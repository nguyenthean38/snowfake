/* ==========================================================
   Tinh Ý toàn cục: nút tròn góc dưới + ngăn hội thoại bên phải
   (mở bằng Ctrl J). Hội thoại giữ trong phiên làm việc hiện tại.
   ========================================================== */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X, SquarePen, ExternalLink } from 'lucide-react'
import { useUI, useApp, useAuth, uid } from '@/store'
import { SUGGESTIONS } from '@/engine/assistant'
import { Kbd } from '@/components/ui'
import { Composer, MessageList, SourcePill, useAskRunner, Chip, BotAvatar } from '@/features/ai/ChatParts'

export function Assistant({ hideLauncher }) {
  const open = useUI((s) => s.assistant)
  const setOpen = useUI((s) => s.setAssistant)
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const runner = useAskRunner({ warehouse: 'KHO_AI', source: 'Tinh Ý' })
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[data-overlay][role="dialog"], [data-overlay] [role="dialog"][aria-modal]')) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  async function send(q) {
    const userMsg = { id: uid('u'), role: 'user', text: q }
    const ans = await runner.run(q)
    if (ans) setMessages((m) => [...m, userMsg, ans])
  }
  function openInAsk() {
    if (messages.length) {
      useApp.getState().upsert('chats', { id: uid('c'), title: messages[0].text.slice(0, 60), at: new Date().toISOString(), messages })
    }
    setOpen(false)
    navigate('/ai/hoi-du-lieu')
  }

  return (
    <>
      {!hideLauncher && !open && (
        <button onClick={() => setOpen(true)} aria-label="Hỏi Tinh Ý (Ctrl J)" title="Hỏi Tinh Ý (Ctrl J)"
          className="group fixed right-5 bottom-5 z-40 h-12 pl-3.5 pr-3.5 hover:pr-4 rounded-2xl bg-crystal text-white shadow-lg flex items-center gap-2 hover:scale-[1.03] transition-all">
          <Sparkles size={20} />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-[13.5px] font-[600] group-hover:max-w-[120px] transition-[max-width] duration-300">Hỏi Tinh Ý</span>
        </button>
      )}
      {open && createPortal(
        <div data-overlay className="fixed inset-0 z-[72] pointer-events-none">
          <div className="absolute inset-0 bg-[rgba(14,14,40,.18)] pointer-events-auto sm:bg-transparent animate-fade-in" onClick={() => setOpen(false)} />
          <aside role="dialog" aria-label="Trợ lý Tinh Ý"
            className="pointer-events-auto absolute right-0 top-0 h-full w-full sm:w-[460px] bg-canvas border-l border-line shadow-lg flex flex-col animate-slide-in">
            <div className="flex items-center gap-2.5 px-4 h-14 border-b border-line bg-surface shrink-0">
              <BotAvatar size={30} />
              <div className="min-w-0 flex-1">
                <div className="font-[650] leading-tight">Tinh Ý</div>
                <div className="text-[11.5px] text-muted leading-tight">Trợ lý dữ liệu · <Kbd className="h-4 text-[10px]">Ctrl J</Kbd></div>
              </div>
              <button onClick={() => setMessages([])} title="Cuộc trò chuyện mới" className="size-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><SquarePen size={16} /></button>
              <button onClick={openInAsk} title="Mở trong Hỏi dữ liệu" className="size-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><ExternalLink size={16} /></button>
              <button onClick={() => setOpen(false)} title="Đóng" className="size-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!messages.length && !runner.pending ? (
                <div className="pt-6">
                  <h2 className="text-[28px] leading-[1.12] font-[750] tracking-[-0.03em]">Chào {user.first || 'bạn'},<br /><span className="text-crystal">mình giúp gì được?</span></h2>
                  <p className="text-muted text-[13.5px] mt-2">Hỏi về doanh thu, món bán chạy, khách hàng hay đánh giá. Mình sẽ viết SQL và chạy ngay.</p>
                  <div className="mt-5 ds-label mb-2">Thử hỏi</div>
                  <div className="flex flex-col items-start gap-1.5">
                    {SUGGESTIONS.slice(0, 5).map((s) => <Chip key={s} onClick={() => send(s)}>{s}</Chip>)}
                  </div>
                </div>
              ) : (
                <MessageList messages={messages} pending={runner.pending} warehouse="KHO_AI" compact onFollowup={send} />
              )}
            </div>
            <div className="px-3 pb-3 pt-1 shrink-0">
              <Composer compact autoFocus onSend={send} disabled={!!runner.pending} placeholder="Hỏi Tinh Ý về dữ liệu…" footer={<SourcePill warehouse="KHO_AI" />} />
              <p className="text-center text-[11px] text-faint mt-1.5">Tinh Ý có thể nhầm, hãy kiểm tra lại số liệu quan trọng.</p>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  )
}
