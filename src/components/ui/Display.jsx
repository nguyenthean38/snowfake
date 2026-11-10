import { Children, cloneElement, isValidElement, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info, Inbox } from 'lucide-react'
import { ICONS } from './icons'
import { cn } from '@/lib/cn'
import { formatNumber, initials } from '@/lib/format'
import { useUI } from '@/store'

/* ---------------- Thẻ nội dung ---------------- */
export function Card({ className, children, as: As = 'div', padded = true, interactive, ...props }) {
  return (
    <As className={cn('card', padded && 'p-5', interactive && 'transition-shadow hover:shadow-sm', className)} {...props}>
      {children}
    </As>
  )
}

/** Tiêu đề thẻ: tên + hành động bên phải */
export function CardHeader({ title, desc, action, className, icon: Icon }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0 flex items-start gap-2.5">
        {Icon && <Icon size={18} className="text-muted mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <h3 className="ds-h3 text-fg">{title}</h3>
          {desc && <p className="ds-caption mt-0.5">{desc}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-1">{action}</div>}
    </div>
  )
}

/** Tiêu đề trang: tên + mô tả + nút hành động */
export function PageHeader({ title, desc, actions, children, className, badge }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="ds-h1 text-fg">{title}</h1>
          {badge}
        </div>
        {desc && <p className="text-muted mt-1 max-w-2xl">{desc}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

/* ---------------- Tiền ---------------- */
/**
 * Hiển thị số tiền VND: chữ số to, ký hiệu ₫ nhỏ và nhạt.
 * - sign: hiện dấu + cho số dương  - tone: tô xanh/đỏ theo dấu  - hideable: che khi bật "Ẩn số dư"
 */
export function Money({ value, className, sign, tone, hideable = true, strike, currencyClass, compact }) {
  const hide = useUI((s) => s.hideBalances) && hideable
  const v = Math.round(value || 0)
  const neg = v < 0
  const txt = hide ? '••••••' : formatNumber(Math.abs(v))
  const prefix = hide ? '' : neg ? '−' : sign && v > 0 ? '+' : ''
  return (
    <span className={cn('num whitespace-nowrap', tone && !hide && (v > 0 ? 'text-pos' : neg ? 'text-fg' : ''), strike && 'line-through decoration-faint', className)}>
      {prefix}{txt}
      <span className={cn('ml-[0.18em] text-[0.72em] font-normal', tone && v > 0 && !hide ? 'text-pos/80' : 'text-faint', currencyClass)}>₫</span>
    </span>
  )
}

/* ---------------- Nhãn trạng thái ---------------- */
const TONES = {
  neutral: 'bg-subtle text-dim border-line',
  pos: 'bg-pos-soft text-pos border-transparent',
  neg: 'bg-neg-soft text-neg border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  brand: 'bg-brand-50 text-brand-ink border-brand-100',
  gold: 'bg-gold-soft text-gold border-transparent',
}
/** <Badge tone="pos" dot>Đã thanh toán</Badge> */
export function Badge({ tone = 'neutral', dot, children, className, icon: Icon, size = 'md' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border font-[550] whitespace-nowrap',
      size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 px-2 text-[12px]',
      TONES[tone], className,
    )}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon size={12} strokeWidth={2.2} />}
      {children}
    </span>
  )
}
/** Nhãn từ bảng tra trạng thái: <StatusBadge map={BILL_STATUS} value="paid" /> */
export function StatusBadge({ map, value, className }) {
  const s = map[value] || { label: value, tone: 'neutral' }
  return <Badge tone={s.tone} dot className={className}>{s.label}</Badge>
}

/* ---------------- Avatar ---------------- */
/** Avatar chữ cái đầu, màu theo `color`. square cho doanh nghiệp. */
export function Avatar({ name = '', color = '#5b46e5', size = 32, square, className, src }) {
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.36), background: `color-mix(in srgb, ${color} 15%, var(--c-surface))`, color }
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className={cn('object-cover shrink-0', square ? 'rounded-lg' : 'rounded-full', className)} />
  return (
    <span aria-hidden className={cn('inline-grid place-items-center font-[650] shrink-0 select-none', square ? 'rounded-[28%]' : 'rounded-full', className)} style={style}>
      {initials(name)}
    </span>
  )
}

/** Nhóm avatar chồng nhau */
export function AvatarStack({ people = [], max = 4, size = 26 }) {
  const shown = people.slice(0, max)
  return (
    <div className="flex -space-x-1">
      {shown.map((p) => <Avatar key={p.id || p.name} name={p.name} color={p.color} size={size} className="ring-2 ring-surface" />)}
      {people.length > max && (
        <span className="inline-grid place-items-center rounded-full bg-subtle text-muted text-[11px] font-[600] ring-2 ring-surface" style={{ width: size, height: size }}>
          +{people.length - max}
        </span>
      )}
    </div>
  )
}

/** Biểu tượng lucide theo tên chuỗi (dùng cho dữ liệu) */
export function DynIcon({ name, ...props }) {
  const I = ICONS[name] || ICONS.Circle
  return <I {...props} />
}

/* ---------------- Phím tắt ---------------- */
export function Kbd({ children, className }) {
  return <kbd className={cn('inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-[5px] border border-line-strong bg-surface text-[11px] font-mono text-muted shadow-[0_1px_0_var(--c-line-strong)]', className)}>{children}</kbd>
}

/* ---------------- Thanh phân đoạn & tab ---------------- */
/** <Segmented value onChange options={[{ value, label, icon }]} /> */
export function Segmented({ value, onChange, options, size = 'md', className }) {
  return (
    <div role="tablist" className={cn('inline-flex items-center gap-0.5 rounded-[11px] bg-subtle p-[3px] border border-line', className)}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o
        const on = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={on}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[8px] font-[550] transition-all duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
              on ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon size={15} />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Tab gạch chân: options [{ value, label, count }] */
export function Tabs({ value, onChange, options, className }) {
  return (
    <div role="tablist" className={cn('flex items-center gap-5 border-b border-line overflow-x-auto no-scrollbar', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative h-10 inline-flex items-center gap-1.5 text-[13.5px] font-[550] whitespace-nowrap transition-colors',
              on ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn('num rounded-md px-1.5 text-[11.5px] leading-5', on ? 'bg-fg text-canvas' : 'bg-subtle text-muted')}>{o.count}</span>
            )}
            {on && <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-fg" />}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Chỉ số ---------------- */
/** Một con số có nhãn: dùng trong dải tóm tắt */
export function Stat({ label, value, sub, className, tone, hint, children }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-1 text-[13px] text-muted">
        <span className={hint ? 'dotted-underline cursor-help' : ''} title={hint}>{label}</span>
      </div>
      <div className={cn('mt-1 text-[22px] font-[500] tracking-tight leading-tight', tone === 'pos' && 'text-pos', tone === 'neg' && 'text-neg')}>{value}</div>
      {sub && <div className="ds-caption mt-0.5">{sub}</div>}
      {children}
    </div>
  )
}

/** Thanh tiến độ. tone tự đổi sang cảnh báo khi gần chạm hạn mức. */
export function Progress({ value = 0, max = 100, className, tone, height = 6, auto = true }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  const t = tone || (auto ? (pct >= 90 ? 'neg' : pct >= 75 ? 'warn' : 'brand') : 'brand')
  const bg = { brand: 'bg-brand-500', neg: 'bg-neg', warn: 'bg-warn', info: 'bg-info', pos: 'bg-pos' }[t]
  return (
    <div className={cn('w-full rounded-full bg-subtle overflow-hidden', className)} style={{ height }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', bg)} style={{ width: pct + '%' }} />
    </div>
  )
}

/** Danh sách cặp nhãn – giá trị (chi tiết trong ngăn kéo) */
export function KeyValue({ items, className, cols = 1 }) {
  return (
    <dl className={cn('grid gap-x-6', cols === 2 && 'sm:grid-cols-2', className)}>
      {items.filter(Boolean).map((it) => (
        <div key={it.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-line last:border-0">
          <dt className="text-[13px] text-muted shrink-0">{it.label}</dt>
          <dd className="text-[13.5px] text-fg text-right min-w-0 break-words">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ---------------- Trạng thái trống / tải ---------------- */
export function EmptyState({ icon: Icon = Inbox, title, desc, action, className, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-14 px-6', className)}>
      <span className="size-12 grid place-items-center rounded-2xl bg-subtle text-muted mb-3.5 border border-line"><Icon size={22} /></span>
      <div className="ds-h3">{title}</div>
      {desc && <p className="ds-caption mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton h-4', className)} />
}

/** Hộp thông tin / cảnh báo trong trang */
export function Callout({ tone = 'info', icon: Icon = Info, title, children, action, className }) {
  const t = { info: 'bg-info-soft text-info', warn: 'bg-warn-soft text-warn', neg: 'bg-neg-soft text-neg', pos: 'bg-pos-soft text-pos', brand: 'bg-brand-50 text-brand-ink', neutral: 'bg-subtle text-dim' }[tone]
  return (
    <div className={cn('flex items-start gap-3 rounded-xl px-4 py-3', t, className)}>
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-[13.5px]">
        {title && <div className="font-[600]">{title}</div>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Dòng liên kết "Xem tất cả ›" */
export function MoreLink({ to, children = 'Xem tất cả', className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-0.5 text-[13px] font-[550] text-brand-ink hover:underline underline-offset-4', className)}>
      {children}<ChevronRight size={15} />
    </Link>
  )
}

/** Tooltip nhẹ bằng CSS (hiện khi rê chuột / focus) */
export function Tooltip({ content, children, side = 'top', className }) {
  const [open, setOpen] = useState(false)
  const child = Children.only(children)
  return (
    <span className={cn('relative inline-flex', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {isValidElement(child) ? cloneElement(child) : child}
      {open && content && (
        <span role="tooltip" className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg bg-fg px-2.5 py-1.5 text-[12px] font-[500] text-canvas shadow-md animate-fade-in',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}>
          {content}
        </span>
      )}
    </span>
  )
}

/** Đường kẻ chia có chữ */
export function Divider({ label, className }) {
  if (!label) return <hr className={cn('border-line', className)} />
  return (
    <div className={cn('flex items-center gap-3 text-[12px] text-faint', className)}>
      <span className="h-px flex-1 bg-line" />{label}<span className="h-px flex-1 bg-line" />
    </div>
  )
}
