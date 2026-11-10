import { forwardRef, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search, UploadCloud, FileText, X, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

const control =
  'w-full bg-surface border border-line-strong rounded-[10px] text-[14px] text-fg transition-[border,box-shadow] duration-150 ' +
  'hover:border-faint focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100 ' +
  'aria-[invalid=true]:border-neg aria-[invalid=true]:ring-neg-soft'

/** Khung nhãn + gợi ý + lỗi cho mọi ô nhập. */
export function Field({ label, hint, error, optional, children, className, htmlFor, action }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-[13px] font-[550] text-dim">
            {label} {optional && <span className="font-normal text-faint">(không bắt buộc)</span>}
          </label>
          {action}
        </div>
      )}
      {children}
      {error ? <p className="text-[12.5px] text-neg">{error}</p> : hint ? <p className="ds-caption">{hint}</p> : null}
    </div>
  )
}

/** Ô nhập chữ. prefix/suffix có thể là chữ hoặc icon component. */
export const Input = forwardRef(function Input({ label, hint, error, optional, prefix: Prefix, suffix, className, inputClassName, size = 'md', id, ...props }, ref) {
  const autoId = useId()
  const fid = id || autoId
  const h = size === 'lg' ? 'h-11' : size === 'sm' ? 'h-8' : 'h-10'
  const box = (
    <div className={cn(control, 'flex items-center gap-2 px-3', h, props.disabled && 'opacity-60 bg-subtle')} aria-invalid={!!error}>
      {Prefix && (typeof Prefix === 'string' ? <span className="text-muted text-[13.5px] shrink-0">{Prefix}</span> : <Prefix size={16} className="text-faint shrink-0" />)}
      <input ref={ref} id={fid} className={cn('min-w-0 flex-1 bg-transparent outline-none h-full', inputClassName)} {...props} />
      {suffix && <span className="text-muted text-[13.5px] shrink-0">{suffix}</span>}
    </div>
  )
  if (!label && !hint && !error) return <div className={className}>{box}</div>
  return <Field label={label} hint={hint} error={error} optional={optional} className={className} htmlFor={fid}>{box}</Field>
})

/** Ô nhập số tiền VND: tự chèn dấu chấm phân cách hàng nghìn. value là số. */
export function MoneyInput({ value, onChange, label, hint, error, size = 'md', className, autoFocus, placeholder = '0', big }) {
  const display = value ? formatNumber(value) : ''
  const handle = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 13)
    onChange(raw ? Number(raw) : 0)
  }
  if (big) {
    return (
      <div className={cn('flex items-baseline gap-2 border-b-2 border-line-strong focus-within:border-brand-400 transition-colors pb-1', className)}>
        <input inputMode="numeric" autoFocus={autoFocus} value={display} onChange={handle} placeholder={placeholder}
          className="num min-w-0 flex-1 bg-transparent outline-none text-[40px] font-[450] tracking-tight placeholder:text-faint" />
        <span className="text-[22px] text-muted">₫</span>
      </div>
    )
  }
  return (
    <Input label={label} hint={hint} error={error} size={size} className={className} inputMode="numeric" autoFocus={autoFocus}
      value={display} onChange={handle} placeholder={placeholder} suffix="₫" inputClassName="num text-right" />
  )
}

export const Textarea = forwardRef(function Textarea({ label, hint, error, optional, className, rows = 3, id, ...props }, ref) {
  const autoId = useId()
  const fid = id || autoId
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className} htmlFor={fid}>
      <div className={cn(control, 'px-3 py-2')} aria-invalid={!!error}>
        <textarea ref={ref} id={fid} rows={rows} className="w-full bg-transparent outline-none resize-none leading-relaxed" {...props} />
      </div>
    </Field>
  )
})

/** Hộp chọn (native select đã tạo kiểu) — options: [{ value, label }] hoặc mảng chuỗi. */
export const Select = forwardRef(function Select({ label, hint, error, optional, options = [], className, size = 'md', placeholder, id, ...props }, ref) {
  const autoId = useId()
  const fid = id || autoId
  const h = size === 'lg' ? 'h-11' : size === 'sm' ? 'h-8 text-[13px]' : 'h-10'
  const box = (
    <div className={cn(control, 'relative flex items-center', h)} aria-invalid={!!error}>
      <select ref={ref} id={fid} className="appearance-none w-full h-full bg-transparent outline-none pl-3 pr-9 cursor-pointer" {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return <option key={opt.value} value={opt.value}>{opt.label}</option>
        })}
      </select>
      <ChevronDown size={16} className="absolute right-3 text-faint pointer-events-none" />
    </div>
  )
  if (!label && !hint && !error) return <div className={className}>{box}</div>
  return <Field label={label} hint={hint} error={error} optional={optional} className={className} htmlFor={fid}>{box}</Field>
})

/** Ô tìm kiếm gọn */
export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm', className, autoFocus, kbd }) {
  return (
    <div className={cn(control, 'flex items-center gap-2 h-9 px-3', className)}>
      <Search size={15} className="text-faint shrink-0" />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none text-[13.5px]" />
      {value ? (
        <button onClick={() => onChange('')} className="text-faint hover:text-fg" aria-label="Xoá"><X size={14} /></button>
      ) : kbd ? <kbd className="text-[11px] text-faint font-mono">{kbd}</kbd> : null}
    </div>
  )
}

/** Ô đánh dấu. indeterminate = trạng thái chọn một phần. */
export function Checkbox({ checked, onChange, label, desc, indeterminate, className, disabled }) {
  return (
    <label className={cn('inline-flex items-start gap-2.5 select-none', disabled ? 'opacity-50' : 'cursor-pointer', className)}>
      <span
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : !!checked}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange?.(!checked) } }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onChange?.(!checked) }}
        className={cn(
          'mt-[1px] size-[18px] shrink-0 rounded-[5px] border grid place-items-center transition-colors',
          checked || indeterminate ? 'bg-brand-500 border-brand-500 text-white' : 'bg-surface border-line-strong hover:border-faint',
        )}
      >
        {indeterminate ? <Minus size={13} strokeWidth={3} /> : checked ? <Check size={13} strokeWidth={3} /> : null}
      </span>
      {(label || desc) && (
        <span className="flex flex-col" onClick={() => !disabled && onChange?.(!checked)}>
          {label && <span className="text-[13.5px] text-fg leading-5">{label}</span>}
          {desc && <span className="ds-caption">{desc}</span>}
        </span>
      )}
    </label>
  )
}

/** Công tắc bật/tắt */
export function Toggle({ checked, onChange, label, desc, className, size = 'md', disabled, 'aria-label': ariaLabel }) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative shrink-0 rounded-full transition-colors duration-200',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand-500' : 'bg-line-strong',
        disabled && 'opacity-50',
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
        size === 'sm' ? 'size-4' : 'size-5',
        checked && (size === 'sm' ? 'translate-x-4' : 'translate-x-5'),
      )} />
    </button>
  )
  if (!label) return sw
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="text-[14px] font-[520] text-fg">{label}</div>
        {desc && <div className="ds-caption mt-0.5">{desc}</div>}
      </div>
      {sw}
    </div>
  )
}

/** Lựa chọn dạng thẻ (radio) — options: [{ value, label, desc, icon }] */
export function RadioCards({ value, onChange, options, className, columns = 1 }) {
  return (
    <div role="radiogroup" className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3', className)}>
      {options.map((o) => {
        const on = value === o.value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-start gap-3 text-left rounded-xl border p-3.5 transition-[border,background,box-shadow]',
              on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint',
            )}
          >
            {Icon ? (
              <span className={cn('size-9 shrink-0 grid place-items-center rounded-lg', on ? 'bg-brand-500 text-white' : 'bg-subtle text-dim')}>
                <Icon size={18} />
              </span>
            ) : (
              <span className={cn('mt-0.5 size-[18px] shrink-0 rounded-full border-2 grid place-items-center', on ? 'border-brand-500' : 'border-line-strong')}>
                {on && <span className="size-2 rounded-full bg-brand-500" />}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[14px] font-[550] text-fg">{o.label}</span>
              {o.desc && <span className="block ds-caption mt-0.5">{o.desc}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Vùng kéo-thả tệp (mô phỏng: chỉ lấy tên tệp) */
export function FileDrop({ value, onChange, accept = '.pdf,.jpg,.jpeg,.png', hint = 'PDF, JPG hoặc PNG, tối đa 10 MB', label = 'Kéo thả tệp vào đây hoặc bấm để chọn', className, compact }) {
  const ref = useRef(null)
  const [over, setOver] = useState(false)
  const pick = (f) => f && onChange?.({ name: f.name, size: f.size })
  if (value) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border border-line bg-subtle px-3.5 py-3', className)}>
        <span className="size-9 grid place-items-center rounded-lg bg-surface border border-line text-brand-ink"><FileText size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-[550] truncate">{value.name}</div>
          <div className="ds-caption">{value.size ? `${Math.max(1, Math.round(value.size / 1024))} KB · ` : ''}Đã tải lên</div>
        </div>
        <button onClick={() => onChange?.(null)} className="text-faint hover:text-neg p-1" aria-label="Gỡ tệp"><X size={16} /></button>
      </div>
    )
  }
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]) }}
      className={cn(
        'flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed cursor-pointer transition-colors',
        compact ? 'px-4 py-4' : 'px-6 py-8',
        over ? 'border-brand-400 bg-brand-50' : 'border-line-strong hover:bg-subtle',
        className,
      )}
    >
      <span className="size-10 grid place-items-center rounded-full bg-subtle text-muted"><UploadCloud size={19} /></span>
      <div className="text-[13.5px] font-[550] text-fg">{label}</div>
      <div className="ds-caption">{hint}</div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  )
}

/** Ô nhập mã OTP 6 số */
export function OtpInput({ value = '', onChange, length = 6, autoFocus = true, masked }) {
  const refs = useRef([])
  const set = (i, ch) => {
    const arr = value.padEnd(length, ' ').split('')
    arr[i] = ch || ' '
    onChange(arr.join('').replace(/\s+$/, ''))
  }
  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          autoFocus={autoFocus && i === 0}
          type={masked ? 'password' : 'text'}
          aria-label={`Số thứ ${i + 1}`}
          inputMode="numeric"
          maxLength={1}
          value={value[i]?.trim() || ''}
          onChange={(e) => { const c = e.target.value.replace(/\D/g, ''); set(i, c); if (c && i < length - 1) refs.current[i + 1]?.focus() }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !value[i]?.trim() && i > 0) refs.current[i - 1]?.focus() }}
          onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, length - 1)]?.focus() } }}
          className={cn(control, 'num size-12 text-center text-[20px] font-[550] outline-none')}
        />
      ))}
    </div>
  )
}
