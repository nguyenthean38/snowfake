import { useMemo, useState } from 'react'
import { Gauge, X, Sparkles, Maximize2, TrendingUp, TrendingDown } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Select, Tabs, Drawer, Table, THead, Th, Tr, Td, Segmented } from '@/components/ui'
import { LineChart, BarChart } from '@/components/charts'
import { useApp } from '@/store'
import { seeded } from '@/lib/random'
import { formatDuration, formatNumber, formatBytes } from '@/lib/format'
import { ChartCard, Legend, nowRef } from '@/features/monitor/shared'
import { cn } from '@/lib/cn'

const RANGES = [
  { value: 'day', label: 'Ngày qua', n: 24, step: 3600e3 },
  { value: 'week', label: 'Tuần qua', n: 7, step: 86400e3 },
  { value: 'month', label: '30 ngày qua', n: 30, step: 86400e3 },
]
const C = { p50: 'var(--c-chart-1)', p90: 'var(--c-chart-2)', overload: 'var(--c-chart-3)', provision: 'var(--c-chart-5)', blocked: 'var(--c-chart-4)' }

const pad = (n) => String(n).padStart(2, '0')
const NO_HISTORY = []
function bucketLabel(ts, range) {
  const d = new Date(ts)
  return range === 'day' ? `${pad(d.getHours())}:00` : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Sinh chuỗi số liệu có hạt giống + trộn số truy vấn thật trong lịch sử */
function useSeries(range, wh, role, history) {
  return useMemo(() => {
    const R = RANGES.find((r) => r.value === range)
    const seed = (range + wh + role).split('').reduce((s, c) => s * 31 + c.charCodeAt(0), 7) >>> 0
    const r = seeded(seed)
    const scale = (wh ? 0.45 : 1) * (role ? 0.6 : 1) * (range === 'day' ? 0.12 : 1)
    const end = nowRef()
    const rows = []
    for (let i = R.n - 1; i >= 0; i--) {
      const t0 = end - (i + 1) * R.step, t1 = end - i * R.step
      const real = history.filter((h) => h.startedAt > t0 && h.startedAt <= t1 && (!wh || h.warehouse === wh) && (!role || h.role === role))
      const hour = new Date(t1).getHours(), dow = new Date(t1).getDay()
      const busy = range === 'day' ? (hour >= 7 && hour <= 20 ? 1 : 0.25) : dow === 0 || dow === 6 ? 0.55 : 1
      const spike = r.chance(0.08) ? 2.4 : 1
      const thr = Math.round((420 + r.next() * 260) * busy * scale) + real.length * 3
      const p50 = Math.round((60 + r.next() * 60) * spike + real.reduce((s, h) => s + h.ms, 0) / Math.max(1, real.length) * 0.1)
      const errors = Math.round(thr * (0.01 + r.next() * 0.02) * spike) + real.filter((h) => h.status === 'Lỗi').length
      rows.push({
        x: bucketLabel(t1, range),
        p50, p90: Math.round(p50 * (3.2 + r.next() * 2.4)),
        thr, errors,
        overload: +(r.next() * 1.4 * spike * busy).toFixed(2),
        provision: +(r.next() * 0.6).toFixed(2),
        blocked: +(r.next() * 0.35 * spike).toFixed(2),
        errPerK: +((errors / Math.max(1, thr)) * 1000).toFixed(1),
        retryPerK: +(r.next() * 1.8 * spike).toFixed(2),
        overloadPct: +(r.next() * 2.2 * spike * busy).toFixed(2),
        blockedPct: +(r.next() * 0.6 * spike).toFixed(2),
      })
    }
    return rows
  }, [range, wh, role, history])
}

const METRICS = [
  { key: 'duration', title: 'Thời lượng truy vấn', kind: 'line', series: [{ key: 'p50', label: 'Trung vị (P50)', color: C.p50 }, { key: 'p90', label: 'P90', color: C.p90 }], value: (d) => formatDuration(median(d.map((x) => x.p50))), sub: 'trung vị', fmt: (v) => formatDuration(v) },
  { key: 'thr', title: 'Thông lượng truy vấn', kind: 'bar', series: [{ key: 'thr', label: 'Số truy vấn', color: C.p50 }], value: (d) => formatNumber(sum(d, 'thr')), sub: 'truy vấn' },
  { key: 'wait', title: 'Thời gian chờ', kind: 'stack', series: [{ key: 'overload', label: 'Quá tải', color: C.overload }, { key: 'provision', label: 'Khởi động kho', color: C.provision }, { key: 'blocked', label: 'Bị chặn', color: C.blocked }], value: (d) => formatDuration(sum(d, 'overload') * 1000), sub: 'tổng chờ', fmt: (v) => `${v.toLocaleString('vi-VN')} giây` },
  { key: 'errors', title: 'Truy vấn lỗi', kind: 'bar', series: [{ key: 'errors', label: 'Số lỗi', color: 'var(--c-neg)' }], value: (d) => formatNumber(sum(d, 'errors')), sub: 'lỗi' },
  { key: 'overloadPct', title: 'Truy vấn phải chờ do quá tải', kind: 'line', series: [{ key: 'overloadPct', label: '% quá tải', color: C.overload }], value: (d) => `${avg(d, 'overloadPct')}%`, fmt: (v) => `${v}%` },
  { key: 'blockedPct', title: 'Truy vấn bị chặn', kind: 'line', series: [{ key: 'blockedPct', label: '% bị chặn', color: C.blocked }], value: (d) => `${avg(d, 'blockedPct')}%`, fmt: (v) => `${v}%` },
  { key: 'errPerK', title: 'Lỗi trên 1.000 truy vấn', kind: 'line', series: [{ key: 'errPerK', label: 'Lỗi/1K', color: 'var(--c-neg)' }], value: (d) => `${avg(d, 'errPerK')}/1K` },
  { key: 'retryPerK', title: 'Thử lại trên 1.000 truy vấn', kind: 'line', series: [{ key: 'retryPerK', label: 'Thử lại/1K', color: C.p90 }], value: (d) => `${avg(d, 'retryPerK')}/1K` },
]
function sum(d, k) { return d.reduce((s, x) => s + (x[k] || 0), 0) }
function avg(d, k) { return (Math.round((sum(d, k) / Math.max(1, d.length)) * 100) / 100).toLocaleString('vi-VN') }
function median(a) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0 }

function MetricChart({ m, data, height }) {
  if (m.kind === 'line') return <LineChart data={data} series={m.series} height={height} area={m.series.length === 1} format={m.fmt} />
  return <BarChart data={data} series={m.series} height={height} stacked={m.kind === 'stack'} format={m.fmt} />
}

function Change({ v }) {
  const up = v > 0
  return (
    <span className={cn('inline-flex items-center gap-1 num font-[600]', Math.abs(v) < 0.5 ? 'text-muted' : up ? 'text-neg' : 'text-pos')}>
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{up ? '+' : ''}{v.toLocaleString('vi-VN')}%
    </span>
  )
}

export default function PerformancePage() {
  const { history, warehouses, roles } = useApp()
  const [banner, setBanner] = useState(() => { try { return localStorage.getItem('lacviet-perf-banner') !== '0' } catch { return true } })
  const [range, setRange] = useState('week')
  const [wh, setWh] = useState('')
  const [role, setRole] = useState('')
  const [tab, setTab] = useState('queries')
  const [open, setOpen] = useState(null)
  const [by, setBy] = useState('warehouse')
  const data = useSeries(range, wh, role, history)
  const prev = useSeries(range, wh + '_truoc', role, NO_HISTORY)

  const r = seeded(range.length * 13 + (wh || '').length)
  const whRows = warehouses.map((w, i) => {
    const cur = +(1 + r.next() * 6 + (w.name === 'KHO_AI' ? 4 : 0)).toFixed(1)
    const was = +(cur * (0.7 + r.next() * 0.6)).toFixed(1)
    return { name: w.name, size: w.size, cur, was, change: Math.round(((cur - was) / was) * 1000) / 10, spill: w.name === 'KHO_AI' ? 7.4 : +(r.next() * 2).toFixed(1), spillBytes: (w.name === 'KHO_AI' ? 4.2e9 : r.next() * 3e8) * (i + 1), queued: +(r.next() * 3).toFixed(1) }
  })
  const TABLES = ['DON_HANG', 'CHI_TIET_DON', 'KHACH_HANG', 'DANH_GIA', 'DOANH_THU_NGAY', 'SAN_PHAM']
  const tblRows = TABLES.map((t, i) => ({ name: t, fail: +(r.next() * (i < 2 ? 8 : 3)).toFixed(1), blocked: +(r.next() * (t === 'DOANH_THU_NGAY' ? 12 : 2)).toFixed(1), read: Math.round(40 + r.next() * (i < 2 ? 900 : 200)), write: Math.round(80 + r.next() * 1500) }))
  const m = METRICS.find((x) => x.key === open)

  return (
    <Page wide title="Hiệu năng" desc="Theo dõi sức khoẻ khối lượng truy vấn, kho tính toán và bảng — phát hiện điểm nghẽn trước khi người dùng phàn nàn."
      actions={<Button icon={Sparkles} to="/ai/hoi-du-lieu">Hỏi Tinh Ý về hiệu năng</Button>}>
      {banner && (
        <div className="card p-4 mb-5 flex items-start gap-4 bg-gradient-to-r from-brand-50 to-surface">
          <span className="size-11 rounded-xl bg-crystal text-white grid place-items-center shrink-0"><Gauge size={22} /></span>
          <div className="flex-1 min-w-0">
            <div className="font-[650]">Chào mừng tới Khám phá hiệu năng</div>
            <p className="text-[13.5px] text-muted mt-0.5">Xem tình trạng chung của khối lượng truy vấn, kho tính toán và mức sử dụng tài nguyên. Bấm vào một biểu đồ để xem chi tiết theo từng kho.</p>
          </div>
          <button aria-label="Ẩn" className="text-muted hover:text-fg" onClick={() => { setBanner(false); try { localStorage.setItem('lacviet-perf-banner', '0') } catch { /* */ } }}><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select size="sm" value={range} onChange={(e) => setRange(e.target.value)} options={RANGES} className="w-36" />
        <Select size="sm" value={wh} onChange={(e) => setWh(e.target.value)} options={[{ value: '', label: 'Kho: Tất cả' }, ...warehouses.map((w) => w.name)]} className="w-48" />
        <Select size="sm" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: '', label: 'Vai trò: Tất cả' }, ...roles.map((x) => x.name)]} className="w-44" />
      </div>

      <Tabs value={tab} onChange={setTab} className="mb-5" options={[{ value: 'queries', label: 'Truy vấn' }, { value: 'warehouses', label: 'Kho tính toán' }, { value: 'tables', label: 'Bảng' }]} />

      {tab === 'queries' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {METRICS.map((mm) => (
            <ChartCard key={mm.key} title={mm.title} value={mm.value(data)} sub={mm.sub} onClick={() => setOpen(mm.key)}
              action={<Maximize2 size={14} className="text-faint" />}>
              {mm.series.length > 1 && <Legend items={mm.series.map((s) => ({ label: s.label, color: s.color }))} className="mb-1" />}
              <MetricChart m={mm} data={data} height={150} />
            </ChartCard>
          ))}
        </div>
      )}

      {tab === 'warehouses' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card overflow-hidden">
            <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Kho có truy vấn lỗi</h3><p className="ds-caption">Lỗi trên 1.000 truy vấn, so với kỳ trước</p></div>
            <Table minWidth={460}>
              <THead><Th>Kho</Th><Th align="right">Lỗi/1K</Th><Th align="right">Kỳ trước</Th><Th align="right">Thay đổi</Th></THead>
              <tbody>{[...whRows].sort((a, b) => b.cur - a.cur).map((w) => (
                <Tr key={w.name}><Td>{w.name} <span className="text-faint">({w.size})</span></Td><Td align="right" className="num font-[600]">{w.cur}</Td><Td align="right" className="num text-muted">{w.was}</Td><Td align="right"><Change v={w.change} /></Td></Tr>
              ))}</tbody>
            </Table>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Kho bị tràn bộ nhớ</h3><p className="ds-caption">% truy vấn phải ghi dữ liệu tạm ra đĩa — dấu hiệu nên tăng cỡ kho</p></div>
            <Table minWidth={460}>
              <THead><Th>Kho</Th><Th align="right">% truy vấn tràn</Th><Th align="right">Dung lượng tràn</Th><Th align="right">Chờ TB (giây)</Th></THead>
              <tbody>{[...whRows].sort((a, b) => b.spill - a.spill).map((w) => (
                <Tr key={w.name}><Td>{w.name}</Td><Td align="right" className={cn('num font-[600]', w.spill > 5 && 'text-warn')}>{w.spill}%</Td><Td align="right" className="num">{formatBytes(w.spillBytes)}</Td><Td align="right" className="num">{w.queued}</Td></Tr>
              ))}</tbody>
            </Table>
          </div>
          <ChartCard title="Thời gian chờ theo ngày" className="lg:col-span-2">
            <Legend items={METRICS[2].series.map((s) => ({ label: s.label, color: s.color }))} className="mb-1" />
            <BarChart data={data} series={METRICS[2].series} stacked height={220} format={METRICS[2].fmt} />
          </ChartCard>
        </div>
      )}

      {tab === 'tables' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card overflow-hidden">
            <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Bảng có truy vấn lỗi / bị chặn</h3><p className="ds-caption">Trên 1.000 truy vấn đọc hoặc ghi bảng</p></div>
            <Table minWidth={420}>
              <THead><Th>Bảng</Th><Th align="right">Lỗi/1K</Th><Th align="right">Bị chặn/1K</Th></THead>
              <tbody>{[...tblRows].sort((a, b) => b.fail + b.blocked - a.fail - a.blocked).map((t) => (
                <Tr key={t.name}><Td className="font-mono text-[12.5px]">{t.name}</Td><Td align="right" className="num">{t.fail}</Td><Td align="right" className={cn('num', t.blocked > 5 && 'text-warn font-[600]')}>{t.blocked}</Td></Tr>
              ))}</tbody>
            </Table>
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Hiệu năng đọc / ghi bảng</h3><p className="ds-caption">Thời lượng trung vị</p></div>
            <Table minWidth={420}>
              <THead><Th>Bảng</Th><Th align="right">Đọc</Th><Th align="right">Ghi</Th></THead>
              <tbody>{[...tblRows].sort((a, b) => b.read - a.read).map((t) => (
                <Tr key={t.name}><Td className="font-mono text-[12.5px]">{t.name}</Td><Td align="right" className="num">{formatDuration(t.read)}</Td><Td align="right" className="num">{formatDuration(t.write)}</Td></Tr>
              ))}</tbody>
            </Table>
          </div>
        </div>
      )}

      <Drawer open={!!m} onClose={() => setOpen(null)} width={720} title={m?.title}>
        {m && (
          <div className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-3">
              <div><div className="ds-caption">{RANGES.find((x) => x.value === range).label}</div><div className="text-[26px] font-[650] num tracking-tight">{m.value(data)}</div></div>
              <Segmented size="sm" value={by} onChange={setBy} options={[{ value: 'warehouse', label: 'Theo kho' }, { value: 'role', label: 'Theo vai trò' }]} />
            </div>
            {m.series.length > 1 && <Legend items={m.series.map((s) => ({ label: s.label, color: s.color }))} />}
            <MetricChart m={m} data={data} height={280} />
            <div>
              <h3 className="ds-h3 mb-2">Phân tích {by === 'warehouse' ? 'theo kho tính toán' : 'theo vai trò'}</h3>
              <div className="card overflow-hidden">
                <Table minWidth={520}>
                  <THead><Th>{by === 'warehouse' ? 'Kho' : 'Vai trò'}</Th><Th align="right">Kỳ này</Th><Th align="right">Kỳ trước</Th><Th align="right">Thay đổi</Th></THead>
                  <tbody>
                    {(by === 'warehouse' ? warehouses.map((w) => w.name) : roles.map((x) => x.name)).map((name, i) => {
                      const k = m.series[0].key
                      const share = [0.46, 0.22, 0.2, 0.08, 0.03, 0.01][i] ?? 0.01
                      const cur = sum(data, k) * share, was = sum(prev, k) * share
                      const ch = was ? Math.round(((cur - was) / was) * 1000) / 10 : 0
                      return (
                        <Tr key={name}>
                          <Td>{name}</Td>
                          <Td align="right" className="num font-[600]">{m.fmt ? m.fmt(Math.round(cur / data.length)) : formatNumber(Math.round(cur))}</Td>
                          <Td align="right" className="num text-muted">{m.fmt ? m.fmt(Math.round(was / prev.length)) : formatNumber(Math.round(was))}</Td>
                          <Td align="right"><Change v={ch} /></Td>
                        </Tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </Page>
  )
}
