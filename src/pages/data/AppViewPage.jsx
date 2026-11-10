import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, Share2, Code2, RotateCw, Zap, Star, Send, CheckCircle2, Loader2, LayoutGrid, Eye } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Card, CardHeader, Select, Segmented, SearchInput, EmptyState, Skeleton } from '@/components/ui'
import { LineChart, HBarChart, Donut, ResultChart } from '@/components/charts'
import { DataGrid } from '@/components/data/DataGrid'
import { query, runSQL, getDB } from '@/engine/db'
import { useApp, toast } from '@/store'
import { STORES, PROVINCES } from '@/data/reference'
import { formatCompact, formatNumber, formatPercent, formatDate, timeAgo, stripAccents } from '@/lib/format'
import { APP_SOURCES } from '@/features/data/appSources'

const toGrid = (rows) => (rows.length ? { columns: Object.keys(rows[0]), rows: rows.map((r) => Object.values(r)) } : { columns: [], rows: [] })
const kindOf = (app) => app.kind || { app1: 'revenue', app2: 'reviews', 'app-kh360': 'kh360' }[app.id] || 'blank'

/* ---------------- Ứng dụng: Bảng doanh thu ---------------- */
function RevenueApp() {
  const [days, setDays] = useState(30)
  const [region, setRegion] = useState('')
  const [store, setStore] = useState('')
  const [data, setData] = useState(null)
  const regionOf = Object.fromEntries(PROVINCES.map((p) => [p.code, p.region]))
  const stores = STORES.filter((s) => !region || regionOf[s[2]] === region)

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      const filt = `${region ? ` AND c.VUNG = '${region}'` : ''}${store ? ` AND c.MA_CH = '${store}'` : ''}`
      const cur = `d.NGAY_DAT >= DATEADD(day, -${days}, CURRENT_DATE())`
      const prev = `d.NGAY_DAT >= DATEADD(day, -${days * 2}, CURRENT_DATE()) AND d.NGAY_DAT < DATEADD(day, -${days}, CURRENT_DATE())`
      const kpi = (w) => `SELECT COALESCE(SUM(d.TONG_TIEN),0) AS DT, COUNT(*) AS SD, COALESCE(AVG(d.TONG_TIEN),0) AS TB, COUNT(DISTINCT d.MA_KH) AS KH FROM DON_HANG d JOIN CUA_HANG c ON c.MA_CH = d.MA_CH WHERE d.TRANG_THAI = 'Hoàn tất' AND ${w}${filt}`
      const t0 = performance.now()
      const [k1, k0, daily, top, byStore] = await Promise.all([
        query(kpi(cur)), query(kpi(prev)),
        query(`SELECT DATE(d.NGAY_DAT) AS NGAY, SUM(d.TONG_TIEN) AS DOANH_THU, COUNT(*) AS SO_DON FROM DON_HANG d JOIN CUA_HANG c ON c.MA_CH = d.MA_CH WHERE d.TRANG_THAI = 'Hoàn tất' AND ${cur}${filt} GROUP BY 1 ORDER BY 1`),
        query(`SELECT p.TEN_SAN_PHAM, SUM(ct.THANH_TIEN) AS DOANH_THU FROM CHI_TIET_DON ct JOIN DON_HANG d ON d.MA_DON = ct.MA_DON JOIN CUA_HANG c ON c.MA_CH = d.MA_CH JOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP WHERE d.TRANG_THAI = 'Hoàn tất' AND ${cur}${filt} GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
        query(`SELECT c.TEN_CUA_HANG, c.TINH_THANH, COUNT(*) AS SO_DON, SUM(d.TONG_TIEN) AS DOANH_THU, ROUND(AVG(d.TONG_TIEN)) AS GIA_TRI_DON_TB FROM DON_HANG d JOIN CUA_HANG c ON c.MA_CH = d.MA_CH WHERE d.TRANG_THAI = 'Hoàn tất' AND ${cur}${filt} GROUP BY 1, 2 ORDER BY DOANH_THU DESC`),
      ])
      if (alive) setData({ k1: k1[0], k0: k0[0], daily, top, byStore, ms: Math.round(performance.now() - t0) })
    }, 180)
    return () => { alive = false; clearTimeout(t) }
  }, [days, region, store])

  const delta = (a, b) => (b ? ((a - b) / b) * 100 : null)
  const kpis = data && [
    ['Doanh thu', formatCompact(data.k1.DT) + ' ₫', delta(data.k1.DT, data.k0.DT)],
    ['Số đơn', formatNumber(data.k1.SD), delta(data.k1.SD, data.k0.SD)],
    ['Giá trị đơn TB', formatCompact(data.k1.TB) + ' ₫', delta(data.k1.TB, data.k0.TB)],
    ['Khách thành viên', formatNumber(data.k1.KH), delta(data.k1.KH, data.k0.KH)],
  ]
  return (
    <div className="flex flex-col gap-5">
      <Card className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-5 items-end">
        <div>
          <div className="flex items-center justify-between text-[13px]"><span className="font-[550] text-dim">Số ngày gần nhất</span><b className="num text-brand-ink">{days} ngày</b></div>
          <input type="range" min={7} max={120} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full mt-3 accent-[var(--c-brand-500)]" aria-label="Số ngày gần nhất" />
          <div className="flex justify-between text-[11px] text-faint num"><span>7</span><span>120</span></div>
        </div>
        <Select label="Vùng" value={region} onChange={(e) => { setRegion(e.target.value); setStore('') }} placeholder="Tất cả vùng" options={['Miền Bắc', 'Miền Trung', 'Miền Nam']} />
        <Select label="Cửa hàng" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Tất cả cửa hàng" options={stores.map((s) => ({ value: s[0], label: s[1] }))} />
      </Card>
      {!data ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(([l, v, d]) => (
              <Card key={l} className="p-4">
                <div className="ds-caption">{l}</div>
                <div className="text-[24px] font-[650] num tracking-tight mt-1">{v}</div>
                {d != null && <div className={cn('text-[12.5px] font-[600] num mt-0.5', d >= 0 ? 'text-pos' : 'text-neg')}>{d >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(d))} <span className="text-faint font-normal">so với {days} ngày trước đó</span></div>}
              </Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
            <Card>
              <CardHeader title="Doanh thu theo ngày" desc={`${data.daily.length} ngày có bán hàng`} />
              {data.daily.length ? <LineChart data={data.daily.map((d) => ({ x: d.NGAY, value: d.DOANH_THU }))} series={[{ key: 'value', label: 'Doanh thu' }]} height={260} format={(v) => formatNumber(v) + ' ₫'} />
                : <EmptyState title="Không có đơn hàng" compact />}
            </Card>
            <Card>
              <CardHeader title="Món mang lại doanh thu cao nhất" />
              <HBarChart items={data.top.map((t) => ({ label: t.TEN_SAN_PHAM, value: t.DOANH_THU }))} format={(v) => formatCompact(v)} />
            </Card>
          </div>
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between"><h3 className="ds-h3">Theo cửa hàng</h3><span className="ds-caption">Truy vấn trong {data.ms} ms</span></div>
            <DataGrid {...toGrid(data.byStore)} stats={false} maxHeight={360} />
          </Card>
        </>
      )}
    </div>
  )
}

/* ---------------- Ứng dụng: Theo dõi đánh giá ---------------- */
const SENT_TONE = { 'Tích cực': 'pos', 'Tiêu cực': 'neg', 'Trung tính': 'neutral' }
function ReviewsApp() {
  const [rows, setRows] = useState(null)
  const [sent, setSent] = useState('Tiêu cực')
  const [topic, setTopic] = useState('')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(12)
  const { reviewTasks = [], upsert } = useApp()
  useEffect(() => {
    query(`SELECT g.MA_DG, g.NGAY, c.TEN_CUA_HANG, g.SO_SAO, g.NOI_DUNG, AI_CAM_XUC(g.NOI_DUNG) AS CAM_XUC, AI_PHAN_LOAI(g.NOI_DUNG, 'Đồ uống, Phục vụ, Không gian, Giao hàng, Giá cả, Thời gian chờ') AS CHU_DE, AI_TRICH_XUAT(g.NOI_DUNG, 'van_de') AS VAN_DE FROM DANH_GIA g JOIN CUA_HANG c ON c.MA_CH = g.MA_CH ORDER BY g.NGAY DESC`).then(setRows)
  }, [])
  const list = useMemo(() => (rows || []).filter((r) => (sent === 'Tất cả' || r.CAM_XUC === sent) && (!topic || r.CHU_DE === topic) && (!q || stripAccents(r.NOI_DUNG + r.TEN_CUA_HANG).toLowerCase().includes(stripAccents(q).toLowerCase()))), [rows, sent, topic, q])
  if (!rows) return <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
  const counts = ['Tích cực', 'Trung tính', 'Tiêu cực'].map((k) => ({ label: k, value: rows.filter((r) => r.CAM_XUC === k).length, color: { 'Tích cực': 'var(--c-pos)', 'Trung tính': 'var(--c-chart-6)', 'Tiêu cực': 'var(--c-neg)' }[k] }))
  const topics = [...new Set(rows.map((r) => r.CHU_DE))]
  const byTopic = topics.map((t) => ({ label: t, value: rows.filter((r) => r.CHU_DE === t && r.CAM_XUC === 'Tiêu cực').length })).sort((a, b) => b.value - a.value)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Cảm xúc của khách" desc={`${rows.length} đánh giá, chấm bằng AI_CAM_XUC`} />
          <Donut segments={counts} size={150}><div><div className="text-[11px] text-muted">Đánh giá</div><div className="font-[650] num">{rows.length}</div></div></Donut>
        </Card>
        <Card>
          <CardHeader title="Chủ đề bị phàn nàn nhiều nhất" desc="Số đánh giá tiêu cực theo chủ đề (AI_PHAN_LOAI)" />
          <HBarChart items={byTopic} color="var(--c-neg)" />
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={sent} onChange={(v) => { setSent(v); setLimit(12) }} options={['Tất cả', 'Tiêu cực', 'Trung tính', 'Tích cực']} />
        <Select size="sm" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Mọi chủ đề" options={topics} className="w-44" />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm trong nội dung" className="w-60" />
        <span className="ds-caption ml-auto">{list.length} đánh giá</span>
      </div>
      {!list.length ? <EmptyState title="Không có đánh giá phù hợp" compact /> : (
        <div className="grid md:grid-cols-2 gap-3">
          {list.slice(0, limit).map((r) => {
            const done = reviewTasks.find((t) => t.id === r.MA_DG)
            return (
              <Card key={r.MA_DG} className="p-4 flex flex-col">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= r.SO_SAO ? 'fill-gold text-gold' : 'text-line-strong'} />)}</span>
                  <span className="text-muted">{r.TEN_CUA_HANG} · {formatDate(r.NGAY)}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed">“{r.NOI_DUNG}”</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge size="sm" tone={SENT_TONE[r.CAM_XUC]} dot>{r.CAM_XUC}</Badge>
                  <Badge size="sm" tone="brand">{r.CHU_DE}</Badge>
                  {r.VAN_DE && <Badge size="sm" tone="warn">{r.VAN_DE}</Badge>}
                  <span className="ml-auto">
                    {done ? <span className="flex items-center gap-1 text-[12.5px] text-pos font-[600]"><CheckCircle2 size={14} />Đã giao {timeAgo(done.at)}</span>
                      : r.CAM_XUC !== 'Tích cực' && <Button size="xs" variant="outline" icon={Send} onClick={() => { upsert('reviewTasks', { id: r.MA_DG, at: new Date().toISOString() }); toast({ title: `Đã giao cho ${r.TEN_CUA_HANG}`, desc: 'Quản lý cửa hàng nhận thông báo để liên hệ khách.' }) }}>Giao cho cửa hàng</Button>}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {list.length > limit && <div className="text-center"><Button variant="ghost" onClick={() => setLimit(limit + 12)}>Xem thêm ({list.length - limit})</Button></div>}
    </div>
  )
}

/* ---------------- Ứng dụng: Khách hàng 360 ---------------- */
function Kh360App() {
  const [rows, setRows] = useState(null)
  const [seg, setSeg] = useState('Cần nhắc lại')
  useEffect(() => {
    query(`WITH R AS (SELECT d.MA_KH, DATEDIFF(day, MAX(d.NGAY_DAT), CURRENT_DATE()) AS GAN_DAY, COUNT(*) AS TAN_SUAT, SUM(d.TONG_TIEN) AS GIA_TRI FROM DON_HANG d WHERE d.MA_KH IS NOT NULL AND d.TRANG_THAI = 'Hoàn tất' GROUP BY 1)
      SELECT k.HO_TEN, k.HANG_THANH_VIEN, k.TINH_THANH, R.GAN_DAY, R.TAN_SUAT, R.GIA_TRI,
        CASE WHEN R.GAN_DAY <= 14 AND R.TAN_SUAT >= 20 THEN 'Trung thành' WHEN R.GAN_DAY <= 30 THEN 'Đang hoạt động' WHEN R.GAN_DAY <= 90 THEN 'Cần nhắc lại' ELSE 'Có nguy cơ rời bỏ' END AS PHAN_KHUC
      FROM R JOIN KHACH_HANG k ON k.MA_KH = R.MA_KH ORDER BY R.GIA_TRI DESC`).then(setRows)
  }, [])
  if (!rows) return <Skeleton className="h-64 rounded-xl" />
  const segs = ['Trung thành', 'Đang hoạt động', 'Cần nhắc lại', 'Có nguy cơ rời bỏ']
  const counts = segs.map((s, i) => ({ label: s, value: rows.filter((r) => r.PHAN_KHUC === s).length, color: ['var(--c-pos)', 'var(--c-chart-1)', 'var(--c-chart-3)', 'var(--c-neg)'][i] }))
  const list = rows.filter((r) => r.PHAN_KHUC === seg)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        <Card><CardHeader title="Phân khúc RFM" desc={`${rows.length} khách thành viên có mua hàng`} /><Donut segments={counts} size={140} /></Card>
        <Card>
          <CardHeader title="Gợi ý chăm sóc" />
          <ul className="flex flex-col gap-2 text-[13.5px] text-dim">
            <li>• <b>{counts[2].value}</b> khách “Cần nhắc lại”: gửi ưu đãi món yêu thích qua ứng dụng.</li>
            <li>• <b>{counts[3].value}</b> khách “Có nguy cơ rời bỏ”: tặng phiếu giảm 20% hết hạn sau 14 ngày.</li>
            <li>• <b>{counts[0].value}</b> khách “Trung thành”: mời tham gia nếm thử món mới.</li>
          </ul>
        </Card>
      </div>
      <div className="flex items-center gap-2 flex-wrap"><Segmented value={seg} onChange={setSeg} options={segs} size="sm" /><span className="ds-caption ml-auto">{list.length} khách</span></div>
      <Card padded={false} className="overflow-hidden"><DataGrid {...toGrid(list)} stats={false} maxHeight={420} /></Card>
    </div>
  )
}

/* ---------------- Ứng dụng trống ---------------- */
function BlankApp() {
  const [sql, setSql] = useState('SELECT TINH_THANH, COUNT(*) AS SO_CUA_HANG, SUM(SO_CHO_NGOI) AS TONG_CHO_NGOI\nFROM CUA_HANG\nGROUP BY 1\nORDER BY 2 DESC')
  const [res, setRes] = useState(null)
  const run = async () => { const { results } = await runSQL(sql, { silent: true }); setRes(results[results.length - 1]) }
  useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={5} spellCheck={false}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run() }}
          className="w-full font-mono text-[13px] bg-subtle border border-line rounded-lg p-3 outline-none focus:border-brand-400 resize-y" />
        <div className="flex justify-end mt-2"><Button variant="primary" icon={Play} onClick={run}>Chạy (Ctrl + Enter)</Button></div>
      </Card>
      {res?.error ? <Card className="text-neg text-[13.5px]">{res.error}</Card> : res && (
        <>
          <Card><ResultChart columns={res.columns} rows={res.rows} height={240} /></Card>
          <Card padded={false} className="overflow-hidden"><DataGrid columns={res.columns} rows={res.rows} maxHeight={360} /></Card>
        </>
      )}
    </div>
  )
}

const VIEWS = { revenue: RevenueApp, reviews: ReviewsApp, kh360: Kh360App, blank: BlankApp }

export default function AppViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { apps, upsert } = useApp()
  const app = apps.find((a) => a.id === id)
  const [edit, setEdit] = useState(false)
  const [ready, setReady] = useState(false)
  const [runKey, setRunKey] = useState(0)
  useEffect(() => { getDB().then(() => setTimeout(() => setReady(true), 350)) }, [])
  useEffect(() => { if (app) upsert('apps', { id: app.id, views: (app.views || 0) + 1 }) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!app) return <Page><EmptyState icon={LayoutGrid} title="Không tìm thấy ứng dụng" action={<Button onClick={() => navigate('/ung-dung')}>Về danh sách ứng dụng</Button>} /></Page>
  const kind = kindOf(app)
  const View = VIEWS[kind]
  const src = APP_SOURCES[kind]

  return (
    <Page wide crumbs={[{ label: 'Ứng dụng', to: '/ung-dung' }, { label: app.name }]}
      title={app.name}
      badge={<><Badge tone="pos" dot size="sm">Đang chạy</Badge><Badge size="sm" icon={Zap}>{app.warehouse}</Badge></>}
      actions={<>
        <Button variant="outline" icon={RotateCw} onClick={() => { setReady(false); setRunKey((k) => k + 1); setTimeout(() => setReady(true), 400) }}>Chạy lại</Button>
        <Button variant="outline" icon={Share2} onClick={() => { navigator.clipboard?.writeText(window.location.href); toast({ title: 'Đã sao chép liên kết ứng dụng', desc: 'Người nhận cần có vai trò được cấp quyền mới mở được.' }) }}>Chia sẻ</Button>
        <Button variant={edit ? 'primary' : 'outline'} icon={edit ? Eye : Code2} onClick={() => setEdit(!edit)}>{edit ? 'Chỉ xem' : 'Chỉnh sửa'}</Button>
      </>}>
      <p className="text-muted -mt-4 mb-5 max-w-3xl">{app.desc}</p>
      <div className={cn('grid gap-4', edit && 'xl:grid-cols-[minmax(0,520px)_1fr]')}>
        {edit && (
          <Card padded={false} className="overflow-hidden self-start xl:sticky xl:top-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-subtle">
              <span className="font-mono text-[12.5px] font-[600]">ung_dung.py</span>
              <span className="ds-caption">Chỉ đọc trong bản demo</span>
            </div>
            <pre className="text-[12px] font-mono leading-[1.65] overflow-auto max-h-[70vh] py-3">
              {src.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-10 shrink-0 text-right pr-3 text-faint select-none">{i + 1}</span>
                  <span className={cn('pr-4 whitespace-pre', line.trim().startsWith('#') ? 'text-[var(--c-code-cmt)] italic' : '')}>{line || ' '}</span>
                </div>
              ))}
            </pre>
          </Card>
        )}
        <div className="min-w-0">
          {!ready ? (
            <Card className="grid place-items-center py-20 text-center">
              <Loader2 size={28} className="animate-spin text-brand-ink" />
              <div className="font-[600] mt-3">Đang khởi động ứng dụng…</div>
              <div className="ds-caption">Kết nối {app.warehouse}</div>
            </Card>
          ) : <View key={runKey} />}
        </div>
      </div>
    </Page>
  )
}
