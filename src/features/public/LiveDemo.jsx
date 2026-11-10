/* ==========================================================
   Bản demo chạy thật trên trang giới thiệu
   Câu hỏi tiếng Việt → Tinh Ý sinh SQL → động cơ SQLite (WASM)
   chạy ngay trong trình duyệt → vẽ biểu đồ từ kết quả thật.
   Động cơ chỉ được tải khi khu vực này cuộn vào màn hình.
   ========================================================== */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles, Loader2, Cpu, Database, Timer, Play, RotateCcw, Table2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ResultChart, valueLabel } from '@/components/charts'
import { LogoMark } from '@/components/brand/Logo'
import { SqlCode } from './SqlCode'

const CHIPS = [
  'Doanh thu theo tháng của các cửa hàng ở Hà Nội',
  'Top 5 cửa hàng doanh thu cao nhất quý 3',
  'Món nào bán chạy nhất tháng 10?',
  'Tỷ trọng doanh thu theo kênh bán',
  'Khung giờ nào đông khách nhất?',
  'Lãi gộp theo nhóm sản phẩm',
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function LiveDemo() {
  const boxRef = useRef(null)
  const engine = useRef(null)
  const run = useRef(0)
  const interacted = useRef(false)
  const [status, setStatus] = useState('idle') // idle | loading-engine | typing-q | thinking | typing-sql | running | done | error
  const [question, setQuestion] = useState('')
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState(null) // { title, text, sql, chart }
  const [sqlShown, setSqlShown] = useState('')
  const [result, setResult] = useState(null) // { columns, rows, ms }
  const [view, setView] = useState('chart')
  const [engineMs, setEngineMs] = useState(null)
  const [inView, setInView] = useState(false)

  const loadEngine = useCallback(async () => {
    if (engine.current) return engine.current
    setStatus('loading-engine')
    const [db, assistant] = await Promise.all([import('@/engine/db'), import('@/engine/assistant')])
    const t = await db.getDB()
    setEngineMs(t.ms)
    engine.current = { ...db, ...assistant }
    return engine.current
  }, [])

  const play = useCallback(async (q, { typeQuestion = true } = {}) => {
    const id = ++run.current
    const alive = () => id === run.current
    setResult(null); setAnswer(null); setSqlShown('')
    try {
      const e = await loadEngine()
      if (!alive()) return
      if (typeQuestion) {
        setStatus('typing-q')
        for (let i = 1; i <= q.length; i++) { if (!alive()) return; setQuestion(q.slice(0, i)); await sleep(22) }
      } else setQuestion(q)
      setStatus('thinking')
      await sleep(550)
      if (!alive()) return
      const a = e.ask(q)
      if (a.type !== 'sql') { setAnswer(a); setStatus('done'); return }
      setAnswer(a)
      setStatus('typing-sql')
      const sql = a.sql
      for (let i = 0; i <= sql.length; i += 4) { if (!alive()) return; setSqlShown(sql.slice(0, i)); await sleep(9) }
      setSqlShown(sql)
      setStatus('running')
      await sleep(250)
      const r = await e.runSQL(sql, { silent: true, maxRows: 500 })
      if (!alive()) return
      const last = r.results[r.results.length - 1]
      if (last.error) { setStatus('error'); setResult({ error: last.error }); return }
      setResult({ columns: last.columns, rows: last.rows, ms: last.ms, rowCount: last.rowCount })
      setView(a.chart ? 'chart' : 'table')
      setStatus('done')
    } catch (err) {
      if (alive()) { setStatus('error'); setResult({ error: 'Không tải được động cơ SQL trên trình duyệt này.' }) }
    }
  }, [loadEngine])

  // Tự chạy khi cuộn tới; tự đổi câu hỏi cho tới khi người xem tương tác
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(([en]) => setInView(en.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const started = useRef(false)
  useEffect(() => {
    if (inView && !started.current) { started.current = true; play(CHIPS[0]) }
  }, [inView, play])
  const cycle = useRef(1)
  useEffect(() => {
    if (status !== 'done' || interacted.current || !inView) return
    const t = setTimeout(() => { if (!interacted.current) play(CHIPS[cycle.current++ % CHIPS.length]) }, 7000)
    return () => clearTimeout(t)
  }, [status, inView, play])

  const askOwn = (q) => {
    const text = (q ?? input).trim()
    if (!text) return
    interacted.current = true
    setInput('')
    play(text, { typeQuestion: false })
  }
  const busy = ['loading-engine', 'typing-q', 'thinking', 'typing-sql', 'running'].includes(status)

  return (
    <div ref={boxRef} className="relative">
      {/* Cửa sổ ứng dụng */}
      <div className="relative rounded-2xl border border-line bg-surface shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 h-11 px-4 border-b border-line bg-subtle/60">
          <span className="flex gap-1.5"><span className="size-3 rounded-full bg-[#ff6159]" /><span className="size-3 rounded-full bg-[#ffbd2e]" /><span className="size-3 rounded-full bg-[#28c840]" /></span>
          <span className="flex-1 text-center text-[12.5px] font-[600] text-dim truncate">Lạc Việt Data · Hỏi dữ liệu</span>
          <span className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-pos font-[600]"><span className="size-1.5 rounded-full bg-pos animate-pulse" />Chạy thật</span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] min-h-[440px]">
          {/* Hội thoại */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-line">
            <div className="flex-1 p-4 sm:p-5 flex flex-col gap-4">
              {question ? (
                <div className="self-end max-w-[92%] rounded-2xl rounded-br-md bg-brand-500 text-white px-4 py-2.5 text-[14px] leading-relaxed">
                  {question}{status === 'typing-q' && <span className="inline-block w-[2px] h-[1em] bg-white/80 align-[-2px] ml-0.5 animate-blink" />}
                </div>
              ) : (
                <div className="text-muted text-[13.5px] py-6 text-center">{status === 'loading-engine' ? 'Đang khởi động động cơ dữ liệu…' : 'Chọn một câu hỏi bên dưới hoặc tự gõ câu hỏi của bạn.'}</div>
              )}
              {(status === 'thinking' || answer) && (
                <div className="flex gap-2.5 max-w-[96%]">
                  <span className="size-7 shrink-0 rounded-lg bg-brand-50 grid place-items-center"><LogoMark size={18} /></span>
                  <div className="text-[13.5px] leading-relaxed text-dim pt-0.5">
                    {status === 'thinking' ? (
                      <span className="inline-flex items-center gap-2 text-muted"><Loader2 size={14} className="animate-spin" />Tinh Ý đang đọc lược đồ dữ liệu…</span>
                    ) : answer && (
                      <>
                        {answer.title && <div className="font-[650] text-fg mb-1">{answer.title}</div>}
                        <div>{answer.text}</div>
                        {answer.suggestions && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {answer.suggestions.map((s) => <button key={s} onClick={() => askOwn(s)} className="rounded-full border border-line px-2.5 py-1 text-[12px] hover:border-brand-300 hover:text-brand-ink">{s}</button>)}
                          </div>
                        )}
                        {result && !result.error && (
                          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                            <span className="inline-flex items-center gap-1"><Timer size={13} />{result.ms} ms</span>
                            <span className="inline-flex items-center gap-1"><Table2 size={13} />{valueLabel(result.rowCount)} dòng</span>
                            <span className="inline-flex items-center gap-1"><Cpu size={13} />Trình duyệt của bạn</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 border-t border-line">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {CHIPS.map((c) => (
                  <button key={c} onClick={() => askOwn(c)} disabled={busy}
                    className="shrink-0 rounded-full border border-line bg-surface px-3 h-8 text-[12.5px] text-dim hover:border-brand-300 hover:text-brand-ink disabled:opacity-50 whitespace-nowrap">
                    {c}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); askOwn() }} className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface pl-3 pr-1.5 h-11 focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100">
                <Sparkles size={16} className="text-brand-ink shrink-0" />
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về doanh thu, món, cửa hàng, khách hàng…" className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px]" />
                <button type="submit" disabled={!input.trim() || busy} aria-label="Gửi câu hỏi"
                  className="size-8 rounded-lg bg-brand-500 text-white grid place-items-center disabled:opacity-40"><ArrowUp size={16} /></button>
              </form>
            </div>
          </div>

          {/* SQL + kết quả */}
          <div className="flex flex-col min-w-0 bg-canvas/40">
            <div className="flex items-center justify-between px-4 h-10 border-b border-line text-[12px]">
              <span className="font-[600] text-dim inline-flex items-center gap-1.5"><Database size={13} />SQL do Tinh Ý viết</span>
              <span className={cn('inline-flex items-center gap-1.5', status === 'running' ? 'text-brand-ink' : status === 'done' ? 'text-pos' : 'text-faint')}>
                {status === 'running' ? <><Loader2 size={12} className="animate-spin" />Đang chạy</> : status === 'done' && result ? <><Play size={11} />Đã chạy xong</> : status === 'typing-sql' ? 'Đang viết…' : 'PHO_NUI_DB.BAN_HANG'}
              </span>
            </div>
            <div className="px-4 py-3 max-h-[200px] min-h-[120px] overflow-auto border-b border-line bg-[var(--c-code-bg)]">
              {sqlShown ? <SqlCode sql={sqlShown} caret={status === 'typing-sql'} /> : <div className="text-faint text-[12.5px] font-mono">-- SQL sẽ hiện ở đây</div>}
            </div>
            <div className="flex-1 p-4 min-h-[240px] flex flex-col">
              {result?.error ? (
                <div className="m-auto text-center text-[13px] text-neg max-w-xs">{result.error}</div>
              ) : result ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12.5px] text-muted">Kết quả thật từ ~14.000 đơn hàng mẫu</div>
                    <div className="inline-flex rounded-lg bg-subtle p-0.5">
                      {[['chart', BarChart3, 'Biểu đồ'], ['table', Table2, 'Bảng']].map(([v, Icon, l]) => (
                        <button key={v} onClick={() => setView(v)} className={cn('h-7 px-2.5 rounded-md text-[12px] inline-flex items-center gap-1.5', view === v ? 'bg-surface shadow-xs text-fg font-[600]' : 'text-muted')}><Icon size={13} />{l}</button>
                      ))}
                    </div>
                  </div>
                  {view === 'chart' ? (
                    <div className="animate-fade-in"><ResultChart columns={result.columns} rows={result.rows} spec={answer?.chart} height={230} /></div>
                  ) : (
                    <div className="overflow-auto max-h-[250px] rounded-lg border border-line animate-fade-in">
                      <table className="w-full text-[12.5px]">
                        <thead className="sticky top-0 bg-surface"><tr>{result.columns.map((c) => <th key={c} className="text-left px-3 h-8 border-b border-line font-[600] whitespace-nowrap">{c}</th>)}</tr></thead>
                        <tbody>
                          {result.rows.slice(0, 30).map((r, i) => (
                            <tr key={i} className="border-b border-line last:border-0">
                              {r.map((v, j) => <td key={j} className={cn('px-3 h-8 whitespace-nowrap max-w-[260px] truncate', typeof v === 'number' && 'text-right num')}>{v == null ? <span className="text-faint">NULL</span> : typeof v === 'number' ? valueLabel(v) : String(v)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="m-auto flex flex-col items-center gap-3 text-faint text-[13px]">
                  {busy ? <Loader2 size={22} className="animate-spin text-brand-400" /> : <BarChart3 size={26} />}
                  {status === 'loading-engine' ? 'Đang tải động cơ SQL (WebAssembly)…' : busy ? 'Đang chuẩn bị kết quả…' : 'Biểu đồ sẽ hiện ở đây'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5"><Cpu size={14} className="text-brand-ink" />Chạy thật ngay trên trình duyệt của bạn — không gửi dữ liệu đi đâu</span>
        {engineMs != null && <span className="inline-flex items-center gap-1.5"><Timer size={14} />Nạp 8 bảng mẫu trong {engineMs} ms</span>}
        {status === 'done' && interacted.current === false && <button onClick={() => { interacted.current = true; play(question, { typeQuestion: false }) }} className="inline-flex items-center gap-1 hover:text-fg"><RotateCcw size={13} />Chạy lại</button>}
      </div>
    </div>
  )
}
