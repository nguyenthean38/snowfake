import { useId } from 'react'
import { cn } from '@/lib/cn'

/** Ngôi sao 14 cánh ở tâm mặt trống đồng Đông Sơn — biểu tượng của Lạc Việt Data */
function starPath(cx, cy, rOut, rIn, n) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut
    const a = (Math.PI * i) / n - Math.PI / 2
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`)
  }
  return 'M' + pts.join('L') + 'Z'
}
const STAR = starPath(16, 16, 9.2, 4.1, 14)

/** Biểu tượng: vành trống + ngôi sao tâm trống, nét gradient tím chàm → lam ngọc */
export function LogoMark({ size = 28, className, mono }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mono ? 'currentColor' : '#7c6cff'} />
          <stop offset="1" stopColor={mono ? 'currentColor' : '#22c3d6'} />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14.2" fill="none" stroke={`url(#lg${id})`} strokeWidth="2.4" />
      <circle cx="16" cy="16" r="11.3" fill="none" stroke={`url(#lg${id})`} strokeWidth="0.9" strokeDasharray="1.6 1.4" opacity=".7" />
      <path d={STAR} fill={`url(#lg${id})`} />
      <circle cx="16" cy="16" r="2.1" fill="var(--c-surface, #fff)" />
    </svg>
  )
}

/** Logo đầy đủ: biểu tượng + chữ "Lạc Việt" kèm nhãn nhỏ "DATA" */
export function Logo({ size = 28, className, text = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <LogoMark size={size} />
      {text && (
        <span className="inline-flex items-baseline gap-1.5 leading-none whitespace-nowrap">
          <span className="font-[750] tracking-[-0.03em] text-[19px] text-fg">Lạc Việt</span>
          <span className="text-[10.5px] font-[700] tracking-[0.14em] text-crystal">DATA</span>
        </span>
      )}
    </span>
  )
}
