import { Table2, Eye, LayoutGrid, Bot, Cloud, HardDrive, Share2 } from 'lucide-react'
import { LINEAGE } from './shared'

const KIND_ICON = { 'Bảng': Table2, 'Khung nhìn': Eye, 'Ứng dụng': LayoutGrid, 'Tác tử AI': Bot, 'Nguồn ngoài': Cloud, 'Vùng tạm': HardDrive, 'Chia sẻ': Share2 }
const KIND_COLOR = { 'Bảng': 'var(--c-chart-1)', 'Khung nhìn': 'var(--c-chart-2)', 'Ứng dụng': 'var(--c-chart-4)', 'Tác tử AI': 'var(--c-chart-5)', 'Nguồn ngoài': 'var(--c-chart-6)', 'Vùng tạm': 'var(--c-chart-3)', 'Chia sẻ': 'var(--c-chart-3)' }

function Node({ x, y, w, h, node, center }) {
  const Icon = KIND_ICON[node.kind] || Table2
  const c = center ? 'var(--c-brand-500)' : KIND_COLOR[node.kind] || 'var(--c-chart-6)'
  return (
    <foreignObject x={x} y={y} width={w} height={h}>
      <div className="h-full rounded-xl border bg-surface flex items-center gap-2.5 px-3 shadow-xs" style={{ borderColor: center ? c : 'var(--c-line)', boxShadow: center ? `0 0 0 3px color-mix(in srgb, ${c} 18%, transparent)` : undefined }}>
        <span className="size-8 shrink-0 rounded-lg grid place-items-center" style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }}><Icon size={16} /></span>
        <span className="min-w-0">
          <span className="block text-[11px] text-muted leading-tight">{node.kind}</span>
          <span className="block text-[12.5px] font-[600] truncate leading-tight mt-0.5">{node.name}</span>
        </span>
      </div>
    </foreignObject>
  )
}

/** Sơ đồ dòng dõi dữ liệu: nguồn → bảng đang xem → nơi sử dụng */
export function Lineage({ table, kind = 'Bảng' }) {
  const lin = LINEAGE[table] || { up: [{ name: 'Tải tệp lên', kind: 'Nguồn ngoài' }], down: [] }
  const W = 880, nw = 220, nh = 56, gap = 22
  const rows = Math.max(1, lin.up.length, lin.down.length)
  const H = Math.max(160, rows * (nh + gap) + 40)
  const colY = (n, i) => (H - (n * nh + (n - 1) * gap)) / 2 + i * (nh + gap)
  const cx = (W - nw) / 2, cy = (H - nh) / 2
  const curve = (x1, y1, x2, y2) => `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[680px] w-full" style={{ maxHeight: 420 }}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-line-strong)" />
          </marker>
        </defs>
        <text x={nw / 2 + 10} y={16} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px] font-[600] uppercase tracking-wider">Nguồn</text>
        <text x={W / 2} y={16} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px] font-[600] uppercase tracking-wider">Đang xem</text>
        <text x={W - nw / 2 - 10} y={16} textAnchor="middle" className="fill-[var(--c-faint)] text-[11px] font-[600] uppercase tracking-wider">Nơi sử dụng</text>
        {lin.up.map((n, i) => <path key={'u' + i} d={curve(10 + nw, colY(lin.up.length, i) + nh / 2 + 12, cx, cy + nh / 2 + 12)} fill="none" stroke="var(--c-line-strong)" strokeWidth="1.6" markerEnd="url(#arr)" />)}
        {lin.down.map((n, i) => <path key={'d' + i} d={curve(cx + nw, cy + nh / 2 + 12, W - nw - 10, colY(lin.down.length, i) + nh / 2 + 12)} fill="none" stroke="var(--c-line-strong)" strokeWidth="1.6" markerEnd="url(#arr)" />)}
        {lin.up.map((n, i) => <Node key={'nu' + i} x={10} y={colY(lin.up.length, i) + 12} w={nw} h={nh} node={n} />)}
        <Node x={cx} y={cy + 12} w={nw} h={nh} node={{ name: table, kind }} center />
        {lin.down.map((n, i) => <Node key={'nd' + i} x={W - nw - 10} y={colY(lin.down.length, i) + 12} w={nw} h={nh} node={n} />)}
        {!lin.down.length && <text x={W - nw / 2 - 10} y={cy + nh / 2 + 16} textAnchor="middle" className="fill-[var(--c-faint)] text-[12px]">Chưa có đối tượng nào dùng bảng này</text>}
      </svg>
    </div>
  )
}
