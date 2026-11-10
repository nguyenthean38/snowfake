import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smile, Tags, AlignLeft, ScanSearch, Languages, Shuffle, Play, Copy, FileCode2, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Textarea, Input, Select, Callout, Segmented } from '@/components/ui'
import { Donut, HBarChart } from '@/components/charts'
import { DataGrid } from '@/components/data/DataGrid'
import { sentimentLabel, sentimentScore, classify, summarize, extract, translate } from '@/engine/aiFunctions'
import { runSQL } from '@/engine/db'
import { REVIEW_TEXTS } from '@/data/reference'
import { useApp, engineHooks, toast } from '@/store'

const FUNCS = [
  { id: 'cam-xuc', name: 'AI_CAM_XUC', label: 'Cảm xúc', icon: Smile, desc: 'Gán nhãn Tích cực / Tiêu cực / Trung tính và điểm từ −1 đến 1.' },
  { id: 'phan-loai', name: 'AI_PHAN_LOAI', label: 'Phân loại', icon: Tags, desc: 'Xếp văn bản vào nhãn phù hợp nhất trong danh sách bạn đưa.' },
  { id: 'tom-tat', name: 'AI_TOM_TAT', label: 'Tóm tắt', icon: AlignLeft, desc: 'Rút gọn thành ý chính đầu tiên.' },
  { id: 'trich-xuat', name: 'AI_TRICH_XUAT', label: 'Trích xuất', icon: ScanSearch, desc: 'Lấy món được nhắc, vấn đề, email hoặc số điện thoại.' },
  { id: 'dich', name: 'AI_DICH', label: 'Dịch', icon: Languages, desc: 'Dịch sang tiếng Anh (bảng cụm từ minh hoạ).' },
]
const TONE = { 'Tích cực': 'pos', 'Tiêu cực': 'neg', 'Trung tính': 'neutral' }
const SENT_COLORS = { 'Tích cực': 'var(--c-pos)', 'Trung tính': 'var(--c-chart-6)', 'Tiêu cực': 'var(--c-neg)' }

export default function AIFunctionsPage() {
  const navigate = useNavigate()
  const newFile = useApp((s) => s.newFile)
  const [fn, setFn] = useState('cam-xuc')
  const [text, setText] = useState(REVIEW_TEXTS[4][1])
  const [labels, setLabels] = useState('Đồ uống, Phục vụ, Không gian, Giao hàng, Giá cả, Thời gian chờ')
  const [what, setWhat] = useState('van_de')
  const f = FUNCS.find((x) => x.id === fn)

  const output = useMemo(() => {
    if (fn === 'cam-xuc') return { main: sentimentLabel(text), extra: `Điểm: ${sentimentScore(text).toLocaleString('vi-VN')}` }
    if (fn === 'phan-loai') return { main: classify(text, labels) }
    if (fn === 'tom-tat') return { main: summarize(text) }
    if (fn === 'trich-xuat') return { main: extract(text, what) ?? 'NULL' }
    return { main: translate(text) }
  }, [fn, text, labels, what])

  const esc = (s) => s.replace(/'/g, "''")
  const sql = fn === 'cam-xuc' ? `SELECT AI_CAM_XUC('${esc(text)}') AS CAM_XUC,\n       AI_DIEM_CAM_XUC('${esc(text)}') AS DIEM;`
    : fn === 'phan-loai' ? `SELECT AI_PHAN_LOAI(\n  '${esc(text)}',\n  '${esc(labels)}'\n) AS CHU_DE;`
      : fn === 'tom-tat' ? `SELECT AI_TOM_TAT('${esc(text)}') AS TOM_TAT;`
        : fn === 'trich-xuat' ? `SELECT AI_TRICH_XUAT('${esc(text)}', '${what}') AS KET_QUA;`
          : `SELECT AI_DICH('${esc(text)}') AS BAN_DICH;`

  const shuffle = () => setText(REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)][1])
  const openSQL = (content, name) => { newFile({ name, content }); navigate('/khong-gian') }

  return (
    <Page title="Hàm AI" desc="Gọi AI ngay trong câu SQL để đọc hiểu văn bản tiếng Việt: cảm xúc, chủ đề, tóm tắt, trích xuất, dịch."
      badge={<Badge tone="brand">Sân chơi</Badge>}>
      <Callout tone="neutral" icon={Info} className="mb-6">Trong bản demo, các hàm AI là bản mô phỏng gọn nhẹ chạy ngay trong trình duyệt (dựa trên từ điển và quy tắc tiếng Việt), không gửi dữ liệu ra ngoài.</Callout>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5 mb-10">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
          {FUNCS.map((x) => (
            <button key={x.id} onClick={() => setFn(x.id)} className={cn('flex items-start gap-3 rounded-xl px-3 py-2.5 text-left shrink-0 transition', fn === x.id ? 'bg-surface border border-brand-200 shadow-xs' : 'border border-transparent hover:bg-hover')}>
              <span className={cn('size-8 rounded-lg grid place-items-center shrink-0', fn === x.id ? 'bg-brand-500 text-white' : 'bg-subtle text-muted')}><x.icon size={16} /></span>
              <span className="min-w-0"><span className="block font-[600] text-[13.5px]">{x.label}</span><span className="block text-[11.5px] font-mono text-faint">{x.name}</span></span>
            </button>
          ))}
        </nav>
        <div className="grid xl:grid-cols-2 gap-5 min-w-0">
          <div className="card p-5 flex flex-col gap-4">
            <div><h3 className="ds-h3">{f.label}</h3><p className="ds-caption">{f.desc}</p></div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-[550] text-dim">Văn bản đầu vào</span>
                <button onClick={shuffle} className="inline-flex items-center gap-1 text-[12.5px] text-brand-ink hover:underline"><Shuffle size={13} />Đánh giá ngẫu nhiên</button>
              </div>
              <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Văn bản đầu vào" />
            </div>
            {fn === 'phan-loai' && <Input label="Các nhãn (cách nhau bởi dấu phẩy)" value={labels} onChange={(e) => setLabels(e.target.value)} />}
            {fn === 'trich-xuat' && <Select label="Trích xuất" value={what} onChange={(e) => setWhat(e.target.value)} options={[{ value: 'mon', label: 'Món được nhắc tới' }, { value: 'van_de', label: 'Vấn đề khách gặp' }, { value: 'email', label: 'Email' }, { value: 'so_dien_thoai', label: 'Số điện thoại' }]} />}
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TEXTS.slice(0, 6).map(([s, t], i) => (
                <button key={i} onClick={() => setText(t)} className="rounded-full border border-line px-2.5 h-7 text-[12px] text-muted hover:text-fg hover:border-line-strong">{'★'.repeat(s)} mẫu {i + 1}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5 min-w-0">
            <div className="card p-5">
              <div className="ds-label mb-2">Kết quả</div>
              {fn === 'cam-xuc' ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge tone={TONE[output.main]} dot className="h-8 px-3 text-[14px]">{output.main}</Badge>
                  <span className="text-muted text-[13px]">{output.extra}</span>
                  <div className="w-full h-2 rounded-full bg-gradient-to-r from-neg via-line-strong to-pos relative mt-2">
                    <span className="absolute -top-1 size-4 rounded-full bg-surface border-2 border-fg -translate-x-1/2 transition-[left]" style={{ left: `${((sentimentScore(text) + 1) / 2) * 100}%` }} />
                  </div>
                  <div className="w-full flex justify-between text-[11px] text-faint"><span>−1 Tiêu cực</span><span>0</span><span>Tích cực +1</span></div>
                </div>
              ) : (
                <div className="text-[17px] font-[600] leading-snug">{output.main}</div>
              )}
            </div>
            <div className="card p-5 min-w-0">
              <div className="flex items-center justify-between mb-2"><span className="ds-label">SQL tương đương</span>
                <span className="flex gap-1">
                  <Button size="xs" variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(sql); toast('Đã sao chép SQL') }}>Sao chép</Button>
                  <Button size="xs" variant="ghost" icon={FileCode2} onClick={() => openSQL(sql, 'thu_ham_ai.sql')}>Mở trong trình soạn</Button>
                </span>
              </div>
              <pre className="rounded-xl bg-subtle border border-line p-3 text-[12.5px] font-mono overflow-x-auto whitespace-pre">{sql}</pre>
            </div>
          </div>
        </div>
      </div>

      <BulkRun onOpen={openSQL} />
    </Page>
  )
}

const BULK_SQL = `SELECT g.MA_DG, c.TEN_CUA_HANG, g.SO_SAO, g.NOI_DUNG,
       AI_CAM_XUC(g.NOI_DUNG) AS CAM_XUC,
       AI_DIEM_CAM_XUC(g.NOI_DUNG) AS DIEM,
       AI_PHAN_LOAI(g.NOI_DUNG, 'Đồ uống, Đồ ăn, Phục vụ, Không gian, Giao hàng, Giá cả, Thời gian chờ') AS CHU_DE,
       AI_TRICH_XUAT(g.NOI_DUNG, 'van_de') AS VAN_DE
FROM PHO_NUI_DB.MARKETING.DANH_GIA g
JOIN PHO_NUI_DB.BAN_HANG.CUA_HANG c ON c.MA_CH = g.MA_CH
ORDER BY g.NGAY DESC;`

function BulkRun({ onOpen }) {
  const [state, setState] = useState(null) // null | 'running' | { columns, rows, ms }
  const [filter, setFilter] = useState('all')
  const run = async () => {
    setState('running')
    const t0 = performance.now()
    const { results } = await runSQL(BULK_SQL, { hooks: engineHooks, source: 'Hàm AI' })
    const r = results[results.length - 1]
    await new Promise((res) => setTimeout(res, Math.max(0, 700 - (performance.now() - t0))))
    if (r.error) { toast({ title: 'Lỗi', desc: r.error, tone: 'neg' }); setState(null); return }
    setState({ columns: r.columns, rows: r.rows, ms: Math.round(performance.now() - t0) })
  }
  const stats = useMemo(() => {
    if (!state || state === 'running') return null
    const ci = state.columns.indexOf('CAM_XUC'), ti = state.columns.indexOf('CHU_DE')
    const s = {}, t = {}
    state.rows.forEach((r) => { s[r[ci]] = (s[r[ci]] || 0) + 1; if (r[ci] === 'Tiêu cực') t[r[ti]] = (t[r[ti]] || 0) + 1 })
    return { s, t: Object.entries(t).sort((a, b) => b[1] - a[1]), ci }
  }, [state])
  const rows = stats ? (filter === 'all' ? state.rows : state.rows.filter((r) => r[stats.ci] === filter)) : []
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div><h2 className="ds-h2">Chạy trên toàn bộ bảng DANH_GIA</h2><p className="ds-caption">240 đánh giá của khách hàng — chấm cảm xúc, chủ đề và vấn đề chỉ bằng một câu SQL.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" icon={FileCode2} onClick={() => onOpen(BULK_SQL, 'cham_diem_danh_gia.sql')}>Mở SQL</Button>
          <Button variant="primary" icon={state === 'running' ? undefined : Play} loading={state === 'running'} onClick={run}>{stats ? 'Chạy lại' : 'Chạy trên KHO_AI'}</Button>
        </div>
      </div>
      {!stats ? (
        <div className="card p-5">
          <pre className={cn('rounded-xl bg-subtle border border-line p-4 text-[12.5px] font-mono overflow-x-auto whitespace-pre transition-opacity', state === 'running' && 'opacity-60')}>{BULK_SQL}</pre>
          {state === 'running' && <div className="flex items-center gap-2 mt-3 text-[13px] text-muted"><Loader2 size={15} className="animate-spin" />Đang đọc 240 đánh giá…</div>}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="ds-h3 mb-4">Phân bố cảm xúc</h3>
              <Donut segments={['Tích cực', 'Trung tính', 'Tiêu cực'].map((k) => ({ label: k, value: stats.s[k] || 0, color: SENT_COLORS[k] }))}>
                <div><div className="text-[11px] text-muted">Đánh giá</div><div className="font-[700] num text-[18px]">{state.rows.length}</div></div>
              </Donut>
            </div>
            <div className="card p-5">
              <h3 className="ds-h3 mb-1">Chủ đề của đánh giá tiêu cực</h3>
              <p className="ds-caption mb-4">Khâu cần ưu tiên cải thiện</p>
              <HBarChart items={stats.t.map(([k, v]) => ({ label: k, value: v }))} color="var(--c-neg)" />
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-line">
              <span className="text-[13px] text-muted">{rows.length} dòng · {state.ms} ms</span>
              <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tất cả' }, { value: 'Tiêu cực', label: 'Tiêu cực' }, { value: 'Trung tính', label: 'Trung tính' }, { value: 'Tích cực', label: 'Tích cực' }]} />
            </div>
            <DataGrid columns={state.columns} rows={rows} stats={false} maxHeight={420} />
          </div>
        </div>
      )}
    </section>
  )
}
