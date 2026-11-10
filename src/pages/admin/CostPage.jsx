import { useEffect, useMemo, useState } from 'react'
import {
  Wallet, TrendingUp, AlertTriangle, Lightbulb, Plus, Gauge, CalendarDays, Trash2, Building2, Download, Sparkles, Info,
} from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, Tabs, Badge, Modal, Input, Select, EmptyState, Progress, Callout, Segmented, Popover, Menu, Checkbox, RadioCards,
} from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui/Table'
import { BarChart, LineChart, Donut, PALETTE, useWidth, niceTicks, axisLabel } from '@/components/charts'
import { useApp, toast, uid } from '@/store'
import { seedConsumption, CREDIT_PRICE, ORG } from '@/data/platform'
import { formatCompact, formatCredits, formatVND } from '@/lib/format'
import { cn } from '@/lib/cn'
import { EmailChips, MiniCalendar, MetricCard, viDate } from '@/features/admin/shared'

const KEYS = ['KHO_PHAN_TICH', 'KHO_NAP_DU_LIEU', 'KHO_AI', 'DICH_VU_DAM_MAY', 'LUU_TRU']
const LABEL = { KHO_PHAN_TICH: 'KHO_PHAN_TICH', KHO_NAP_DU_LIEU: 'KHO_NAP_DU_LIEU', KHO_AI: 'KHO_AI', DICH_VU_DAM_MAY: 'Dịch vụ đám mây', LUU_TRU: 'Lưu trữ' }
const TYPE = { KHO_PHAN_TICH: 'Kho tính toán', KHO_NAP_DU_LIEU: 'Kho tính toán', KHO_AI: 'Kho tính toán', DICH_VU_DAM_MAY: 'Dịch vụ', LUU_TRU: 'Lưu trữ' }
const SERIES = KEYS.map((k, i) => ({ key: k, label: LABEL[k], color: PALETTE[i] }))
const vnd = (credits) => credits * CREDIT_PRICE

const TABS = [
  { value: 'org', label: 'Tổng quan tổ chức' },
  { value: 'account', label: 'Tổng quan tài khoản' },
  { value: 'usage', label: 'Tiêu thụ' },
  { value: 'anomaly', label: 'Bất thường' },
  { value: 'budget', label: 'Ngân sách' },
  { value: 'monitor', label: 'Giám sát tài nguyên' },
]

export default function CostPage() {
  const [tab, setTab] = useState('org')
  const data = useMemo(() => seedConsumption(), [])
  const [budgetOpen, setBudgetOpen] = useState(null)
  const [monitorOpen, setMonitorOpen] = useState(false)
  return (
    <Page title="Quản lý chi phí" desc={`Theo dõi tín dụng tính toán và chi phí của ${ORG.name}. Giá tham chiếu gói ${ORG.edition}: ${formatVND(CREDIT_PRICE)} / tín dụng.`}
      actions={<>
        {tab === 'budget' && <Popover align="end" width={240} trigger={(p) => <Button {...p} variant="primary" icon={Plus}>Ngân sách</Button>}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Ngân sách tài khoản', desc: 'Giới hạn chung theo tháng', onClick: () => setBudgetOpen('account') },
            { label: 'Ngân sách tuỳ chỉnh', desc: 'Cho một nhóm kho tính toán', onClick: () => setBudgetOpen('custom') },
          ]} />}
        </Popover>}
        {tab === 'monitor' && <Button variant="primary" icon={Plus} onClick={() => setMonitorOpen(true)}>Bộ giám sát tài nguyên</Button>}
        {['org', 'account', 'usage'].includes(tab) && <Button variant="outline" icon={Download} onClick={() => toast({ title: 'Đã bắt đầu xuất CSV', desc: 'Tệp chi_phi_30_ngay.csv sẽ được tải xuống sau giây lát.' })}>Xuất CSV</Button>}
      </>}>
      <Tabs value={tab} onChange={setTab} options={TABS} className="mb-6" />
      {tab === 'org' && <OrgOverview data={data} />}
      {tab === 'account' && <AccountOverview data={data} onTab={setTab} />}
      {tab === 'usage' && <Usage data={data} />}
      {tab === 'anomaly' && <Anomalies data={data} />}
      {tab === 'budget' && <Budgets data={data} onCreate={setBudgetOpen} />}
      {tab === 'monitor' && <Monitors onCreate={() => setMonitorOpen(true)} />}
      <BudgetModal kind={budgetOpen} onClose={() => setBudgetOpen(null)} />
      <MonitorModal open={monitorOpen} onClose={() => setMonitorOpen(false)} />
    </Page>
  )
}

const dayTotal = (d) => KEYS.reduce((s, k) => s + d[k], 0)

/* ---------------- Tổng quan tổ chức ---------------- */
function OrgOverview({ data }) {
  const total = data.reduce((s, d) => s + dayTotal(d), 0)
  const perKey = KEYS.map((k) => ({ k, v: data.reduce((s, d) => s + d[k], 0) })).sort((a, b) => b.v - a.v)
  const [mode, setMode] = useState('vnd')
  const chart = data.map((d) => ({ x: d.date, ...Object.fromEntries(KEYS.map((k) => [k, mode === 'vnd' ? vnd(d[k]) : d[k]])) }))
  const fmt = mode === 'vnd' ? (v) => formatVND(v) : (v) => `${formatCredits(v)} tín dụng`
  return (
    <div className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard label="Tổng chi phí 30 ngày" value={formatCompact(vnd(total)) + ' ₫'} sub={`${formatCredits(total, 1)} tín dụng`} icon={Wallet} />
        <MetricCard label="Bình quân mỗi tháng" value={formatCompact(vnd(total) * 0.94) + ' ₫'} sub="Tính trên 3 tháng gần nhất" icon={TrendingUp} />
        <MetricCard label="Tài khoản trong tổ chức" value="1" sub={`${ORG.account} · ${ORG.region}`} icon={Building2} />
      </div>
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div><h3 className="ds-h3">Chi tiêu của tổ chức</h3><p className="ds-caption">30 ngày gần nhất, theo tài nguyên</p></div>
          <Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'vnd', label: 'Đồng' }, { value: 'credit', label: 'Tín dụng' }]} />
        </div>
        <BarChart data={chart} series={SERIES} stacked height={280} format={fmt} />
        <Legend />
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between"><h3 className="ds-h3">Chi tiêu theo tài khoản</h3></div>
        <Table minWidth={720}>
          <THead><Th>Tài khoản</Th><Th align="right">Luỹ kế 30 ngày</Th><Th align="right">Tháng này</Th><Th align="right">Tháng trước</Th><Th align="right">Bình quân tháng</Th></THead>
          <tbody>
            <Tr>
              <Td><div className="font-[600] font-mono text-[12.5px]">{ORG.account}</div><div className="ds-caption">Tài khoản hiện tại · {ORG.edition}</div></Td>
              <Td align="right" className="num font-[600]">{formatVND(vnd(total))}</Td>
              <Td align="right" className="num">{formatVND(vnd(data.slice(-10).reduce((s, d) => s + dayTotal(d), 0)))}</Td>
              <Td align="right" className="num">{formatVND(vnd(total) * 0.97)}</Td>
              <Td align="right" className="num">{formatVND(vnd(total) * 0.94)}</Td>
            </Tr>
          </tbody>
        </Table>
        <div className="px-5 py-4 border-t border-line grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {perKey.map(({ k, v }) => (
            <div key={k}>
              <div className="flex items-center gap-1.5 text-[12.5px] text-muted"><span className="size-2 rounded-sm" style={{ background: PALETTE[KEYS.indexOf(k)] }} />{LABEL[k]}</div>
              <div className="font-[600] num">{formatCompact(vnd(v))} ₫</div>
              <div className="ds-caption">{Math.round((v / total) * 100)}% tổng chi</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
      {SERIES.map((s) => <span key={s.key} className="flex items-center gap-1.5 text-[12.5px] text-muted"><span className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
    </div>
  )
}

/* ---------------- Tổng quan tài khoản ---------------- */
function AccountOverview({ data, onTab }) {
  const budgets = useApp((s) => s.budgets)
  const month = data.slice(-10)
  const mtd = month.reduce((s, d) => s + dayTotal(d), 0)
  const accBudget = budgets.find((b) => b.scope === 'Toàn tài khoản')
  const projected = (mtd / 10) * 30
  const byWh = KEYS.slice(0, 3).map((k) => ({ label: k, value: vnd(month.reduce((s, d) => s + d[k], 0)) }))
  const tagged = 38
  return (
    <div className="flex flex-col gap-5">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-[13px] text-muted">Tóm tắt chi phí tháng 11</div>
          <div className="text-[24px] font-[650] num mt-1.5">{formatCompact(vnd(mtd))} ₫</div>
          <div className="ds-caption">Từ 1/11 đến 10/11 · {formatCredits(mtd, 1)} tín dụng</div>
        </div>
        <div className="card p-4">
          <div className="text-[13px] text-muted">Sử dụng ngân sách tháng</div>
          {accBudget ? <>
            <div className="text-[24px] font-[650] num mt-1.5">{Math.round((projected / accBudget.limit) * 100)}%</div>
            <Progress value={projected} max={accBudget.limit} className="mt-2" />
            <div className="ds-caption mt-1">Dự báo {formatCredits(projected, 0)}/{accBudget.limit} tín dụng</div>
          </> : <Button size="sm" variant="outline" className="mt-3" onClick={() => onTab('budget')}>Đặt ngân sách</Button>}
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between"><span className="text-[13px] text-muted">Bất thường</span><AlertTriangle size={16} className="text-warn" /></div>
          <div className="text-[24px] font-[650] num mt-1.5 text-warn">1</div>
          <button onClick={() => onTab('anomaly')} className="ds-caption text-left hover:text-brand-ink hover:underline">KHO_AI tăng 2,3 lần so với bình thường →</button>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between"><span className="text-[13px] text-muted">Gợi ý tối ưu</span><Lightbulb size={16} className="text-gold" /></div>
          <div className="text-[24px] font-[650] num mt-1.5">2</div>
          <div className="ds-caption">Có thể tiết kiệm ~{formatCompact(vnd(14))} ₫/tháng</div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <div className="card p-5">
          <h3 className="ds-h3 mb-1">Phân bổ chi phí</h3>
          <p className="ds-caption mb-4">Tổng chi phí tháng này theo ngày</p>
          <BarChart data={month.map((d) => ({ x: d.date, value: vnd(dayTotal(d)) }))} series={[{ key: 'value', label: 'Chi phí', color: 'var(--c-chart-1)' }]} height={240} format={(v) => formatVND(v)} />
        </div>
        <div className="card p-5">
          <h3 className="ds-h3 mb-1">Chi phí theo kho tính toán</h3>
          <p className="ds-caption mb-4">Tỷ lệ chi phí đã được gắn thẻ dự án: {tagged}%</p>
          <Donut segments={byWh} format={(v) => formatCompact(v) + ' ₫'} size={150}><div className="text-center"><div className="text-[11px] text-muted">Tháng 11</div><div className="font-[650] num">{formatCompact(byWh.reduce((s, x) => s + x.value, 0))}</div></div></Donut>
          <div className="mt-4">
            <div className="flex justify-between text-[12.5px] mb-1"><span>Đã gắn thẻ</span><span className="num">{tagged}%</span></div>
            <div className="h-2.5 rounded-full bg-warn-soft overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${tagged}%` }} /></div>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="ds-h3 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-brand-ink" />Gợi ý tối ưu chi phí</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ['Giảm thời gian tự tạm dừng của KHO_AI từ 300 xuống 60 giây', 'Kho thường rảnh 4 phút sau mỗi lượt gọi hàm AI.', 9],
            ['Gộp tác vụ DONG_BO_POS_15_PHUT thành 30 phút', 'Mỗi lần chạy chỉ nạp trung bình 18 đơn, kho phải khởi động liên tục.', 5],
          ].map(([t, d, c]) => (
            <div key={t} className="rounded-xl border border-line p-4">
              <div className="font-[600] text-[13.5px]">{t}</div>
              <div className="ds-caption mt-1">{d}</div>
              <div className="flex items-center justify-between mt-3"><Badge tone="pos">Tiết kiệm ~{formatCompact(vnd(c))} ₫/tháng</Badge><Button size="sm" variant="outline" onClick={() => toast({ title: 'Đã áp dụng gợi ý', desc: t })}>Áp dụng</Button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Tiêu thụ ---------------- */
function Usage({ data }) {
  const [range, setRange] = useState('30')
  const [type, setType] = useState('')
  const [wh, setWh] = useState('')
  const rows = data.slice(range === '7' ? -7 : -30)
  const keys = KEYS.filter((k) => (!type || TYPE[k] === type) && (!wh || k === wh))
  const chart = rows.map((d) => ({ x: d.date, ...Object.fromEntries(keys.map((k) => [k, d[k]])) }))
  const totals = keys.map((k) => ({ k, v: rows.reduce((s, d) => s + d[k], 0) })).sort((a, b) => b.v - a.v)
  const max = Math.max(...totals.map((t) => t.v), 1)
  const sum = totals.reduce((s, t) => s + t.v, 0)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" value={range} onChange={setRange} options={[{ value: '7', label: '7 ngày qua' }, { value: '30', label: '30 ngày qua' }]} />
        <Select size="sm" className="w-48" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: '', label: 'Loại dịch vụ: Tất cả' }, 'Kho tính toán', 'Dịch vụ', 'Lưu trữ']} />
        <Select size="sm" className="w-52" value={wh} onChange={(e) => setWh(e.target.value)} options={[{ value: '', label: 'Tài nguyên: Tất cả' }, ...KEYS.map((k) => ({ value: k, label: LABEL[k] }))]} />
        <span className="ml-auto text-[13px]"><b className="num">{formatCredits(sum, 1)}</b> <span className="text-muted">tín dụng đã dùng · {formatCompact(vnd(sum))} ₫</span></span>
      </div>
      <div className="card p-5">
        <BarChart data={chart} series={SERIES.filter((s) => keys.includes(s.key))} stacked height={280} format={(v) => `${formatCredits(v)} tín dụng`} />
        <Legend />
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={680}>
          <THead><Th>Tên</Th><Th>Loại</Th><Th>Thẻ</Th><Th align="right">Tín dụng đã dùng</Th><Th width={260}>Tỷ trọng</Th></THead>
          <tbody>
            {totals.map(({ k, v }) => (
              <Tr key={k}>
                <Td><span className="flex items-center gap-2 font-[550]"><span className="size-2.5 rounded-sm" style={{ background: PALETTE[KEYS.indexOf(k)] }} />{LABEL[k]}</span></Td>
                <Td className="text-muted">{TYPE[k]}</Td>
                <Td className="text-muted">{k === 'KHO_AI' ? <Badge size="sm" tone="brand">du_an: ai</Badge> : '—'}</Td>
                <Td align="right" className="num font-[600]">{formatCredits(v, 1)}</Td>
                <Td><div className="flex items-center gap-2"><Progress value={v} max={max} auto={false} className="flex-1" /><span className="num text-[12px] text-muted w-10 text-right">{Math.round((v / sum) * 100)}%</span></div></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

/* ---------------- Bất thường ---------------- */
function BandChart({ data, height = 260 }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const pad = { l: 52, r: 12, t: 12, b: 28 }
  const iw = Math.max(10, w - pad.l - pad.r), ih = height - pad.t - pad.b
  const ticks = niceTicks(0, Math.max(...data.map((d) => Math.max(d.v, d.hi))), 4)
  const hiT = ticks[ticks.length - 1]
  const X = (i) => pad.l + (i / (data.length - 1)) * iw
  const Y = (v) => pad.t + ih - (v / hiT) * ih
  const band = data.map((d, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(d.hi)}`).join(' ') + ' ' + [...data].reverse().map((d, j) => `L${X(data.length - 1 - j)} ${Y(d.lo)}`).join(' ') + ' Z'
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(d.v)}`).join(' ')
  return (
    <div ref={ref} className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left - pad.l) / iw) * (data.length - 1)); setHover(i >= 0 && i < data.length ? i : null) }}>
      {w > 0 && (
        <svg width={w} height={height}>
          {ticks.map((t) => <g key={t}><line x1={pad.l} x2={w - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--c-line)" strokeDasharray="3 4" /><text x={pad.l - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--c-faint)] text-[11px]">{formatCredits(t, 1)}</text></g>)}
          <path d={band} fill="var(--c-chart-2)" opacity=".14" />
          <path d={line} fill="none" stroke="var(--c-chart-1)" strokeWidth="2.2" />
          {data.map((d, i) => d.flag && <circle key={i} cx={X(i)} cy={Y(d.v)} r="5" fill="var(--c-neg)" stroke="var(--c-surface)" strokeWidth="2" />)}
          {data.map((d, i) => i % 5 === 0 && <text key={i} x={X(i)} y={height - 8} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px]">{axisLabel(d.x, false)}</text>)}
          {hover != null && <line x1={X(hover)} x2={X(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--c-line-strong)" />}
        </svg>
      )}
      {hover != null && (
        <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-surface px-3 py-2 shadow-md text-[12.5px] w-48" style={{ left: Math.min(Math.max(X(hover) - 96, 0), w - 192) }}>
          <div className="text-muted">{viDate(data[hover].x)}</div>
          <div className="flex justify-between"><span>Thực tế</span><b className="num">{formatCredits(data[hover].v)}</b></div>
          <div className="flex justify-between text-muted"><span>Dự kiến</span><span className="num">{formatCredits(data[hover].lo)}–{formatCredits(data[hover].hi)}</span></div>
          {data[hover].flag && <div className="text-neg font-[600] mt-1">Bất thường</div>}
        </div>
      )}
    </div>
  )
}
function Anomalies({ data }) {
  const series = data.map((d, i) => {
    const base = data.slice(Math.max(0, i - 7), i).reduce((s, x) => s + x.KHO_AI, 0) / Math.max(1, Math.min(7, i)) || d.KHO_AI
    const lo = Math.max(0, base * 0.55), hi = base * 1.6 + 0.4
    return { x: d.date, v: d.KHO_AI, lo, hi, flag: i > 3 && d.KHO_AI > hi }
  })
  const flagged = series.filter((s) => s.flag)
  return (
    <div className="flex flex-col gap-5">
      <Callout tone="warn" icon={AlertTriangle} title={`${flagged.length} ngày tiêu thụ bất thường ở KHO_AI`}>Tác vụ CHAM_DIEM_CAM_XUC_DANH_GIA chạy lại nhiều lần sau khi bị lỗi hết thời gian chờ, kéo theo hàm AI được gọi lặp.</Callout>
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div><h3 className="ds-h3">Tín dụng KHO_AI mỗi ngày</h3><p className="ds-caption">Vùng xanh là khoảng dự kiến do mô hình học từ 7 ngày trước đó</p></div>
          <div className="flex gap-3 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--c-chart-1)]" />Thực tế</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 bg-[var(--c-chart-2)] opacity-30" />Khoảng dự kiến</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-neg" />Bất thường</span>
          </div>
        </div>
        <BandChart data={series} />
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={640}>
          <THead><Th>Ngày</Th><Th>Tài nguyên</Th><Th align="right">Tiêu thụ</Th><Th align="right">Khoảng dự kiến</Th><Th align="right">Vượt</Th></THead>
          <tbody>
            {flagged.map((s) => (
              <Tr key={s.x}>
                <Td>{viDate(s.x)}</Td><Td className="font-mono text-[12.5px]">KHO_AI</Td>
                <Td align="right" className="num font-[600]">{formatCredits(s.v)}</Td>
                <Td align="right" className="num text-muted">{formatCredits(s.lo)} – {formatCredits(s.hi)}</Td>
                <Td align="right"><Badge tone="neg">+{formatCompact(vnd(s.v - s.hi))} ₫</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!flagged.length && <EmptyState icon={Gauge} title="Không có bất thường" compact />}
      </div>
    </div>
  )
}

/* ---------------- Ngân sách ---------------- */
function Budgets({ data, onCreate }) {
  const budgets = useApp((s) => s.budgets)
  const remove = useApp((s) => s.remove)
  const month = data.slice(-10)
  const spentFor = (b) => month.reduce((s, d) => s + (b.scope === 'Toàn tài khoản' ? dayTotal(d) : d[b.scope] || 0), 0)
  const acc = budgets.find((b) => b.scope === 'Toàn tài khoản')
  const cum = []
  let run = 0
  for (let i = 1; i <= 30; i++) {
    if (i <= 10) { run += dayTotal(month[i - 1]); cum.push({ x: `2026-11-${String(i).padStart(2, '0')}`, actual: run, forecast: i === 10 ? run : null }) }
    else { run += dayTotal(month[9]) * 1.02; cum.push({ x: `2026-11-${String(i).padStart(2, '0')}`, actual: null, forecast: run }) }
  }
  const chart = cum.map((c) => ({ x: c.x, value: c.actual ?? 0, fc: c.actual == null ? c.forecast : 0 }))
  const over = budgets.filter((b) => (spentFor(b) / 10) * 30 > b.limit).length
  return (
    <div className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard label="Tổng số ngân sách" value={budgets.length} sub="đang theo dõi" />
        <MetricCard label="Dự báo vượt hạn mức" value={over} tone={over ? 'neg' : 'pos'} sub="trong tháng 11" />
        <MetricCard label="Chưa đặt hạn mức" value={acc ? 0 : 1} sub={acc ? 'Mọi tài nguyên đã có ngân sách' : 'Tài khoản chưa có ngân sách'} />
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div><h3 className="ds-h3">Chi tiêu tài khoản tháng 11</h3><p className="ds-caption">Luỹ kế thực tế (đậm) và dự báo tới cuối tháng (nhạt)</p></div>
          {acc && <Badge tone={(run > acc.limit) ? 'neg' : 'pos'}>Hạn mức {acc.limit} tín dụng</Badge>}
        </div>
        {!acc && <Callout tone="info" icon={Info} className="mb-3" action={<Button size="sm" variant="primary" onClick={() => onCreate('account')}>Tạo ngân sách tài khoản</Button>}>Chưa có ngân sách tài khoản. Hãy đặt hạn mức để nhận cảnh báo trước khi vượt chi.</Callout>}
        <BarChart data={chart} stacked height={240} series={[{ key: 'value', label: 'Thực tế', color: 'var(--c-chart-1)' }, { key: 'fc', label: 'Dự báo', color: 'var(--c-brand-200)' }]} format={(v) => `${formatCredits(v, 1)} tín dụng`} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = spentFor(b), proj = (spent / 10) * 30
          return (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-[600]">{b.name}</div><div className="ds-caption">{b.scope} · theo {b.period.toLowerCase()}</div></div>
                <button onClick={() => { remove('budgets', b.id); toast(`Đã xoá ${b.name}`) }} className="text-faint hover:text-neg p-1" aria-label="Xoá ngân sách"><Trash2 size={15} /></button>
              </div>
              <div className="flex items-baseline gap-2 mt-3"><span className="text-[24px] font-[650] num">{formatCredits(spent, 1)}</span><span className="text-muted text-[13px]">/ {b.limit} tín dụng</span></div>
              <Progress value={proj} max={b.limit} className="mt-2" />
              <div className="flex justify-between ds-caption mt-1.5"><span>Dự báo cuối tháng: {formatCredits(proj, 0)} tín dụng</span><span>{formatCompact(vnd(b.limit))} ₫</span></div>
              <div className="ds-caption mt-2">Thông báo tới: {b.notify.join(', ') || '—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BudgetModal({ kind, onClose }) {
  const { upsert, budgets } = useApp()
  const [limit, setLimit] = useState(180)
  const [emails, setEmails] = useState(['khoa.tran@phonui.demo'])
  const [name, setName] = useState('')
  const [scope, setScope] = useState('KHO_PHAN_TICH')
  useEffect(() => { if (kind) { setLimit(kind === 'account' ? 180 : 40); setName(''); setScope('KHO_PHAN_TICH'); setEmails(['khoa.tran@phonui.demo']) } }, [kind])
  const existing = budgets.find((b) => b.scope === 'Toàn tài khoản')
  const save = () => {
    if (kind === 'account') upsert('budgets', { id: existing?.id || uid('b'), name: 'Ngân sách tài khoản', scope: 'Toàn tài khoản', limit: +limit, period: 'Tháng', notify: emails })
    else upsert('budgets', { id: uid('b'), name: name || `Ngân sách ${scope}`, scope, limit: +limit, period: 'Tháng', notify: emails })
    toast(kind === 'account' ? 'Ngân sách tài khoản đã được kích hoạt' : 'Đã tạo ngân sách tuỳ chỉnh')
    onClose()
  }
  return (
    <Modal open={!!kind} onClose={onClose} title={kind === 'account' ? 'Thiết lập ngân sách tài khoản' : 'Ngân sách tuỳ chỉnh'} desc={kind === 'account' ? 'Đặt hạn mức chi tiêu hằng tháng; bạn nhận thông báo khi dự báo vượt hạn mức.' : 'Theo dõi riêng một kho tính toán hoặc dịch vụ.'}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!limit || limit <= 0} onClick={save}>Hoàn tất</Button></>}>
      <div className="flex flex-col gap-4">
        {kind === 'custom' && <>
          <Input label="Tên ngân sách" value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: Ngân sách nhóm phân tích" />
          <Select label="Tài nguyên" value={scope} onChange={(e) => setScope(e.target.value)} options={KEYS.map((k) => ({ value: k, label: LABEL[k] }))} />
        </>}
        <Input label="Hạn mức chi tiêu" type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} suffix="tín dụng / tháng" hint={`Tương đương ${formatVND(vnd(+limit || 0))} mỗi tháng. Chi tiêu 10 ngày đầu tháng dự báo ${formatCredits(116, 0)} tín dụng.`} />
        <div>
          <div className="text-[13px] font-[550] text-dim mb-1.5">Thông báo khi dự báo vượt hạn mức <span className="font-normal text-faint">(không bắt buộc)</span></div>
          <EmailChips value={emails} onChange={setEmails} />
          <p className="ds-caption mt-1">Email cần được xác minh trước khi nhận thông báo.</p>
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Giám sát tài nguyên ---------------- */
function Monitors({ onCreate }) {
  const monitors = useApp((s) => s.monitors)
  const remove = useApp((s) => s.remove)
  if (!monitors.length) return <div className="card"><EmptyState icon={Gauge} title="Chưa có bộ giám sát tài nguyên" desc="Tạo bộ giám sát để tự tạm dừng kho tính toán khi dùng quá hạn mức tín dụng." action={<Button variant="primary" icon={Plus} onClick={onCreate}>Tạo bộ giám sát</Button>} /></div>
  return (
    <div className="card overflow-hidden">
      <Table minWidth={860}>
        <THead><Th>Tên</Th><Th align="right">Hạn mức</Th><Th width={200}>Đã dùng</Th><Th>Cấp độ</Th><Th>Kho áp dụng</Th><Th>Tần suất</Th><Th>Hành động</Th><Th /></THead>
        <tbody>
          {monitors.map((m) => (
            <Tr key={m.id}>
              <Td className="font-mono font-[600] text-[12.5px]">{m.name}</Td>
              <Td align="right" className="num">{m.quota}</Td>
              <Td><div className="flex items-center gap-2"><Progress value={m.used} max={m.quota} className="flex-1" /><span className="num text-[12px] text-muted">{Math.round((m.used / m.quota) * 100)}%</span></div></Td>
              <Td>{m.level}</Td>
              <Td className="font-mono text-[12px] text-muted">{m.warehouses?.join(', ') || '—'}</Td>
              <Td>{m.frequency}{m.start && <div className="ds-caption">từ {viDate(m.start)}{m.end ? ` đến ${viDate(m.end)}` : ''}</div>}</Td>
              <Td className="text-[12.5px] text-muted">{m.actions.map((a) => `${a.at}% → ${a.do}`).join(' · ')}</Td>
              <Td align="right"><button onClick={() => { remove('monitors', m.id); toast(`Đã xoá ${m.name}`) }} className="text-faint hover:text-neg p-1" aria-label="Xoá"><Trash2 size={15} /></button></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

const ACTIONS = ['Thông báo', 'Tạm dừng sau khi chạy xong', 'Tạm dừng ngay']
function MonitorModal({ open, onClose }) {
  const { warehouses, upsert } = useApp()
  const [name, setName] = useState('')
  const [quota, setQuota] = useState(100)
  const [level, setLevel] = useState('Tài khoản')
  const [whs, setWhs] = useState(['KHO_AI'])
  const [freq, setFreq] = useState('Hằng tháng')
  const [start, setStart] = useState('2026-11-10')
  const [end, setEnd] = useState('')
  const [sched, setSched] = useState(false)
  const [calFor, setCalFor] = useState('start')
  const [acts, setActs] = useState([{ at: 80, do: 'Thông báo' }, { at: 100, do: 'Tạm dừng sau khi chạy xong' }, { at: 110, do: 'Tạm dừng ngay' }])
  useEffect(() => { if (open) { setName(''); setQuota(100); setLevel('Tài khoản'); setWhs(['KHO_AI']); setSched(false); setStart('2026-11-10'); setEnd('') } }, [open])
  const n = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const valid = n && quota > 0 && (level === 'Tài khoản' || whs.length)
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Bộ giám sát tài nguyên mới" desc="Theo dõi tín dụng tiêu thụ và tự động thông báo hoặc tạm dừng kho tính toán."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!valid} onClick={() => {
        upsert('monitors', { id: uid('rm'), name: n, quota: +quota, used: 0, level: level === 'Tài khoản' ? 'Tài khoản' : 'Kho tính toán', warehouses: level === 'Tài khoản' ? [] : whs, frequency: freq, start, end, actions: acts })
        toast(`Đã tạo bộ giám sát tài nguyên “${n}”`); onClose()
      }}>Tạo bộ giám sát</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Tên" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: GIOI_HAN_KHO_AI" hint={n ? `Lưu thành ${n}` : undefined} />
        <Input label="Hạn mức tín dụng" type="number" min={1} value={quota} onChange={(e) => setQuota(e.target.value)} suffix="tín dụng" hint={`≈ ${formatVND(vnd(+quota || 0))}`} />
      </div>
      <div className="mt-4">
        <div className="text-[13px] font-[550] text-dim mb-1.5">Loại giám sát</div>
        <RadioCards columns={2} value={level} onChange={setLevel} options={[{ value: 'Tài khoản', label: 'Toàn tài khoản', desc: 'Chỉ thông báo, không tạm dừng kho' }, { value: 'Kho', label: 'Kho tính toán', desc: 'Có thể tạm dừng kho được chọn' }]} />
      </div>
      {level === 'Kho' && (
        <div className="mt-3 flex flex-wrap gap-3">
          {warehouses.map((w) => <Checkbox key={w.id} checked={whs.includes(w.name)} onChange={(v) => setWhs(v ? [...whs, w.name] : whs.filter((x) => x !== w.name))} label={<span className="font-mono text-[12.5px]">{w.name}</span>} />)}
        </div>
      )}
      <div className="mt-4 rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13.5px] font-[600]">Lịch</div>
            <div className="ds-caption">Bắt đầu {viDate(start)} · {end ? `Kết thúc ${viDate(end)}` : 'Không kết thúc'} · Đặt lại {freq.toLowerCase()}</div>
          </div>
          <Button size="sm" variant="outline" icon={CalendarDays} onClick={() => setSched(!sched)}>{sched ? 'Thu gọn' : 'Tuỳ chỉnh'}</Button>
        </div>
        {sched && (
          <div className="mt-4 grid sm:grid-cols-[auto_1fr] gap-5 animate-fade-in">
            <div>
              <Segmented size="sm" value={calFor} onChange={setCalFor} options={[{ value: 'start', label: 'Ngày bắt đầu' }, { value: 'end', label: 'Ngày kết thúc' }]} className="mb-3" />
              <MiniCalendar key={calFor} value={calFor === 'start' ? start : end} rangeStart={calFor === 'end' ? start : undefined} min={calFor === 'end' ? start : undefined}
                onChange={(d) => (calFor === 'start' ? (setStart(d), end && end < d && setEnd('')) : setEnd(d))} />
            </div>
            <div className="flex flex-col gap-3">
              <Select label="Đặt lại hạn mức" value={freq} onChange={(e) => setFreq(e.target.value)} options={['Hằng ngày', 'Hằng tuần', 'Hằng tháng', 'Hằng năm', 'Không bao giờ']} />
              {end && <Button size="sm" variant="ghost" onClick={() => setEnd('')}>Bỏ ngày kết thúc</Button>}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] font-[550] text-dim">Hành động khi đạt ngưỡng</div>
          <Button size="xs" variant="ghost" icon={Plus} onClick={() => setActs([...acts, { at: 90, do: 'Thông báo' }])}>Thêm</Button>
        </div>
        <div className="flex flex-col gap-2">
          {acts.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[13px] text-muted w-10">Khi</span>
              <Input size="sm" type="number" className="w-24" value={a.at} onChange={(e) => setActs(acts.map((x, j) => (j === i ? { ...x, at: +e.target.value } : x)))} suffix="%" />
              <span className="text-[13px] text-muted">tín dụng thì</span>
              <Select size="sm" className="flex-1" value={a.do} onChange={(e) => setActs(acts.map((x, j) => (j === i ? { ...x, do: e.target.value } : x)))} options={level === 'Tài khoản' ? ['Thông báo'] : ACTIONS} />
              <button onClick={() => setActs(acts.filter((_, j) => j !== i))} className={cn('p-1 text-faint hover:text-neg', acts.length === 1 && 'invisible')} aria-label="Bỏ"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

