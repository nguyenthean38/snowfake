import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, BellRing, MoreHorizontal, Pause, Play, Zap, Trash2, X, Activity, Gauge, ShieldCheck, Check } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, IconButton, Input, Textarea, Select, Checkbox, Badge, SearchInput, Table, THead, Th, Tr, Td, Popover, Menu, EmptyState, Confirm,
} from '@/components/ui'
import { FlowShell } from '@/components/ui/Overlay'
import { useApp, useAuth, toast, uid } from '@/store'
import { formatDateTime } from '@/lib/format'
import { ago } from '@/features/monitor/shared'
import { cn } from '@/lib/cn'

const TEMPLATES = [
  { id: 'anomaly', label: 'Phát hiện bất thường', icon: Activity, desc: 'Tự học mức bình thường của chỉ số và báo khi lệch đột ngột', metric: 'TIN_DUNG_SU_DUNG', category: 'Chi phí' },
  { id: 'threshold', label: 'Vượt ngưỡng', icon: Gauge, desc: 'Báo khi chỉ số lớn hơn hoặc nhỏ hơn một giá trị cố định', metric: 'TY_LE_DON_HUY', category: 'Vận hành' },
  { id: 'quality', label: 'Chất lượng dữ liệu', icon: ShieldCheck, desc: 'Báo khi bảng chậm cập nhật, thiếu dòng hoặc có giá trị rỗng bất thường', metric: 'DO_TRE_DU_LIEU_PHUT', category: 'Chất lượng dữ liệu' },
]
const STEPS = ['Chọn mẫu', 'Cấu hình']

function Recipients({ value, onChange }) {
  const [v, setV] = useState('')
  const add = () => {
    const e = v.trim()
    if (!e) return
    if (!/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(e)) { toast({ title: 'Email chưa hợp lệ', tone: 'neg' }); return }
    if (!value.includes(e)) onChange([...value, e])
    setV('')
  }
  return (
    <div>
      <div className="text-[13px] font-[550] text-dim mb-1.5">Người nhận</div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-2 py-1.5 min-h-10 focus-within:border-brand-400">
        {value.map((e) => (
          <span key={e} className="inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-ink px-2 h-6 text-[12.5px]">
            {e}<button onClick={() => onChange(value.filter((x) => x !== e))} aria-label={`Bỏ ${e}`}><X size={12} /></button>
          </span>
        ))}
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }} onBlur={add}
          placeholder={value.length ? '' : 'Nhập email rồi bấm Enter'} className="flex-1 min-w-[160px] bg-transparent outline-none text-[13.5px] h-7" />
      </div>
    </div>
  )
}

function CreateAlert({ open, onClose }) {
  const user = useAuth((s) => s.user)
  const { upsert, warehouses } = useApp()
  const [step, setStep] = useState(0)
  const [f, setF] = useState(null)
  useEffect(() => {
    if (open) {
      setStep(0)
      setF({ template: 'anomaly', metric: 'TIN_DUNG_SU_DUNG', scope: 'Tài khoản', notify: 'Email', recipients: [user.email], name: '', desc: '', location: 'PHO_NUI_DB.PUBLIC', compute: 'Không máy chủ', every: 1, unit: 'giờ', active: true, threshold: 5, op: '>' })
    }
  }, [open, user.email])
  if (!open || !f) return null
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const tpl = TEMPLATES.find((t) => t.id === f.template)
  const valid0 = f.metric && f.recipients.length
  const valid1 = /^[A-Za-z_][\w]*$/.test(f.name)
  const condition = f.template === 'threshold' ? `${f.metric} ${f.op} ${f.threshold}` : f.template === 'quality' ? `${f.metric} > ${f.threshold}` : `${f.metric} lệch khỏi khoảng dự báo 95%`
  const create = () => {
    upsert('alerts', {
      id: uid('al'), name: f.name.toUpperCase(), state: f.active ? 'Đang bật' : 'Tạm dừng', schedule: `Mỗi ${f.every} ${f.unit}`,
      condition, action: `${f.notify} tới ${f.recipients.join(', ')}`, lastRun: null, lastResult: 'Chưa chạy', category: tpl.category,
      desc: f.desc, location: f.location, compute: f.compute, created: new Date().toISOString(),
    })
    toast({ title: `Đã tạo cảnh báo ${f.name.toUpperCase()}`, desc: f.active ? `Lần kiểm tra đầu tiên sau ${f.every} ${f.unit}.` : 'Cảnh báo đang tạm dừng.' })
    onClose()
  }
  return (
    <FlowShell open onClose={onClose} title="Tạo cảnh báo" steps={STEPS} current={step} onBack={step ? () => setStep(0) : undefined}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Huỷ</Button>
        <div className="flex gap-2">
          {step > 0 && <Button onClick={() => setStep(0)}>Quay lại</Button>}
          {step === 0 ? <Button variant="primary" disabled={!valid0} onClick={() => setStep(1)}>Tiếp tục</Button> : <Button variant="primary" disabled={!valid1} onClick={create}>Tạo cảnh báo</Button>}
        </div>
      </>}>
      {step === 0 ? (
        <div className="flex flex-col gap-5">
          <div><h2 className="ds-h1">Chọn mẫu cảnh báo</h2><p className="text-muted mt-1">Lạc Việt Data sẽ chạy kiểm tra theo lịch và gửi thông báo khi điều kiện xảy ra.</p></div>
          <div className="grid gap-2">
            {TEMPLATES.map((t) => {
              const Icon = t.icon, on = f.template === t.id
              return (
                <button key={t.id} onClick={() => set({ template: t.id, metric: t.metric })} className={cn('flex items-start gap-3 rounded-xl border p-3.5 text-left transition', on ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-line-strong')}>
                  <span className={cn('size-9 rounded-lg grid place-items-center shrink-0', on ? 'bg-brand-500 text-white' : 'bg-subtle text-dim')}><Icon size={18} /></span>
                  <span className="flex-1"><span className="block font-[600]">{t.label}</span><span className="block ds-caption">{t.desc}</span></span>
                  {on && <Check size={18} className="text-brand-ink" />}
                </button>
              )
            })}
          </div>
          <Input label="Tên chỉ số" value={f.metric} onChange={(e) => set({ metric: e.target.value.toUpperCase().replace(/\s+/g, '_') })} hint="Cột hoặc biểu thức được theo dõi, ví dụ TIN_DUNG_SU_DUNG" />
          {f.template !== 'anomaly' && (
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <Select label="Điều kiện" value={f.op} onChange={(e) => set({ op: e.target.value })} options={['>', '>=', '<', '<=']} />
              <Input label="Ngưỡng" type="number" value={f.threshold} onChange={(e) => set({ threshold: e.target.value })} />
            </div>
          )}
          <Select label="Phạm vi" value={f.scope} onChange={(e) => set({ scope: e.target.value })} options={['Tài khoản', ...warehouses.map((w) => `Kho ${w.name}`), 'Bảng PHO_NUI_DB.BAN_HANG.DON_HANG']} />
          <Select label="Kênh thông báo" value={f.notify} onChange={(e) => set({ notify: e.target.value })} options={['Email', 'Webhook (Slack, Teams…)', 'Tin nhắn Zalo OA']} />
          <Recipients value={f.recipients} onChange={(v) => set({ recipients: v })} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div><h2 className="ds-h1">Cấu hình</h2><p className="text-muted mt-1">Đặt tên, nơi lưu và lịch kiểm tra cho cảnh báo.</p></div>
          <Input label="Tên cảnh báo" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })} placeholder="VD: CANH_BAO_DON_HUY_TANG"
            error={f.name && !valid1 ? 'Chỉ dùng chữ không dấu, số và dấu gạch dưới, không bắt đầu bằng số.' : undefined} />
          <Textarea label="Mô tả" optional value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder={`Theo dõi ${f.metric} và báo khi có bất thường.`} />
          <Select label="Vị trí lưu" value={f.location} onChange={(e) => set({ location: e.target.value })} options={['PHO_NUI_DB.PUBLIC', 'PHO_NUI_DB.BAN_HANG', 'PHO_NUI_DB.MARKETING']} />
          <Select label="Loại tính toán" value={f.compute} onChange={(e) => set({ compute: e.target.value })} options={['Không máy chủ', ...warehouses.map((w) => w.name)]} hint="Không máy chủ: Lạc Việt Data tự cấp tài nguyên, chỉ tính phí khi chạy." />
          <div>
            <div className="text-[13px] font-[550] text-dim mb-1.5">Lịch kiểm tra</div>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] text-muted">Mỗi</span>
              <Input type="number" min={1} value={f.every} onChange={(e) => set({ every: Math.max(1, +e.target.value || 1) })} className="w-20" />
              <Select value={f.unit} onChange={(e) => set({ unit: e.target.value })} options={['phút', 'giờ', 'ngày']} className="w-28" />
            </div>
          </div>
          <Checkbox checked={f.active} onChange={(v) => set({ active: v })} label="Kích hoạt ngay sau khi tạo" desc="Cảnh báo được tạo ở trạng thái tạm dừng nếu bỏ chọn." />
          <div className="rounded-xl bg-subtle border border-line p-4 text-[13px]">
            <div className="ds-label mb-2">Xem trước</div>
            <div className="font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">{`CREATE ALERT ${f.name || '<TEN>'}\n  SCHEDULE = '${f.every} ${f.unit}'\n  IF (${condition})\n  THEN GUI_THONG_BAO('${f.notify}', '${f.recipients.join(', ')}');`}</div>
          </div>
        </div>
      )}
    </FlowShell>
  )
}

export default function AlertsPage() {
  const { alerts, update, remove } = useApp()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(params.get('tao') === '1')
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [del, setDel] = useState(null)
  const [running, setRunning] = useState(null)
  const list = useMemo(() => alerts.filter((a) => (!state || a.state === state) && (!q || a.name.toLowerCase().includes(q.toLowerCase()))), [alerts, q, state])

  const patch = (id, p) => update('alerts', (l) => l.map((a) => (a.id === id ? { ...a, ...p } : a)))
  const runNow = (a) => {
    setRunning(a.id)
    setTimeout(() => {
      const fired = Math.random() < 0.35
      patch(a.id, { lastRun: new Date().toISOString(), lastResult: fired ? 'Đã kích hoạt' : 'Không kích hoạt' })
      setRunning(null)
      toast(fired ? { title: `${a.name} đã kích hoạt`, desc: `Đã gửi thông báo: ${a.action}`, tone: 'info' } : { title: `${a.name}: điều kiện chưa xảy ra`, desc: 'Không gửi thông báo.' })
    }, 1200)
  }

  return (
    <Page title="Cảnh báo" badge={<Badge tone="brand" size="sm">Xem trước</Badge>} desc="Tự động kiểm tra dữ liệu, chi phí và vận hành theo lịch — gửi email hoặc webhook khi có điều bất thường."
      actions={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Cảnh báo</Button>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm cảnh báo" className="w-full sm:w-64" />
        <Select size="sm" value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'Trạng thái: Tất cả' }, 'Đang bật', 'Tạm dừng']} className="w-44 [&>div]:h-9" />
        <span className="ds-caption self-center ml-auto">{list.length} cảnh báo</span>
      </div>
      <div className="card overflow-hidden">
        {!list.length ? (
          <EmptyState icon={BellRing} title="Chưa có cảnh báo nào" desc="Tạo cảnh báo để được báo khi chi phí tăng vọt hoặc dữ liệu chậm cập nhật." action={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo cảnh báo</Button>} />
        ) : (
          <Table minWidth={980}>
            <THead><Th>Tên</Th><Th>Trạng thái</Th><Th>Lịch</Th><Th>Điều kiện</Th><Th>Nhóm</Th><Th>Lần chạy gần nhất</Th><Th>Kết quả</Th><Th width={48} /></THead>
            <tbody>
              {list.map((a) => (
                <Tr key={a.id}>
                  <Td><div className="font-[600] font-mono text-[12.5px]">{a.name}</div><div className="ds-caption truncate max-w-[260px]">{a.action}</div></Td>
                  <Td><Badge size="sm" dot tone={a.state === 'Đang bật' ? 'pos' : 'neutral'}>{a.state}</Badge></Td>
                  <Td className="text-[13px] whitespace-nowrap">{a.schedule}</Td>
                  <Td className="text-[13px] max-w-[240px]"><span className="block truncate" title={a.condition}>{a.condition}</span></Td>
                  <Td className="text-[13px]">{a.category}</Td>
                  <Td className="text-[13px] whitespace-nowrap" title={a.lastRun ? formatDateTime(a.lastRun) : ''}>{running === a.id ? <span className="text-info">Đang chạy…</span> : a.lastRun ? ago(new Date(a.lastRun).getTime()) : '—'}</Td>
                  <Td><Badge size="sm" tone={a.lastResult === 'Đã kích hoạt' ? 'warn' : a.lastResult === 'Không kích hoạt' ? 'pos' : 'neutral'}>{a.lastResult}</Badge></Td>
                  <Td>
                    <Popover align="end" width={200} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác" size="sm" />}>
                      {(close) => <Menu onClose={close} items={[
                        a.state === 'Đang bật'
                          ? { label: 'Tạm dừng', icon: Pause, onClick: () => { patch(a.id, { state: 'Tạm dừng' }); toast(`Đã tạm dừng ${a.name}`) } }
                          : { label: 'Bật lại', icon: Play, onClick: () => { patch(a.id, { state: 'Đang bật' }); toast(`Đã bật ${a.name}`) } },
                        { label: 'Chạy ngay', icon: Zap, onClick: () => runNow(a) },
                        { divider: true },
                        { label: 'Xoá', icon: Trash2, danger: true, onClick: () => setDel(a) },
                      ]} />}
                    </Popover>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <CreateAlert open={creating} onClose={() => { setCreating(false); if (params.get('tao')) setParams({}, { replace: true }) }} />
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={`Xoá cảnh báo ${del?.name}?`} desc="Cảnh báo sẽ ngừng chạy và không thể khôi phục." confirmLabel="Xoá cảnh báo"
        onConfirm={() => { remove('alerts', del.id); toast(`Đã xoá ${del.name}`) }} />
    </Page>
  )
}
