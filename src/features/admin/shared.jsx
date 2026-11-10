/* Thành phần dùng chung cho các trang quản trị */
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toast } from '@/store'

const pad = (n) => String(n).padStart(2, '0')
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const viDate = (s) => (s ? `${+s.slice(8, 10)}/${+s.slice(5, 7)}/${s.slice(0, 4)}` : '—')

/** Ô nhập nhiều email dạng chip (Enter, dấu phẩy hoặc dấu cách để thêm) */
export function EmailChips({ value = [], onChange, placeholder = 'Nhập email rồi nhấn Enter', invalidText = 'Email chưa hợp lệ' }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const add = () => {
    const parts = text.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean)
    if (!parts.length) return
    const bad = parts.filter((p) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p))
    if (bad.length) { setErr(`${invalidText}: ${bad.join(', ')}`); return }
    onChange([...new Set([...value, ...parts])])
    setText(''); setErr('')
  }
  return (
    <div>
      <div className="min-h-10 w-full flex flex-wrap items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-2 py-1.5 focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100">
        {value.map((e) => (
          <span key={e} className="inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-ink px-2 h-7 text-[12.5px] font-[550]">
            {e}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== e))} aria-label={`Bỏ ${e}`} className="hover:text-neg"><X size={13} /></button>
          </span>
        ))}
        <input value={text} onChange={(e) => { setText(e.target.value); setErr('') }} placeholder={value.length ? '' : placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); add() } if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)) }}
          onBlur={add} className="flex-1 min-w-[160px] h-7 bg-transparent outline-none text-[13.5px] px-1" />
      </div>
      {err && <p className="text-[12.5px] text-neg mt-1">{err}</p>}
    </div>
  )
}

/** Lịch chọn ngày nhỏ (dựng tại chỗ, không dùng thư viện) */
export function MiniCalendar({ value, onChange, min, rangeStart }) {
  const init = value ? new Date(value) : new Date(2026, 10, 10)
  const [cur, setCur] = useState(new Date(init.getFullYear(), init.getMonth(), 1))
  const first = (cur.getDay() + 6) % 7
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div className="w-[264px] select-none">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))} className="size-8 grid place-items-center rounded-lg hover:bg-hover" aria-label="Tháng trước"><ChevronLeft size={16} /></button>
        <div className="font-[600] text-[13.5px]">Tháng {cur.getMonth() + 1}/{cur.getFullYear()}</div>
        <button type="button" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))} className="size-8 grid place-items-center rounded-lg hover:bg-hover" aria-label="Tháng sau"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[11.5px] text-faint mb-1">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const iso = isoDate(new Date(cur.getFullYear(), cur.getMonth(), d))
          const on = iso === value
          const inRange = rangeStart && value && iso > rangeStart && iso < value
          const disabled = min && iso < min
          return (
            <button type="button" key={i} disabled={disabled} onClick={() => onChange(iso)}
              className={cn('h-8 rounded-lg text-[13px] num', on ? 'bg-brand-500 text-white font-[650]' : inRange || iso === rangeStart ? 'bg-brand-50 text-brand-ink' : 'hover:bg-hover', disabled && 'opacity-30 pointer-events-none', iso === '2026-11-10' && !on && 'ring-1 ring-brand-300')}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Hộp mã có nút sao chép */
export function CodeBox({ children, className, copy = true, label }) {
  const text = String(children)
  return (
    <div className={cn('relative rounded-xl border border-line bg-subtle', className)}>
      {label && <div className="px-3.5 pt-2.5 ds-label">{label}</div>}
      <pre className="px-3.5 py-3 text-[12.5px] font-mono whitespace-pre-wrap break-all text-dim leading-relaxed">{text}</pre>
      {copy && (
        <button type="button" onClick={() => { navigator.clipboard?.writeText(text); toast('Đã sao chép') }}
          className="absolute top-2 right-2 size-8 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-fg" aria-label="Sao chép"><Copy size={14} /></button>
      )}
    </div>
  )
}

/** Thẻ số liệu nhỏ */
export function MetricCard({ label, value, sub, icon: Icon, tone, className, children }) {
  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted">{label}</span>
        {Icon && <Icon size={16} className="text-faint" />}
      </div>
      <div className={cn('mt-1.5 text-[24px] font-[650] tracking-tight num', tone === 'neg' && 'text-neg', tone === 'pos' && 'text-pos', tone === 'warn' && 'text-warn')}>{value}</div>
      {sub && <div className="ds-caption mt-0.5">{sub}</div>}
      {children}
    </div>
  )
}

export const SEVERITY_TONE = { 'Nghiêm trọng': 'neg', Cao: 'neg', 'Trung bình': 'warn', Thấp: 'info' }
