/* ==========================================================
   Thành phần hội thoại dùng chung: Hỏi dữ liệu, ngăn Tinh Ý,
   xem trước tác tử AI.
   ========================================================== */
import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUp, Check, Copy, Loader2, Sparkles, ThumbsUp, ThumbsDown, FileCode2, BarChart3, Table2, Code2,
  AlertTriangle, CornerDownRight, Database, Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { ResultChart } from '@/components/charts'
import { DataGrid } from '@/components/data/DataGrid'
import { useApp, useUI, toast } from '@/store'
import { LogoMark } from '@/components/brand/Logo'
import { answerQuestion, fileNameFrom } from './answer'

/** Văn bản có **đậm**, `mã` và xuống dòng */
export function RichText({ text = '', className }) {
  const lines = String(text).split('\n')
  return (
    <div className={cn('leading-relaxed', className)}>
      {lines.map((ln, i) => (
        <Fragment key={i}>
          {ln.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, j) => {
            if (p.startsWith('**') && p.endsWith('**')) return <b key={j} className="font-[650] text-fg">{p.slice(2, -2)}</b>
            if (p.startsWith('`') && p.endsWith('`')) return <code key={j} className="font-mono text-[12.5px] px-1 py-0.5 rounded bg-subtle">{p.slice(1, -1)}</code>
            return <Fragment key={j}>{p}</Fragment>
          })}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </div>
  )
}

/** Hình đại diện trợ lý (biểu tượng trống đồng) */
export function BotAvatar({ size = 30, color, icon: Icon }) {
  if (Icon) {
    return (
      <span className="shrink-0 grid place-items-center rounded-xl text-white" style={{ width: size, height: size, background: color || 'var(--c-brand-500)' }}>
        <Icon size={size * 0.52} />
      </span>
    )
  }
  return (
    <span className="shrink-0 grid place-items-center rounded-xl bg-brand-50 border border-brand-100" style={{ width: size, height: size }}>
      <LogoMark size={size * 0.66} />
    </span>
  )
}

const STEP_LABELS = (wh) => ['Hiểu câu hỏi', 'Viết SQL', `Chạy trên ${wh}`, 'Phân tích kết quả']

/** Các bước "đang suy nghĩ" có hiệu ứng */
export function Thinking({ step = 0, warehouse = 'KHO_AI', compact }) {
  const labels = STEP_LABELS(warehouse)
  return (
    <div className={cn('flex flex-col gap-1.5', compact ? 'text-[12.5px]' : 'text-[13.5px]')}>
      {labels.map((l, i) => (
        <div key={l} className={cn('flex items-center gap-2 transition-opacity duration-300', i > step ? 'opacity-35' : 'opacity-100')}>
          {i < step ? <Check size={14} className="text-pos" /> : i === step ? <Loader2 size={14} className="animate-spin text-brand-ink" /> : <span className="size-3.5 rounded-full border border-line-strong" />}
          <span className={i === step ? 'text-fg font-[550]' : 'text-muted'}>{l}{i === step && '…'}</span>
        </div>
      ))}
    </div>
  )
}

/** Hook chạy câu hỏi + hiệu ứng các bước */
export function useAskRunner({ warehouse = 'KHO_AI', source = 'Hỏi dữ liệu' } = {}) {
  const [pending, setPending] = useState(null)
  const busy = useRef(false)
  async function run(question, ctx = {}) {
    if (busy.current) return null
    busy.current = true
    setPending({ question, step: 0 })
    const timers = [1, 2, 3].map((s, i) => setTimeout(() => setPending((p) => (p ? { ...p, step: s } : p)), 420 * (i + 1)))
    const t0 = Date.now()
    let ans
    try {
      ans = await answerQuestion(question, { ...ctx, source })
    } catch (e) {
      ans = { role: 'assistant', id: `m${Date.now()}`, type: 'error', text: `Có lỗi khi khởi động động cơ dữ liệu: ${e.message}` }
    }
    const minWait = ans.type === 'sql' ? 1500 : 550
    await new Promise((r) => setTimeout(r, Math.max(0, minWait - (Date.now() - t0))))
    timers.forEach(clearTimeout)
    setPending(null)
    busy.current = false
    return ans
  }
  return { pending, run, warehouse }
}

/** Ô nhập câu hỏi */
export function Composer({ onSend, disabled, placeholder = 'Hỏi về doanh thu, món bán chạy, khách hàng, đánh giá…', compact, autoFocus, footer }) {
  const [v, setV] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(compact ? 120 : 180, el.scrollHeight) + 'px'
  }, [v, compact])
  const send = () => {
    const q = v.trim()
    if (!q || disabled) return
    onSend(q)
    setV('')
  }
  return (
    <div className={cn('rounded-2xl border border-line-strong bg-surface shadow-sm focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100 transition', compact ? 'p-2' : 'p-3')}>
      <textarea ref={ref} rows={1} autoFocus={autoFocus} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        className={cn('w-full resize-none bg-transparent outline-none leading-relaxed px-1', compact ? 'text-[13.5px]' : 'text-[15px]')} />
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <div className="flex items-center gap-2 min-w-0 text-[12px] text-muted">{footer}</div>
        <button onClick={send} disabled={!v.trim() || disabled} aria-label="Gửi câu hỏi"
          className="size-8 shrink-0 rounded-full bg-brand-500 text-white grid place-items-center hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed">
          {disabled ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </div>
  )
}

/** Viên thuốc nguồn dữ liệu */
export function SourcePill({ warehouse = 'KHO_AI' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 h-6 text-[11.5px] text-dim">
      <Database size={12} /> PHO_NUI_DB <span className="text-faint">·</span> <Zap size={12} /> {warehouse}
    </span>
  )
}

/** Tin nhắn người dùng */
export function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 text-white px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">{text}</div>
    </div>
  )
}

/**
 * Thẻ trả lời của trợ lý.
 * compact: dùng trong ngăn Tinh Ý (biểu đồ thấp hơn, ít hành động hơn)
 */
export function AnswerCard({ msg, compact, onFollowup, bot }) {
  const navigate = useNavigate()
  const newFile = useApp((s) => s.newFile)
  const [view, setView] = useState(msg.chart && msg.chart.type ? 'chart' : 'table')
  const [vote, setVote] = useState(null)
  const [copied, setCopied] = useState(false)
  const avatar = bot ? <BotAvatar size={compact ? 26 : 30} color={bot.color} icon={bot.icon} /> : <BotAvatar size={compact ? 26 : 30} />

  const copySQL = () => {
    navigator.clipboard?.writeText(msg.sql || '')
    setCopied(true); setTimeout(() => setCopied(false), 1500)
    toast('Đã sao chép SQL')
  }
  const openEditor = () => {
    newFile({ name: fileNameFrom(msg.title), content: `-- ${msg.title || 'Truy vấn từ Tinh Ý'}\n-- Câu hỏi: "${msg.question || ''}"\n-- Tạo bởi Tinh Ý\n\n${msg.sql}` })
    useUI.getState().setAssistant(false)
    navigate('/khong-gian')
    toast({ title: 'Đã mở trong không gian làm việc', desc: 'Bấm Chạy (Ctrl + Enter) để thực thi lại.' })
  }

  if (msg.type !== 'sql') {
    return (
      <div className="flex gap-3 animate-slide-up">
        {avatar}
        <div className="min-w-0 flex-1 pt-0.5">
          {msg.type === 'error' && <div className="flex items-center gap-1.5 text-neg text-[13px] font-[600] mb-1"><AlertTriangle size={14} /> Có lỗi xảy ra</div>}
          <RichText text={msg.text} className={cn('text-dim', compact ? 'text-[13.5px]' : 'text-[14.5px]')} />
          {msg.sql && <pre className="mt-3 rounded-xl bg-subtle border border-line p-3 text-[12px] font-mono overflow-x-auto whitespace-pre">{msg.sql}</pre>}
          {msg.suggestions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {msg.suggestions.map((s) => <Chip key={s} onClick={() => onFollowup?.(s)}>{s}</Chip>)}
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    msg.chart?.type && { v: 'chart', label: 'Biểu đồ', icon: BarChart3 },
    { v: 'table', label: `Dữ liệu (${msg.rowCount ?? msg.rows?.length ?? 0})`, icon: Table2 },
    { v: 'sql', label: 'SQL', icon: Code2 },
  ].filter(Boolean)

  return (
    <div className="flex gap-3 animate-slide-up">
      {avatar}
      <div className="min-w-0 flex-1">
        <div className={cn('rounded-2xl border border-line bg-surface shadow-xs overflow-hidden')}>
          <div className={cn(compact ? 'px-3.5 pt-3' : 'px-5 pt-4')}>
            <div className="flex items-start justify-between gap-3">
              <h3 className={cn('font-[650] tracking-tight', compact ? 'text-[14px]' : 'text-[16px]')}>{msg.title}</h3>
              {msg.ms != null && <span className="text-[11.5px] text-faint num shrink-0 mt-0.5">{msg.ms} ms</span>}
            </div>
            <RichText text={msg.insight} className={cn('text-dim mt-1.5', compact ? 'text-[13px]' : 'text-[14px]')} />
            <div className={cn('flex items-center gap-1 mt-3 border-b border-line overflow-x-auto no-scrollbar', compact ? '-mx-3.5 px-3.5' : '-mx-5 px-5')}>
              {tabs.map((t) => (
                <button key={t.v} onClick={() => setView(t.v)}
                  className={cn('relative h-9 px-2 inline-flex items-center gap-1.5 text-[12.5px] font-[550] whitespace-nowrap', view === t.v ? 'text-fg' : 'text-muted hover:text-fg')}>
                  <t.icon size={14} />{t.label}
                  {view === t.v && <span className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-brand-500" />}
                </button>
              ))}
            </div>
          </div>
          <div className={cn(view === 'table' ? '' : compact ? 'p-3.5' : 'p-5')}>
            {view === 'chart' && <ResultChart columns={msg.columns} rows={msg.rows} spec={msg.chart} height={compact ? 190 : 260} />}
            {view === 'table' && <DataGrid columns={msg.columns} rows={msg.rows} stats={false} maxHeight={compact ? 260 : 340} />}
            {view === 'sql' && (
              <div className="relative">
                <pre className="rounded-xl bg-subtle border border-line p-3.5 pr-11 text-[12.5px] leading-relaxed font-mono overflow-x-auto whitespace-pre">{msg.sql}</pre>
                <button onClick={copySQL} className="absolute top-2 right-2 size-8 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-fg" title="Sao chép SQL">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
              </div>
            )}
          </div>
          <div className={cn('flex items-center gap-1 flex-wrap border-t border-line bg-subtle/60', compact ? 'px-2.5 py-1.5' : 'px-4 py-2')}>
            <ActionBtn icon={FileCode2} onClick={openEditor}>{compact ? 'Mở trong trình soạn' : 'Mở trong không gian làm việc'}</ActionBtn>
            {!compact && <ActionBtn icon={copied ? Check : Copy} onClick={copySQL}>Sao chép SQL</ActionBtn>}
            <span className="ml-auto flex items-center gap-0.5">
              <button onClick={() => { setVote('up'); toast('Cảm ơn phản hồi của bạn!') }} className={cn('size-8 grid place-items-center rounded-lg hover:bg-hover', vote === 'up' ? 'text-pos' : 'text-muted')} title="Câu trả lời hữu ích"><ThumbsUp size={14} /></button>
              <button onClick={() => { setVote('down'); toast({ title: 'Đã ghi nhận', desc: 'Tinh Ý sẽ dùng phản hồi này để cải thiện.' }) }} className={cn('size-8 grid place-items-center rounded-lg hover:bg-hover', vote === 'down' ? 'text-neg' : 'text-muted')} title="Chưa đúng ý"><ThumbsDown size={14} /></button>
            </span>
          </div>
        </div>
        {msg.explain && !compact && <p className="ds-caption mt-2 flex gap-1.5"><Sparkles size={13} className="shrink-0 mt-0.5 text-brand-ink" />{msg.explain}</p>}
        {msg.followups?.length > 0 && onFollowup && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {msg.followups.slice(0, compact ? 2 : 3).map((s) => <Chip key={s} onClick={() => onFollowup(s)} icon={CornerDownRight}>{s}</Chip>)}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ icon: Icon, children, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12.5px] font-[550] text-dim hover:bg-hover hover:text-fg">
      <Icon size={14} />{children}
    </button>
  )
}

export function Chip({ children, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 h-8 text-[12.5px] text-dim hover:border-brand-300 hover:text-brand-ink hover:bg-brand-50 transition-colors text-left">
      {Icon && <Icon size={13} className="text-faint shrink-0" />}<span className="truncate max-w-[280px]">{children}</span>
    </button>
  )
}

/** Tin nhắn đang chờ (câu hỏi + các bước) */
export function PendingAnswer({ pending, warehouse, compact, bot }) {
  if (!pending) return null
  return (
    <div className="flex gap-3 animate-fade-in">
      {bot ? <BotAvatar size={compact ? 26 : 30} color={bot.color} icon={bot.icon} /> : <BotAvatar size={compact ? 26 : 30} />}
      <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-xs min-w-[220px]">
        <Thinking step={pending.step} warehouse={warehouse} compact={compact} />
      </div>
    </div>
  )
}

/** Danh sách tin nhắn (người dùng + trợ lý) */
export function MessageList({ messages = [], pending, warehouse, compact, onFollowup, bot }) {
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, pending?.step])
  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6')}>
      {messages.map((m) => (m.role === 'user'
        ? <UserBubble key={m.id} text={m.text} />
        : <AnswerCard key={m.id} msg={m} compact={compact} onFollowup={onFollowup} bot={bot} />))}
      {pending && (
        <>
          <UserBubble text={pending.question} />
          <PendingAnswer pending={pending} warehouse={warehouse} compact={compact} bot={bot} />
        </>
      )}
      <div ref={end} />
    </div>
  )
}
