import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_1px_2px_rgba(40,25,120,.3)]',
  secondary: 'bg-subtle text-fg hover:bg-hover active:bg-press',
  outline: 'bg-surface text-fg border border-line-strong hover:bg-subtle active:bg-hover shadow-xs',
  ghost: 'text-dim hover:bg-hover hover:text-fg active:bg-press',
  danger: 'bg-neg text-white hover:brightness-95 active:brightness-90',
  'danger-soft': 'bg-neg-soft text-neg hover:brightness-[.97]',
  link: 'text-brand-ink hover:underline underline-offset-4 px-0 h-auto',
  inverse: 'bg-fg text-canvas hover:opacity-90',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-[12.5px] gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[9px]',
  md: 'h-9 px-3.5 text-[13.5px] gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-[14.5px] gap-2 rounded-xl',
}

/**
 * Nút bấm chuẩn.
 * <Button variant="primary" size="md" icon={Send} to="/duong-dan">Chuyển tiền</Button>
 * - variant: primary | secondary | outline | ghost | danger | danger-soft | link | inverse
 * - pill: bo tròn hẳn (dùng cho thanh hành động nhanh)
 */
export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading, pill, to, href, className, children, disabled, type = 'button', ...props },
  ref,
) {
  const cls = cn(
    'inline-flex items-center justify-center whitespace-nowrap font-[550] transition-[background,color,box-shadow,opacity,filter] duration-150 select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    SIZES[size],
    VARIANTS[variant],
    pill && 'rounded-full',
    className,
  )
  const iconSize = size === 'lg' ? 18 : size === 'xs' ? 14 : 16
  const content = (
    <>
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} strokeWidth={2} className="shrink-0" />}
      {children}
      {IconRight && <IconRight size={iconSize} strokeWidth={2} className="shrink-0 -mr-0.5" />}
    </>
  )
  if (to) return <Link ref={ref} to={to} className={cls} {...props}>{content}</Link>
  if (href) return <a ref={ref} href={href} className={cls} target="_blank" rel="noreferrer" {...props}>{content}</a>
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
})

/** Nút chỉ có biểu tượng — luôn cần `label` để đọc màn hình và tooltip. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', className, badge, ...props },
  ref,
) {
  const s = { xs: 'size-7', sm: 'size-8', md: 'size-9', lg: 'size-11' }[size]
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center rounded-[10px] transition-colors duration-150 disabled:opacity-40',
        s,
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      <Icon size={size === 'xs' ? 14 : size === 'lg' ? 20 : 17} strokeWidth={1.9} />
      {badge ? <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-neg ring-2 ring-canvas" /> : null}
    </button>
  )
})
