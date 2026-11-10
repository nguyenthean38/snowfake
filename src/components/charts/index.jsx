/* ==========================================================
   Biểu đồ SVG tự viết — không dùng thư viện ngoài
   - LineChart / BarChart: một hoặc nhiều chuỗi, tooltip khi rê chuột
   - HBarChart: cột ngang có nhãn dài (xếp hạng)
   - Donut, Sparkline, BarList
   - ResultChart: vẽ nhanh từ kết quả SQL { columns, rows } + spec
   ========================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatCompact, formatNumber } from '@/lib/format'

export const PALETTE = ['var(--c-chart-1)', 'var(--c-chart-2)', 'var(--c-chart-3)', 'var(--c-chart-4)', 'var(--c-chart-5)', 'var(--c-chart-6)']

export function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Các mốc trục tròn đẹp */
export function niceTicks(min, max, count = 4) {
  if (!isFinite(min) || !isFinite(max)) return [0, 1]
  if (min === max) { max = min + (min === 0 ? 1 : Math.abs(min) * 0.5) }
  const span = max - min
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out = []
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10))
  return out
}

/** Định dạng nhãn trục: số lớn rút gọn, ngày ISO → "Th3" hoặc "12/3" */
export function axisLabel(v, monthly = true) {
  if (typeof v === 'number') return formatCompact(v)
  const s = String(v ?? '')
  if (monthly && /^\d{4}-\d{2}-01$/.test(s)) return `Th${+s.slice(5, 7)}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return `${+s.slice(8, 10)}/${+s.slice(5, 7)}`
  return s.length > 14 ? s.slice(0, 13) + '…' : s
}
export function valueLabel(v) {
  if (typeof v !== 'number') return String(v ?? '—')
  return Number.isInteger(v) ? formatNumber(v) : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(v)
}

function Tip({ x, w, children, top = 4 }) {
  const width = 180
  const left = Math.min(Math.max(x - width / 2, 0), Math.max(0, w - width))
  return (
    <div className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-3 py-2 shadow-md text-[12.5px] animate-fade-in" style={{ left, top, width }}>
      {children}
    </div>
  )
}

/**
 * Biểu đồ đường / vùng.
 * data: [{ x, [key]: number }], series: [{ key, label, color }]
 */
export function LineChart({ data = [], series, height = 240, area = true, className, format = valueLabel, yTicks = 4, dots }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const S = series || [{ key: 'value', label: 'Giá trị' }]
  const pad = { l: 52, r: 12, t: 12, b: 28 }
  const iw = Math.max(10, w - pad.l - pad.r), ih = height - pad.t - pad.b
  const vals = data.flatMap((d) => S.map((s) => +d[s.key] || 0))
  const ticks = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals), yTicks)
  const lo = ticks[0], hi = ticks[ticks.length - 1]
  const X = (i) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const Y = (v) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 64))))
  const monthly = data.every((d) => /-01$/.test(String(d.x)))
  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const i = Math.round(((e.clientX - r.left - pad.l) / iw) * (data.length - 1))
        setHover(i >= 0 && i < data.length ? i : null)
      }}>
      {w > 0 && (
        <svg width={w} height={height} className="overflow-visible">
          <defs>
            {S.map((s, si) => (
              <linearGradient key={s.key} id={`lg-${s.key}-${si}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || PALETTE[si]} stopOpacity=".22" />
                <stop offset="100%" stopColor={s.color || PALETTE[si]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--c-line)" strokeDasharray={t === 0 ? '' : '3 4'} />
              <text x={pad.l - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--c-faint)] text-[11px] num">{formatCompact(t)}</text>
            </g>
          ))}
          {data.map((d, i) => (i % every === 0 || i === data.length - 1) && (
            <text key={i} x={X(i)} y={height - 8} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px]">{axisLabel(d.x, monthly)}</text>
          ))}
          {S.map((s, si) => {
            const pts = data.map((d, i) => [X(i), Y(+d[s.key] || 0)])
            const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
            const c = s.color || PALETTE[si]
            return (
              <g key={s.key}>
                {area && S.length === 1 && pts.length > 1 && <path d={`${path} L ${pts[pts.length - 1][0]} ${Y(Math.max(lo, 0))} L ${pts[0][0]} ${Y(Math.max(lo, 0))} Z`} fill={`url(#lg-${s.key}-${si})`} />}
                <path d={path} fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                {(dots || data.length <= 14) && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 3} fill="var(--c-surface)" stroke={c} strokeWidth="2" />)}
              </g>
            )
          })}
          {hover != null && <line x1={X(hover)} x2={X(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--c-line-strong)" />}
        </svg>
      )}
      {hover != null && data[hover] && (
        <Tip x={X(hover)} w={w}>
          <div className="text-muted mb-1">{String(data[hover].x)}</div>
          {S.map((s, si) => (
            <div key={s.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0"><span className="size-2 rounded-full shrink-0" style={{ background: s.color || PALETTE[si] }} /><span className="truncate">{s.label}</span></span>
              <span className="font-[600] num">{format(+data[hover][s.key] || 0)}</span>
            </div>
          ))}
        </Tip>
      )}
    </div>
  )
}

/** Biểu đồ cột dọc. data: [{ x, [key]: number }], series như LineChart. stacked: chồng các chuỗi */
export function BarChart({ data = [], series, height = 240, className, format = valueLabel, stacked, yTicks = 4, highlight, onBarClick }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const S = series || [{ key: 'value', label: 'Giá trị' }]
  const pad = { l: 52, r: 8, t: 12, b: 28 }
  const iw = Math.max(10, w - pad.l - pad.r), ih = height - pad.t - pad.b
  const totals = data.map((d) => (stacked ? S.reduce((s, x) => s + (+d[x.key] || 0), 0) : Math.max(...S.map((x) => +d[x.key] || 0))))
  const mins = data.map((d) => Math.min(0, ...S.map((x) => +d[x.key] || 0)))
  const ticks = niceTicks(Math.min(0, ...mins), Math.max(0, ...totals), yTicks)
  const lo = ticks[0], hi = ticks[ticks.length - 1]
  const Y = (v) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih
  const slot = iw / Math.max(1, data.length)
  const groupW = Math.min(56, slot * 0.68)
  const barW = stacked ? groupW : groupW / S.length
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 58))))
  const monthly = data.every((d) => /-01$/.test(String(d.x)))
  return (
    <div ref={ref} className={cn('relative w-full select-none', className)} style={{ height }} onMouseLeave={() => setHover(null)}>
      {w > 0 && (
        <svg width={w} height={height}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--c-line)" strokeDasharray={t === 0 ? '' : '3 4'} />
              <text x={pad.l - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--c-faint)] text-[11px] num">{formatCompact(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = pad.l + slot * i + slot / 2
            let acc = 0
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onClick={onBarClick ? () => onBarClick(d, i) : undefined} className={onBarClick ? 'cursor-pointer' : ''}>
                <rect x={pad.l + slot * i} y={pad.t} width={slot} height={ih} fill={hover === i ? 'var(--c-subtle)' : 'transparent'} />
                {S.map((s, si) => {
                  const v = +d[s.key] || 0
                  const c = s.color || PALETTE[si]
                  const x = stacked ? cx - groupW / 2 : cx - groupW / 2 + barW * si
                  const y0 = stacked ? Y(acc) : Y(0)
                  const y1 = stacked ? Y(acc + v) : Y(v)
                  acc += v
                  const top = Math.min(y0, y1), h = Math.max(1, Math.abs(y1 - y0))
                  const dim = highlight != null && highlight !== i
                  return <rect key={s.key} x={x + 1} y={top} width={Math.max(2, barW - 2)} height={h} rx={Math.min(4, barW / 3)} fill={c} opacity={dim ? 0.35 : 1} />
                })}
                {(i % every === 0) && <text x={cx} y={height - 8} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px]">{axisLabel(d.x, monthly)}</text>}
              </g>
            )
          })}
        </svg>
      )}
      {hover != null && data[hover] && (
        <Tip x={pad.l + slot * hover + slot / 2} w={w}>
          <div className="text-muted mb-1 truncate">{String(data[hover].x)}</div>
          {S.map((s, si) => (
            <div key={s.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 min-w-0"><span className="size-2 rounded-sm shrink-0" style={{ background: s.color || PALETTE[si] }} /><span className="truncate">{s.label}</span></span>
              <span className="font-[600] num">{format(+data[hover][s.key] || 0)}</span>
            </div>
          ))}
        </Tip>
      )}
    </div>
  )
}

/** Cột ngang có nhãn — dùng cho xếp hạng. items: [{ label, value, color }] */
export function HBarChart({ items = [], format = valueLabel, className, color = 'var(--c-chart-1)', max }) {
  const top = max || Math.max(1, ...items.map((i) => Math.abs(+i.value || 0)))
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[minmax(90px,38%)_1fr_auto] items-center gap-3 text-[13px]">
          <span className="truncate text-dim" title={String(it.label)}>{String(it.label)}</span>
          <span className="h-5 rounded-md bg-subtle overflow-hidden">
            <span className="block h-full rounded-md transition-[width] duration-500" style={{ width: `${(Math.abs(+it.value || 0) / top) * 100}%`, background: it.color || color, opacity: Math.max(0.55, 1 - i * 0.03) }} />
          </span>
          <span className="num font-[600] text-right min-w-[64px]">{format(+it.value || 0)}</span>
        </div>
      ))}
    </div>
  )
}

/** Biểu đồ vành khuyên. segments: [{ label, value, color }] */
export function Donut({ segments = [], size = 168, thickness = 20, children, format = valueLabel, legend = true, className }) {
  const total = segments.reduce((s, x) => s + (+x.value || 0), 0) || 1
  const r = (size - thickness) / 2, C = 2 * Math.PI * r
  const [hover, setHover] = useState(null)
  let off = 0
  return (
    <div className={cn('flex items-center gap-6 flex-wrap', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-subtle)" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = ((+s.value || 0) / total) * C
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color || PALETTE[i % PALETTE.length]}
                strokeWidth={hover === i ? thickness + 4 : thickness} strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-off}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="transition-[stroke-width]" />
            )
            off += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          {hover != null ? (
            <div><div className="text-[12px] text-muted max-w-[110px] truncate">{segments[hover].label}</div><div className="font-[650] num">{Math.round(((+segments[hover].value || 0) / total) * 1000) / 10}%</div></div>
          ) : children}
        </div>
      </div>
      {legend && (
        <ul className="flex flex-col gap-1.5 min-w-[150px] flex-1">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px]" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <span className="size-2.5 rounded-sm shrink-0" style={{ background: s.color || PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-dim flex-1">{s.label}</span>
              <span className="num font-[600]">{format(+s.value || 0)}</span>
              <span className="num text-faint w-12 text-right">{Math.round(((+s.value || 0) / total) * 1000) / 10}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Sparkline({ values = [], width = 96, height = 28, color = 'var(--c-chart-1)', fill = true }) {
  if (values.length < 2) return <svg width={width} height={height} />
  const lo = Math.min(...values), hi = Math.max(...values)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - lo) / (hi - lo || 1)) * (height - 4)])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={color} opacity=".12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

/** Danh sách thanh ngang đơn giản. items: [{ label, value, color }] */
export function BarList({ items, format = valueLabel, className, onClick, color = 'var(--c-brand-500)' }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)))
  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {items.map((it, i) => (
        <li key={i}>
          <button onClick={onClick ? () => onClick(it) : undefined} className={cn('relative w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] overflow-hidden', onClick && 'hover:bg-subtle')}>
            <span className="absolute inset-y-1 left-0 rounded-md opacity-15" style={{ width: `${(Math.abs(it.value) / max) * 100}%`, background: it.color || color }} />
            <span className="relative truncate">{it.label}</span>
            <span className="relative num font-[600] shrink-0">{format(it.value)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ---------------- Biểu đồ từ kết quả SQL ---------------- */
const isNum = (v) => typeof v === 'number' && isFinite(v)

/** Đoán cấu hình biểu đồ phù hợp từ kết quả */
export function guessChart(columns = [], rows = []) {
  if (!rows.length || columns.length < 2) return null
  const numCols = columns.filter((c, i) => rows.slice(0, 20).every((r) => r[i] == null || isNum(r[i])))
  const dimCols = columns.filter((c) => !numCols.includes(c))
  const x = dimCols[0] || columns[0]
  // ưu tiên cột đo lường có giá trị lớn nhất (thường là doanh thu / tổng tiền)
  const cands = numCols.filter((c) => c !== x)
  const maxOf = (c) => Math.max(...rows.slice(0, 50).map((r) => Math.abs(+r[columns.indexOf(c)] || 0)))
  const y = cands.sort((a, b) => maxOf(b) - maxOf(a))[0]
  if (!y) return null
  const xi = columns.indexOf(x)
  const timey = rows.slice(0, 10).every((r) => /^\d{4}-\d{2}-\d{2}/.test(String(r[xi] ?? '')))
  return { type: timey ? 'line' : rows.length > 12 ? 'hbar' : 'bar', x, y }
}

/** Cột có thể làm trục hoành / trục tung (cho bộ chọn cấu hình biểu đồ) */
export function chartableColumns(columns = [], rows = []) {
  const numeric = columns.filter((c, i) => rows.slice(0, 20).some((r) => isNum(r[i])) && rows.slice(0, 20).every((r) => r[i] == null || isNum(r[i])))
  return { all: columns, numeric }
}

/**
 * <ResultChart columns rows spec={{ type: 'line'|'bar'|'hbar'|'donut'|'kpi', x, y }} />
 */
export function ResultChart({ columns = [], rows = [], spec, height = 260, className }) {
  const s = spec || guessChart(columns, rows)
  const data = useMemo(() => {
    if (!s || s.type === 'kpi') return []
    const xi = columns.indexOf(s.x), yi = columns.indexOf(s.y)
    if (xi < 0 || yi < 0) return []
    return rows.slice(0, 200).map((r) => ({ x: r[xi], value: +r[yi] || 0 }))
  }, [columns, rows, s])
  if (!s || (s.type !== 'kpi' && !data.length)) {
    return <div className="grid place-items-center text-muted text-[13px] text-center px-6" style={{ height }}>Kết quả này chưa vẽ được biểu đồ (cần ít nhất một cột số).</div>
  }
  if (s.type === 'kpi') {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3', className)}>
        {columns.map((c, i) => (
          <div key={c} className="rounded-xl border border-line bg-surface px-4 py-3 min-w-0">
            <div className="ds-label truncate">{c.replace(/_/g, ' ')}</div>
            <div className="text-[22px] font-[650] num mt-1 tracking-tight truncate">{valueLabel(rows[0]?.[i])}</div>
          </div>
        ))}
      </div>
    )
  }
  const label = s.y.replace(/_/g, ' ').toLowerCase()
  if (s.type === 'line') return <LineChart data={data} height={height} className={className} series={[{ key: 'value', label }]} />
  if (s.type === 'donut') {
    return (
      <Donut className={className} segments={data.slice(0, 8).map((d) => ({ label: String(d.x), value: d.value }))}>
        <div><div className="text-[11px] text-muted">Tổng</div><div className="font-[650] num">{formatCompact(data.reduce((a, b) => a + b.value, 0))}</div></div>
      </Donut>
    )
  }
  if (s.type === 'hbar' || s.horizontal) return <HBarChart className={className} items={data.slice(0, 15).map((d) => ({ label: d.x, value: d.value }))} />
  return <BarChart data={data} height={height} className={className} series={[{ key: 'value', label }]} />
}
