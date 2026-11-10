/* ==========================================================
   Bảng trái của Không gian làm việc
   - "Không gian": cây tệp SQL theo thư mục (tạo, đổi tên, xoá, tìm)
   - "Cơ sở dữ liệu": cây CSDL › lược đồ › bảng › cột từ động cơ SQL
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, FileCode2, Folder, FolderOpen, ChevronRight, MoreHorizontal, Pencil, Trash2, FolderPlus, Database,
  Layers, Table2, Eye, Columns3, RefreshCw, Copy, PlayCircle, X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { stripAccents, formatNumber } from '@/lib/format'
import { useApp, toast } from '@/store'
import { Popover, Menu, Modal, Confirm, Button, Input } from '@/components/ui'
import { getCatalog, getDB, isReady, onCatalogChange } from '@/engine/db'

const norm = (s) => stripAccents(String(s || '')).toLowerCase()

/* ---------------- Cây tệp ---------------- */
function FilesTree({ onOpen }) {
  const { files, folders, activeTab, newFile, renameFile, deleteFile, update } = useApp()
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState({})
  const [rename, setRename] = useState(null) // { id, name }
  const [del, setDel] = useState(null)
  const [folderModal, setFolderModal] = useState(false)
  const [folderName, setFolderName] = useState('')

  const allFolders = useMemo(() => [...new Set([...folders, ...files.map((f) => f.folder)])], [folders, files])
  const shown = files.filter((f) => !q || norm(f.name).includes(norm(q)))

  const doRename = () => {
    const n = rename?.name.trim()
    if (!n) return
    renameFile(rename.id, /\.\w+$/.test(n) ? n : n + '.sql'); setRename(null); toast('Đã đổi tên tệp')
  }
  const createFolder = () => {
    const n = folderName.trim()
    if (!n) return
    if (allFolders.includes(n)) { toast({ title: 'Thư mục đã tồn tại', tone: 'neg' }); return }
    update('folders', (l) => [...l, n])
    setFolderModal(false); setFolderName('')
    toast(`Đã tạo thư mục “${n}”`)
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3 pt-3 pb-2 flex items-center gap-1.5">
        <Popover align="start" width={220} trigger={(p) => (
          <button {...p} className="flex-1 h-8 rounded-lg bg-subtle hover:bg-hover text-[13px] font-[600] flex items-center justify-center gap-1.5"><Plus size={15} />Thêm mới</button>
        )}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Tệp SQL', icon: FileCode2, onClick: () => { const f = newFile(); onOpen?.(f.id) } },
            { label: 'Thư mục', icon: FolderPlus, onClick: () => setFolderModal(true) },
          ]} />}
        </Popover>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-line bg-surface">
          <Search size={14} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tệp" className="min-w-0 flex-1 bg-transparent outline-none text-[12.5px]" />
          {q && <button onClick={() => setQ('')} className="text-faint"><X size={13} /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {allFolders.map((folder) => {
          const list = shown.filter((f) => f.folder === folder)
          if (q && !list.length) return null
          const isClosed = closed[folder]
          return (
            <div key={folder} className="mb-1">
              <div className="group flex items-center gap-1 h-8 px-1.5 rounded-md hover:bg-hover">
                <button onClick={() => setClosed((c) => ({ ...c, [folder]: !c[folder] }))} className="flex-1 min-w-0 flex items-center gap-1.5 text-[13px] font-[600] text-dim">
                  <ChevronRight size={14} className={cn('text-faint transition-transform shrink-0', !isClosed && 'rotate-90')} />
                  {isClosed ? <Folder size={15} className="text-muted shrink-0" /> : <FolderOpen size={15} className="text-muted shrink-0" />}
                  <span className="truncate">{folder}</span>
                  <span className="text-faint font-normal text-[11.5px]">{list.length}</span>
                </button>
                <button onClick={() => { const f = newFile({ folder }); onOpen?.(f.id) }} title="Tệp mới trong thư mục" className="opacity-0 group-hover:opacity-100 size-6 grid place-items-center rounded text-muted hover:bg-press"><Plus size={14} /></button>
              </div>
              {!isClosed && (
                <ul className="ml-3 pl-2 border-l border-line">
                  {list.map((f) => (
                    <li key={f.id} className={cn('group flex items-center gap-1 h-8 pl-2 pr-1 rounded-md', activeTab === f.id ? 'bg-brand-50 text-brand-ink' : 'hover:bg-hover text-fg')}>
                      <button onClick={() => onOpen?.(f.id)} className="flex-1 min-w-0 flex items-center gap-2 text-[13px] text-left">
                        <FileCode2 size={14} className={activeTab === f.id ? 'text-brand-ink' : 'text-faint'} />
                        <span className="truncate">{f.name}</span>
                      </button>
                      <Popover align="end" width={180} trigger={(p) => (
                        <button {...p} className="opacity-0 group-hover:opacity-100 aria-expanded:opacity-100 size-6 grid place-items-center rounded text-muted hover:bg-press" title="Tuỳ chọn"><MoreHorizontal size={14} /></button>
                      )}>
                        {(close) => <Menu onClose={close} items={[
                          { label: 'Mở', icon: FileCode2, onClick: () => onOpen?.(f.id) },
                          { label: 'Đổi tên', icon: Pencil, onClick: () => setRename({ id: f.id, name: f.name }) },
                          { label: 'Nhân bản', icon: Copy, onClick: () => { const n = newFile({ name: f.name.replace(/\.sql$/, '_ban_sao.sql'), content: f.content, folder: f.folder }); onOpen?.(n.id); toast('Đã nhân bản tệp') } },
                          { divider: true },
                          { label: 'Xoá', icon: Trash2, danger: true, onClick: () => setDel(f) },
                        ]} />}
                      </Popover>
                    </li>
                  ))}
                  {!list.length && <li className="text-[12px] text-faint px-2 py-1.5">Thư mục trống</li>}
                </ul>
              )}
            </div>
          )
        })}
        {q && !shown.length && <div className="text-center text-[12.5px] text-muted py-6">Không có tệp nào khớp “{q}”.</div>}
      </div>

      <Modal open={!!rename} onClose={() => setRename(null)} title="Đổi tên tệp" size="sm"
        footer={<><Button onClick={() => setRename(null)}>Huỷ</Button><Button variant="primary" onClick={doRename}>Lưu</Button></>}>
        {rename && <Input autoFocus value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && doRename()} />}
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} danger title="Xoá tệp?" confirmLabel="Xoá tệp"
        desc={del ? `Tệp “${del.name}” và lịch sử phiên bản của nó sẽ bị xoá vĩnh viễn.` : ''}
        onConfirm={() => { deleteFile(del.id); toast('Đã xoá tệp') }} />
      <Modal open={folderModal} onClose={() => setFolderModal(false)} title="Thư mục mới" size="sm"
        footer={<><Button onClick={() => setFolderModal(false)}>Huỷ</Button><Button variant="primary" onClick={createFolder}>Tạo thư mục</Button></>}>
        <Input autoFocus label="Tên thư mục" placeholder="Ví dụ: Báo cáo tháng" value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} />
      </Modal>
    </div>
  )
}

/* ---------------- Cây đối tượng dữ liệu ---------------- */
const TYPE_COLOR = { NUMBER: 'text-ice', VARCHAR: 'text-brand-ink', DATE: 'text-chart-3', TIMESTAMP: 'text-chart-3', BOOLEAN: 'text-chart-4', VARIANT: 'text-muted' }

function ObjectsTree({ onInsert, onPreview }) {
  const [tree, setTree] = useState(() => (isReady() ? getCatalog() : null))
  const [open, setOpen] = useState({ PHO_NUI_DB: true, 'PHO_NUI_DB.BAN_HANG': true })
  const [q, setQ] = useState('')
  useEffect(() => {
    let alive = true
    getDB().then(() => alive && setTree(getCatalog()))
    const off = onCatalogChange(() => alive && setTree(getCatalog()))
    return () => { alive = false; off() }
  }, [])
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const nq = norm(q)

  if (!tree) {
    return <div className="p-4 flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-6" style={{ width: `${85 - i * 9}%` }} />)}</div>
  }
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3 pt-3 pb-2 flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-2 h-8 px-2.5 rounded-lg border border-line bg-surface">
          <Search size={14} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bảng, cột" className="min-w-0 flex-1 bg-transparent outline-none text-[12.5px]" />
          {q && <button onClick={() => setQ('')} className="text-faint"><X size={13} /></button>}
        </div>
        <button onClick={() => { setTree(getCatalog()); toast('Đã làm mới danh mục') }} title="Làm mới" className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover"><RefreshCw size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 text-[13px]">
        {tree.map((d) => {
          const dk = d.name
          const tablesMatch = (s) => s.tables.filter((t) => !nq || norm(t.name).includes(nq) || t.columns.some((c) => norm(c.name).includes(nq)))
          if (nq && !d.schemas.some((s) => tablesMatch(s).length)) return null
          const dOpen = open[dk] || !!nq
          return (
            <div key={dk}>
              <Row depth={0} open={dOpen} onToggle={() => toggle(dk)} icon={Database} label={d.name} sub={d.system ? 'hệ thống' : null} onInsert={() => onInsert(d.name)} />
              {dOpen && d.schemas.map((s) => {
                const sk = `${dk}.${s.name}`
                const tables = tablesMatch(s)
                if (nq && !tables.length) return null
                const sOpen = open[sk] || !!nq
                return (
                  <div key={sk}>
                    <Row depth={1} open={sOpen} onToggle={() => toggle(sk)} icon={Layers} label={s.name} count={s.tables.length} onInsert={() => onInsert(sk)} />
                    {sOpen && tables.map((t) => {
                      const tk = `${sk}.${t.name}`
                      const tOpen = open[tk] || (nq && t.columns.some((c) => norm(c.name).includes(nq)))
                      return (
                        <div key={tk}>
                          <Row depth={2} open={tOpen} onToggle={() => toggle(tk)} icon={t.kind === 'Bảng' ? Table2 : Eye} label={t.name}
                            title={`${t.fqn}${t.rows != null ? ` · ${formatNumber(t.rows)} dòng` : ''}${t.comment ? `\n${t.comment}` : ''}`}
                            onInsert={() => onInsert(t.fqn)}
                            actions={[
                              { label: 'Xem trước 100 dòng', icon: PlayCircle, onClick: () => onPreview(t) },
                              { label: 'Chèn tên đầy đủ', icon: Plus, onClick: () => onInsert(t.fqn) },
                              { label: 'Chèn danh sách cột', icon: Columns3, onClick: () => onInsert(t.columns.map((c) => c.name).join(',\n       ')) },
                              { label: 'Sao chép tên', icon: Copy, onClick: () => { navigator.clipboard?.writeText(t.fqn); toast('Đã sao chép ' + t.fqn) } },
                            ]} />
                          {tOpen && t.columns.map((c) => (
                            <button key={c.name} onClick={() => onInsert(c.name)} title={`Chèn ${c.name}`}
                              className={cn('w-full flex items-center gap-2 h-7 rounded-md hover:bg-hover pr-2 text-left', nq && norm(c.name).includes(nq) && 'bg-brand-50')}
                              style={{ paddingLeft: 3 * 16 + 14 }}>
                              <span className="truncate flex-1 text-[12.5px] text-dim">{c.name}</span>
                              <span className={cn('text-[10.5px] font-mono shrink-0', TYPE_COLOR[c.type] || 'text-muted')}>{c.type}</span>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t border-line text-[11.5px] text-faint">Bấm vào tên để chèn vào trình soạn.</div>
    </div>
  )
}

function Row({ depth, open, onToggle, icon: Icon, label, sub, count, onInsert, actions, title }) {
  return (
    <div className="group flex items-center gap-1 h-8 rounded-md hover:bg-hover pr-1" style={{ paddingLeft: depth * 16 + 4 }} title={title}>
      <button onClick={onToggle} className="size-5 grid place-items-center text-faint shrink-0" aria-label={open ? 'Thu gọn' : 'Mở rộng'}>
        <ChevronRight size={13} className={cn('transition-transform', open && 'rotate-90')} />
      </button>
      <button onClick={onInsert} onDoubleClick={onToggle} className="flex-1 min-w-0 flex items-center gap-1.5 text-left">
        <Icon size={14} className="text-muted shrink-0" />
        <span className={cn('truncate', depth < 2 ? 'font-[600] text-dim' : 'text-fg')}>{label}</span>
        {sub && <span className="text-[11px] text-faint">{sub}</span>}
        {count != null && <span className="text-[11px] text-faint">{count}</span>}
      </button>
      {actions && (
        <Popover align="end" width={220} trigger={(p) => (
          <button {...p} className="opacity-0 group-hover:opacity-100 aria-expanded:opacity-100 size-6 grid place-items-center rounded text-muted hover:bg-press" title="Tuỳ chọn"><MoreHorizontal size={14} /></button>
        )}>
          {(close) => <Menu onClose={close} items={actions} />}
        </Popover>
      )}
    </div>
  )
}

export function LeftPanel({ onOpen, onInsert, onPreview, tab, onTab }) {
  return (
    <div className="h-full flex flex-col bg-side min-h-0">
      <div className="h-11 shrink-0 flex items-center gap-4 px-4 border-b border-line">
        {[['files', 'Không gian'], ['db', 'Cơ sở dữ liệu']].map(([v, l]) => (
          <button key={v} onClick={() => onTab(v)} className={cn('h-full text-[13px] border-b-2 -mb-px', tab === v ? 'border-brand-500 text-brand-ink font-[600]' : 'border-transparent text-muted hover:text-fg')}>{l}</button>
        ))}
      </div>
      {tab === 'files' ? <FilesTree onOpen={onOpen} /> : <ObjectsTree onInsert={onInsert} onPreview={onPreview} />}
    </div>
  )
}
