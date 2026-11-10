/* ==========================================================
   Thành phần & hàm dùng chung cho nhóm trang Giám sát / Tính toán
   ========================================================== */
import { useState } from 'react'
import { Check, Copy, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge, Button, Modal } from '@/components/ui'
import { toast } from '@/store'
import { explainSQL } from '@/engine/assistant'
import { SIZES, CREDIT_PRICE } from '@/data/platform'
import { formatNumber, TODAY } from '@/lib/format'

export const QUERY_STATUS = {
  'Thành công': 'pos',
  'Lỗi': 'neg',
  'Đang chạy': 'info',
  'Đang chờ': 'warn',
}
export function QueryStatus({ value }) {
  return <Badge tone={QUERY_STATUS[value] || 'neutral'} dot size="sm">{value}</Badge>
}

export function WarehouseState({ value }) {
  const tone = value === 'Đang chạy' ? 'pos' : value === 'Đang khởi động' ? 'info' : value === 'Đang tạm dừng' ? 'warn' : 'neutral'
  return <Badge tone={tone} dot size="sm">{value}</Badge>
}

/** Chuẩn hoá SQL để gom nhóm truy vấn giống nhau (bỏ hằng số, khoảng trắng) */
export function normalizeSQL(sql = '') {
  return sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:[^']|'')*'/g, '?')
    .replace(/\b\d+(\.\d+)?\b/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}
export function hashSQL(sql) {
  const s = normalizeSQL(sql)
  let h1 = 0x811c9dc5, h2 = 0x1b873593
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822507) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + (h1 ^ h2).toString(16).padStart(8, '0').slice(0, 4)
}

/** Thanh tỉ lệ thời lượng nhỏ trong bảng */
export function DurationBar({ ms, max, className }) {
  const pct = Math.max(3, Math.min(100, (ms / (max || 1)) * 100))
  return (
    <span className={cn('inline-block h-1.5 w-16 rounded-full bg-subtle overflow-hidden align-middle', className)}>
      <span className="block h-full rounded-full bg-brand-400" style={{ width: pct + '%' }} />
    </span>
  )
}

/** Nút sao chép nhỏ */
export function CopyButton({ text, label = 'Sao chép', className }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      title={label}
      onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(text); setOk(true); toast('Đã sao chép'); setTimeout(() => setOk(false), 1400) }}
      className={cn('inline-grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-fg', className)}
    >
      {ok ? <Check size={14} className="text-pos" /> : <Copy size={14} />}
    </button>
  )
}

/** Hiển thị văn bản có **in đậm** và xuống dòng */
export function RichText({ text, className }) {
  return (
    <div className={cn('whitespace-pre-wrap leading-relaxed text-[13.5px]', className)}>
      {String(text || '').split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <b key={i} className="font-[650]">{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}
    </div>
  )
}

/** Hộp thoại "Phân tích với Tinh Ý" cho một câu SQL */
export function ExplainModal({ open, onClose, sql, extra }) {
  return (
    <Modal open={open} onClose={onClose} size="lg"
      title={<span className="flex items-center gap-2"><span className="size-7 rounded-lg bg-crystal text-white grid place-items-center"><Sparkles size={15} /></span>Tinh Ý phân tích truy vấn</span>}
      footer={<Button variant="primary" onClick={onClose}>Đã hiểu</Button>}>
      <pre className="rounded-xl bg-subtle border border-line p-3 text-[12.5px] font-mono whitespace-pre-wrap max-h-40 overflow-auto mb-4">{sql}</pre>
      <RichText text={open ? explainSQL(sql || '') : ''} />
      {extra && <div className="mt-4">{extra}</div>}
    </Modal>
  )
}

/** Mốc "bây giờ": lấy thời điểm thật nếu đã qua mốc demo, để truy vấn vừa chạy hiển thị đúng */
export const nowRef = () => Math.max(Date.now(), TODAY.getTime())
/** "Vừa xong" · "5 phút trước" · "3 giờ trước" · "2 ngày trước" */
export function ago(ts) {
  const diff = (nowRef() - ts) / 1000
  if (diff < 45) return 'Vừa xong'
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} phút trước`
  if (diff < 86400) return `${Math.round(diff / 3600)} giờ trước`
  return `${Math.round(diff / 86400)} ngày trước`
}

export const sizeCredits =(size) => SIZES.find((s) => s.id === size)?.credits ?? 1
export const creditCostVND = (credits) => `${formatNumber(credits * CREDIT_PRICE)} ₫`

/** Mảnh thẻ biểu đồ nhỏ */
export function ChartCard({ title, value, sub, children, onClick, className, action }) {
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
      className={cn('card p-4 min-w-0 flex flex-col', onClick && 'cursor-pointer hover:border-brand-200 hover:shadow-sm transition', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-[600] text-dim truncate">{title}</div>
          {value != null && <div className="text-[20px] font-[650] num tracking-tight mt-0.5">{value}{sub && <span className="text-[12px] font-[500] text-muted ml-1.5">{sub}</span>}</div>}
        </div>
        {action}
      </div>
      <div className="mt-2 flex-1">{children}</div>
    </div>
  )
}

/** Chú giải nhỏ cho biểu đồ nhiều chuỗi */
export function Legend({ items, className }) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap text-[11.5px] text-muted', className)}>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: it.color }} />{it.label}</span>
      ))}
    </div>
  )
}
