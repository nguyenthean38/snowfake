import { useMemo } from 'react'
import { seeded } from '@/lib/random'

/** Mã QR minh hoạ (không quét được) — sinh ô vuông theo chuỗi `value` cho bản demo. */
export function QrCode({ value = 'mach', size = 168, className }) {
  const N = 29
  const cells = useMemo(() => {
    let h = 0
    for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    const r = seeded(h)
    const out = []
    const finder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && r.chance(0.48)) out.push([x, y])
    return out
  }, [value])
  const s = size / N
  const Finder = ({ x, y }) => (
    <g transform={`translate(${x * s},${y * s})`}>
      <rect width={7 * s} height={7 * s} rx={s * 1.6} fill="currentColor" />
      <rect x={s} y={s} width={5 * s} height={5 * s} rx={s} fill="var(--qr-bg, #fff)" />
      <rect x={2 * s} y={2 * s} width={3 * s} height={3 * s} rx={s * 0.6} fill="currentColor" />
    </g>
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="Mã QR thanh toán">
      {cells.map(([x, y]) => <rect key={x + '-' + y} x={x * s + 0.4} y={y * s + 0.4} width={s - 0.8} height={s - 0.8} rx={s * 0.3} fill="currentColor" />)}
      <Finder x={0} y={0} /><Finder x={N - 7} y={0} /><Finder x={0} y={N - 7} />
    </svg>
  )
}
