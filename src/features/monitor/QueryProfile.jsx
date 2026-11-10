/* ==========================================================
   Hồ sơ truy vấn: dựng cây toán tử minh hoạ từ câu SQL
   (Quét bảng → Nối → Lọc → Tổng hợp → Sắp xếp → Giới hạn → Kết quả)
   Số liệu thời gian / số dòng được ước lượng có hạt giống cố định.
   ========================================================== */
import { useMemo, useState } from 'react'
import { Table2, GitMerge, Filter, Sigma, ArrowDownUp, Scissors, Flag, Sparkles, Lightbulb, AppWindow } from 'lucide-react'
import { cn } from '@/lib/cn'
import { seeded } from '@/lib/random'
import { formatNumber, formatBytes, formatDuration } from '@/lib/format'
import { getCatalog, isReady } from '@/engine/db'
import { hashSQL } from './shared'

const NODE = {
  scan: { label: 'Quét bảng', icon: Table2, color: 'var(--c-chart-1)' },
  join: { label: 'Nối bảng', icon: GitMerge, color: 'var(--c-chart-2)' },
  filter: { label: 'Lọc', icon: Filter, color: 'var(--c-chart-3)' },
  ai: { label: 'Hàm AI', icon: Sparkles, color: 'var(--c-chart-4)' },
  agg: { label: 'Tổng hợp', icon: Sigma, color: 'var(--c-chart-5)' },
  window: { label: 'Hàm cửa sổ', icon: AppWindow, color: 'var(--c-chart-2)' },
  sort: { label: 'Sắp xếp', icon: ArrowDownUp, color: 'var(--c-chart-6)' },
  limit: { label: 'Giới hạn', icon: Scissors, color: 'var(--c-chart-6)' },
  result: { label: 'Kết quả', icon: Flag, color: 'var(--c-brand-500)' },
}

function tableRows() {
  if (!isReady()) return {}
  const out = {}
  for (const d of getCatalog()) for (const s of d.schemas) for (const t of s.tables) out[t.name] = { rows: t.rows, bytes: t.bytes }
  return out
}

/** Phân tích câu SQL thành danh sách nút */
export function buildProfile(rec) {
  const sql = rec.sql || ''
  const u = sql.toUpperCase().replace(/--[^\n]*/g, ' ')
  const r = seeded(parseInt(hashSQL(sql).slice(0, 8), 16))
  const known = tableRows()
  const tables = [...new Set([...u.matchAll(/\b(?:FROM|JOIN)\s+([\w.]+)/g)].map((m) => m[1].split('.').pop()))].filter((t) => t && !['(', 'SELECT'].includes(t))
  const out = rec.rows || 0
  const scans = (tables.length ? tables : ['BẢNG_TẠM']).map((t) => {
    const total = known[t]?.rows ?? Math.max(out, 1000 + Math.round(r.next() * 20000))
    const filtered = /\bWHERE\b/.test(u) ? Math.max(out, Math.round(total * (0.15 + r.next() * 0.5))) : total
    const parts = Math.max(1, Math.ceil(total / 4000))
    return { kind: 'scan', title: t, rows: filtered, totalRows: total, partitions: [/\bWHERE\b/.test(u) ? Math.max(1, Math.ceil(parts * 0.4)) : parts, parts], bytes: known[t]?.bytes ?? total * 96 }
  })
  const chain = []
  let rows = scans.reduce((s, x) => Math.max(s, x.rows), 0)
  if (scans.length > 1) chain.push({ kind: 'join', title: `Nối ${scans.length} bảng`, rows })
  if (/\bWHERE\b/.test(u)) { rows = Math.max(out, Math.round(rows * 0.6)); chain.push({ kind: 'filter', title: 'Điều kiện WHERE', rows }) }
  if (/\bAI_[A-Z_]+\(/.test(u)) chain.push({ kind: 'ai', title: [...new Set([...u.matchAll(/\b(AI_[A-Z_]+)\(/g)].map((m) => m[1]))].join(', '), rows })
  if (/\bGROUP BY\b|\b(SUM|COUNT|AVG|MIN|MAX)\s*\(/.test(u)) { rows = Math.max(out, 1); chain.push({ kind: 'agg', title: /\bGROUP BY\b/.test(u) ? 'Gom nhóm GROUP BY' : 'Tổng hợp toàn bảng', rows }) }
  if (/\bOVER\s*\(/.test(u)) chain.push({ kind: 'window', title: 'OVER (…)', rows })
  if (/\bORDER BY\b/.test(u)) chain.push({ kind: 'sort', title: 'ORDER BY', rows })
  if (/\bLIMIT\b/.test(u)) chain.push({ kind: 'limit', title: `LIMIT ${u.match(/\bLIMIT\s+(\d+)/)?.[1] || ''}`, rows: out })
  chain.push({ kind: 'result', title: 'Trả về máy khách', rows: out })

  // phân bổ thời gian: quét chiếm phần lớn, AI và sắp xếp tốn kém hơn
  const weight = { scan: 4, join: 2.4, filter: 0.8, ai: 6, agg: 1.6, window: 1.4, sort: 1.1, limit: 0.2, result: 0.3 }
  const all = [...scans, ...chain]
  const ws = all.map((n) => weight[n.kind] * (0.6 + r.next() * 0.8))
  const sum = ws.reduce((a, b) => a + b, 0)
  all.forEach((n, i) => { n.pct = Math.round((ws[i] / sum) * 1000) / 10 })

  const insights = []
  const scanBig = scans.find((s) => s.title === 'DON_HANG' || s.title === 'CHI_TIET_DON')
  if (scanBig && !/NGAY_DAT\s*(>|<|BETWEEN|=)/.test(u) && !/MONTH\s*\(|QUARTER\s*\(|DATE_TRUNC/.test(u.split('WHERE')[1] || '')) insights.push({ tone: 'warn', text: `Lọc sớm theo NGAY_DAT để giảm số phân vùng phải quét trên ${scanBig.title}.` })
  if (/SELECT\s+\*/.test(u)) insights.push({ tone: 'warn', text: 'Chỉ chọn những cột cần dùng thay cho SELECT * để giảm dữ liệu đọc từ đĩa.' })
  if (/\bAI_[A-Z_]+\(/.test(u)) insights.push({ tone: 'info', text: 'Hàm AI chạy trên từng dòng — nên lọc bớt dữ liệu trước khi gọi để tiết kiệm tín dụng.' })
  if (/\bORDER BY\b/.test(u) && !/\bLIMIT\b/.test(u)) insights.push({ tone: 'info', text: 'Sắp xếp toàn bộ kết quả mà không có LIMIT — cân nhắc giới hạn số dòng trả về.' })
  if (scans.length > 2) insights.push({ tone: 'info', text: 'Truy vấn nối nhiều bảng: kiểm tra điều kiện ON để tránh nhân bản dòng.' })
  if (rec.status === 'Lỗi') insights.unshift({ tone: 'neg', text: `Truy vấn lỗi: ${rec.error || 'không rõ nguyên nhân'}` })
  if (!insights.length) insights.push({ tone: 'pos', text: 'Không phát hiện vấn đề đáng kể. Truy vấn đã được tối ưu tốt.' })

  const scannedParts = scans.reduce((s, x) => s + x.partitions[0], 0)
  const totalParts = scans.reduce((s, x) => s + x.partitions[1], 0)
  const stats = [
    ['Phân vùng đã quét', `${formatNumber(scannedParts)} / ${formatNumber(totalParts)}`],
    ['Dữ liệu đã quét', formatBytes(rec.bytes || scans.reduce((s, x) => s + x.bytes, 0) * 0.4)],
    ['Đọc từ bộ nhớ đệm', `${Math.round(20 + r.next() * 70)}%`],
    ['Dữ liệu tràn ra đĩa cục bộ', /\bORDER BY\b|\bGROUP BY\b/.test(u) && (rec.ms || 0) > 2000 ? formatBytes(1.2e6 + r.next() * 4e6) : '0 B'],
    ['Số dòng trả về', formatNumber(out)],
  ]
  return { scans, chain, insights, stats }
}

function NodeBox({ n, active, onClick }) {
  const meta = NODE[n.kind]
  const Icon = meta.icon
  return (
    <button onClick={onClick} className={cn('w-[230px] rounded-xl border bg-surface px-3 py-2.5 text-left shadow-xs transition', active ? 'border-brand-400 ring-2 ring-brand-100' : 'border-line hover:border-brand-200')}>
      <div className="flex items-center gap-2">
        <span className="size-7 rounded-lg grid place-items-center text-white shrink-0" style={{ background: meta.color }}><Icon size={14} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-[650] truncate">{meta.label} <span className="text-faint font-[500]">[{n.idx}]</span></div>
          <div className="text-[11.5px] text-muted truncate font-mono">{n.title}</div>
        </div>
        <span className="text-[12px] font-[650] num">{n.pct}%</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-subtle overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, n.pct * 1.4)}%`, background: meta.color }} /></div>
      <div className="mt-1.5 text-[11.5px] text-muted num">{formatNumber(n.rows)} dòng</div>
    </button>
  )
}

export function QueryProfile({ rec }) {
  const p = useMemo(() => buildProfile(rec), [rec])
  const nodes = useMemo(() => {
    const chain = [...p.chain].reverse()
    let k = 0
    chain.forEach((n) => { n.idx = k++ })
    p.scans.forEach((n) => { n.idx = k++ })
    return chain
  }, [p])
  const [sel, setSel] = useState(null)
  const selected = sel != null ? [...nodes, ...p.scans].find((n) => n.idx === sel) : null

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5">
      <div className="card p-5 overflow-x-auto dot-grid">
        <div className="flex flex-col items-center min-w-fit">
          {nodes.map((n, i) => (
            <div key={n.idx} className="flex flex-col items-center">
              <NodeBox n={n} active={sel === n.idx} onClick={() => setSel(sel === n.idx ? null : n.idx)} />
              {i < nodes.length - 1 && <div className="w-px h-6 bg-line-strong" />}
            </div>
          ))}
          <div className="w-px h-6 bg-line-strong" />
          {p.scans.length > 1 && (
            <div className="h-px bg-line-strong" style={{ width: (p.scans.length - 1) * 246 }} />
          )}
          <div className="flex gap-4 items-start">
            {p.scans.map((n) => (
              <div key={n.idx} className="flex flex-col items-center">
                {p.scans.length > 1 && <div className="w-px h-5 bg-line-strong" />}
                <NodeBox n={n} active={sel === n.idx} onClick={() => setSel(sel === n.idx ? null : n.idx)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-gold" /><h3 className="ds-h3">Nhận định</h3></div>
          <ul className="flex flex-col gap-2">
            {p.insights.map((it, i) => (
              <li key={i} className={cn('rounded-lg px-3 py-2 text-[13px]', { warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info', neg: 'bg-neg-soft text-neg', pos: 'bg-pos-soft text-pos' }[it.tone])}>{it.text}</li>
            ))}
          </ul>
        </div>
        {selected ? (
          <div className="card p-4 animate-fade-in">
            <h3 className="ds-h3 mb-2">{NODE[selected.kind].label} [{selected.idx}]</h3>
            <dl className="text-[13px] flex flex-col gap-1.5">
              <div className="flex justify-between"><dt className="text-muted">Đối tượng</dt><dd className="font-mono text-[12px] truncate ml-3">{selected.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tỷ lệ thời gian</dt><dd className="num font-[600]">{selected.pct}%</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Thời gian ước tính</dt><dd className="num">{formatDuration(((rec.ms || 0) * selected.pct) / 100)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Số dòng đầu ra</dt><dd className="num">{formatNumber(selected.rows)}</dd></div>
              {selected.kind === 'scan' && <>
                <div className="flex justify-between"><dt className="text-muted">Tổng số dòng bảng</dt><dd className="num">{formatNumber(selected.totalRows)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Phân vùng quét</dt><dd className="num">{selected.partitions[0]} / {selected.partitions[1]}</dd></div>
              </>}
            </dl>
          </div>
        ) : (
          <div className="card p-4">
            <h3 className="ds-h3 mb-2">Thống kê</h3>
            <dl className="text-[13px] flex flex-col gap-1.5">
              {p.stats.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="num font-[550]">{v}</dd></div>)}
            </dl>
            <p className="ds-caption mt-3">Bấm vào một nút trên cây để xem chi tiết toán tử.</p>
          </div>
        )}
      </div>
    </div>
  )
}
