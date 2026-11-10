/* ==========================================================
   Tinh Ý trong Không gian làm việc
   Hỏi bằng tiếng Việt → Tinh Ý viết / giải thích / định dạng /
   sửa SQL rồi cho phép chèn, thay thế hoặc chạy ngay.
   ========================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles, X, SquarePen, ArrowUp, ThumbsUp, ThumbsDown, Copy, Play, CornerDownLeft, Replace, Check, Loader2, CircleCheck,
  Wand2, BookOpenText,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { toast } from '@/store'
import { ask, SUGGESTIONS } from '@/engine/assistant'
import { getSchemaHints, getDB } from '@/engine/db'
import { tokenizeSQL } from './sqlUtils'
import { FeedbackModal } from './Modals'

const TOK = { kw: 'text-[var(--c-code-kw)] font-[600]', str: 'text-[var(--c-code-str)]', num: 'text-[var(--c-code-num)]', cmt: 'text-[var(--c-code-cmt)] italic', fn: 'text-[var(--c-code-fn)]', txt: '' }

export function SqlBlock({ sql, className }) {
  return (
    <pre className={cn('font-mono text-[12px] leading-[1.65] whitespace-pre-wrap break-words', className)}>
      {tokenizeSQL(sql).map((t, i) => <span key={i} className={TOK[t.t]}>{t.v}</span>)}
    </pre>
  )
}

/** Hiển thị **đậm**, `mã` và xuống dòng */
export function RichText({ text }) {
  return (
    <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
      {String(text || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <b key={i} className="font-[650]">{p.slice(2, -2)}</b>
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="font-mono text-[12px] px-1 py-0.5 rounded bg-subtle">{p.slice(1, -1)}</code>
        return <span key={i}>{p}</span>
      })}
    </div>
  )
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function stepsFor(q, ctx) {
  const n = q.toLowerCase()
  if (/giải thích|giai thich/.test(n)) return ['Đọc đoạn SQL đang mở', 'Phân tích từng câu lệnh', 'Viết lời giải thích']
  if (/định dạng|dinh dang|format/.test(n)) return ['Đọc đoạn SQL đang mở', 'Chuẩn hoá từ khoá và thụt lề']
  if (/lỗi|loi|fix/.test(n)) return ['Đọc thông báo lỗi', ctx.lastError ? 'Đối chiếu với lược đồ dữ liệu' : 'Kiểm tra câu lệnh gần nhất', 'Đề xuất cách sửa']
  return ['Đọc câu hỏi', `Xem lược đồ dữ liệu (${Object.keys(ctx.schema || {}).length} bảng)`, 'Viết câu SQL']
}

/** Trạng thái hội thoại — đặt ở trang để còn nguyên khi đóng/mở bảng */
export function useTinhY(getCtx) {
  const [messages, setMessages] = useState([])
  const busy = useRef(false)
  const send = useCallback(async (text) => {
    const q = String(text || '').trim()
    if (!q || busy.current) return
    busy.current = true
    await getDB().catch(() => {})
    const ctx = { ...getCtx(), schema: getSchemaHints() }
    const id = Date.now()
    const steps = stepsFor(q, ctx)
    setMessages((m) => [...m, { id: id + 'u', role: 'user', text: q }, { id, role: 'ai', status: 'thinking', steps, done: 0 }])
    for (let i = 0; i < steps.length; i++) {
      await wait(320 + Math.random() * 260)
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, done: i + 1 } : x)))
    }
    let a
    try { a = ask(q, ctx) } catch { a = { type: 'unknown', text: 'Xin lỗi, mình gặp trục trặc khi xử lý câu hỏi này.' } }
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: 'done', answer: a } : x)))
    busy.current = false
  }, [getCtx])
  return { messages, send, reset: () => setMessages([]) }
}

export function TinhYPanel({ firstName = 'bạn', chat, onClose, onInsert, onReplace, onRunNow, className }) {
  const { messages, send, reset } = chat
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(false)
  const [rated, setRated] = useState({})
  const scroller = useRef(null)
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  const submit = () => { if (input.trim()) { send(input); setInput('') } }
  const chips = ['Giải thích đoạn SQL này', 'Định dạng lại SQL', ...SUGGESTIONS.slice(0, 4)]

  return (
    <aside className={cn('flex flex-col min-h-0 bg-surface border-l border-line', className)}>
      <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-line">
        <span className="size-7 rounded-lg bg-crystal grid place-items-center text-white"><Sparkles size={15} /></span>
        <span className="font-[650]">Tinh Ý</span>
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-ink font-[600]">Trợ lý SQL</span>
        <div className="flex-1" />
        <button onClick={reset} title="Cuộc trò chuyện mới" className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><SquarePen size={16} /></button>
        <button onClick={onClose} title="Đóng (Ctrl I)" className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><X size={17} /></button>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4">
        {!messages.length ? (
          <div className="h-full flex flex-col justify-center py-6">
            <h2 className="text-[34px] leading-[1.08] font-[750] tracking-[-0.035em]">
              Chào {firstName},<br /><span className="text-crystal">mình giúp gì được?</span>
            </h2>
            <p className="text-muted mt-3 text-[13.5px]">Hỏi về dữ liệu bán hàng Phố Núi bằng tiếng Việt, hoặc nhờ mình giải thích, định dạng, sửa câu SQL đang mở.</p>
            <div className="flex flex-col gap-1.5 mt-5">
              {chips.map((c, i) => (
                <button key={c} onClick={() => send(c)} className="flex items-center gap-2 text-left rounded-xl border border-line px-3 py-2 text-[13px] hover:border-brand-300 hover:bg-brand-50 transition-colors">
                  {i === 0 ? <BookOpenText size={14} className="text-brand-ink shrink-0" /> : i === 1 ? <Wand2 size={14} className="text-brand-ink shrink-0" /> : <Sparkles size={14} className="text-ice shrink-0" />}
                  <span className="truncate">{c}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => m.role === 'user' ? (
              <div key={m.id} className="self-end max-w-[88%] rounded-2xl rounded-br-md bg-brand-500 text-white px-3.5 py-2 text-[13.5px] whitespace-pre-wrap">{m.text}</div>
            ) : (
              <div key={m.id} className="flex flex-col gap-2 animate-fade-in">
                <ul className="flex flex-col gap-1">
                  {m.steps.map((s, i) => (
                    <li key={i} className={cn('flex items-center gap-2 text-[12.5px]', i < m.done ? 'text-muted' : i === m.done && m.status === 'thinking' ? 'text-fg' : 'text-faint')}>
                      {i < m.done ? <CircleCheck size={14} className="text-pos" /> : i === m.done && m.status === 'thinking' ? <Loader2 size={14} className="animate-spin text-brand-ink" /> : <span className="size-3.5 rounded-full border border-line-strong" />}
                      {s}
                    </li>
                  ))}
                </ul>
                {m.status === 'done' && <Answer a={m.answer} onInsert={onInsert} onReplace={onReplace} onRunNow={onRunNow} onAsk={send}
                  rated={rated[m.id]} onRate={(v) => { setRated((r) => ({ ...r, [m.id]: v })); if (v === 'down') setFeedback(true); else toast('Cảm ơn bạn!') }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-line">
        <div className="rounded-2xl border border-line-strong bg-surface focus-within:border-brand-400 focus-within:shadow-[0_0_0_3px_var(--c-brand-100)] transition-shadow">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Hỏi về dữ liệu, nhờ viết hoặc sửa SQL…" className="w-full resize-none bg-transparent outline-none px-3.5 pt-3 text-[13.5px]" />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <span className="text-[11.5px] text-faint flex items-center gap-1"><CornerDownLeft size={12} />Enter để gửi</span>
            <button onClick={submit} disabled={!input.trim()} className="size-8 rounded-full bg-brand-500 text-white grid place-items-center disabled:opacity-40" aria-label="Gửi"><ArrowUp size={16} /></button>
          </div>
        </div>
        <p className="text-[11.5px] text-faint text-center mt-2">Tinh Ý có thể sai, hãy kiểm tra lại kết quả.</p>
      </div>
      <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
    </aside>
  )
}

function Answer({ a, onInsert, onReplace, onRunNow, onAsk, rated, onRate }) {
  const [copied, setCopied] = useState(false)
  if (!a) return null
  return (
    <div className="flex flex-col gap-2.5">
      {a.title && <div className="font-[650] text-[14px]">{a.title}</div>}
      {a.text && <RichText text={a.text} />}
      {a.filters?.length > 0 && (
        <div className="flex flex-wrap gap-1">{a.filters.map((f) => <span key={f} className="text-[11.5px] px-2 py-0.5 rounded-full bg-ice-soft text-ice font-[600]">{f}</span>)}</div>
      )}
      {a.sql && (
        <div className="rounded-xl border border-line bg-[var(--c-code-bg)] overflow-hidden">
          <div className="flex items-center justify-between h-8 px-3 border-b border-line bg-subtle">
            <span className="text-[11.5px] font-[600] text-muted">SQL</span>
            <button onClick={() => { navigator.clipboard?.writeText(a.sql); setCopied(true); setTimeout(() => setCopied(false), 1400) }} className="text-[11.5px] text-muted hover:text-fg flex items-center gap-1">
              {copied ? <><Check size={12} />Đã chép</> : <><Copy size={12} />Sao chép</>}
            </button>
          </div>
          <SqlBlock sql={a.sql} className="p-3 max-h-72 overflow-auto" />
          <div className="flex flex-wrap gap-1.5 p-2 border-t border-line">
            {a.type === 'format' || a.type === 'fix' ? (
              <>
                <ActionBtn primary icon={Check} onClick={() => onReplace(a.sql)}>Áp dụng</ActionBtn>
                <ActionBtn icon={CornerDownLeft} onClick={() => onInsert(a.sql, a.title || 'Bản đã sửa')}>Chèn xuống cuối</ActionBtn>
              </>
            ) : (
              <>
                <ActionBtn primary icon={Play} onClick={() => onRunNow(a.sql, a.title)}>Chạy ngay</ActionBtn>
                <ActionBtn icon={CornerDownLeft} onClick={() => onInsert(a.sql, a.title)}>Chèn vào trình soạn</ActionBtn>
                <ActionBtn icon={Replace} onClick={() => onReplace(a.sql)}>Thay thế</ActionBtn>
              </>
            )}
          </div>
        </div>
      )}
      {a.suggestions?.length > 0 && (
        <div className="flex flex-col gap-1">
          {a.suggestions.map((s) => <button key={s} onClick={() => onAsk(s)} className="text-left text-[13px] rounded-lg border border-line px-3 py-1.5 hover:bg-brand-50 hover:border-brand-300">{s}</button>)}
        </div>
      )}
      <div className="flex items-center gap-1 text-muted">
        <button onClick={() => onRate('up')} className={cn('size-7 grid place-items-center rounded-md hover:bg-hover', rated === 'up' && 'text-pos')} title="Hữu ích"><ThumbsUp size={14} /></button>
        <button onClick={() => onRate('down')} className={cn('size-7 grid place-items-center rounded-md hover:bg-hover', rated === 'down' && 'text-neg')} title="Chưa ổn"><ThumbsDown size={14} /></button>
      </div>
    </div>
  )
}

function ActionBtn({ primary, icon: Icon, children, onClick }) {
  return (
    <button onClick={onClick} className={cn('h-7 px-2.5 rounded-lg text-[12.5px] font-[600] flex items-center gap-1.5', primary ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-subtle text-fg hover:bg-hover')}>
      <Icon size={13} />{children}
    </button>
  )
}
