import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, FileCode2, AlertCircle, SearchX, Radar, Download } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, IconButton, Tabs, Badge, Callout, EmptyState, Modal, Select, Skeleton } from '@/components/ui'
import { DataGrid, downloadCSV } from '@/components/data/DataGrid'
import { useApp, toast } from '@/store'
import { runSQL } from '@/engine/db'
import { seeded } from '@/lib/random'
import { formatDateTime, formatDuration, formatNumber, formatBytes } from '@/lib/format'
import { QueryStatus, CopyButton, ExplainModal, hashSQL } from '@/features/monitor/shared'
import { QueryProfile } from '@/features/monitor/QueryProfile'

function Row({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-muted">{label}</div>
      <div className="text-[13.5px] mt-0.5 min-w-0 break-words">{children}</div>
    </div>
  )
}

const LEVELS = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']

function EventLevelModal({ open, onClose }) {
  const [scope, setScope] = useState('Tài khoản')
  const [traces, setTraces] = useState('Bật')
  const [logs, setLogs] = useState('INFO')
  const [metrics, setMetrics] = useState('Tắt')
  return (
    <Modal open={open} onClose={onClose} title="Mức ghi nhận sự kiện" desc="Chọn loại sự kiện được ghi vào bảng sự kiện để theo dõi dấu vết và nhật ký."
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => { toast({ title: 'Đã cập nhật mức ghi nhận', desc: `Dấu vết: ${traces} · Nhật ký: ${logs}` }); onClose() }}>Lưu</Button></>}>
      <div className="flex flex-col gap-4">
        <Select label="Áp dụng cho" value={scope} onChange={(e) => setScope(e.target.value)} options={['Tài khoản', 'Cơ sở dữ liệu PHO_NUI_DB', 'Lược đồ BAN_HANG']} />
        <div className="rounded-xl border border-line divide-y divide-line">
          <div className="flex items-center justify-between gap-3 p-3">
            <div><div className="font-[600] text-[13.5px]">Dấu vết</div><div className="ds-caption">Ghi lại các đoạn thực thi để xem dòng thời gian</div></div>
            <Select size="sm" value={traces} onChange={(e) => setTraces(e.target.value)} options={['Bật', 'Tắt']} className="w-24" />
          </div>
          <div className="p-3">
            <div className="font-[600] text-[13.5px]">Nhật ký</div>
            <div className="ds-caption mb-2">Mức nghiêm trọng thấp nhất được ghi lại</div>
            <div className="grid grid-cols-6 gap-1">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLogs(l)} className={`h-8 rounded-lg text-[11.5px] font-[600] border ${LEVELS.indexOf(l) <= LEVELS.indexOf(logs) ? 'bg-brand-500 text-white border-brand-500' : 'border-line text-muted hover:bg-subtle'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <div><div className="font-[600] text-[13.5px]">Chỉ số</div><div className="ds-caption">Bộ nhớ, CPU của hàm và thủ tục do người dùng viết</div></div>
            <Select size="sm" value={metrics} onChange={(e) => setMetrics(e.target.value)} options={['Bật', 'Tắt']} className="w-24" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ResultTab({ rec }) {
  const [state, setState] = useState({ loading: true })
  const isRead = /^\s*(SELECT|WITH|SHOW|DESC)/i.test(rec.sql.replace(/--[^\n]*\n/g, ''))
  useEffect(() => {
    if (!isRead) return
    let live = true
    runSQL(rec.sql, { silent: true, maxRows: 2000 }).then(({ results }) => {
      if (live) setState({ res: results[results.length - 1] })
    }).catch((e) => live && setState({ res: { error: e.message } }))
    return () => { live = false }
  }, [rec.sql, isRead])
  if (!isRead) return <EmptyState icon={FileCode2} title="Câu lệnh không trả về bảng kết quả" desc="Chỉ xem lại được kết quả của câu SELECT. Câu lệnh này thay đổi dữ liệu hoặc cấu trúc nên không chạy lại để tránh tác dụng phụ." />
  if (state.loading && !state.res) return <div className="card p-5 flex flex-col gap-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-40" /></div>
  const r = state.res
  if (r.error) return <Callout tone="neg" icon={AlertCircle} title="Không xem lại được kết quả">{r.error}</Callout>
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 h-11 border-b border-line">
        <span className="text-[13px] text-muted">Kết quả chạy lại · <b className="text-fg num">{formatNumber(r.rowCount)}</b> dòng · {formatDuration(r.ms)}</span>
        <Button size="sm" variant="ghost" icon={Download} onClick={() => downloadCSV(`ket_qua_${rec.id.slice(0, 8)}`, r.columns, r.rows)}>Tải CSV</Button>
      </div>
      <DataGrid columns={r.columns} rows={r.rows} maxHeight={520} />
    </div>
  )
}

export default function QueryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { history, newFile } = useApp()
  const rec = history.find((h) => h.id === id)
  const [tab, setTab] = useState('detail')
  const [explain, setExplain] = useState(false)
  const [levels, setLevels] = useState(false)

  const parts = useMemo(() => {
    if (!rec) return null
    const r = seeded(parseInt(hashSQL(rec.sql).slice(0, 8), 16))
    const compile = Math.min(rec.ms * 0.18, 30 + r.next() * 120)
    const queue = rec.ms > 1500 ? rec.ms * (0.03 + r.next() * 0.08) : 0
    return [
      { label: 'Biên dịch', ms: compile, color: 'var(--c-chart-2)' },
      { label: 'Hàng đợi', ms: queue, color: 'var(--c-chart-3)' },
      { label: 'Thực thi', ms: Math.max(0, rec.ms - compile - queue), color: 'var(--c-chart-1)' },
    ]
  }, [rec])

  if (!rec) {
    return (
      <Page crumbs={[{ label: 'Lịch sử truy vấn', to: '/giam-sat/truy-van' }, { label: 'Không tìm thấy' }]}>
        <EmptyState icon={SearchX} title="Không tìm thấy truy vấn" desc="Truy vấn này có thể đã quá 14 ngày hoặc bị xoá khỏi lịch sử của trình duyệt."
          action={<Button variant="primary" to="/giam-sat/truy-van">Về lịch sử truy vấn</Button>} />
      </Page>
    )
  }

  const end = rec.startedAt + rec.ms
  return (
    <Page wide crumbs={[{ label: 'Giám sát' }, { label: 'Lịch sử truy vấn', to: '/giam-sat/truy-van' }, { label: rec.id.slice(0, 18) + '…' }]}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-start gap-2 min-w-0">
          <IconButton icon={ArrowLeft} label="Quay lại" onClick={() => navigate(-1)} className="-ml-2 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="ds-h1 truncate">Truy vấn · <span className="font-mono text-[20px]">{rec.id}</span></h1>
              <CopyButton text={rec.id} label="Sao chép mã truy vấn" />
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <QueryStatus value={rec.status} />
              <Badge size="sm">{rec.warehouse} · {rec.size || 'X-Small'}</Badge>
              <Badge size="sm">{rec.user}</Badge>
              <span className="ds-caption">{formatDateTime(rec.startedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button icon={Sparkles} onClick={() => setExplain(true)}>Phân tích với Tinh Ý</Button>
          <Button variant="primary" icon={FileCode2} onClick={() => { newFile({ name: `truy_van_${rec.id.slice(4, 12)}.sql`, content: rec.sql.trim() + (rec.sql.trim().endsWith(';') ? '\n' : ';\n') }); navigate('/khong-gian') }}>Mở trong trình soạn</Button>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} className="mb-5" options={[
        { value: 'detail', label: 'Chi tiết' },
        { value: 'profile', label: 'Hồ sơ truy vấn' },
        { value: 'result', label: 'Kết quả' },
        { value: 'trace', label: 'Dấu vết' },
      ]} />

      {tab === 'detail' && (
        <div className="flex flex-col gap-5">
          {rec.status === 'Lỗi' && <Callout tone="neg" icon={AlertCircle} title="Truy vấn thất bại">{rec.error || 'Không rõ nguyên nhân.'}</Callout>}
          <div className="card p-5">
            <h3 className="ds-h3 mb-4">Chi tiết</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              <Row label="Trạng thái"><QueryStatus value={rec.status} /></Row>
              <Row label="Bắt đầu">{formatDateTime(rec.startedAt)}</Row>
              <Row label="Kết thúc">{formatDateTime(end)}</Row>
              <Row label="Thời lượng"><span className="num font-[600]">{formatDuration(rec.ms)}</span></Row>
              <Row label="Kho tính toán">{rec.warehouse} <span className="text-faint">({rec.size || 'X-Small'})</span></Row>
              <Row label="Người dùng / vai trò">{rec.user} · {rec.role}</Row>
              <Row label="Số dòng trả về"><span className="num">{formatNumber(rec.rows || 0)}</span></Row>
              <Row label="Dữ liệu đã quét"><span className="num">{formatBytes(rec.bytes || 0)}</span></Row>
              <Row label="Nguồn">{rec.source || 'Không gian làm việc'}</Row>
              <Row label="Loại câu lệnh">{{ select: 'Truy vấn (SELECT)', ddl: 'Định nghĩa (DDL)', dml: 'Thay đổi dữ liệu (DML)', meta: 'Quản trị', error: 'Lỗi' }[rec.kind] || 'Khác'}</Row>
              <Row label="Mã băm tham số"><span className="font-mono text-[12px]">{hashSQL(rec.sql)}</span></Row>
              <Row label="Phiên bản trình điều khiển">Lạc Việt Data Web 9.32.1</Row>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-[12.5px] text-muted mb-1.5"><span>Phân bổ thời gian</span><span className="num">{formatDuration(rec.ms)}</span></div>
              <div className="flex h-3 rounded-full overflow-hidden bg-subtle">
                {parts.map((p) => <div key={p.label} title={`${p.label}: ${formatDuration(p.ms)}`} style={{ width: `${(p.ms / (rec.ms || 1)) * 100}%`, background: p.color }} />)}
              </div>
              <div className="flex gap-4 flex-wrap mt-2 text-[12.5px]">
                {parts.map((p) => <span key={p.label} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: p.color }} />{p.label}<b className="num font-[600]">{formatDuration(p.ms)}</b></span>)}
              </div>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 h-12 border-b border-line">
              <h3 className="ds-h3">Câu SQL</h3>
              <CopyButton text={rec.sql} label="Sao chép SQL" />
            </div>
            <pre className="p-5 text-[13px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto bg-[var(--c-code-bg)]">{rec.sql}</pre>
          </div>
        </div>
      )}

      {tab === 'profile' && <QueryProfile rec={rec} />}
      {tab === 'result' && <ResultTab rec={rec} />}
      {tab === 'trace' && (
        <div className="card">
          <EmptyState icon={Radar} title="Chưa có dấu vết cho truy vấn này" desc="Dấu vết chỉ được ghi khi bật mức ghi nhận sự kiện cho tài khoản, cơ sở dữ liệu hoặc lược đồ."
            action={<Button variant="primary" onClick={() => setLevels(true)}>Đặt mức ghi nhận sự kiện</Button>} />
        </div>
      )}

      <ExplainModal open={explain} onClose={() => setExplain(false)} sql={rec.sql}
        extra={rec.status === 'Lỗi' ? <Callout tone="neg" icon={AlertCircle} title="Nguyên nhân lỗi">{rec.error}</Callout> : null} />
      <EventLevelModal open={levels} onClose={() => setLevels(false)} />
    </Page>
  )
}
