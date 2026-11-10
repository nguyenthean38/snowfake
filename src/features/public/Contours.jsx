import { useMemo } from 'react'
import { cn } from '@/lib/cn'

/**
 * Nền đường đồng mức (contour) chuyển động nhẹ — gợi hình "dòng dữ liệu".
 * Các đường cong lồng nhau, trôi chậm bằng CSS transform.
 */
export function Contours({ className, rings = 22, opacity = 0.55 }) {
  const paths = useMemo(() => {
    const out = []
    for (let i = 0; i < rings; i++) {
      const r = 60 + i * 34
      const wob = 10 + i * 1.4
      // hình giọt nước méo nhẹ quanh tâm (600, 640)
      const pts = []
      for (let a = 0; a <= 360; a += 15) {
        const rad = (a * Math.PI) / 180
        const k = r + Math.sin(rad * 3 + i * 0.5) * wob + Math.cos(rad * 2 - i * 0.3) * wob * 0.6
        pts.push([600 + Math.cos(rad) * k * 1.35, 640 + Math.sin(rad) * k * 0.8])
      }
      out.push('M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + 'Z')
    }
    return out
  }, [rings])
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <svg viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ opacity }}>
        <defs>
          <linearGradient id="contour-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--c-brand-400)" />
            <stop offset="1" stopColor="var(--c-ice)" />
          </linearGradient>
          <radialGradient id="contour-fade" cx="50%" cy="72%" r="70%">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="contour-mask"><rect width="1200" height="900" fill="url(#contour-fade)" /></mask>
        </defs>
        <g mask="url(#contour-mask)" fill="none" stroke="url(#contour-g)" strokeWidth="1">
          {paths.map((d, i) => (
            <path key={i} d={d} opacity={0.25 + (i % 4) * 0.08}
              style={{ transformOrigin: '600px 640px', animation: `contour-drift ${18 + (i % 5) * 4}s ease-in-out ${-i * 0.7}s infinite alternate` }} />
          ))}
        </g>
      </svg>
      <style>{`
        @keyframes contour-drift { from { transform: rotate(-2.2deg) scale(1) } to { transform: rotate(2.2deg) scale(1.035) } }
        @media (prefers-reduced-motion: reduce) { [style*="contour-drift"] { animation: none !important } }
      `}</style>
    </div>
  )
}
