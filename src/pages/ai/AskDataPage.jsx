import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MessageSquareText, MoreHorizontal, Pencil, Trash2, PanelLeft, TrendingUp, Store, Coffee, MessageCircleWarning, Clock, PieChart, Percent, UserX } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp, useAuth, uid } from '@/store'
import { Popover, Menu, Modal, Input, Button, Confirm } from '@/components/ui'
import { SUGGESTIONS } from '@/engine/assistant'
import { timeAgo } from '@/lib/format'
import { Composer, MessageList, SourcePill, useAskRunner, BotAvatar } from '@/features/ai/ChatParts'

const SUGG_ICONS = [TrendingUp, Store, Coffee, MessageCircleWarning, Clock, PieChart, Percent, UserX]

export default function AskDataPage() {
  const { chats, upsert, remove } = useApp()
  const user = useAuth((s) => s.user)
  const [activeId, setActiveId] = useState(null)
  const [showList, setShowList] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const runner = useAskRunner({ warehouse: 'KHO_AI', source: 'Hỏi dữ liệu' })
  const chat = useMemo(() => chats.find((c) => c.id === activeId), [chats, activeId])
  const messages = chat?.messages || []

  async function send(q) {
    let id = activeId
    let base = chat
    if (!base) {
      id = uid('c')
      base = { id, title: q.length > 60 ? q.slice(0, 57) + '…' : q, at: new Date().toISOString(), messages: [] }
      setActiveId(id)
    }
    const userMsg = { id: uid('u'), role: 'user', text: q, at: new Date().toISOString() }
    const ans = await runner.run(q)
    if (!ans) return
    const latest = useApp.getState().chats.find((c) => c.id === id) || base
    upsert('chats', { ...latest, at: new Date().toISOString(), messages: [...latest.messages, userMsg, ans] })
  }

  // ?q=<câu hỏi> (từ trang giới thiệu): mở cuộc trò chuyện mới và hỏi luôn một lần
  const [params, setParams] = useSearchParams()
  const autoAsked = useRef(false)
  useEffect(() => {
    const q = params.get('q')
    if (!q || autoAsked.current) return
    autoAsked.current = true
    const p = new URLSearchParams(params); p.delete('q')
    setParams(p, { replace: true })
    setActiveId(null)
    send(q.trim())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const newChat = () => { setActiveId(null); setShowList(false) }
  const empty = !messages.length && !runner.pending

  const history = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button variant="outline" icon={Plus} className="w-full" onClick={newChat}>Cuộc trò chuyện mới</Button>
      </div>
      <div className="px-3 pb-1 ds-label">Gần đây</div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!chats.length && <p className="px-2 py-4 ds-caption">Các câu hỏi bạn đã hỏi sẽ được lưu ở đây.</p>}
        {chats.map((c) => (
          <div key={c.id} className={cn('group flex items-center gap-1 rounded-lg pr-1', c.id === activeId ? 'bg-brand-50' : 'hover:bg-hover')}>
            <button onClick={() => { setActiveId(c.id); setShowList(false) }} className="flex-1 min-w-0 flex items-start gap-2 px-2.5 py-2 text-left">
              <MessageSquareText size={15} className={cn('shrink-0 mt-0.5', c.id === activeId ? 'text-brand-ink' : 'text-faint')} />
              <span className="min-w-0">
                <span className={cn('block truncate text-[13px]', c.id === activeId && 'font-[600]')}>{c.title}</span>
                <span className="block text-[11.5px] text-faint">{timeAgo(c.at)} · {Math.floor(c.messages.length / 2)} câu hỏi</span>
              </span>
            </button>
            <Popover align="end" width={190} trigger={(p) => <button {...p} className="size-7 grid place-items-center rounded-md text-muted opacity-60 md:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-press" aria-label="Tuỳ chọn"><MoreHorizontal size={15} /></button>}>
              {(close) => <Menu onClose={close} items={[
                { label: 'Đổi tên', icon: Pencil, onClick: () => setRenaming({ id: c.id, title: c.title }) },
                { label: 'Xoá cuộc trò chuyện', icon: Trash2, danger: true, onClick: () => setDeleting(c.id) },
              ]} />}
            </Popover>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="h-full flex min-h-0">
      <aside className="hidden md:flex w-[260px] shrink-0 border-r border-line bg-side/60 flex-col">{history}</aside>
      {showList && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[rgba(14,14,40,.35)]" onClick={() => setShowList(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-surface shadow-lg animate-slide-in">{history}</div>
        </div>
      )}
      <section className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14 border-b border-line shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button className="md:hidden size-9 grid place-items-center rounded-lg hover:bg-hover" onClick={() => setShowList(true)} aria-label="Lịch sử"><PanelLeft size={18} /></button>
            <h1 className="font-[650] truncate">{chat?.title || 'Hỏi dữ liệu'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {chat && <Button size="sm" variant="ghost" icon={Plus} onClick={newChat} className="hidden sm:inline-flex">Mới</Button>}
            <SourcePill warehouse="KHO_AI" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto max-w-[860px] px-4 sm:px-6 pt-10 sm:pt-16 pb-8">
              <div className="flex items-center gap-3 mb-5"><BotAvatar size={44} /><span className="text-[13px] text-muted">Tinh Ý · trợ lý dữ liệu của bạn</span></div>
              <h2 className="text-[30px] sm:text-[40px] leading-[1.12] font-[750] tracking-[-0.035em]">
                Chào {user.first || 'bạn'},<br /><span className="text-crystal">hôm nay bạn muốn biết điều gì?</span>
              </h2>
              <p className="text-muted mt-3 max-w-xl">Hỏi bằng tiếng Việt như nói với đồng nghiệp. Tinh Ý tự viết SQL, chạy trên dữ liệu bán hàng của chuỗi Phố Núi và vẽ biểu đồ cho bạn.</p>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-8">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = SUGG_ICONS[i % SUGG_ICONS.length]
                  return (
                    <button key={s} onClick={() => send(s)} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-brand-300 hover:shadow-sm transition">
                      <span className="size-9 rounded-lg bg-brand-50 text-brand-ink grid place-items-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors"><Icon size={17} /></span>
                      <span className="text-[13.5px] text-dim group-hover:text-fg">{s}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-6">
              <MessageList messages={messages} pending={runner.pending} warehouse="KHO_AI" onFollowup={send} />
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2">
          <div className="mx-auto max-w-[900px]">
            <Composer onSend={send} disabled={!!runner.pending} autoFocus footer={<span className="hidden sm:inline">Enter để gửi · Shift + Enter xuống dòng</span>} />
            <p className="text-center text-[11.5px] text-faint mt-2">Tinh Ý chạy SQL thật trên dữ liệu mẫu ngay trong trình duyệt. Hãy kiểm tra lại số liệu quan trọng trước khi ra quyết định.</p>
          </div>
        </div>
      </section>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Đổi tên cuộc trò chuyện" size="sm"
        footer={<><Button onClick={() => setRenaming(null)}>Huỷ</Button><Button variant="primary" onClick={() => {
          const c = chats.find((x) => x.id === renaming.id)
          if (c && renaming.title.trim()) upsert('chats', { ...c, title: renaming.title.trim() })
          setRenaming(null)
        }}>Lưu</Button></>}>
        {renaming && <Input autoFocus value={renaming.title} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} />}
      </Modal>
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} danger title="Xoá cuộc trò chuyện?" desc="Toàn bộ câu hỏi và câu trả lời trong cuộc trò chuyện này sẽ bị xoá." confirmLabel="Xoá"
        onConfirm={() => { remove('chats', deleting); if (deleting === activeId) setActiveId(null) }} />
    </div>
  )
}
