import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ShieldAlert, Network, Plus, Radar, Tag, EyeOff, Rows3, Sigma, Link2, Columns3, CheckCircle2, AlertTriangle,
  Play, Trash2, Wand2,
} from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Tabs, Badge, Modal, Input, Textarea, Select, EmptyState, Progress, Toggle, Callout } from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui/Table'
import { LineChart } from '@/components/charts'
import { useApp, toast, uid } from '@/store'
import { SECURITY } from '@/data/platform'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { CodeBox, MetricCard, SEVERITY_TONE } from '@/features/admin/shared'

const NONE = []
const TABS = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'findings', label: 'Phát hiện' },
  { value: 'scanners', label: 'Trình quét' },
  { value: 'network', label: 'Chính sách mạng' },
  { value: 'protect', label: 'Gắn thẻ & bảo vệ dữ liệu' },
]

export default function SecurityPage() {
  const [tab, setTab] = useState('overview')
  const [netOpen, setNetOpen] = useState(false)
  const [maskOpen, setMaskOpen] = useState(false)
  return (
    <Page title="Trung tâm bảo mật" desc="Theo dõi tư thế bảo mật của tài khoản: xác thực mạnh, phát hiện rủi ro, chính sách mạng và bảo vệ dữ liệu nhạy cảm."
      actions={<Badge tone="brand">Kho: KHO_PHAN_TICH</Badge>}>
      <Tabs value={tab} onChange={setTab} options={TABS} className="mb-6" />
      {tab === 'overview' && <Overview onTab={setTab} onNetwork={() => setNetOpen(true)} />}
      {tab === 'findings' && <Findings onNetwork={() => setNetOpen(true)} />}
      {tab === 'scanners' && <Scanners />}
      {tab === 'network' && <NetworkPolicies onCreate={() => setNetOpen(true)} />}
      {tab === 'protect' && <Protection onMask={() => setMaskOpen(true)} />}
      <NetworkPolicyModal open={netOpen} onClose={() => setNetOpen(false)} />
      <MaskingModal open={maskOpen} onClose={() => setMaskOpen(false)} />
    </Page>
  )
}

function useFindings() {
  const { users, update } = useApp()
  const policies = useApp((s) => s.networkPolicies || NONE)
  const resolved = useApp((s) => s.resolvedFindings || NONE)
  const noMfa = users.filter((u) => !u.mfa && u.type !== 'Dịch vụ' && u.status !== 'Bị khoá').length
  const list = SECURITY.findings.map((f) => {
    if (f.id === 's1') return { ...f, title: `${noMfa} người dùng chưa bật xác thực đa yếu tố`, open: noMfa > 0 }
    if (f.id === 's2') return { ...f, open: !policies.length }
    return { ...f, open: !resolved.includes(f.id) }
  })
  return { list, noMfa, resolve: (id) => update('resolvedFindings', (l = []) => [...(l || []), id]) }
}

/* ---------------- Tổng quan ---------------- */
function Overview({ onTab, onNetwork }) {
  const { users } = useApp()
  const navigate = useNavigate()
  const { list, noMfa } = useFindings()
  const policiesCount = useApp((s) => (s.networkPolicies || []).length)
  const humans = users.filter((u) => u.type !== 'Dịch vụ')
  const ready = humans.length - noMfa
  const open = list.filter((f) => f.open)
  const bySev = ['Cao', 'Trung bình', 'Thấp'].map((s) => [s, open.filter((f) => f.severity === s).length])
  const trend = useMemo(() => ['27/10', '28/10', '29/10', '30/10', '31/10', '1/11', '2/11', '3/11', '4/11', '5/11', '6/11', '7/11', '8/11', '9/11', '10/11']
    .map((x, i) => ({ x, Cao: i < 6 ? 2 : open.filter((f) => f.severity === 'Cao').length, 'Trung bình': i < 3 ? 2 : open.filter((f) => f.severity === 'Trung bình').length, Thấp: open.filter((f) => f.severity === 'Thấp').length })), [open])
  const phases = [
    { name: 'Giai đoạn 1', date: '01/09/2026', desc: 'Cảnh báo người dùng mới chưa có MFA', done: true },
    { name: 'Giai đoạn 2', date: '01/12/2026', desc: 'Người dùng mới bắt buộc bật MFA', current: true },
    { name: 'Giai đoạn 3', date: SECURITY.enforceDate, desc: 'Mọi người dùng là con người bắt buộc MFA' },
  ]
  return (
    <div className="flex flex-col gap-5">
      <h2 className="ds-h2">Phát hiện về xác thực mạnh</h2>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="ds-h3">Tiến độ xác thực mạnh</h3>
              <p className="ds-caption mt-0.5 max-w-md">Đăng nhập chỉ bằng mật khẩu sẽ bị ngừng hỗ trợ. Để tránh gián đoạn, 100% người dùng phải dùng xác thực mạnh.</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate('/quan-tri/nguoi-dung?loc=chua-mfa')}>Xem chi tiết</Button>
          </div>
          {noMfa > 0 && <div className="mt-4 flex items-center gap-2 text-[13px] text-neg font-[550]"><AlertTriangle size={15} /> Hãy xử lý những người dùng dưới đây để tài khoản sẵn sàng.</div>}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border-l-[3px] border-neg pl-3"><div className="text-[30px] font-[650] num">{noMfa}</div><div className="ds-caption">người dùng chưa sẵn sàng</div></div>
            <div className="border-l-[3px] border-pos pl-3"><div className="text-[30px] font-[650] num">{SECURITY.serviceNoKey}</div><div className="ds-caption">tài khoản dịch vụ chưa sẵn sàng</div></div>
          </div>
          <Progress value={ready} max={humans.length} tone="pos" className="mt-4" />
          <div className="ds-caption mt-1.5">{ready}/{humans.length} người dùng đã bật MFA</div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="ds-h3">Lộ trình bắt buộc</h3>
              <p className="ds-caption mt-0.5">Áp dụng cho mọi người dùng từ {SECURITY.enforceDate}, 09:00 (GMT+7).</p>
            </div>
          </div>
          <ol className="mt-4 flex flex-col gap-0">
            {phases.map((p, i) => (
              <li key={p.name} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn('size-6 rounded-full grid place-items-center text-[11px] font-[700] border-2', p.done ? 'bg-pos border-pos text-white' : p.current ? 'border-brand-500 text-brand-ink bg-brand-50' : 'border-line-strong text-faint')}>{p.done ? '✓' : i + 1}</span>
                  {i < phases.length - 1 && <span className="w-px flex-1 bg-line my-1 min-h-6" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2"><span className="text-[13.5px] font-[600]">{p.name}</span>{p.current && <Badge size="sm" tone="brand">Sắp tới</Badge>}</div>
                  <div className="ds-caption">{p.date} · {p.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <h2 className="ds-h2 mt-2">Phát hiện trên tài khoản</h2>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="ds-h3">Vi phạm bảo mật đang mở ({open.length})</h3>
            <Button size="sm" variant="ghost" onClick={() => onTab('findings')}>Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {bySev.map(([s, n]) => (
              <div key={s} className="rounded-lg bg-subtle px-3 py-2">
                <div className="ds-caption">{s}</div>
                <div className={cn('text-[20px] font-[650] num', n && s === 'Cao' && 'text-neg', n && s === 'Trung bình' && 'text-warn')}>{n}</div>
              </div>
            ))}
          </div>
          <LineChart data={trend} height={150} area={false} yTicks={2} series={[{ key: 'Cao', label: 'Cao', color: 'var(--c-neg)' }, { key: 'Trung bình', label: 'Trung bình', color: 'var(--c-warn)' }, { key: 'Thấp', label: 'Thấp', color: 'var(--c-info)' }]} />
        </div>
        <div className="card p-5 flex flex-col">
          <h3 className="ds-h3">Phát hiện bất thường mỗi ngày</h3>
          <EmptyState icon={Radar} title="Không có phát hiện trong 7 ngày qua" desc="Lạc Việt Data theo dõi đăng nhập lạ, truy vấn trích xuất dữ liệu lớn và thay đổi quyền bất thường." compact className="flex-1" />
          {!policiesCount && (
            <Callout tone="neutral" icon={Network} action={<Button size="sm" variant="outline" onClick={onNetwork}>Tạo</Button>}>Chưa có chính sách mạng — nên giới hạn IP văn phòng.</Callout>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Danh sách phát hiện ---------------- */
function Findings({ onNetwork }) {
  const navigate = useNavigate()
  const { list, resolve } = useFindings()
  const [show, setShow] = useState('open')
  const rows = list.filter((f) => (show === 'open' ? f.open : !f.open))
  const fix = (f) => {
    if (f.id === 's1') navigate('/quan-tri/nguoi-dung?loc=chua-mfa')
    else if (f.id === 's2') onNetwork()
    else { resolve(f.id); toast({ title: 'Đã đánh dấu đã xử lý', desc: f.title }) }
  }
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant={show === 'open' ? 'inverse' : 'outline'} onClick={() => setShow('open')}>Đang mở ({list.filter((f) => f.open).length})</Button>
        <Button size="sm" variant={show === 'done' ? 'inverse' : 'outline'} onClick={() => setShow('done')}>Đã xử lý ({list.filter((f) => !f.open).length})</Button>
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={760}>
          <THead><Th>Mức độ</Th><Th>Phát hiện</Th><Th>Trình quét</Th><Th>Khuyến nghị</Th><Th /></THead>
          <tbody>
            {rows.map((f) => (
              <Tr key={f.id}>
                <Td><Badge tone={SEVERITY_TONE[f.severity]} dot>{f.severity}</Badge></Td>
                <Td className="font-[550]">{f.title}</Td>
                <Td className="text-muted">{f.scanner}</Td>
                <Td className="text-muted">{f.fix}</Td>
                <Td align="right">{f.open ? <Button size="sm" variant="outline" icon={Wand2} onClick={() => fix(f)}>Khắc phục</Button> : <Badge tone="pos" icon={CheckCircle2}>Đã xử lý</Badge>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!rows.length && <EmptyState icon={ShieldCheck} title={show === 'open' ? 'Không còn phát hiện nào đang mở' : 'Chưa có phát hiện nào được xử lý'} compact />}
      </div>
    </>
  )
}

/* ---------------- Trình quét ---------------- */
const SCANNERS = [
  { id: 'sc1', name: 'Kiểm tra CIS', desc: 'Đối chiếu cấu hình tài khoản với 40 khuyến nghị bảo mật cơ bản.', schedule: 'Hằng ngày 02:00', on: true, last: '2026-11-10T02:00:00' },
  { id: 'sc2', name: 'Phân quyền', desc: 'Tìm vai trò có quyền quá rộng, người dùng không hoạt động giữ quyền cao.', schedule: 'Hằng tuần', on: true, last: '2026-11-09T02:00:00' },
  { id: 'sc3', name: 'Phát hiện mối đe doạ', desc: 'Đăng nhập từ vị trí lạ, đăng nhập thất bại liên tiếp, truy vấn trích xuất bất thường.', schedule: 'Liên tục', on: true, last: '2026-11-10T10:10:00' },
  { id: 'sc4', name: 'Dữ liệu nhạy cảm', desc: 'Tự phân loại cột chứa số điện thoại, email, CCCD bằng AI và đề xuất chính sách che.', schedule: 'Hằng tuần', on: false, last: null },
]
function Scanners() {
  const stored = useApp((s) => s.scanners)
  const update = useApp((s) => s.update)
  const list = stored || SCANNERS
  const [running, setRunning] = useState(null)
  const set = (id, patch) => update('scanners', () => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {list.map((s) => (
        <div key={s.id} className="card p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-xl grid place-items-center bg-brand-50 text-brand-ink"><Radar size={18} /></span>
              <div><div className="font-[600]">{s.name}</div><div className="ds-caption">{s.schedule}</div></div>
            </div>
            <Toggle checked={s.on} onChange={(v) => { set(s.id, { on: v }); toast(v ? `Đã bật trình quét ${s.name}` : `Đã tắt trình quét ${s.name}`) }} aria-label={`Bật ${s.name}`} />
          </div>
          <p className="ds-caption mt-3 flex-1">{s.desc}</p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
            <span className="ds-caption">{s.last ? `Lần quét gần nhất: ${timeAgo(s.last)}` : 'Chưa quét lần nào'}</span>
            <Button size="sm" variant="outline" icon={Play} loading={running === s.id} disabled={!s.on} onClick={() => {
              setRunning(s.id)
              setTimeout(() => { setRunning(null); set(s.id, { last: new Date().toISOString() }); toast({ title: `Đã quét xong: ${s.name}`, desc: 'Không có phát hiện mới.' }) }, 1400)
            }}>Quét ngay</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Chính sách mạng ---------------- */
function NetworkPolicies({ onCreate }) {
  const policies = useApp((s) => s.networkPolicies || NONE)
  const { update } = useApp()
  if (!policies.length) {
    return <div className="card"><EmptyState icon={Network} title="Chưa có chính sách mạng" desc="Chính sách mạng cho phép hoặc chặn truy cập vào tài khoản theo địa chỉ IP." action={<Button variant="primary" icon={Plus} onClick={onCreate}>Tạo chính sách mạng</Button>} /></div>
  }
  return (
    <>
      <div className="flex justify-end mb-3"><Button variant="primary" icon={Plus} onClick={onCreate}>Tạo chính sách mạng</Button></div>
      <div className="card overflow-hidden">
        <Table minWidth={760}>
          <THead><Th>Tên</Th><Th>IP cho phép</Th><Th>IP chặn</Th><Th>Áp dụng</Th><Th>Tạo lúc</Th><Th /></THead>
          <tbody>
            {policies.map((p) => (
              <Tr key={p.id}>
                <Td className="font-mono font-[600] text-[12.5px]">{p.name}</Td>
                <Td className="font-mono text-[12px] text-muted">{p.allowed.join(', ') || '—'}</Td>
                <Td className="font-mono text-[12px] text-muted">{p.blocked.join(', ') || '—'}</Td>
                <Td>{p.active ? <Badge tone="pos" dot>Toàn tài khoản</Badge> : <Badge>Chưa áp dụng</Badge>}</Td>
                <Td className="text-muted">{timeAgo(p.created)}</Td>
                <Td align="right"><button className="text-faint hover:text-neg p-1" aria-label="Xoá" onClick={() => { update('networkPolicies', () => policies.filter((x) => x.id !== p.id)); toast(`Đã xoá chính sách ${p.name}`) }}><Trash2 size={15} /></button></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
function NetworkPolicyModal({ open, onClose }) {
  const { update } = useApp()
  const [name, setName] = useState('VAN_PHONG_PHO_NUI')
  const [allowed, setAllowed] = useState('203.113.150.0/24\n14.161.20.15')
  const [blocked, setBlocked] = useState('')
  const [active, setActive] = useState(true)
  const parse = (s) => s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean)
  const bad = [...parse(allowed), ...parse(blocked)].filter((x) => !IP_RE.test(x))
  const n = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  return (
    <Modal open={open} onClose={onClose} title="Tạo chính sách mạng" desc="Chỉ những địa chỉ IP được cho phép mới đăng nhập được vào tài khoản."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!n || bad.length > 0 || !parse(allowed).length} onClick={() => {
        update('networkPolicies', (l) => [{ id: uid('np'), name: n, allowed: parse(allowed), blocked: parse(blocked), active, created: new Date().toISOString() }, ...(l || [])])
        toast({ title: `Đã tạo chính sách mạng ${n}`, desc: active ? 'Đã áp dụng cho toàn tài khoản.' : undefined }); onClose()
      }}>Tạo chính sách</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên chính sách" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Danh sách IP cho phép" rows={3} value={allowed} onChange={(e) => setAllowed(e.target.value)} hint="Mỗi dòng một địa chỉ IP hoặc dải CIDR, vd: 203.113.150.0/24" />
        <Textarea label="Danh sách IP chặn" optional rows={2} value={blocked} onChange={(e) => setBlocked(e.target.value)} />
        {bad.length > 0 && <p className="text-[12.5px] text-neg">Địa chỉ không hợp lệ: {bad.join(', ')}</p>}
        <Toggle checked={active} onChange={setActive} label="Áp dụng cho toàn tài khoản ngay" desc="Bạn vẫn đăng nhập được vì Lạc Việt Data kiểm tra IP hiện tại trước khi áp dụng." />
        <Callout tone="warn" icon={ShieldAlert}>Hãy chắc chắn IP văn phòng của bạn nằm trong danh sách cho phép để tránh tự khoá mình.</Callout>
      </div>
    </Modal>
  )
}

/* ---------------- Gắn thẻ & bảo vệ dữ liệu ---------------- */
const POLICY_TYPES = [
  { id: 'mask', icon: EyeOff, name: 'Che dữ liệu', desc: 'Ẩn một phần giá trị cột theo vai trò' },
  { id: 'row', icon: Rows3, name: 'Truy cập theo dòng', desc: 'Mỗi vai trò chỉ thấy dòng được phép' },
  { id: 'agg', icon: Sigma, name: 'Chỉ tổng hợp', desc: 'Chỉ cho truy vấn số liệu gộp nhóm' },
  { id: 'join', icon: Link2, name: 'Giới hạn nối bảng', desc: 'Bắt buộc nối qua cột được chỉ định' },
  { id: 'proj', icon: Columns3, name: 'Giới hạn chọn cột', desc: 'Không cho SELECT trực tiếp cột nhạy cảm' },
]
function Protection({ onMask }) {
  const masks = useApp((s) => s.maskingPolicies || NONE)
  const tags = [
    { name: 'DU_LIEU_CA_NHAN', on: ['KHACH_HANG.EMAIL', 'KHACH_HANG.SO_DIEN_THOAI', 'KHACH_HANG.HO_TEN'] },
    { name: 'TAI_CHINH', on: ['DON_HANG.TONG_TIEN', 'SAN_PHAM.GIA_VON'] },
    { name: 'VAN_BAN_TU_DO', on: ['DANH_GIA.NOI_DUNG'] },
  ]
  const applied = tags.reduce((s, t) => s + t.on.length, 0)
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Tổng số thẻ" value={tags.length + 3} icon={Tag} />
        <MetricCard label="Lượt gắn thẻ" value={applied} sub="trên 3 bảng" />
        <MetricCard label="Chính sách đang bật" value={masks.length} tone={masks.length ? 'pos' : undefined} />
        <MetricCard label="Cột nhạy cảm chưa bảo vệ" value={Math.max(0, 3 - masks.length)} tone={masks.length >= 3 ? 'pos' : 'warn'} />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="ds-h2">Chính sách bảo vệ dữ liệu</h2>
          <Button variant="primary" icon={Plus} onClick={onMask}>Tạo chính sách che dữ liệu</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {POLICY_TYPES.map((p) => (
            <button key={p.id} onClick={p.id === 'mask' ? onMask : () => toast({ title: `${p.name}: sắp ra mắt trong bản demo`, tone: 'info' })} className="card p-4 text-left hover:shadow-sm transition-shadow">
              <span className="size-9 rounded-lg grid place-items-center bg-brand-50 text-brand-ink"><p.icon size={17} /></span>
              <div className="font-[600] mt-3">{p.name}</div>
              <div className="ds-caption mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="ds-h3 mb-3">Thẻ được dùng nhiều nhất</h3>
          <div className="flex flex-col gap-3">
            {tags.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-[13px]"><span className="font-mono font-[600]">{t.name}</span><span className="text-muted num">{t.on.length} cột</span></div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">{t.on.map((c) => <span key={c} className="text-[11.5px] font-mono rounded bg-subtle px-1.5 py-0.5 text-dim">{c}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="ds-h3 mb-3">Chính sách che dữ liệu</h3>
          {!masks.length ? <EmptyState icon={EyeOff} title="Chưa có chính sách" desc="Ví dụ: che số điện thoại khách hàng với vai trò MARKETING." compact action={<Button size="sm" variant="outline" onClick={onMask}>Tạo ngay</Button>} /> : (
            <ul className="flex flex-col divide-y divide-line">
              {masks.map((m) => (
                <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0"><div className="font-mono font-[600] text-[12.5px]">{m.name}</div><div className="ds-caption">{m.column} · che với {m.roles.join(', ')}</div></div>
                  <Badge tone="pos" dot>Đang bật</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const MASK_COLUMNS = ['KHACH_HANG.SO_DIEN_THOAI', 'KHACH_HANG.EMAIL', 'KHACH_HANG.HO_TEN', 'SAN_PHAM.GIA_VON']
const MASK_STYLES = [
  { value: 'partial', label: 'Che một phần (giữ 3 ký tự cuối)' },
  { value: 'full', label: 'Che toàn bộ (***)' },
  { value: 'hash', label: 'Băm SHA-256 (vẫn nối bảng được)' },
  { value: 'null', label: 'Trả về NULL' },
]
function MaskingModal({ open, onClose }) {
  const { roles, update } = useApp()
  const [col, setCol] = useState(MASK_COLUMNS[0])
  const [style, setStyle] = useState('partial')
  const [role, setRole] = useState('MARKETING')
  const name = `CHE_${col.split('.')[1]}`
  const expr = { partial: "CONCAT(REPEAT('*', LENGTH(val) - 3), RIGHT(val, 3))", full: "'***'", hash: 'SHA2(val)', null: 'NULL' }[style]
  const sql = `CREATE OR REPLACE MASKING POLICY ${name} AS (val STRING) RETURNS STRING ->\n  CASE\n    WHEN CURRENT_ROLE() IN ('QUAN_TRI', 'BAO_MAT') THEN val\n    WHEN CURRENT_ROLE() = '${role}' THEN ${expr}\n    ELSE ${expr}\n  END;\n\nALTER TABLE PHO_NUI_DB.BAN_HANG.${col.split('.')[0]}\n  MODIFY COLUMN ${col.split('.')[1]} SET MASKING POLICY ${name};`
  const sample = col.endsWith('SO_DIEN_THOAI') ? '0912****456' : col.endsWith('EMAIL') ? 'linh.dang12@mail.vn' : col.endsWith('HO_TEN') ? 'Đặng Mai Linh' : '62000'
  const masked = { partial: '*'.repeat(Math.max(0, sample.length - 3)) + sample.slice(-3), full: '***', hash: '9f2c41ab…e07d', null: 'NULL' }[style]
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Tạo chính sách che dữ liệu" desc="Vai trò được chỉ định chỉ thấy giá trị đã che; QUAN_TRI và BAO_MAT vẫn thấy đầy đủ."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => {
        update('maskingPolicies', (l) => [{ id: uid('mp'), name, column: col, style, roles: [role] }, ...(l || []).filter((x) => x.name !== name)])
        toast({ title: `Đã áp dụng chính sách ${name}`, desc: `${role} sẽ thấy ${col} đã được che.` }); onClose()
      }}>Tạo & áp dụng</Button></>}>
      <div className="grid sm:grid-cols-3 gap-4">
        <Select label="Cột cần bảo vệ" value={col} onChange={(e) => setCol(e.target.value)} options={MASK_COLUMNS} />
        <Select label="Kiểu che" value={style} onChange={(e) => setStyle(e.target.value)} options={MASK_STYLES} />
        <Select label="Áp dụng với vai trò" value={role} onChange={(e) => setRole(e.target.value)} options={roles.filter((r) => !['QUAN_TRI', 'BAO_MAT'].includes(r.name)).map((r) => r.name)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl border border-line p-3"><div className="ds-label">QUAN_TRI thấy</div><div className="font-mono mt-1">{sample}</div></div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3"><div className="ds-label">{role} thấy</div><div className="font-mono mt-1 text-brand-ink">{masked}</div></div>
      </div>
      <CodeBox className="mt-4" label="SQL tương ứng">{sql}</CodeBox>
    </Modal>
  )
}
