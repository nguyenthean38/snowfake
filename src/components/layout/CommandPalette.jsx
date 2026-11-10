import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, CornerDownLeft, FileCode2, Moon, Sparkles, Table2, Zap, Bot, MessageSquareText, Upload, History } from 'lucide-react'
import { cn } from '@/lib/cn'
import { stripAccents } from '@/lib/format'
import { useApp, useUI } from '@/store'
import { Kbd } from '@/components/ui'
import { getCatalog, isReady } from '@/engine/db'
import { ALL_PAGES } from './nav'

const norm = (s) => stripAccents(String(s || '')).toLowerCase()

/** Bảng lệnh Ctrl K: tìm trang, tệp SQL, bảng dữ liệu, hành động nhanh */
export function CommandPalette() {
  const open = useUI((s) => s.command)
  const setOpen = useUI((s) => s.setCommand)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const listRef = useRef(null)
  const { files, warehouses, agents, openFile, newFile } = useApp()

  useEffect(() => { if (open) { setQ(''); setI(0) } }, [open])

  const groups = useMemo(() => {
    if (!open) return []
    const ui = useUI.getState()
    const nq = norm(q.trim())
    const match = (s) => !nq || norm(s).includes(nq)
    const actions = [
      { label: 'Tạo tệp SQL mới', icon: FileCode2, run: () => { newFile(); navigate('/khong-gian') } },
      { label: 'Hỏi dữ liệu bằng tiếng Việt', icon: MessageSquareText, run: () => navigate('/ai/hoi-du-lieu') },
      { label: 'Mở trợ lý Tinh Ý', icon: Sparkles, kbd: 'Ctrl J', run: () => ui.setAssistant(true) },
      { label: 'Tải tệp CSV lên thành bảng', icon: Upload, run: () => navigate('/nap-du-lieu?tai-len=1') },
      { label: 'Xem lịch sử truy vấn', icon: History, run: () => navigate('/giam-sat/truy-van') },
      { label: 'Đổi giao diện sáng / tối', icon: Moon, run: () => ui.setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark') },
    ]
    const g = []
    const acts = actions.filter((a) => match(a.label))
    if (acts.length) g.push({ title: 'Hành động', items: acts.slice(0, nq ? 6 : 4) })
    const pages = ALL_PAGES.filter((p) => match(p.label + ' ' + (p.parent || '')))
    if (pages.length) g.push({ title: 'Trang', items: pages.slice(0, nq ? 8 : 5).map((p) => ({ label: p.label, sub: p.parent, icon: p.icon, run: () => navigate(p.to) })) })
    const fs = files.filter((f) => match(f.name))
    if (fs.length && (nq || true)) g.push({ title: 'Tệp SQL', items: fs.slice(0, nq ? 6 : 3).map((f) => ({ label: f.name, sub: f.folder, icon: FileCode2, run: () => { openFile(f.id); navigate('/khong-gian') } })) })
    if (nq.length >= 2) {
      if (isReady()) {
        const tables = getCatalog({ withCounts: false }).flatMap((d) => d.schemas.flatMap((s) => s.tables))
        const ts = tables.filter((t) => match(t.name + ' ' + t.fqn))
        if (ts.length) g.push({ title: 'Bảng dữ liệu', items: ts.slice(0, 6).map((t) => ({ label: t.name, sub: `${t.database}.${t.schema}`, icon: Table2, run: () => navigate(`/du-lieu/${t.database}/${t.schema}/${t.name}`) })) })
      }
      const ws = warehouses.filter((w) => match(w.name))
      if (ws.length) g.push({ title: 'Kho tính toán', items: ws.map((w) => ({ label: w.name, sub: `${w.size} · ${w.state}`, icon: Zap, run: () => navigate('/tinh-toan/kho') })) })
      const ag = agents.filter((a) => match(a.display + ' ' + a.name))
      if (ag.length) g.push({ title: 'Tác tử AI', items: ag.map((a) => ({ label: a.display, sub: a.name, icon: Bot, run: () => navigate(`/ai/tac-tu/${a.id}`) })) })
    }
    return g
  }, [q, open, files, warehouses, agents]) // eslint-disable-line react-hooks/exhaustive-deps

  const flat = groups.flatMap((g) => g.items)
  useEffect(() => { setI(0) }, [q])
  useEffect(() => { listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' }) }, [i])

  if (!open) return null
  const run = (it) => { setOpen(false); it.run() }
  let k = -1
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh] px-4" data-overlay>
      <div className="absolute inset-0 bg-[rgba(14,14,40,.38)] backdrop-blur-[3px] animate-fade-in" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-[600px] rounded-2xl border border-line bg-surface shadow-lg animate-pop-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Search size={18} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trang, tệp SQL, bảng dữ liệu, hành động…"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(flat.length - 1, x + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)) }
              if (e.key === 'Enter' && flat[i]) run(flat[i])
              if (e.key === 'Escape') setOpen(false)
            }}
            className="flex-1 bg-transparent outline-none text-[15px]" />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[56vh] overflow-y-auto p-2">
          {!flat.length && <div className="py-10 text-center text-muted text-[13.5px]">Không tìm thấy kết quả cho “{q}”.</div>}
          {groups.map((g) => (
            <div key={g.title} className="mb-1">
              <div className="px-2.5 pt-2 pb-1 ds-label">{g.title}</div>
              {g.items.map((it) => {
                k++
                const idx = k
                const Icon = it.icon
                return (
                  <button key={g.title + it.label + idx} data-i={idx} onMouseMove={() => setI(idx)} onClick={() => run(it)}
                    className={cn('w-full flex items-center gap-3 rounded-lg px-2.5 h-10 text-left text-[13.5px]', i === idx ? 'bg-brand-50 text-fg' : 'text-dim')}>
                    <Icon size={16} className={i === idx ? 'text-brand-ink' : 'text-muted'} />
                    <span className="truncate flex-1">{it.label}{it.sub && <span className="text-faint ml-2 text-[12.5px]">{it.sub}</span>}</span>
                    {it.kbd ? <Kbd>{it.kbd}</Kbd> : i === idx && <CornerDownLeft size={14} className="text-faint" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 px-4 h-10 border-t border-line text-[12px] text-muted">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> di chuyển</span>
          <span className="flex items-center gap-1"><Kbd>Enter</Kbd> mở</span>
          <span className="flex items-center gap-1 ml-auto"><Kbd>Ctrl</Kbd><Kbd>Enter</Kbd> chạy SQL trong trình soạn</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
