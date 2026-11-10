/* ==========================================================
   Không gian làm việc — trình soạn SQL chạy thật trên trình duyệt
   Bố cục: cây tệp / cây dữ liệu │ thẻ tệp + trình soạn + kết quả │ Tinh Ý
   Tham số URL hỗ trợ:
   - ?tep=<id>                       mở một tệp có sẵn
   - ?sql=<câu SQL>&ten=<tên>&chay=1 tạo tệp mới với nội dung, chạy ngay nếu chay=1
   ========================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Play, ChevronDown, ChevronRight, Plus, X, PanelLeftOpen, PanelLeftClose, Sparkles, Share2, MoreHorizontal, Wand2, History,
  Download, Pencil, Trash2, UserCog, Database, Keyboard, FileCode2, PlaySquare, Save, Check, MessageSquareText, Circle,
  BookOpen, ListTree,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp, useAuth, toast, engineHooks } from '@/store'
import { Popover, Menu, Button, Modal, Input, Confirm, Kbd } from '@/components/ui'
import { runSQL, getDB, isReady, getCatalog, getContext, setContext, onCatalogChange } from '@/engine/db'
import { formatSQL } from '@/engine/assistant'
import { SqlEditor } from '@/features/editor/SqlEditor'
import { ResultsPanel } from '@/features/editor/ResultsPanel'
import { LeftPanel } from '@/features/editor/LeftPanel'
import { TinhYPanel, useTinhY } from '@/features/editor/TinhYPanel'
import { VersionHistoryModal, ShareModal, ShortcutsModal } from '@/features/editor/Modals'
import { slugFile } from '@/features/editor/sqlUtils'

/** Gợi ý tự hoàn thành: tên bảng ngắn + tên đầy đủ DB.LƯỢC_ĐỒ.BẢNG */
function buildSchema() {
  if (!isReady()) return {}
  const out = {}
  for (const d of getCatalog({ withCounts: false })) {
    const dbNs = {}
    for (const s of d.schemas) {
      const sNs = {}
      for (const t of s.tables) {
        const cols = t.columns.map((c) => c.name)
        sNs[t.name] = cols
        out[t.name] = cols
      }
      dbNs[s.name] = sNs
    }
    out[d.name] = dbNs
  }
  return out
}

const STATE_DOT = { 'Đang chạy': 'bg-pos', 'Tạm dừng': 'bg-faint', 'Đang khởi động': 'bg-warn' }

export default function WorkspacePage() {
  const app = useApp()
  const { files, tabs, activeTab, openFile, closeTab, newFile, saveFile, snapshot, renameFile, deleteFile, warehouses, currentWarehouse, currentRole, roles, update } = app
  const user = useAuth((s) => s.user)
  const file = files.find((f) => f.id === activeTab) || null
  const editor = useRef(null)
  const textRef = useRef(file?.content || '')
  const pending = useRef(null)
  const [params, setParams] = useSearchParams()

  const [ready, setReady] = useState(isReady())
  const [schema, setSchema] = useState(() => buildSchema())
  const [ctx, setCtxState] = useState(getContext())
  const [runs, setRuns] = useState({})
  const [cursor, setCursor] = useState({ line: 1, col: 1, selected: 0 })
  const [leftOpen, setLeftOpen] = useState(true)
  const [leftTab, setLeftTab] = useState('files')
  const [mobileLeft, setMobileLeft] = useState(false)
  const [aiOpen, setAiOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1440)
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [resH, setResH] = useState(null)
  const bodyRef = useRef(null)
  const [modal, setModal] = useState(null) // 'share' | 'history' | 'shortcuts' | 'rename' | 'delete'
  const [renameVal, setRenameVal] = useState('')

  const run = runs[file?.id]
  const lastError = useMemo(() => run?.results?.find((r) => r.error)?.error || null, [run])

  /* ----- đồng bộ ngữ cảnh động cơ với vai trò / kho đang chọn ----- */
  useEffect(() => { setContext({ role: currentRole, warehouse: currentWarehouse }); setCtxState(getContext()) }, [currentRole, currentWarehouse])

  /* ----- khởi động động cơ + gợi ý lược đồ ----- */
  useEffect(() => {
    let alive = true
    getDB().then(() => { if (alive) { setReady(true); setSchema(buildSchema()); setCtxState(getContext()) } }).catch(() => {})
    const off = onCatalogChange(() => alive && setSchema(buildSchema()))
    return () => { alive = false; off() }
  }, [])

  /* ----- lưu nội dung (trễ 400ms), xả ngay khi đổi tệp ----- */
  const flush = useCallback(() => {
    const p = pending.current
    if (p) { clearTimeout(p.t); saveFile(p.id, p.text); pending.current = null }
  }, [saveFile])
  const onChange = useCallback((text) => {
    textRef.current = text
    const id = useApp.getState().activeTab
    if (pending.current) clearTimeout(pending.current.t)
    pending.current = { id, text, t: setTimeout(() => { saveFile(id, text); pending.current = null }, 400) }
  }, [saveFile])
  useEffect(() => { textRef.current = file?.content || '' }, [file?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => flush(), [flush])
  const switchTo = (id) => { if (!id) return; flush(); openFile(id); setMobileLeft(false) }

  /* ----- chạy truy vấn ----- */
  const execute = useCallback(async (text, fileId) => {
    const id = fileId || useApp.getState().activeTab
    if (!text || !text.replace(/--[^\n]*/g, '').trim()) { toast({ title: 'Chưa có câu lệnh để chạy', tone: 'info' }); return }
    flush()
    setCollapsed(false)
    setRuns((r) => ({ ...r, [id]: { ...(r[id] || {}), status: isReady() ? 'running' : 'booting' } }))
    const out = await runSQL(text, { hooks: engineHooks })
    setReady(true)
    setRuns((r) => ({ ...r, [id]: { status: 'done', results: out.results, totalMs: out.totalMs, at: Date.now() } }))
    if (id) useApp.getState().snapshot(id)
    setCtxState(getContext())
    if (out.results.some((x) => x.kind === 'ddl' || x.kind === 'meta')) setSchema(buildSchema())
  }, [flush])

  const runCurrent = useCallback(() => {
    const t = editor.current?.getRunTarget()
    if (t) execute(t.text)
  }, [execute])
  const runAll = useCallback(() => execute(editor.current?.getText()), [execute])

  /* ----- Tinh Ý ----- */
  const getAiCtx = useCallback(() => ({ sql: editor.current?.getSelection() || editor.current?.getText() || textRef.current, lastError }), [lastError])
  const chat = useTinhY(getAiCtx)
  const ensureFile = (sql, title) => {
    if (useApp.getState().activeTab && editor.current) return null
    return newFile({ name: slugFile(title), content: `-- Tinh Ý: ${title || 'truy vấn'}\n${sql}\n` })
  }
  const aiInsert = (sql, title) => {
    if (ensureFile(sql, title)) { toast('Đã tạo tệp mới với câu SQL'); return }
    editor.current.append(`-- Tinh Ý: ${title || 'truy vấn'}\n${sql}\n`)
    toast('Đã chèn SQL vào cuối tệp')
  }
  const aiReplace = (sql) => {
    if (ensureFile(sql, 'Tinh Ý')) return
    editor.current.setText(sql.endsWith('\n') ? sql : sql + '\n')
    toast('Đã thay nội dung trình soạn')
  }
  const aiRunNow = (sql, title) => {
    const f = ensureFile(sql, title)
    if (f) { setTimeout(() => execute(sql, f.id), 50); return }
    editor.current.append(`-- Tinh Ý: ${title || 'truy vấn'}\n${sql}\n`)
    execute(sql)
  }
  const fixWithAI = () => { setAiOpen(true); chat.send('Sửa lỗi giúp mình') }

  /* ----- cây dữ liệu ----- */
  const insertName = (name) => {
    if (!editor.current || !useApp.getState().activeTab) { newFile({ content: name }); return }
    editor.current.insertAtCursor(name)
  }
  const preview = (t) => {
    const sql = `SELECT *\nFROM ${t.fqn}\nLIMIT 100;\n`
    flush()
    const f = newFile({ name: `xem_truoc_${t.name.toLowerCase()}.sql`, content: sql })
    setMobileLeft(false)
    setTimeout(() => execute(sql, f.id), 30)
  }

  /* ----- tham số URL ----- */
  useEffect(() => {
    const tep = params.get('tep'), q = params.get('sql')
    if (!tep && !q) return
    if (tep && useApp.getState().files.some((f) => f.id === tep)) openFile(tep)
    if (q) {
      const f = newFile({ name: slugFile(params.get('ten') || 'truy_van'), content: q.endsWith('\n') ? q : q + '\n' })
      if (params.get('chay') === '1') setTimeout(() => execute(q, f.id), 60)
    }
    setParams({}, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = () => {
    if (!file) return
    flush(); snapshot(file.id)
    toast({ title: 'Đã lưu phiên bản', desc: file.name })
  }

  /* ----- phím tắt khi con trỏ không nằm trong trình soạn ----- */
  const keyRef = useRef({})
  keyRef.current = { runAll, runCurrent, saveNow }
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const k = e.key.toLowerCase()
      if (k === 'i') { e.preventDefault(); setAiOpen((v) => !v) }
      if (k === 's') { e.preventDefault(); keyRef.current.saveNow() }
      if (k === 'enter' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        if (e.shiftKey) keyRef.current.runAll(); else keyRef.current.runCurrent()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ----- kéo thanh chia trình soạn / kết quả ----- */
  const startDrag = (e) => {
    e.preventDefault()
    const box = bodyRef.current.getBoundingClientRect()
    const move = (ev) => {
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY
      setResH(Math.max(120, Math.min(box.height - 90, box.bottom - y)))
    }
    const up = () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up)
    }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move); window.addEventListener('touchend', up)
  }

  const wh = warehouses.find((w) => w.name === currentWarehouse)
  const download = () => {
    const blob = new Blob([textRef.current], { type: 'text/sql;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 800)
  }
  const tree = ready ? getCatalog({ withCounts: false }) : []

  function doRename() {
    const n = renameVal.trim()
    if (!n || !file) return
    renameFile(file.id, /\.\w+$/.test(n) ? n : n + '.sql')
    setModal(null)
    toast('Đã đổi tên tệp')
  }

  const left = <LeftPanel tab={leftTab} onTab={setLeftTab} onOpen={switchTo} onInsert={insertName} onPreview={preview} />

  return (
    <div className="h-full flex min-h-0 bg-canvas">
      {/* ----- Bảng trái ----- */}
      {leftOpen && <div className="hidden lg:flex w-[280px] shrink-0 border-r border-line min-h-0">{left}</div>}
      {mobileLeft && (
        <div className="lg:hidden fixed inset-0 z-[65]">
          <div className="absolute inset-0 bg-[rgba(14,14,40,.4)] animate-fade-in" onClick={() => setMobileLeft(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] flex shadow-lg animate-slide-in">{left}</div>
        </div>
      )}

      {/* ----- Vùng giữa ----- */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Thẻ tệp */}
        <div className="h-11 shrink-0 flex items-stretch border-b border-line bg-side">
          <button onClick={() => (window.innerWidth >= 1024 ? setLeftOpen((v) => !v) : setMobileLeft(true))} title={leftOpen ? 'Ẩn bảng tệp' : 'Hiện bảng tệp'}
            className="w-11 shrink-0 grid place-items-center text-muted hover:text-fg hover:bg-hover border-r border-line">
            <span className="hidden lg:block">{leftOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</span>
            <span className="lg:hidden"><ListTree size={17} /></span>
          </button>
          <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto no-scrollbar">
            {tabs.map((id) => {
              const f = files.find((x) => x.id === id)
              if (!f) return null
              const on = id === activeTab
              const r = runs[id]
              return (
                <div key={id} onClick={() => switchTo(id)}
                  className={cn('group relative flex items-center gap-2 pl-3 pr-1.5 border-r border-line min-w-0 max-w-[220px] text-[13px] cursor-pointer select-none',
                    on ? 'bg-surface text-fg' : 'text-muted hover:bg-hover hover:text-fg')}>
                  {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-500" />}
                  <FileCode2 size={14} className={on ? 'text-brand-ink shrink-0' : 'shrink-0'} />
                  <span className="truncate">{f.name}</span>
                  {(r?.status === 'running' || r?.status === 'booting') && <span className="size-1.5 rounded-full bg-warn animate-pulse shrink-0" />}
                  <button onClick={(e) => { e.stopPropagation(); flush(); closeTab(id) }} title="Đóng thẻ"
                    className={cn('size-6 grid place-items-center rounded hover:bg-press shrink-0', on ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}><X size={13} /></button>
                </div>
              )
            })}
            <button onClick={() => { flush(); newFile() }} className="w-10 shrink-0 grid place-items-center text-muted hover:text-fg hover:bg-hover" title="Tệp SQL mới"><Plus size={16} /></button>
          </div>
          <button onClick={() => setAiOpen((v) => !v)} title="Tinh Ý (Ctrl I)"
            className={cn('shrink-0 flex items-center gap-1.5 px-3 border-l border-line text-[13px] font-[600]', aiOpen ? 'bg-brand-50 text-brand-ink' : 'text-dim hover:bg-hover')}>
            <Sparkles size={15} /><span className="hidden sm:inline">Tinh Ý</span>
          </button>
        </div>

        {!file ? (
          <Welcome onNew={() => newFile()} onOpenStarter={() => switchTo(files[0]?.id)} hasStarter={!!files.length} onAsk={() => setAiOpen(true)} onShortcuts={() => setModal('shortcuts')} />
        ) : (
          <>
            {/* Thanh công cụ */}
            <div className="shrink-0 border-b border-line bg-surface px-3 py-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[12.5px] text-muted min-w-0 mr-1">
                <span className="truncate max-w-[140px]">{file.folder}</span>
                <ChevronRight size={13} className="text-faint shrink-0" />
                <span className="text-fg font-[600] truncate max-w-[200px]">{file.name}</span>
              </div>
              <div className="flex items-stretch rounded-lg overflow-hidden shadow-xs">
                <button onClick={runCurrent} className="h-8 pl-3 pr-3.5 bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1.5 text-[13px] font-[600]" title="Chạy (Ctrl + Enter)">
                  <Play size={14} fill="currentColor" />Chạy
                </button>
                <Popover align="start" width={260} trigger={(p) => <button {...p} className="h-8 px-1.5 bg-brand-500 hover:bg-brand-600 text-white border-l border-white/25" aria-label="Tuỳ chọn chạy"><ChevronDown size={15} /></button>}>
                  {(close) => <Menu onClose={close} items={[
                    { label: 'Chạy câu lệnh hiện tại', icon: Play, kbd: 'Ctrl ↵', onClick: runCurrent },
                    { label: 'Chạy tất cả', icon: PlaySquare, kbd: 'Ctrl ⇧ ↵', onClick: runAll },
                  ]} />}
                </Popover>
              </div>
              <div className="flex-1" />
              {/* Ngữ cảnh: vai trò · kho · CSDL.LƯỢC_ĐỒ */}
              <div className="flex items-center gap-1 flex-wrap">
                <Popover align="end" width={260} trigger={(p) => (
                  <button {...p} className="h-8 px-2 rounded-lg hover:bg-hover flex items-center gap-1.5 text-[12.5px] font-[600] text-dim" title="Vai trò">
                    <UserCog size={14} className="text-muted" />{currentRole}
                  </button>
                )}>
                  {(close) => (
                    <div>
                      <div className="px-2.5 pt-1.5 pb-1 ds-label">Vai trò</div>
                      <Menu onClose={close} items={roles.map((r) => ({ label: r.name, desc: r.label, checked: r.name === currentRole, onClick: () => { update('currentRole', r.name); toast(`Đang dùng vai trò ${r.name}`) } }))} />
                    </div>
                  )}
                </Popover>
                <Popover align="end" width={290} trigger={(p) => (
                  <button {...p} className="h-8 px-2 rounded-lg hover:bg-hover flex items-center gap-1.5 text-[12.5px] font-[600] text-dim" title="Kho tính toán">
                    <span className={cn('size-2 rounded-full', STATE_DOT[wh?.state] || 'bg-faint')} />
                    {currentWarehouse}<span className="font-normal text-faint hidden md:inline">({wh?.size})</span>
                  </button>
                )}>
                  {(close) => (
                    <div>
                      <div className="px-2.5 pt-1.5 pb-1 ds-label">Kho tính toán</div>
                      {warehouses.map((w) => (
                        <button key={w.id} onClick={() => { app.useWarehouse(w.name); close(); toast({ title: `Đang dùng ${w.name}`, desc: w.state === 'Đang chạy' ? 'Kho đã sẵn sàng.' : 'Kho được tự động khởi động lại.' }) }}
                          className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-hover text-left">
                          <span className={cn('size-2 rounded-full shrink-0', STATE_DOT[w.state] || 'bg-faint')} />
                          <span className="flex-1 min-w-0"><span className="block text-[13px] font-[550] truncate">{w.name}</span><span className="block ds-caption">{w.size} · {w.state}</span></span>
                          {w.name === currentWarehouse && <Check size={15} className="text-brand-ink" />}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-line" />
                      <Link to="/tinh-toan/kho" onClick={close} className="block rounded-lg px-2.5 py-2 text-[13px] text-brand-ink hover:bg-hover">Quản lý kho tính toán →</Link>
                    </div>
                  )}
                </Popover>
                <Popover align="end" width={280} trigger={(p) => (
                  <button {...p} className="h-8 px-2 rounded-lg hover:bg-hover flex items-center gap-1.5 text-[12.5px] font-[600] text-dim max-w-[260px]" title="Cơ sở dữ liệu và lược đồ đang dùng">
                    <Database size={14} className="text-muted shrink-0" /><span className="truncate">{ctx.database}.{ctx.schema}</span>
                  </button>
                )}>
                  {(close) => (
                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-2.5 pt-1.5 pb-1 ds-label">Chọn lược đồ</div>
                      {!tree.length && <div className="px-2.5 py-2 ds-caption">Đang khởi động…</div>}
                      {tree.map((d) => (
                        <div key={d.name}>
                          <div className="px-2.5 pt-2 pb-0.5 text-[11.5px] font-[650] text-muted">{d.name}</div>
                          {d.schemas.map((s) => (
                            <button key={s.name} onClick={async () => { close(); await runSQL(`USE SCHEMA ${d.name}.${s.name}`, { silent: true }); setCtxState(getContext()) }}
                              className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-hover">
                              {s.name}{ctx.database === d.name && ctx.schema === s.name && <Check size={14} className="text-brand-ink" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </Popover>
              </div>
              <Button size="sm" variant="outline" icon={Share2} onClick={() => setModal('share')}>Chia sẻ</Button>
              <Popover align="end" width={240} trigger={(p) => <button {...p} className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg" aria-label="Thêm"><MoreHorizontal size={17} /></button>}>
                {(close) => <Menu onClose={close} items={[
                  { label: 'Định dạng SQL', icon: Wand2, onClick: () => { editor.current?.setText(formatSQL(editor.current.getText()) + '\n'); toast('Đã định dạng SQL') } },
                  { label: 'Lưu phiên bản', icon: Save, kbd: 'Ctrl S', onClick: saveNow },
                  { label: 'Lịch sử phiên bản', icon: History, onClick: () => { flush(); setModal('history') } },
                  { label: 'Tải xuống .sql', icon: Download, onClick: download },
                  { divider: true },
                  { label: 'Đổi tên', icon: Pencil, onClick: () => { setRenameVal(file.name); setModal('rename') } },
                  { label: 'Xoá tệp', icon: Trash2, danger: true, onClick: () => setModal('delete') },
                ]} />}
              </Popover>
            </div>

            {/* Trình soạn + kết quả */}
            <div ref={bodyRef} className="flex-1 min-h-0 flex flex-col">
              <div className={cn('min-h-0 relative', expanded ? 'hidden' : 'flex-1')}>
                <SqlEditor key={file.id} ref={editor} value={file.content} schema={schema}
                  onChange={onChange} onRun={runCurrent} onRunAll={runAll} onCursor={setCursor}
                  onToggleAssistant={() => setAiOpen((v) => !v)} onSave={saveNow} />
              </div>
              {!collapsed && !expanded && (
                <div onMouseDown={startDrag} onTouchStart={startDrag} className="h-1.5 shrink-0 cursor-row-resize bg-line/60 hover:bg-brand-300 transition-colors" title="Kéo để đổi kích thước" />
              )}
              <div className={cn('min-h-0', collapsed ? 'shrink-0 border-t border-line' : expanded ? 'flex-1' : 'shrink-0')}
                style={!collapsed && !expanded ? { height: resH ?? '42%' } : undefined}>
                <ResultsPanel run={run} collapsed={collapsed} expanded={expanded} fileName={file.name}
                  onToggleCollapse={() => { setCollapsed((v) => !v); setExpanded(false) }}
                  onToggleExpand={() => { setExpanded((v) => !v); setCollapsed(false) }}
                  onFixWithAI={fixWithAI} />
              </div>
            </div>
          </>
        )}

        {/* Thanh trạng thái */}
        <div className="h-8 shrink-0 flex items-center gap-3 px-3 border-t border-line bg-side text-[12px] text-muted whitespace-nowrap overflow-hidden">
          {file && <span className="num shrink-0">Dòng {cursor.line}, Cột {cursor.col}{cursor.selected ? ` · đã chọn ${cursor.selected} ký tự` : ''}</span>}
          <span className="flex items-center gap-1.5 shrink-0">
            <Circle size={8} className={ready ? 'fill-pos text-pos' : 'fill-warn text-warn animate-pulse'} />
            {ready ? 'Động cơ SQL sẵn sàng' : 'Đang khởi động kho tính toán…'}
          </span>
          <span className={`hidden ${aiOpen ? '2xl:inline' : 'xl:inline'} text-faint truncate min-w-0`}>SQLite WASM chạy ngay trên trình duyệt của bạn</span>
          <div className="flex-1" />
          <button onClick={() => setModal('shortcuts')} className="flex items-center gap-1 hover:text-fg"><Keyboard size={13} /><span className="hidden sm:inline">Phím tắt</span></button>
          <Link to="/mau-du-an" className="hidden sm:flex items-center gap-1 hover:text-fg"><BookOpen size={13} />Mẫu</Link>
          <Link to="/ai/hoi-du-lieu" className="hidden sm:flex items-center gap-1 hover:text-fg"><MessageSquareText size={13} />Hỏi dữ liệu</Link>
        </div>
      </div>

      {/* ----- Tinh Ý ----- */}
      {aiOpen && (
        <TinhYPanel chat={chat} firstName={user.first || 'bạn'} onClose={() => setAiOpen(false)}
          onInsert={aiInsert} onReplace={aiReplace} onRunNow={aiRunNow}
          className="fixed inset-0 z-[66] lg:static lg:z-auto lg:w-[380px] xl:w-[400px] shrink-0 animate-fade-in" />
      )}

      {/* ----- Hộp thoại ----- */}
      <ShareModal open={modal === 'share'} onClose={() => setModal(null)} file={file} />
      {modal === 'history' && file && (
        <VersionHistoryModal open onClose={() => setModal(null)} file={file} current={textRef.current}
          onRestore={(content) => { editor.current?.setText(content); flush(); snapshot(file.id); toast('Đã khôi phục phiên bản') }} />
      )}
      <ShortcutsModal open={modal === 'shortcuts'} onClose={() => setModal(null)} />
      <Modal open={modal === 'rename'} onClose={() => setModal(null)} title="Đổi tên tệp" size="sm"
        footer={<><Button onClick={() => setModal(null)}>Huỷ</Button><Button variant="primary" onClick={doRename}>Lưu</Button></>}>
        <Input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doRename()} />
      </Modal>
      <Confirm open={modal === 'delete'} onClose={() => setModal(null)} danger title="Xoá tệp?" confirmLabel="Xoá tệp"
        desc={file ? `Tệp “${file.name}” và lịch sử phiên bản sẽ bị xoá vĩnh viễn.` : ''}
        onConfirm={() => { if (pending.current) { clearTimeout(pending.current.t); pending.current = null } deleteFile(file.id); toast('Đã xoá tệp') }} />
    </div>
  )
}

/* ---------------- Màn hình chào khi chưa mở tệp nào ---------------- */
function Welcome({ onNew, onOpenStarter, hasStarter, onAsk, onShortcuts }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[640px] mx-auto px-6 py-14 text-center">
        <div className="mx-auto size-16 rounded-2xl bg-crystal grid place-items-center text-white shadow-md animate-float"><FileCode2 size={28} /></div>
        <h2 className="ds-h1 mt-5">Chào mừng tới Không gian làm việc</h2>
        <p className="text-muted mt-2">Viết SQL, chạy ngay trên dữ liệu mẫu của chuỗi cà phê Phố Núi và nhờ Tinh Ý giúp khi cần.</p>
        <div className="grid sm:grid-cols-3 gap-2 mt-7">
          <WelcomeBtn icon={Plus} label="Tệp SQL mới" onClick={onNew} />
          <WelcomeBtn icon={BookOpen} label="Mở tệp mẫu" onClick={onOpenStarter} disabled={!hasStarter} />
          <WelcomeBtn icon={Sparkles} label="Hỏi Tinh Ý" onClick={onAsk} />
        </div>
        <div className="mt-10 text-left card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="ds-h3">Phím tắt hay dùng</div>
            <button onClick={onShortcuts} className="text-[13px] text-brand-ink font-[600] hover:underline">Xem tất cả</button>
          </div>
          {[['Chạy câu lệnh', ['Ctrl', 'Enter']], ['Chạy tất cả', ['Ctrl', 'Shift', 'Enter']], ['Mở Tinh Ý', ['Ctrl', 'I']], ['Tìm mọi thứ', ['Ctrl', 'K']]].map(([l, k]) => (
            <div key={l} className="flex items-center justify-between py-2 border-t border-line first:border-0 text-[13.5px]">
              <span className="text-dim">{l}</span><span className="flex gap-1">{k.map((x) => <Kbd key={x}>{x}</Kbd>)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
function WelcomeBtn({ icon: Icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="card px-4 py-4 flex flex-col items-center gap-2 hover:border-brand-300 hover:shadow-sm transition disabled:opacity-50">
      <span className="size-9 rounded-xl bg-brand-50 text-brand-ink grid place-items-center"><Icon size={18} /></span>
      <span className="text-[13.5px] font-[600]">{label}</span>
    </button>
  )
}
