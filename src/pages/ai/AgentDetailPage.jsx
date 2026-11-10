import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, History, Check, Circle, Sparkles, Plus, X, Database, Search, FileText, Mail, ShieldAlert, ShieldCheck,
  FlaskConical, Play, Loader2, RotateCcw, Trash2, MessagesSquare, Users, Target, Gauge, Palette,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useApp, toast } from '@/store'
import {
  Button, Badge, Tabs, Segmented, Input, Textarea, Toggle, RadioCards, Modal, Drawer, Popover, Menu, EmptyState,
  Progress, Callout, Select, FlowShell, Checkbox, ICONS, PICKABLE_ICONS, DynIcon, Confirm,
} from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui'
import { LineChart } from '@/components/charts'
import { seeded } from '@/lib/random'
import { TODAY, timeAgo, formatNumber, formatDateTime, formatPercent } from '@/lib/format'
import { Composer, MessageList, useAskRunner, Chip, BotAvatar } from '@/features/ai/ChatParts'
import { EVAL_SET, METRICS, scoreQuestion } from '@/features/ai/evals'
import { uid } from '@/store'

const COLORS = ['#5b46e5', '#0fb5c9', '#2fb57c', '#e0559b', '#f29d38', '#d6364f']
const TOOLS = [
  { key: 'Hỏi dữ liệu bán hàng', icon: Database, desc: 'Viết và chạy SQL trên PHO_NUI_DB (đơn hàng, cửa hàng, sản phẩm, khách hàng).' },
  { key: 'Tìm trong đánh giá khách hàng', icon: Search, desc: 'Tìm kiếm ngữ nghĩa trên bảng DANH_GIA bằng mô hình SEN-EMBED-VI.' },
  { key: 'Tra cứu tài liệu nội bộ', icon: FileText, desc: 'Quy trình vận hành, công thức pha chế, chính sách thành viên.' },
  { key: 'Gửi email', icon: Mail, desc: 'Gửi tóm tắt câu trả lời tới email trong tổ chức (cần quyền tích hợp email).' },
]
const EDITABLE = ['display', 'desc', 'color', 'icon', 'questions', 'instructions', 'style', 'tools', 'model']
const pick = (a) => Object.fromEntries(EDITABLE.map((k) => [k, a[k] ?? (k === 'questions' || k === 'tools' ? [] : k === 'style' ? 'Ngắn gọn' : '')]))

function readiness(a) {
  const items = [
    { key: 'desc', label: 'Viết mô tả cho tác tử', done: (a.desc || '').trim().length >= 20, tab: 'cau-hinh', sub: 'chung' },
    { key: 'ins', label: 'Thêm hướng dẫn trả lời', done: (a.instructions || '').trim().length >= 40, tab: 'cau-hinh', sub: 'huong-dan' },
    { key: 'tools', label: 'Kết nối ít nhất một công cụ', done: (a.tools || []).length > 0, tab: 'cau-hinh', sub: 'cong-cu' },
    { key: 'qs', label: 'Thêm 2 câu hỏi mẫu trở lên', done: (a.questions || []).length >= 2, tab: 'cau-hinh', sub: 'chung' },
    { key: 'access', label: 'Cấp quyền cho vai trò sử dụng', done: (a.access || []).filter((r) => r !== 'QUAN_TRI').length > 0, tab: 'quyen' },
    { key: 'eval', label: 'Chạy ít nhất một lượt đánh giá', done: (a.evals || []).length > 0, tab: 'danh-gia' },
  ]
  return { items, pct: Math.round((items.filter((i) => i.done).length / items.length) * 100) }
}

export default function AgentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { agents, upsert, remove } = useApp()
  const agent = agents.find((a) => a.id === id)
  const [draft, setDraft] = useState(() => (agent ? pick(agent) : null))
  const [publishOpen, setPublishOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => { if (agent) setDraft(pick(agent)) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const tab = params.get('tab') || 'tong-quan'
  const setTab = (t, sub) => { const p = new URLSearchParams(params); p.set('tab', t); sub ? p.set('muc', sub) : p.delete('muc'); setParams(p, { replace: true }) }
  const dirty = useMemo(() => agent && draft && JSON.stringify(pick(agent)) !== JSON.stringify(draft), [agent, draft])

  if (!agent || !draft) {
    return (
      <div className="p-10">
        <EmptyState title="Không tìm thấy tác tử" desc="Tác tử có thể đã bị xoá." action={<Button to="/ai/tac-tu" icon={ArrowLeft}>Về danh sách tác tử</Button>} />
      </div>
    )
  }
  const live = { ...agent, ...draft }
  const versions = agent.versions?.length ? agent.versions : agent.version ? Array.from({ length: agent.version }, (_, i) => ({ v: i + 1, at: new Date(new Date(agent.updated).getTime() - (agent.version - 1 - i) * 3 * 86400000).toISOString(), note: i === 0 ? 'Phiên bản đầu tiên' : '', alias: i === agent.version - 1 ? 'SAN_XUAT' : '', config: pick(agent) })) : []

  const save = (extra = {}) => {
    upsert('agents', { ...agent, ...draft, updated: new Date().toISOString(), readiness: readiness(live).pct, ...extra })
  }
  const publish = ({ note, alias }) => {
    const v = (agent.version || 0) + 1
    save({ status: 'Đã xuất bản', version: v, versions: [{ v, at: new Date().toISOString(), note, alias, config: { ...draft } }, ...versions] })
    setPublishOpen(false)
    toast({ title: `Phiên bản ${v} đã được xuất bản`, desc: alias ? `Bí danh ${alias} đang phục vụ người dùng.` : 'Đang phục vụ người dùng.' })
  }
  const Icon = ICONS[live.icon] || ICONS.Bot

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={() => navigate('/ai/tac-tu')} className="size-9 grid place-items-center rounded-lg hover:bg-hover text-muted shrink-0 mt-0.5" aria-label="Quay lại"><ArrowLeft size={18} /></button>
          <span className="size-11 rounded-xl grid place-items-center text-white shrink-0" style={{ background: live.color }}><Icon size={22} /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="ds-h1 truncate">{agent.name}</h1>
              <Badge tone={agent.status === 'Đã xuất bản' ? 'pos' : 'neutral'} dot>{agent.status}{agent.version ? ` · v${agent.version}` : ''}</Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap mt-1 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1"><Database size={13} />{agent.database}.{agent.schema}</span>
              <span>Cập nhật {timeAgo(agent.updated)}</span>
              <span>{live.display}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dirty && <span className="inline-flex items-center gap-1.5 text-[12.5px] text-warn mr-1"><span className="size-2 rounded-full bg-warn" />Có thay đổi chưa lưu</span>}
          <Button variant="ghost" icon={History} onClick={() => setHistoryOpen(true)}>Lịch sử phiên bản</Button>
          <Button variant="outline" disabled={!dirty} onClick={() => { save(); toast('Đã lưu bản nháp') }}>Lưu</Button>
          <Button variant="primary" onClick={() => setPublishOpen(true)}>Xuất bản</Button>
          <Popover align="end" width={200} trigger={(p) => <Button {...p} variant="ghost" className="px-2.5">⋯</Button>}>
            {(close) => <Menu onClose={close} items={[
              { label: 'Huỷ thay đổi', icon: RotateCcw, disabled: !dirty, onClick: () => setDraft(pick(agent)) },
              { label: 'Xoá tác tử', icon: Trash2, danger: true, onClick: () => setDeleting(true) },
            ]} />}
          </Popover>
        </div>
      </div>

      <Tabs value={tab} onChange={(t) => setTab(t)} className="mb-6" options={[
        { value: 'tong-quan', label: 'Tổng quan' }, { value: 'cau-hinh', label: 'Cấu hình' }, { value: 'quyen', label: 'Quyền truy cập', count: agent.access?.length },
        { value: 'danh-gia', label: 'Đánh giá', count: agent.evals?.length || undefined }, { value: 'xem-truoc', label: 'Xem trước' },
      ]} />

      {tab === 'tong-quan' && <Overview agent={live} stored={agent} onJump={setTab} />}
      {tab === 'cau-hinh' && <Config draft={draft} setDraft={setDraft} sub={params.get('muc') || 'chung'} setSub={(s) => setTab('cau-hinh', s)} />}
      {tab === 'quyen' && <Access agent={agent} />}
      {tab === 'danh-gia' && <Evaluations agent={agent} />}
      {tab === 'xem-truoc' && <Preview agent={live} />}

      <PublishModal open={publishOpen} onClose={() => setPublishOpen(false)} next={(agent.version || 0) + 1} onPublish={publish} />
      <Drawer open={historyOpen} onClose={() => setHistoryOpen(false)} title="Lịch sử phiên bản" width={420}>
        <div className="flex flex-col gap-2">
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <div className="flex items-center justify-between"><span className="font-[600]">Bản nháp</span>{dirty && <Badge size="sm" tone="warn">Chưa lưu</Badge>}</div>
            <div className="ds-caption mt-0.5">Chỉnh sửa trước khi xuất bản thành phiên bản mới</div>
          </div>
          {!versions.length && <p className="ds-caption px-1 py-3">Chưa có phiên bản nào được xuất bản.</p>}
          {versions.map((v) => (
            <div key={v.v} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-[600]">Phiên bản {v.v}</span>
                <span className="flex items-center gap-1.5">
                  {v.alias && <Badge size="sm" tone="pos">{v.alias}</Badge>}
                  <Popover align="end" width={200} trigger={(p) => <button {...p} className="size-7 grid place-items-center rounded-md hover:bg-hover text-muted">⋯</button>}>
                    {(close) => <Menu onClose={close} items={[{ label: 'Khôi phục vào bản nháp', icon: RotateCcw, onClick: () => { if (v.config) { setDraft({ ...pick(agent), ...v.config }); toast(`Đã khôi phục cấu hình phiên bản ${v.v} vào bản nháp`) } } }]} />}
                  </Popover>
                </span>
              </div>
              <div className="ds-caption mt-0.5">{formatDateTime(v.at)}</div>
              {v.note && <p className="text-[13px] text-dim mt-1.5">{v.note}</p>}
            </div>
          ))}
        </div>
      </Drawer>
      <Confirm open={deleting} onClose={() => setDeleting(false)} danger title="Xoá tác tử?" desc={`${agent.display} và toàn bộ phiên bản, lượt đánh giá sẽ bị xoá vĩnh viễn.`} confirmLabel="Xoá tác tử"
        onConfirm={() => { remove('agents', agent.id); toast('Đã xoá tác tử'); navigate('/ai/tac-tu') }} />
    </div>
  )
}

/* ---------------- Tổng quan ---------------- */
function Overview({ agent, stored, onJump }) {
  const { items, pct } = readiness(agent)
  const usage = useMemo(() => {
    const r = seeded(agent.name.length * 31 + (stored.sessions || 0))
    const base = (stored.sessions || 0) / 30
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(TODAY); d.setDate(d.getDate() - (6 - i))
      const s = Math.round(base * (0.6 + r.next() * 0.9))
      return { x: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, sessions: s, users: Math.max(0, Math.round(s * 0.4)) }
    })
  }, [agent.name, stored.sessions])
  const last = stored.evals?.[0]
  const totalS = usage.reduce((a, b) => a + b.sessions, 0)
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><Sparkles size={16} className="text-brand-ink" /><h3 className="ds-h3">Sẵn sàng cho người dùng</h3><Badge size="sm" tone="brand">Tinh Ý gợi ý</Badge></div>
              <p className="ds-caption mt-0.5">Hoàn thành các bước dưới đây để tác tử trả lời chính xác hơn.</p>
            </div>
            <div className="text-right shrink-0"><div className="text-[24px] font-[700] num leading-none">{pct}%</div><div className="ds-caption">hoàn thành</div></div>
          </div>
          <Progress value={pct} auto={false} className="mt-3" />
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {items.map((it) => (
              <li key={it.key} className="flex items-center gap-3 py-2.5">
                {it.done ? <span className="size-5 rounded-full bg-pos text-white grid place-items-center"><Check size={12} strokeWidth={3} /></span> : <Circle size={20} className="text-line-strong" />}
                <span className={cn('flex-1 text-[13.5px]', it.done && 'text-muted line-through decoration-faint')}>{it.label}</span>
                {!it.done && <Button size="xs" variant="outline" onClick={() => onJump(it.tab, it.sub)}>Làm ngay</Button>}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="ds-h3">Mức sử dụng 7 ngày qua</h3><span className="ds-caption">{formatNumber(totalS)} phiên</span></div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Kpi icon={MessagesSquare} label="Tổng phiên" value={formatNumber(totalS)} />
            <Kpi icon={Users} label="Người dùng hoạt động" value={formatNumber(Math.max(...usage.map((u) => u.users)))} />
            <Kpi icon={Target} label="Độ chính xác gần nhất" value={last ? formatPercent(last.avg.correct * 100) : '—'} />
          </div>
          <LineChart data={usage} height={220} series={[{ key: 'sessions', label: 'Phiên' }, { key: 'users', label: 'Người dùng' }]} />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${agent.color}, color-mix(in srgb, ${agent.color} 45%, #0fb5c9))` }}>
          <Sparkles size={64} className="absolute -right-3 -top-3 opacity-20" />
          <h3 className="font-[700] text-[17px]">Dùng thử với Tinh Ý</h3>
          <p className="text-[13px] opacity-90 mt-1">Trò chuyện với {agent.display} bằng dữ liệu thật trước khi xuất bản.</p>
          <Button className="mt-4 bg-white text-fg hover:bg-white/90" icon={Play} onClick={() => onJump('xem-truoc')}>Mở xem trước</Button>
        </div>
        <div className="card p-5">
          <h3 className="ds-h3 mb-3">Thông tin</h3>
          <dl className="text-[13px] flex flex-col gap-2.5">
            {[['Tên hiển thị', agent.display], ['Mô hình', agent.model], ['Công cụ', `${agent.tools?.length || 0} công cụ`], ['Phong cách', agent.style || 'Ngắn gọn'], ['Vai trò được dùng', (stored.access || []).join(', ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-[550] truncate">{v}</dd></div>
            ))}
          </dl>
          {agent.desc && <p className="ds-caption mt-3 pt-3 border-t border-line">{agent.desc}</p>}
        </div>
      </div>
    </div>
  )
}
function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[12px] text-muted truncate"><Icon size={13} />{label}</div>
      <div className="text-[20px] font-[650] num mt-0.5">{value}</div>
    </div>
  )
}

/* ---------------- Cấu hình ---------------- */
function Config({ draft, setDraft, sub, setSub }) {
  const models = useApp((s) => s.models).filter((m) => m.kind === 'Sinh văn bản')
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const [q, setQ] = useState('')
  const Icon = ICONS[draft.icon] || ICONS.Bot
  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <div className="lg:hidden">
        <Segmented value={sub} onChange={setSub} size="sm" options={[{ value: 'chung', label: 'Chung' }, { value: 'huong-dan', label: 'Hướng dẫn' }, { value: 'cong-cu', label: 'Công cụ' }, { value: 'mo-hinh', label: 'Mô hình' }]} />
      </div>
      <nav className="hidden lg:flex flex-col gap-0.5">
        {[['chung', 'Chung'], ['huong-dan', 'Hướng dẫn'], ['cong-cu', 'Công cụ'], ['mo-hinh', 'Mô hình']].map(([v, l]) => (
          <button key={v} onClick={() => setSub(v)} className={cn('text-left rounded-lg px-3 h-9 text-[13.5px]', sub === v ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-dim hover:bg-hover')}>{l}</button>
        ))}
      </nav>
      <div className="card p-5 sm:p-6 min-w-0">
        {sub === 'chung' && (
          <div className="flex flex-col gap-5 max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="ds-h3">Chung</h3><p className="ds-caption">Hiển thị cho người dùng, không ảnh hưởng tới cách tác tử trả lời.</p></div>
              <Popover align="end" width={280} trigger={(p) => (
                <button {...p} className="size-12 rounded-xl grid place-items-center text-white shrink-0 ring-offset-2 hover:ring-2 ring-brand-300" style={{ background: draft.color }} title="Đổi màu và biểu tượng"><Icon size={22} /></button>
              )}>
                <div className="p-2">
                  <div className="ds-label mb-2 flex items-center gap-1"><Palette size={12} />Màu</div>
                  <div className="flex gap-2 mb-3">
                    {COLORS.map((c) => <button key={c} onClick={() => set({ color: c })} className={cn('size-7 rounded-full ring-offset-2 ring-offset-surface', draft.color === c && 'ring-2 ring-fg')} style={{ background: c }} aria-label={c} />)}
                  </div>
                  <div className="ds-label mb-2">Biểu tượng</div>
                  <div className="grid grid-cols-6 gap-1">
                    {PICKABLE_ICONS.map((n) => (
                      <button key={n} onClick={() => set({ icon: n })} className={cn('size-9 grid place-items-center rounded-lg', draft.icon === n ? 'bg-brand-50 text-brand-ink ring-1 ring-brand-300' : 'text-muted hover:bg-hover')}><DynIcon name={n} size={17} /></button>
                    ))}
                  </div>
                </div>
              </Popover>
            </div>
            <Input label="Tên hiển thị" value={draft.display} onChange={(e) => set({ display: e.target.value })} />
            <Textarea label="Mô tả" rows={3} value={draft.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Giới thiệu tác tử làm được gì, dành cho ai." hint="Hiển thị cho người dùng khi chọn tác tử." />
            <div>
              <div className="text-[13px] font-[550] text-dim mb-1.5">Câu hỏi mẫu <span className="font-normal text-faint">(tối đa 10)</span></div>
              <div className="flex flex-col gap-2">
                {draft.questions.map((x, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="flex-1" value={x} onChange={(e) => set({ questions: draft.questions.map((y, j) => (j === i ? e.target.value : y)) })} />
                    <button onClick={() => set({ questions: draft.questions.filter((_, j) => j !== i) })} className="size-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-neg" aria-label="Xoá câu hỏi"><X size={16} /></button>
                  </div>
                ))}
                {draft.questions.length < 10 && (
                  <div className="flex items-center gap-2">
                    <Input className="flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="vd: Hôm qua cửa hàng nào bán tốt nhất?"
                      onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { set({ questions: [...draft.questions, q.trim()] }); setQ('') } }} />
                    <Button icon={Plus} disabled={!q.trim()} onClick={() => { set({ questions: [...draft.questions, q.trim()] }); setQ('') }}>Thêm</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {sub === 'huong-dan' && (
          <div className="flex flex-col gap-5 max-w-2xl">
            <div><h3 className="ds-h3">Hướng dẫn</h3><p className="ds-caption">Quy tắc tác tử luôn tuân theo khi trả lời.</p></div>
            <Textarea label="Hướng dẫn trả lời" rows={8} value={draft.instructions} onChange={(e) => set({ instructions: e.target.value })}
              hint={`${draft.instructions.length} ký tự · Nêu vai trò, phạm vi dữ liệu, điều không được làm.`} />
            <div>
              <div className="text-[13px] font-[550] text-dim mb-1.5">Phong cách trả lời</div>
              <RadioCards columns={3} value={draft.style || 'Ngắn gọn'} onChange={(v) => set({ style: v })} options={[
                { value: 'Ngắn gọn', label: 'Ngắn gọn', desc: '1–2 câu kèm số liệu chính' },
                { value: 'Chi tiết', label: 'Chi tiết', desc: 'Giải thích cách tính, bối cảnh' },
                { value: 'Gạch đầu dòng', label: 'Gạch đầu dòng', desc: 'Dễ đọc trên điện thoại' },
              ]} />
            </div>
          </div>
        )}
        {sub === 'cong-cu' && (
          <div className="flex flex-col gap-1 max-w-2xl">
            <h3 className="ds-h3">Công cụ</h3>
            <p className="ds-caption mb-3">Tác tử tự chọn công cụ phù hợp với từng câu hỏi.</p>
            {TOOLS.map((t) => {
              const on = draft.tools.includes(t.key)
              return (
                <div key={t.key} className="flex items-start gap-3 py-3 border-b border-line last:border-0">
                  <span className={cn('size-9 rounded-lg grid place-items-center shrink-0', on ? 'bg-brand-50 text-brand-ink' : 'bg-subtle text-muted')}><t.icon size={17} /></span>
                  <div className="flex-1 min-w-0"><div className="font-[550] text-[14px]">{t.key}</div><div className="ds-caption">{t.desc}</div></div>
                  <Toggle checked={on} aria-label={t.key} onChange={(v) => set({ tools: v ? [...draft.tools, t.key] : draft.tools.filter((x) => x !== t.key) })} />
                </div>
              )
            })}
          </div>
        )}
        {sub === 'mo-hinh' && (
          <div className="flex flex-col gap-4 max-w-2xl">
            <div><h3 className="ds-h3">Mô hình</h3><p className="ds-caption">Mô hình ngôn ngữ dùng để lập kế hoạch và viết câu trả lời.</p></div>
            <RadioCards value={draft.model} onChange={(v) => set({ model: v })} options={[
              { value: 'Tự động', label: 'Tự động (khuyến nghị)', desc: 'Lạc Việt Data chọn mô hình tốt nhất theo độ khó câu hỏi' },
              ...models.map((m) => ({ value: m.name, label: m.name, desc: m.desc })),
            ]} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- Quyền truy cập ---------------- */
function Access({ agent }) {
  const { roles, upsert } = useApp()
  const [grant, setGrant] = useState(null)
  const granted = agent.granted || ['QUAN_TRI']
  const access = agent.access || []
  const others = roles.filter((r) => !access.includes(r.name))
  const setAccess = (list, extra = {}) => upsert('agents', { ...agent, access: list, ...extra })
  const toolsLabel = (agent.tools || []).length
  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-line">
        <div><h3 className="ds-h3">Quyền truy cập</h3><p className="ds-caption">Chọn vai trò được xem và trò chuyện với tác tử này.</p></div>
        <Popover align="end" width={260} trigger={(p) => <Button {...p} icon={Plus} variant="outline" disabled={!others.length}>Thêm vai trò</Button>}>
          {(close) => <Menu onClose={close} items={others.map((r) => ({ label: r.name, desc: r.label, onClick: () => { setAccess([...access, r.name]); toast(`Đã thêm vai trò ${r.name}`) } }))} />}
        </Popover>
      </div>
      <ul className="divide-y divide-line">
        {access.map((r) => {
          const ok = granted.includes(r)
          return (
            <li key={r} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="size-9 rounded-lg bg-subtle grid place-items-center text-muted"><Users size={16} /></span>
                <div className="min-w-0">
                  <div className="font-[600] text-[13.5px]">{r}</div>
                  <div className="ds-caption">{roles.find((x) => x.name === r)?.label}</div>
                </div>
                {r === 'QUAN_TRI' && <Badge size="sm" tone="brand">Chủ sở hữu</Badge>}
              </div>
              {ok ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-pos"><ShieldCheck size={14} />Đủ quyền với mọi công cụ và nguồn dữ liệu</span>
              ) : (
                <span className="inline-flex items-center gap-2 text-[12.5px] text-warn"><ShieldAlert size={14} />Thiếu quyền trên {toolsLabel} công cụ
                  <Button size="xs" variant="outline" onClick={() => setGrant(r)}>Cấp toàn bộ quyền</Button>
                </span>
              )}
              {r !== 'QUAN_TRI' && (
                <button onClick={() => { setAccess(access.filter((x) => x !== r), { granted: granted.filter((x) => x !== r) }); toast(`Đã thu hồi quyền của ${r}`) }} className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-neg self-end sm:self-auto" title="Thu hồi"><X size={16} /></button>
              )}
            </li>
          )
        })}
      </ul>
      <Modal open={!!grant} onClose={() => setGrant(null)} title={`Cấp toàn bộ quyền cho ${toolsLabel} công cụ`} desc={`Vai trò ${grant} sẽ được cấp các quyền sau:`}
        footer={<><Button onClick={() => setGrant(null)}>Huỷ</Button><Button variant="primary" onClick={() => { setAccess(access, { granted: [...granted, grant] }); toast({ title: `Đã cấp quyền cho ${grant}` }); setGrant(null) }}>Cấp toàn bộ quyền</Button></>}>
        <pre className="rounded-xl bg-subtle border border-line p-3.5 text-[12.5px] font-mono overflow-x-auto leading-relaxed">{`-- Quyền dùng tác tử
GRANT USAGE ON AGENT ${agent.database}.${agent.schema}.${agent.name} TO ROLE ${grant};
-- Quyền trên nguồn dữ liệu
GRANT USAGE ON DATABASE ${agent.database} TO ROLE ${grant};
GRANT USAGE ON SCHEMA ${agent.database}.${agent.schema} TO ROLE ${grant};
GRANT SELECT ON ALL TABLES IN SCHEMA ${agent.database}.${agent.schema} TO ROLE ${grant};
-- Quyền dùng kho tính toán
GRANT USAGE ON WAREHOUSE KHO_AI TO ROLE ${grant};`}</pre>
      </Modal>
    </div>
  )
}

/* ---------------- Đánh giá ---------------- */
function Evaluations({ agent }) {
  const [wizard, setWizard] = useState(false)
  const [view, setView] = useState(null)
  const evals = agent.evals || []
  const run = evals.find((e) => e.id === view)
  if (run) return <EvalResult run={run} onBack={() => setView(null)} />
  return (
    <>
      {!evals.length ? (
        <div className="card">
          <EmptyState icon={FlaskConical} title="Chưa có lượt đánh giá nào" desc="Tạo lượt đánh giá đầu tiên để đo chất lượng câu trả lời của tác tử trên bộ câu hỏi mẫu."
            action={<Button variant="primary" icon={Plus} onClick={() => setWizard(true)}>Tạo lượt đánh giá</Button>} />
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-line">
            <div><h3 className="ds-h3">Lượt đánh giá</h3><p className="ds-caption">So sánh chất lượng giữa các phiên bản</p></div>
            <Button variant="primary" icon={Plus} onClick={() => setWizard(true)}>Tạo lượt đánh giá</Button>
          </div>
          <Table minWidth={680}>
            <THead><Th>Tên</Th><Th>Phiên bản</Th><Th align="right">Chính xác</Th><Th align="right">Chọn công cụ</Th><Th align="right">Nhất quán</Th><Th>Thời gian</Th></THead>
            <tbody>
              {evals.map((e) => (
                <Tr key={e.id} onClick={() => setView(e.id)}>
                  <Td className="font-[600]">{e.name}</Td><Td>{e.version}</Td>
                  {['correct', 'tool', 'consistent'].map((k) => <Td key={k} align="right" className="num">{e.avg[k] != null ? formatPercent(e.avg[k] * 100) : '—'}</Td>)}
                  <Td className="text-muted">{timeAgo(e.at)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {wizard && <EvalWizard agent={agent} onClose={() => setWizard(false)} onDone={(id) => { setWizard(false); setView(id) }} />}
    </>
  )
}

function EvalWizard({ agent, onClose, onDone }) {
  const upsert = useApp((s) => s.upsert)
  const [step, setStep] = useState(0)
  const [name, setName] = useState(`danh_gia_${(agent.evals?.length || 0) + 1}`)
  const [desc, setDesc] = useState('Đánh giá cơ sở về độ chính xác và khả năng chọn công cụ.')
  const [version, setVersion] = useState(agent.version ? `Phiên bản ${agent.version}` : 'Bản nháp')
  const [dataset, setDataset] = useState('mau')
  const [metrics, setMetrics] = useState({ correct: true, tool: true, consistent: false })
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])
  const running = step === 3 && progress < EVAL_SET.length

  useEffect(() => {
    if (step !== 3) return
    let i = 0
    const seed = Date.now() % 1000
    const out = []
    const t = setInterval(() => {
      out.push(scoreQuestion(EVAL_SET[i], i, seed))
      i++
      setResults([...out]); setProgress(i)
      if (i >= EVAL_SET.length) clearInterval(t)
    }, 520)
    return () => clearInterval(t)
  }, [step])

  const finish = () => {
    const avg = Object.fromEntries(METRICS.map((m) => [m.key, metrics[m.key] ? results.reduce((s, r) => s + r[m.key], 0) / results.length : null]))
    const e = { id: uid('ev'), name, desc, version, at: new Date().toISOString(), metrics, avg, results }
    upsert('agents', { ...agent, evals: [e, ...(agent.evals || [])] })
    toast({ title: 'Đã lưu lượt đánh giá', desc: `Độ chính xác trung bình ${formatPercent((avg.correct ?? 0) * 100)}` })
    onDone(e.id)
  }
  const steps = ['Thông tin lượt đánh giá', 'Chọn bộ dữ liệu', 'Chọn chỉ số', 'Chạy đánh giá']
  const canNext = [name.trim(), dataset, Object.values(metrics).some(Boolean), !running][step]
  return (
    <FlowShell title="Lượt đánh giá mới" steps={steps} current={step} onClose={onClose} onBack={step > 0 && step < 3 ? () => setStep(step - 1) : undefined}
      footer={<>
        <Button onClick={onClose}>Huỷ</Button>
        {step < 2 && <Button variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
        {step === 2 && <Button variant="primary" icon={Play} disabled={!canNext} onClick={() => setStep(3)}>Chạy đánh giá</Button>}
        {step === 3 && <Button variant="primary" disabled={running} onClick={finish}>{running ? 'Đang chạy…' : 'Xem kết quả'}</Button>}
      </>}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Thông tin lượt đánh giá</h2><p className="text-muted mt-1">Đo chất lượng câu trả lời để biết nên cải thiện ở đâu.</p></div>
          <Input label="Tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Mô tả" optional rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Select label="Phiên bản tác tử" value={version} onChange={(e) => setVersion(e.target.value)} options={['Bản nháp', ...Array.from({ length: agent.version || 0 }, (_, i) => `Phiên bản ${agent.version - i}`)]} />
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Chọn bộ dữ liệu đánh giá</h2><p className="text-muted mt-1">Gồm câu hỏi và đáp án mong đợi.</p></div>
          <RadioCards value={dataset} onChange={setDataset} options={[
            { value: 'mau', label: 'Bộ câu hỏi mẫu Phố Núi', desc: `${EVAL_SET.length} câu hỏi về doanh thu, sản phẩm, khách hàng, đánh giá` },
            { value: 'cau-hoi-mau', label: 'Từ câu hỏi mẫu của tác tử', desc: `${agent.questions?.length || 0} câu hỏi (chưa có đáp án — chỉ chấm chọn công cụ)` },
          ]} />
          <div className="rounded-xl border border-line overflow-hidden">
            <div className="px-3 py-2 bg-subtle ds-label">Xem trước dữ liệu</div>
            <ul className="divide-y divide-line text-[13px]">
              {EVAL_SET.map((e, i) => <li key={i} className="grid grid-cols-[24px_1fr_1fr] gap-3 px-3 py-2"><span className="text-faint num">{i + 1}</span><span>{e.q}</span><span className="text-muted">{e.answer}</span></li>)}
            </ul>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Chọn chỉ số</h2><p className="text-muted mt-1">Mỗi chỉ số được một mô hình giám khảo chấm từ 0 đến 1.</p></div>
          <div className="card divide-y divide-line">
            {METRICS.map((m) => <div key={m.key} className="p-4"><Toggle label={m.label} desc={m.desc} checked={metrics[m.key]} onChange={(v) => setMetrics({ ...metrics, [m.key]: v })} /></div>)}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">{running ? 'Đang chạy đánh giá…' : 'Đánh giá hoàn tất'}</h2><p className="text-muted mt-1">{progress}/{EVAL_SET.length} câu hỏi · {version}</p></div>
          <Progress value={progress} max={EVAL_SET.length} auto={false} />
          <ul className="flex flex-col gap-2">
            {EVAL_SET.map((e, i) => {
              const r = results[i]
              return (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-[13px]">
                  {r ? <Check size={16} className="text-pos" /> : i === progress ? <Loader2 size={16} className="animate-spin text-brand-ink" /> : <Circle size={16} className="text-line-strong" />}
                  <span className="flex-1 min-w-0 truncate">{e.q}</span>
                  {r && <Badge size="sm" tone={r.correct >= 0.8 ? 'pos' : r.correct >= 0.5 ? 'warn' : 'neg'}>{formatPercent(r.correct * 100, 0)}</Badge>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </FlowShell>
  )
}

function EvalResult({ run, onBack }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>Tất cả lượt đánh giá</Button>
        <span className="text-faint">/</span><span className="font-[600]">{run.name}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {METRICS.map((m) => (
          <div key={m.key} className="card p-4">
            <div className="flex items-center gap-1.5 text-[12.5px] text-muted"><Gauge size={14} />{m.label}</div>
            <div className="text-[26px] font-[700] num mt-1">{run.avg[m.key] != null ? formatPercent(run.avg[m.key] * 100) : '—'}</div>
            {run.avg[m.key] != null && <Progress value={run.avg[m.key] * 100} auto={false} tone={run.avg[m.key] >= 0.8 ? 'pos' : 'warn'} className="mt-2" />}
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={820}>
          <THead><Th>#</Th><Th>Câu hỏi</Th><Th>Đáp án mong đợi</Th><Th>Tác tử trả lời</Th><Th align="right">Chính xác</Th><Th align="right">Công cụ</Th><Th align="right">Thời gian</Th></THead>
          <tbody>
            {run.results.map((r, i) => (
              <Tr key={i}>
                <Td className="text-faint num">{i + 1}</Td>
                <Td className="max-w-[220px]"><span className="line-clamp-2">{r.q}</span></Td>
                <Td className="text-muted max-w-[200px]"><span className="line-clamp-2">{r.expect}</span></Td>
                <Td className="max-w-[220px]"><span className="line-clamp-2">{r.got}</span></Td>
                <Td align="right"><Badge size="sm" tone={r.correct >= 0.8 ? 'pos' : r.correct >= 0.5 ? 'warn' : 'neg'}>{formatPercent(r.correct * 100, 0)}</Badge></Td>
                <Td align="right" className="num">{formatPercent(r.tool * 100, 0)}</Td>
                <Td align="right" className="num text-muted">{(r.ms / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giây</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

/* ---------------- Xem trước ---------------- */
function Preview({ agent }) {
  const [messages, setMessages] = useState([])
  const runner = useAskRunner({ warehouse: 'KHO_AI', source: `Tác tử ${agent.name}` })
  const Icon = ICONS[agent.icon] || ICONS.Bot
  const bot = { color: agent.color, icon: Icon }
  const send = async (q) => {
    const userMsg = { id: uid('u'), role: 'user', text: q }
    const ans = await runner.run(q)
    if (ans) setMessages((m) => [...m, userMsg, ans])
  }
  return (
    <div className="card flex flex-col h-[calc(100dvh-260px)] min-h-[520px] overflow-hidden">
      <div className="flex items-center gap-3 px-5 h-14 border-b border-line shrink-0">
        <BotAvatar size={32} color={agent.color} icon={Icon} />
        <div className="min-w-0 flex-1"><div className="font-[650] truncate">{agent.display}</div><div className="ds-caption truncate">Xem trước · {agent.model} · {(agent.tools || []).length} công cụ</div></div>
        {messages.length > 0 && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setMessages([])}>Làm mới</Button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {!messages.length && !runner.pending ? (
          <div className="max-w-xl mx-auto text-center pt-6">
            <span className="inline-grid size-14 rounded-2xl place-items-center text-white mb-3" style={{ background: agent.color }}><Icon size={26} /></span>
            <h3 className="text-[22px] font-[700] tracking-tight">{agent.display}</h3>
            <p className="text-muted mt-1">{agent.desc || 'Hỏi tác tử bất kỳ câu hỏi nào về dữ liệu bán hàng.'}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {(agent.questions?.length ? agent.questions : ['Doanh thu theo tháng', 'Món nào bán chạy nhất?']).map((q) => <Chip key={q} onClick={() => send(q)}>{q}</Chip>)}
            </div>
          </div>
        ) : (
          <div className="max-w-[860px] mx-auto"><MessageList messages={messages} pending={runner.pending} warehouse="KHO_AI" onFollowup={send} bot={bot} /></div>
        )}
      </div>
      <div className="px-4 sm:px-6 pb-4 shrink-0"><div className="max-w-[860px] mx-auto"><Composer onSend={send} disabled={!!runner.pending} placeholder={`Hỏi ${agent.display}…`} /></div></div>
    </div>
  )
}

/* ---------------- Xuất bản ---------------- */
function PublishModal({ open, onClose, next, onPublish }) {
  const [note, setNote] = useState('')
  const [alias, setAlias] = useState('SAN_XUAT')
  const [useNow, setUseNow] = useState(true)
  useEffect(() => { if (open) { setNote(''); setAlias('SAN_XUAT'); setUseNow(true) } }, [open])
  return (
    <Modal open={open} onClose={onClose} title="Xuất bản" desc={`Tạo phiên bản ${next} từ bản nháp hiện tại.`} size="sm"
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => onPublish({ note, alias: useNow ? alias.trim().toUpperCase() : '' })}>Xuất bản</Button></>}>
      <div className="flex flex-col gap-4">
        <Checkbox checked={useNow} onChange={setUseNow} label="Dùng phiên bản này ngay" desc="Gắn bí danh để ứng dụng và người dùng nhận phiên bản mới." />
        <Textarea label="Ghi chú" optional rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mô tả ngắn thay đổi trong phiên bản này" />
        {useNow && <Input label="Bí danh" value={alias} onChange={(e) => setAlias(e.target.value)} hint="Ứng dụng gọi tác tử qua bí danh, không cần đổi mã khi có phiên bản mới." />}
      </div>
    </Modal>
  )
}
