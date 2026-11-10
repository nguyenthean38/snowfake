/* ==========================================================
   Khung kết quả truy vấn: bảng (có thống kê cột) / biểu đồ,
   nhiều tab khi chạy nhiều câu lệnh, lỗi kèm nút nhờ Tinh Ý sửa.
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, ChevronUp, Maximize2, Minimize2, Download, Table2, BarChart3, Search, AlertCircle, Sparkles, Loader2,
  CheckCircle2, Clock, Copy, X, LineChart as LineIcon, BarChartHorizontal, PieChart, Hash,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDuration, formatNumber } from '@/lib/format'
import { toast } from '@/store'
import { Button, Segmented, Select, Callout } from '@/components/ui'
import { DataGrid, downloadCSV } from '@/components/data/DataGrid'
import { ResultChart, guessChart, chartableColumns } from '@/components/charts'

function timeLabel(at) {
  if (!at) return ''
  const s = Math.round((Date.now() - at) / 1000)
  if (s < 30) return 'vừa xong'
  if (s < 3600) return `${Math.round(s / 60)} phút trước`
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const CHART_TYPES = [
  { value: 'line', label: 'Đường', icon: LineIcon },
  { value: 'bar', label: 'Cột', icon: BarChart3 },
  { value: 'hbar', label: 'Cột ngang', icon: BarChartHorizontal },
  { value: 'donut', label: 'Vành khuyên', icon: PieChart },
  { value: 'kpi', label: 'Chỉ số', icon: Hash },
]

function ChartView({ res }) {
  const guess = useMemo(() => guessChart(res.columns, res.rows), [res])
  const cols = useMemo(() => chartableColumns(res.columns, res.rows), [res])
  const [spec, setSpec] = useState(guess)
  useEffect(() => { setSpec(guess) }, [guess])
  const s = spec || { type: 'bar', x: res.columns[0], y: cols.numeric[0] }
  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-line p-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          <div className="ds-label mb-2">Loại biểu đồ</div>
          <div className="grid grid-cols-5 md:grid-cols-2 gap-1.5">
            {CHART_TYPES.map((c) => (
              <button key={c.value} onClick={() => setSpec({ ...s, type: c.value })}
                className={cn('flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11.5px]', s.type === c.value ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line hover:bg-subtle text-dim')}>
                <c.icon size={16} />{c.label}
              </button>
            ))}
          </div>
        </div>
        {s.type !== 'kpi' && (
          <>
            <Select size="sm" label="Trục X (nhóm)" value={s.x || ''} onChange={(e) => setSpec({ ...s, x: e.target.value })} options={cols.all} />
            <Select size="sm" label="Trục Y (giá trị)" value={s.y || ''} onChange={(e) => setSpec({ ...s, y: e.target.value })}
              options={cols.numeric.length ? cols.numeric : [{ value: '', label: 'Không có cột số' }]} />
            <p className="ds-caption">Biểu đồ dùng tối đa 200 dòng đầu của kết quả.</p>
          </>
        )}
      </aside>
      <div className="flex-1 min-w-0 p-5 overflow-auto">
        <ResultChart columns={res.columns} rows={res.rows} spec={s.y || s.type === 'kpi' ? s : null} height={280} />
      </div>
    </div>
  )
}

/**
 * props: run { status: 'idle'|'booting'|'running'|'done', results, totalMs, at }, collapsed, expanded,
 * onToggleCollapse, onToggleExpand, onFixWithAI, fileName
 */
export function ResultsPanel({ run, collapsed, expanded, onToggleCollapse, onToggleExpand, onFixWithAI, fileName }) {
  const [tab, setTab] = useState(0)
  const [view, setView] = useState('table')
  const [filter, setFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const results = run?.results || []
  useEffect(() => { setTab(Math.max(0, results.length - 1)); setFilter('') }, [run?.at]) // eslint-disable-line react-hooks/exhaustive-deps
  const res = results[tab]
  const [, force] = useState(0)
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 30000); return () => clearInterval(t) }, [])

  const busy = run?.status === 'running' || run?.status === 'booting'
  const header = (
    <div className="h-10 shrink-0 flex items-center gap-1 px-2 border-b border-line bg-surface">
      <button onClick={onToggleCollapse} className="flex items-center gap-1.5 px-2 h-8 rounded-md text-[13px] font-[600] text-brand-ink hover:bg-subtle">
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        {run?.status === 'booting' ? 'Đang khởi động kho tính toán…' : run?.status === 'running' ? 'Đang chạy…' : results.length ? `Kết quả (${timeLabel(run.at)})` : 'Kết quả'}
      </button>
      {results.length > 1 && (
        <div className="flex items-center gap-0.5 ml-1 overflow-x-auto no-scrollbar min-w-0">
          {results.map((r, i) => (
            <button key={r.id} onClick={() => setTab(i)} title={r.sql}
              className={cn('h-7 px-2.5 rounded-md text-[12px] whitespace-nowrap flex items-center gap-1.5', i === tab ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-muted hover:bg-subtle')}>
              {r.error ? <AlertCircle size={12} className="text-neg" /> : <CheckCircle2 size={12} className="text-pos" />}
              Câu {i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1" />
      <button onClick={onToggleExpand} className="size-8 grid place-items-center rounded-md text-muted hover:bg-subtle hover:text-fg" title={expanded ? 'Thu nhỏ' : 'Phóng to kết quả'}>
        {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
      <button onClick={onToggleCollapse} className="size-8 grid place-items-center rounded-md text-muted hover:bg-subtle hover:text-fg" title={collapsed ? 'Mở kết quả' : 'Thu gọn kết quả'}>
        {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  )
  if (collapsed) return header

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      {header}
      {busy && !results.length ? (
        <div className="flex-1 grid place-items-center text-muted text-[13px]">
          <div className="flex flex-col items-center gap-3">
            <div className="relative size-10"><span className="absolute inset-0 rounded-xl bg-crystal opacity-20 animate-ping" /><span className="absolute inset-1 rounded-lg bg-crystal" /></div>
            {run?.status === 'booting' ? 'Đang khởi động kho tính toán và nạp dữ liệu mẫu…' : 'Đang thực thi truy vấn…'}
          </div>
        </div>
      ) : !res ? (
        <div className="flex-1 grid place-items-center text-center px-6">
          <div>
            <div className="mx-auto size-12 rounded-2xl bg-subtle border border-line grid place-items-center text-muted mb-3"><Table2 size={22} /></div>
            <div className="ds-h3">Chưa có kết quả</div>
            <p className="ds-caption mt-1">Đặt con trỏ vào một câu lệnh rồi bấm <b className="text-fg">Ctrl + Enter</b> để chạy.</p>
          </div>
        </div>
      ) : res.error ? (
        <div className="flex-1 overflow-auto p-4">
          <Callout tone="neg" icon={AlertCircle} title="Câu lệnh gặp lỗi">
            <p className="font-mono text-[12.5px] mt-1 whitespace-pre-wrap">{res.error}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="primary" icon={Sparkles} onClick={() => onFixWithAI?.(res)}>Sửa lỗi với Tinh Ý</Button>
              <Button size="sm" variant="outline" icon={Copy} onClick={() => { navigator.clipboard?.writeText(res.error); toast('Đã sao chép thông báo lỗi') }}>Sao chép lỗi</Button>
            </div>
          </Callout>
          <pre className="mt-3 rounded-lg bg-subtle border border-line p-3 text-[12px] font-mono whitespace-pre-wrap text-dim">{res.sql}</pre>
          <div className="ds-caption mt-2">Mã truy vấn <Link className="font-mono text-brand-ink hover:underline" to={`/giam-sat/truy-van/${res.id}`}>{res.id}</Link></div>
        </div>
      ) : (
        <>
          <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-line">
            <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'table', label: 'Bảng', icon: Table2 }, { value: 'chart', label: 'Biểu đồ', icon: BarChart3 }]} />
            {res.message && res.kind !== 'select' && <span className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-pos ml-1"><CheckCircle2 size={14} />{res.message}</span>}
            <div className="flex-1" />
            {view === 'table' && (showFilter ? (
              <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-line bg-surface w-48">
                <Search size={14} className="text-faint" />
                <input autoFocus value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc trong kết quả" className="min-w-0 flex-1 bg-transparent outline-none text-[12.5px]" />
                <button onClick={() => { setFilter(''); setShowFilter(false) }} className="text-faint hover:text-fg"><X size={13} /></button>
              </div>
            ) : (
              <button onClick={() => setShowFilter(true)} className="size-8 grid place-items-center rounded-md text-muted hover:bg-subtle hover:text-fg" title="Lọc kết quả"><Search size={15} /></button>
            ))}
            <span className="text-[12.5px] text-dim num whitespace-nowrap" title={res.truncated ? 'Chỉ hiển thị 10.000 dòng đầu' : undefined}>
              {formatNumber(res.rowCount)} dòng{res.truncated ? '*' : ''}
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-dim num whitespace-nowrap" title="Thời gian thực thi">
              <Clock size={13} className="text-faint" />{formatDuration(res.ms)}
              <span className="w-14 h-1.5 rounded-full bg-subtle overflow-hidden flex">
                <span className="h-full bg-brand-400" style={{ width: `${Math.max(12, Math.min(70, res.ms / 4))}%` }} />
                <span className="h-full bg-ice" style={{ width: '22%' }} />
              </span>
            </span>
            <button onClick={() => downloadCSV((fileName || 'ket_qua').replace(/\.sql$/, '') + `_cau_${tab + 1}`, res.columns, res.rows)}
              className="size-8 grid place-items-center rounded-md text-muted hover:bg-subtle hover:text-fg" title="Tải xuống CSV"><Download size={15} /></button>
            <Link to={`/giam-sat/truy-van/${res.id}`} className="hidden md:inline text-[12px] font-mono text-faint hover:text-brand-ink hover:underline truncate max-w-40" title="Xem chi tiết truy vấn">{res.id.slice(0, 18)}…</Link>
          </div>
          <div className="flex-1 min-h-0">
            {view === 'table'
              ? <DataGrid key={res.id} columns={res.columns} rows={res.rows} filter={filter} className="h-full" />
              : <ChartView key={res.id} res={res} />}
          </div>
        </>
      )}
    </div>
  )
}
