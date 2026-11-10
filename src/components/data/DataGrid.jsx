/* ==========================================================
   Bảng kết quả truy vấn
   - Biểu tượng kiểu dữ liệu ở đầu cột, sắp xếp khi bấm tiêu đề
   - Hàng thống kê: biểu đồ phân bố (số, ngày) hoặc giá trị phổ biến (chữ)
   - Chọn ô để xem đầy đủ giá trị, sao chép
   - Hiển thị dần (300 dòng mỗi lần) để không treo trình duyệt
   ========================================================== */
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Hash, Type, Calendar, ToggleLeft, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { toast } from '@/store'

const isNum = (v) => typeof v === 'number' && isFinite(v)
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(v)

export function columnType(rows, i) {
  let num = 0, date = 0, bool = 0, n = 0
  for (const r of rows.slice(0, 200)) {
    const v = r[i]
    if (v == null) continue
    n++
    if (isNum(v)) { num++; if (v === 0 || v === 1) bool++ } else if (isDate(v)) date++
  }
  if (!n) return 'text'
  if (date === n) return 'date'
  if (num === n) return bool === n && n > 2 ? 'bool' : 'number'
  return 'text'
}
const TYPE_ICON = { number: Hash, text: Type, date: Calendar, bool: ToggleLeft }

export function formatCell(v, type) {
  if (v == null) return null
  if (type === 'bool') return v ? 'TRUE' : 'FALSE'
  // số nguyên lớn có dấu chấm phân cách (năm như 2026 giữ nguyên)
  if (isNum(v)) return Number.isInteger(v) ? (Math.abs(v) >= 10000 ? formatNumber(v) : String(v)) : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(v)
  return String(v)
}

function Stats({ rows, i, type }) {
  const s = useMemo(() => {
    const vals = rows.map((r) => r[i]).filter((v) => v != null)
    const nulls = rows.length - vals.length
    if (!vals.length) return { empty: true, nulls }
    if (type === 'number' || type === 'date') {
      const nums = type === 'date' ? vals.map((v) => Date.parse(String(v).replace(' ', 'T'))) : vals
      const lo = Math.min(...nums), hi = Math.max(...nums)
      const bins = Array(12).fill(0)
      for (const v of nums) bins[Math.min(11, Math.floor(((v - lo) / (hi - lo || 1)) * 12))]++
      const max = Math.max(...bins)
      const fmt = (x) => (type === 'date' ? new Date(x).toLocaleDateString('vi-VN') : formatNumber(x))
      return { bins: bins.map((b) => b / (max || 1)), lo: fmt(lo), hi: fmt(hi), nulls }
    }
    const counts = new Map()
    for (const v of vals) counts.set(v, (counts.get(v) || 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])
    return { top: top.slice(0, 2).map(([v, c]) => [String(v), Math.round((c / rows.length) * 1000) / 10]), more: Math.max(0, top.length - 2), distinct: top.length, nulls }
  }, [rows, i, type])
  if (s.empty) return <div className="ds-caption">Toàn bộ NULL</div>
  if (s.bins) {
    return (
      <div className="w-full">
        <div className="flex items-end gap-[2px] h-9">
          {s.bins.map((b, k) => <span key={k} className="flex-1 rounded-[2px] bg-brand-400/80" style={{ height: `${Math.max(6, b * 100)}%` }} />)}
        </div>
        <div className="flex justify-between text-[11px] text-faint mt-1 num gap-2"><span className="truncate">{s.lo}</span><span className="truncate">{s.hi}</span></div>
      </div>
    )
  }
  return (
    <div className="text-[12px] w-full flex flex-col gap-0.5">
      {s.top.map(([v, p]) => (
        <div key={v} className="flex justify-between gap-2"><span className="truncate text-dim">{v}</span><span className="text-faint num shrink-0">{p.toLocaleString('vi-VN')}%</span></div>
      ))}
      {s.more > 0 && <div className="text-faint">+{s.more} giá trị khác</div>}
    </div>
  )
}

/**
 * <DataGrid columns={[...]} rows={[[...]]} stats maxHeight={420} />
 */
export function DataGrid({ columns = [], rows = [], stats = true, className, maxHeight, emptyText = 'Truy vấn không trả về dòng nào.', filter = '' }) {
  const [sort, setSort] = useState(null) // { i, dir }
  const [limit, setLimit] = useState(300)
  const [sel, setSel] = useState(null) // { r, c }
  const types = useMemo(() => columns.map((_, i) => columnType(rows, i)), [columns, rows])
  const view = useMemo(() => {
    let out = rows.map((r, idx) => ({ r, idx }))
    const f = filter.trim().toLowerCase()
    if (f) out = out.filter(({ r }) => r.some((v) => v != null && String(v).toLowerCase().includes(f)))
    if (sort) {
      const { i, dir } = sort
      out.sort((a, b) => {
        const x = a.r[i], y = b.r[i]
        if (x == null) return 1
        if (y == null) return -1
        return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'asc' ? 1 : -1)
      })
    }
    return out
  }, [rows, sort, filter])

  if (!columns.length) return <div className="p-8 text-center text-muted text-[13px]">{emptyText}</div>
  const selVal = sel ? view[sel.r]?.r[sel.c] : undefined

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <div className="overflow-auto min-h-0 flex-1" style={{ maxHeight }}>
        <table className="border-separate border-spacing-0 text-[13px] min-w-full">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="sticky left-0 z-[3] bg-surface border-b border-r border-line w-12 min-w-12" />
              {columns.map((c, i) => {
                const Icon = TYPE_ICON[types[i]]
                const active = sort?.i === i
                return (
                  <th key={i} className="bg-surface border-b border-r border-line px-3 h-10 text-left font-[600] text-[12.5px] whitespace-nowrap">
                    <button className="flex items-center gap-1.5 hover:text-brand-ink" onClick={() => setSort(active ? (sort.dir === 'asc' ? { i, dir: 'desc' } : null) : { i, dir: 'asc' })}>
                      <Icon size={13} className="text-faint" />
                      {c}
                      {active && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  </th>
                )
              })}
            </tr>
            {stats && rows.length > 1 && (
              <tr>
                <th className="sticky left-0 z-[3] bg-surface border-b border-r border-line" />
                {columns.map((c, i) => (
                  <th key={i} className="bg-surface border-b border-r border-line px-3 py-2 font-normal align-top min-w-[150px] max-w-[260px]">
                    <Stats rows={rows} i={i} type={types[i]} />
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {view.slice(0, limit).map(({ r }, ri) => (
              <tr key={ri} className="group">
                <td className="sticky left-0 z-[1] bg-surface group-hover:bg-subtle border-b border-r border-line text-center text-faint text-[12px] num">{ri + 1}</td>
                {r.map((v, ci) => {
                  const txt = formatCell(v, types[ci])
                  const on = sel && sel.r === ri && sel.c === ci
                  return (
                    <td key={ci} onClick={() => setSel(on ? null : { r: ri, c: ci })}
                      className={cn('border-b border-r border-line px-3 h-9 max-w-[360px] truncate cursor-default group-hover:bg-subtle',
                        types[ci] === 'number' && 'text-right num',
                        on && 'outline-2 -outline-offset-2 outline-brand-500 bg-brand-50 group-hover:bg-brand-50')}
                      title={txt ?? 'NULL'}>
                      {txt == null ? <span className="text-faint italic">NULL</span> : txt}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!view.length && <div className="p-8 text-center text-muted text-[13px]">{filter ? 'Không có dòng nào khớp từ khoá.' : emptyText}</div>}
        {view.length > limit && (
          <div className="p-3 text-center">
            <button onClick={() => setLimit(limit + 300)} className="text-[13px] font-[600] text-brand-ink hover:underline">Hiển thị thêm 300 dòng ({formatNumber(view.length - limit)} dòng còn lại)</button>
          </div>
        )}
      </div>
      {sel && selVal !== undefined && (
        <div className="border-t border-line bg-subtle px-3 py-2 flex items-start gap-3 text-[12.5px] animate-fade-in">
          <span className="ds-label pt-0.5 shrink-0">{columns[sel.c]}</span>
          <span className="flex-1 min-w-0 font-mono whitespace-pre-wrap break-words max-h-24 overflow-auto">{selVal == null ? 'NULL' : String(selVal)}</span>
          <button className="text-muted hover:text-fg" title="Sao chép" onClick={() => { navigator.clipboard?.writeText(selVal == null ? '' : String(selVal)); toast('Đã sao chép giá trị') }}><Copy size={14} /></button>
          <button className="text-muted hover:text-fg" title="Đóng" onClick={() => setSel(null)}><X size={14} /></button>
        </div>
      )}
    </div>
  )
}

/* ---------------- Xuất dữ liệu ---------------- */
export function toCSV(columns, rows) {
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [columns.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}
export function downloadCSV(name, columns, rows) {
  const blob = new Blob(['﻿' + toCSV(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name.endsWith('.csv') ? name : `${name}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
/** Phân tích CSV đơn giản (có dấu nháy kép) → { columns, rows } */
export function parseCSV(text, delimiter) {
  const d = delimiter || (text.split('\n')[0].split(';').length > text.split('\n')[0].split(',').length ? ';' : ',')
  const rows = []
  let row = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c
    } else if (c === '"') q = true
    else if (c === d) { row.push(cur); cur = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
    } else cur += c
  }
  if (cur !== '' || row.length) { row.push(cur); if (row.some((x) => x !== '')) rows.push(row) }
  const header = (rows.shift() || []).map((h, i) => h.trim().replace(/^﻿/, '') || `COT_${i + 1}`)
  return { columns: header, rows, delimiter: d }
}
/** Đoán kiểu cột từ chuỗi CSV: NUMBER | DATE | BOOLEAN | VARCHAR */
export function inferCsvTypes(columns, rows) {
  return columns.map((_, i) => {
    const vals = rows.slice(0, 200).map((r) => (r[i] ?? '').trim()).filter(Boolean)
    if (!vals.length) return 'VARCHAR'
    if (vals.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return 'NUMBER'
    if (vals.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v))) return 'DATE'
    if (vals.every((v) => /^(true|false)$/i.test(v))) return 'BOOLEAN'
    return 'VARCHAR'
  })
}
