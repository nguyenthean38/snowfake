/* ==========================================================
   Các hộp thoại của Không gian làm việc:
   lịch sử phiên bản (so sánh dòng), chia sẻ tệp, phím tắt
   ========================================================== */
import { useMemo, useState } from 'react'
import { History, RotateCcw, Link2, UserPlus, Check, Trash2, Globe2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { toast, useApp } from '@/store'
import { Modal, Button, Confirm, Input, Select, Avatar, Kbd, Checkbox, Badge } from '@/components/ui'
import { lineDiff } from './sqlUtils'

/* ---------------- Lịch sử phiên bản ---------------- */
export function VersionHistoryModal({ open, onClose, file, current, onRestore }) {
  const versions = useMemo(() => {
    if (!file) return []
    const list = [{ key: 'now', at: new Date().toISOString(), by: 'Bạn', content: current, label: 'Phiên bản hiện tại' }]
    ;(file.versions || []).forEach((v, i) => list.push({ key: 'v' + i, ...v }))
    return list
  }, [file, current])
  const [sel, setSel] = useState(1)
  const [compare, setCompare] = useState(true)
  const [ask, setAsk] = useState(false)
  const pick = versions[Math.min(sel, versions.length - 1)]
  const diff = useMemo(() => (pick ? lineDiff(current || '', pick.content || '') : []), [pick, current])
  const stats = diff.reduce((s, d) => ({ add: s.add + (d.type === 'add'), del: s.del + (d.type === 'del') }), { add: 0, del: 0 })
  const isNow = pick?.key === 'now'

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Lịch sử phiên bản" desc={file?.name}
      footer={<>
        <Checkbox className="mr-auto" checked={compare} onChange={setCompare} label="So sánh với phiên bản hiện tại" />
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="primary" icon={RotateCcw} disabled={isNow || !pick} onClick={() => setAsk(true)}>Khôi phục phiên bản này</Button>
      </>}>
      {versions.length <= 1 ? (
        <div className="py-12 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-subtle grid place-items-center text-muted mb-3"><History size={22} /></div>
          <div className="ds-h3">Chưa có phiên bản cũ</div>
          <p className="ds-caption mt-1">Mỗi lần bạn chạy truy vấn hoặc bấm Ctrl + S, Lạc Việt Data lưu lại một phiên bản.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_250px] gap-4 -mx-1">
          <div className="min-w-0 rounded-xl border border-line overflow-hidden">
            <div className="h-9 px-3 flex items-center justify-between bg-subtle border-b border-line text-[12.5px]">
              <span className="font-[600] truncate">{isNow ? 'Phiên bản hiện tại' : formatDateTime(pick.at)}</span>
              {compare && !isNow && (
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-pos">+{stats.add} dòng</span><span className="text-neg">−{stats.del} dòng</span>
                </span>
              )}
            </div>
            <div className="max-h-[52vh] overflow-auto font-mono text-[12.5px] leading-[1.7] py-2">
              {(compare && !isNow ? diff : (pick?.content || '').split('\n').map((t) => ({ type: 'same', text: t }))).map((d, i) => (
                <div key={i} className={cn('flex px-3 whitespace-pre', d.type === 'add' && 'bg-pos-soft', d.type === 'del' && 'bg-neg-soft')}>
                  <span className={cn('w-5 shrink-0 select-none', d.type === 'add' ? 'text-pos' : d.type === 'del' ? 'text-neg' : 'text-faint')}>{d.type === 'add' ? '+' : d.type === 'del' ? '−' : ' '}</span>
                  <span className={cn(d.type === 'del' && 'line-through decoration-neg/40 text-dim')}>{d.text || ' '}</span>
                </div>
              ))}
            </div>
            {compare && !isNow && (
              <div className="px-3 py-2 border-t border-line text-[11.5px] text-muted flex gap-4 flex-wrap">
                <span><span className="inline-block size-2.5 rounded-sm bg-pos-soft border border-pos/40 mr-1.5 align-middle" />Có trong phiên bản đã chọn</span>
                <span><span className="inline-block size-2.5 rounded-sm bg-neg-soft border border-neg/40 mr-1.5 align-middle" />Chỉ có ở bản hiện tại</span>
              </div>
            )}
          </div>
          <ul className="flex flex-col gap-1 max-h-[58vh] overflow-y-auto">
            {versions.map((v, i) => (
              <li key={v.key}>
                <button onClick={() => setSel(i)} className={cn('w-full text-left rounded-lg px-3 py-2 border', i === sel ? 'border-brand-300 bg-brand-50' : 'border-transparent hover:bg-subtle')}>
                  <div className={cn('text-[13px]', i === sel ? 'font-[600] text-brand-ink' : 'text-fg')}>{v.label || formatDateTime(v.at)}</div>
                  <div className="ds-caption">{v.key === 'now' ? 'Chưa lưu thành phiên bản' : `bởi ${v.by || 'MINHKHOA'}`}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Confirm open={ask} onClose={() => setAsk(false)} title="Khôi phục phiên bản cũ?" confirmLabel="Khôi phục"
        desc={pick ? `Nội dung tệp sẽ được thay bằng phiên bản lúc ${formatDateTime(pick.at)}. Bản hiện tại vẫn được lưu trong lịch sử.` : ''}
        onConfirm={() => { onRestore?.(pick.content); onClose?.() }} />
    </Modal>
  )
}

/* ---------------- Chia sẻ tệp ---------------- */
export function ShareModal({ open, onClose, file }) {
  const users = useApp((s) => s.users)
  const [email, setEmail] = useState('')
  const [perm, setPerm] = useState('xem')
  const [people, setPeople] = useState([{ name: 'Lê Thu Hà', email: 'ha.le@phonui.demo', perm: 'sua' }])
  const [linkMode, setLinkMode] = useState('noi-bo')
  const link = `${typeof location !== 'undefined' ? location.origin : ''}/khong-gian?tep=${file?.id || ''}`
  const suggestions = email.length >= 1 ? users.filter((u) => u.email && (u.email.includes(email.toLowerCase()) || u.name.toLowerCase().includes(email.toLowerCase())) && !people.some((p) => p.email === u.email)).slice(0, 4) : []

  const invite = (em = email, name) => {
    const e = em.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast({ title: 'Email chưa hợp lệ', tone: 'neg' }); return }
    if (people.some((p) => p.email === e)) return
    const u = users.find((x) => x.email === e)
    setPeople((l) => [...l, { name: name || u?.name || e.split('@')[0], email: e, perm }])
    setEmail('')
    toast({ title: 'Đã chia sẻ tệp', desc: `${e} nhận được email mời với quyền ${perm === 'sua' ? 'chỉnh sửa' : 'xem'}.` })
  }
  return (
    <Modal open={open} onClose={onClose} title={`Chia sẻ “${file?.name || ''}”`} desc="Người được mời dùng vai trò và kho tính toán của chính họ khi chạy tệp."
      footer={<>
        <Button icon={Link2} className="mr-auto" onClick={() => { navigator.clipboard?.writeText(link); toast('Đã sao chép liên kết') }}>Sao chép liên kết</Button>
        <Button variant="primary" onClick={onClose}>Xong</Button>
      </>}>
      <div className="flex gap-2 items-start">
        <div className="flex-1 relative">
          <Input prefix={UserPlus} placeholder="Nhập email hoặc tên đồng nghiệp" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invite()} />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-10 rounded-xl border border-line bg-surface shadow-md p-1">
              {suggestions.map((u) => (
                <button key={u.id} onClick={() => invite(u.email, u.name)} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover text-left">
                  <Avatar name={u.name} size={26} /><span className="min-w-0"><span className="block text-[13px]">{u.name}</span><span className="block ds-caption truncate">{u.email}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Select className="w-36" value={perm} onChange={(e) => setPerm(e.target.value)} options={[{ value: 'xem', label: 'Được xem' }, { value: 'sua', label: 'Được sửa' }]} />
        <Button variant="primary" onClick={() => invite()}>Mời</Button>
      </div>
      <div className="mt-5 ds-label mb-2">Người có quyền truy cập</div>
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-3 py-1.5">
          <Avatar name="Trần Minh Khoa" size={32} />
          <div className="flex-1 min-w-0"><div className="text-[13.5px] font-[550]">Trần Minh Khoa (bạn)</div><div className="ds-caption">khoa.tran@phonui.demo</div></div>
          <Badge tone="brand">Chủ sở hữu</Badge>
        </li>
        {people.map((p) => (
          <li key={p.email} className="flex items-center gap-3 py-1.5">
            <Avatar name={p.name} color="#0fb5c9" size={32} />
            <div className="flex-1 min-w-0"><div className="text-[13.5px] font-[550] truncate">{p.name}</div><div className="ds-caption truncate">{p.email}</div></div>
            <Select size="sm" className="w-32" value={p.perm} onChange={(e) => setPeople((l) => l.map((x) => (x.email === p.email ? { ...x, perm: e.target.value } : x)))} options={[{ value: 'xem', label: 'Được xem' }, { value: 'sua', label: 'Được sửa' }]} />
            <button onClick={() => setPeople((l) => l.filter((x) => x.email !== p.email))} className="size-8 grid place-items-center rounded-lg text-muted hover:bg-neg-soft hover:text-neg" title="Gỡ quyền"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl border border-line p-3 flex items-center gap-3">
        <span className="size-9 rounded-lg bg-subtle grid place-items-center text-muted"><Globe2 size={17} /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-[550]">Truy cập bằng liên kết</div>
          <div className="ds-caption">{linkMode === 'noi-bo' ? 'Mọi người trong tài khoản PHONUI-VN01 có liên kết đều xem được' : 'Chỉ những người được mời'}</div>
        </div>
        <Select size="sm" className="w-40" value={linkMode} onChange={(e) => setLinkMode(e.target.value)} options={[{ value: 'han-che', label: 'Hạn chế' }, { value: 'noi-bo', label: 'Trong tài khoản' }]} />
      </div>
    </Modal>
  )
}

/* ---------------- Phím tắt ---------------- */
const SHORTCUTS = [
  ['Chạy câu lệnh dưới con trỏ / vùng chọn', ['Ctrl', 'Enter']],
  ['Chạy tất cả câu lệnh', ['Ctrl', 'Shift', 'Enter']],
  ['Lưu phiên bản', ['Ctrl', 'S']],
  ['Mở / đóng Tinh Ý', ['Ctrl', 'I']],
  ['Tìm trong tệp', ['Ctrl', 'F']],
  ['Thay thế', ['Ctrl', 'H']],
  ['Gợi ý tự hoàn thành', ['Ctrl', 'Space']],
  ['Chú thích dòng', ['Ctrl', '/']],
  ['Hoàn tác / Làm lại', ['Ctrl', 'Z']],
  ['Bảng lệnh tìm mọi thứ', ['Ctrl', 'K']],
]
export function ShortcutsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Phím tắt" desc="Trên macOS dùng ⌘ thay cho Ctrl." size="md">
      <ul className="flex flex-col divide-y divide-line -mt-1">
        {SHORTCUTS.map(([l, keys]) => (
          <li key={l} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
            <span className="text-dim">{l}</span>
            <span className="flex gap-1 shrink-0">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/* ---------------- Góp ý câu trả lời của Tinh Ý ---------------- */
export function FeedbackModal({ open, onClose }) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState([])
  const opts = ['SQL chạy lỗi', 'Kết quả không đúng', 'Hiểu sai câu hỏi', 'Giải thích khó hiểu']
  return (
    <Modal open={open} onClose={onClose} title="Điều gì chưa ổn?" desc="Góp ý của bạn giúp Tinh Ý trả lời tốt hơn (không bắt buộc)." size="sm"
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => { onClose(); setText(''); setTags([]); toast('Cảm ơn bạn đã góp ý!') }}>Gửi góp ý</Button></>}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {opts.map((o) => {
          const on = tags.includes(o)
          return (
            <button key={o} onClick={() => setTags((t) => (on ? t.filter((x) => x !== o) : [...t, o]))}
              className={cn('h-7 px-2.5 rounded-full border text-[12.5px] flex items-center gap-1', on ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line text-dim hover:bg-subtle')}>
              {on && <Check size={12} />}{o}
            </button>
          )
        })}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Mô tả thêm…"
        className="w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2 outline-none focus:border-brand-400 text-[13.5px]" />
    </Modal>
  )
}
