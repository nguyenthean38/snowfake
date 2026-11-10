import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  UserPlus, Send, ShieldCheck, ShieldAlert, Lock, Unlock, KeyRound, Trash2, ChevronDown, ChevronRight, CheckCircle2,
  Users, Plus, MoreHorizontal, Bot,
} from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, Tabs, SearchInput, Select, Input, Textarea, Checkbox, Modal, Drawer, Badge, Avatar, KeyValue,
  EmptyState, Confirm, Callout,
} from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui/Table'
import { useApp, toast, uid } from '@/store'
import { timeAgo, formatDate, stripAccents } from '@/lib/format'
import { cn } from '@/lib/cn'
import { EmailChips } from '@/features/admin/shared'

const STATUS_TONE = { 'Đang hoạt động': 'pos', 'Bị khoá': 'neg', 'Chờ kích hoạt': 'warn' }
const COLORS = ['#5b46e5', '#0fb5c9', '#e0559b', '#f29d38', '#2fb57c', '#8a94b8']
const colorOf = (s = '') => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]

export default function UsersPage() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') === 'vai-tro' ? 'roles' : 'users')
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const { users, roles } = useApp()

  useEffect(() => {
    if (params.get('tao') === '1') {
      setCreateOpen(true)
      params.delete('tao'); setParams(params, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title="Người dùng & vai trò" desc="Quản lý ai được vào tài khoản Phố Núi và họ được làm gì. Vai trò quyết định quyền đọc, ghi dữ liệu và dùng kho tính toán."
      actions={tab === 'users' ? <>
        <Button variant="outline" icon={Send} onClick={() => setInviteOpen(true)}>Mời</Button>
        <Button variant="primary" icon={UserPlus} onClick={() => setCreateOpen(true)}>Tạo người dùng</Button>
      </> : <Button variant="primary" icon={Plus} onClick={() => setRoleOpen(true)}>Tạo vai trò</Button>}>
      <Tabs value={tab} onChange={setTab} className="mb-5" options={[
        { value: 'users', label: 'Người dùng', count: users.length },
        { value: 'roles', label: 'Vai trò', count: roles.length },
      ]} />
      {tab === 'users' ? <UsersTab initialFilter={params.get('loc')} /> : <RolesTab />}
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CreateRoleModal open={roleOpen} onClose={() => setRoleOpen(false)} />
    </Page>
  )
}

/* ---------------- Danh sách người dùng ---------------- */
function UsersTab({ initialFilter }) {
  const { users, roles } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [mfa, setMfa] = useState(initialFilter === 'chua-mfa' ? 'no' : '')
  const [sel, setSel] = useState(null)
  const list = useMemo(() => {
    const nq = stripAccents(q).toLowerCase()
    return users.filter((u) => (!nq || stripAccents(`${u.username} ${u.name} ${u.email}`).toLowerCase().includes(nq))
      && (!status || u.status === status) && (!role || u.role === role)
      && (!mfa || (mfa === 'no' ? !u.mfa && u.type !== 'Dịch vụ' : u.mfa)))
  }, [users, q, status, role, mfa])
  const noMfa = users.filter((u) => !u.mfa && u.type !== 'Dịch vụ').length
  const selected = users.find((u) => u.id === sel)
  return (
    <>
      {noMfa > 0 && mfa !== 'no' && (
        <Callout tone="warn" icon={ShieldAlert} className="mb-4" title={`${noMfa} người dùng chưa bật xác thực đa yếu tố`}
          action={<Button size="sm" variant="outline" onClick={() => setMfa('no')}>Xem danh sách</Button>}>
          Từ 01/03/2027, mọi người dùng là con người bắt buộc phải bật MFA để đăng nhập.
        </Callout>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tên, email…" className="w-full sm:w-72" />
        <Select size="sm" className="w-44" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'Trạng thái: Tất cả' }, 'Đang hoạt động', 'Bị khoá', 'Chờ kích hoạt']} />
        <Select size="sm" className="w-44" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: '', label: 'Vai trò: Tất cả' }, ...roles.map((r) => r.name)]} />
        <Select size="sm" className="w-36" value={mfa} onChange={(e) => setMfa(e.target.value)} options={[{ value: '', label: 'MFA: Tất cả' }, { value: 'yes', label: 'Đã bật' }, { value: 'no', label: 'Chưa bật' }]} />
        <span className="ds-caption ml-auto">{list.length} người dùng</span>
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={980}>
          <THead>
            <Th>Tên đăng nhập</Th><Th>Tên hiển thị</Th><Th>Trạng thái</Th><Th>Đăng nhập gần nhất</Th><Th>Loại</Th><Th>MFA</Th><Th>Vai trò mặc định</Th><Th>Chủ sở hữu</Th><Th width={48} />
          </THead>
          <tbody>
            {list.map((u) => (
              <Tr key={u.id} onClick={() => setSel(u.id)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    {u.type === 'Dịch vụ' ? <span className="size-7 rounded-full grid place-items-center bg-subtle text-muted"><Bot size={15} /></span> : <Avatar name={u.name} color={colorOf(u.username)} size={28} />}
                    <span className="font-[600] font-mono text-[12.5px]">{u.username}</span>
                  </div>
                </Td>
                <Td>{u.name}</Td>
                <Td><Badge tone={STATUS_TONE[u.status] || 'neutral'} dot>{u.status}</Badge></Td>
                <Td className="text-muted">{u.lastLogin ? timeAgo(u.lastLogin) : 'Chưa đăng nhập'}</Td>
                <Td className="text-muted">{u.type}</Td>
                <Td>{u.type === 'Dịch vụ' ? <span className="text-faint">—</span> : u.mfa ? <Badge tone="pos" icon={ShieldCheck} size="sm">Đã bật</Badge> : <Badge tone="warn" size="sm">Chưa bật</Badge>}</Td>
                <Td><span className="font-mono text-[12.5px] rounded-md bg-subtle px-1.5 py-0.5">{u.role}</span></Td>
                <Td className="text-muted font-mono text-[12.5px]">{u.owner || 'BAO_MAT'}</Td>
                <Td><MoreHorizontal size={16} className="text-faint" /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!list.length && <EmptyState icon={Users} title="Không có người dùng phù hợp" desc="Thử bỏ bớt bộ lọc." compact />}
      </div>
      {selected && <UserDrawer user={selected} onClose={() => setSel(null)} />}
    </>
  )
}

function UserDrawer({ user, onClose }) {
  const { roles, upsert, remove } = useApp()
  const [confirmDel, setConfirmDel] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const set = (patch, msg) => { upsert('users', { id: user.id, ...patch }); if (msg) toast(msg) }
  const locked = user.status === 'Bị khoá'
  const me = user.username === 'MINHKHOA'
  return (
    <Drawer open onClose={onClose} width={480}
      header={
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={colorOf(user.username)} size={44} />
          <div className="min-w-0">
            <h2 className="ds-h2 truncate">{user.name}</h2>
            <div className="ds-caption font-mono">{user.username}</div>
          </div>
        </div>
      }
      footer={<>
        <Button variant="danger-soft" icon={Trash2} onClick={() => setConfirmDel(true)} disabled={me}>Xoá</Button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </>}>
      <div className="flex flex-wrap gap-2 mb-5">
        <Badge tone={STATUS_TONE[user.status] || 'neutral'} dot>{user.status}</Badge>
        {user.type !== 'Dịch vụ' && <Badge tone={user.mfa ? 'pos' : 'warn'}>{user.mfa ? 'Đã bật MFA' : 'Chưa bật MFA'}</Badge>}
        <Badge>{user.type}</Badge>
      </div>
      <KeyValue items={[
        { label: 'Email', value: user.email || '—' },
        { label: 'Ngày tạo', value: user.created ? formatDate(user.created) : '—' },
        { label: 'Đăng nhập gần nhất', value: user.lastLogin ? timeAgo(user.lastLogin) : 'Chưa đăng nhập' },
        { label: 'Kho mặc định', value: user.warehouse || 'KHO_PHAN_TICH' },
        { label: 'Không gian tên mặc định', value: user.namespace || 'PHO_NUI_DB.BAN_HANG' },
        user.comment && { label: 'Ghi chú', value: user.comment },
      ]} />
      <div className="mt-6">
        <Select label="Vai trò mặc định" value={user.role} onChange={(e) => set({ role: e.target.value }, `Đã đổi vai trò mặc định thành ${e.target.value}`)} options={roles.map((r) => ({ value: r.name, label: `${r.name} — ${r.label}` }))} />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="ds-label mb-1">Thao tác</div>
        {user.type !== 'Dịch vụ' && (
          <ActionRow icon={KeyRound} title="Đặt lại mật khẩu" desc={resetDone ? 'Đã gửi liên kết đặt lại mật khẩu tới email của người dùng.' : 'Gửi liên kết đặt lại mật khẩu qua email (hiệu lực 4 giờ).'}
            action={<Button size="sm" variant="outline" disabled={resetDone || !user.email} onClick={() => { setResetDone(true); toast({ title: 'Đã gửi liên kết đặt lại mật khẩu', desc: user.email }) }}>{resetDone ? 'Đã gửi' : 'Gửi'}</Button>} />
        )}
        {user.type !== 'Dịch vụ' && !user.mfa && (
          <ActionRow icon={ShieldCheck} title="Yêu cầu bật MFA" desc="Người dùng sẽ phải đăng ký ứng dụng xác thực ở lần đăng nhập tới."
            action={<Button size="sm" variant="outline" onClick={() => set({ mfaRequired: true }, 'Đã yêu cầu bật MFA')} disabled={user.mfaRequired}>{user.mfaRequired ? 'Đã yêu cầu' : 'Yêu cầu'}</Button>} />
        )}
        <ActionRow icon={locked ? Unlock : Lock} title={locked ? 'Mở khoá người dùng' : 'Khoá người dùng'} desc={me ? 'Bạn không thể tự khoá tài khoản đang đăng nhập.' : locked ? 'Cho phép người dùng đăng nhập trở lại.' : 'Chặn đăng nhập ngay, các phiên đang mở bị đóng.'}
          action={<Button size="sm" variant={locked ? 'outline' : 'danger-soft'} disabled={me} onClick={() => set({ status: locked ? 'Đang hoạt động' : 'Bị khoá' }, locked ? `Đã mở khoá ${user.username}` : `Đã khoá ${user.username}`)}>{locked ? 'Mở khoá' : 'Khoá'}</Button>} />
      </div>
      <Confirm open={confirmDel} onClose={() => setConfirmDel(false)} danger confirmLabel="Xoá người dùng" title={`Xoá ${user.username}?`}
        desc="Người dùng sẽ mất quyền truy cập ngay lập tức. Đối tượng họ sở hữu chuyển cho vai trò BAO_MAT."
        onConfirm={() => { remove('users', user.id); toast(`Đã xoá người dùng ${user.username}`); onClose() }} />
    </Drawer>
  )
}

function ActionRow({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line p-3">
      <span className="size-8 grid place-items-center rounded-lg bg-subtle text-dim shrink-0"><Icon size={16} /></span>
      <div className="min-w-0 flex-1"><div className="text-[13.5px] font-[600]">{title}</div><div className="ds-caption">{desc}</div></div>
      {action}
    </div>
  )
}

/* ---------------- Tạo người dùng ---------------- */
const EMPTY = { username: '', email: '', password: '', confirm: '', comment: '', mustChange: true, login: '', display: '', first: '', last: '', role: 'CONG_KHAI', warehouse: 'KHO_PHAN_TICH', namespace: '' }
function CreateUserModal({ open, onClose }) {
  const { users, roles, warehouses, upsert } = useApp()
  const [f, setF] = useState(EMPTY)
  const [adv, setAdv] = useState(false)
  const [tried, setTried] = useState(false)
  useEffect(() => { if (open) { setF(EMPTY); setAdv(false); setTried(false) } }, [open])
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const uname = f.username.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const errs = {
    username: !f.username.trim() ? 'Nhập tên người dùng' : users.some((u) => u.username === uname) ? 'Tên người dùng đã tồn tại' : '',
    email: f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) ? 'Email chưa hợp lệ' : '',
    password: f.password && f.password.length < 8 ? 'Mật khẩu cần ít nhất 8 ký tự' : '',
    confirm: f.password && f.confirm !== f.password ? 'Mật khẩu xác nhận không khớp' : '',
  }
  const valid = !Object.values(errs).some(Boolean)
  const submit = () => {
    setTried(true)
    if (!valid) return
    const name = f.display || [f.last, f.first].filter(Boolean).join(' ') || uname
    upsert('users', {
      id: uid('u'), username: uname, name, email: f.email, role: f.role, status: f.password ? 'Đang hoạt động' : 'Chờ kích hoạt', mfa: false,
      lastLogin: null, type: 'Người dùng', created: new Date().toISOString().slice(0, 10), comment: f.comment, warehouse: f.warehouse,
      namespace: f.namespace, owner: useApp.getState().currentRole, mustChange: f.mustChange,
    })
    toast({ title: `Đã tạo người dùng ${uname}`, desc: f.password ? 'Người dùng có thể đăng nhập ngay.' : 'Chưa đặt mật khẩu: hãy gửi lời mời để người dùng kích hoạt.' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Người dùng mới" desc={`Chủ sở hữu: ${useApp.getState().currentRole}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={submit} disabled={!f.username.trim()}>Tạo người dùng</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Tên người dùng" autoFocus value={f.username} onChange={s('username')} placeholder="vd: thanhhuong" error={tried && errs.username} hint={f.username && !errs.username ? `Sẽ lưu thành ${uname}` : undefined} />
        <Input label="Email" optional type="email" value={f.email} onChange={s('email')} placeholder="ten@phonui.demo" error={tried && errs.email} />
        <Input label="Mật khẩu" optional type="password" value={f.password} onChange={s('password')} error={tried && errs.password} hint="Bỏ trống nếu sẽ gửi lời mời" />
        <Input label="Xác nhận mật khẩu" optional type="password" value={f.confirm} onChange={s('confirm')} error={tried && errs.confirm} disabled={!f.password} />
        <Textarea className="sm:col-span-2" label="Ghi chú" optional rows={2} value={f.comment} onChange={s('comment')} placeholder="vd: Tài khoản cho nhân viên phân tích vùng miền Bắc" />
        <Checkbox className="sm:col-span-2" checked={f.mustChange} onChange={(v) => setF({ ...f, mustChange: v })} label="Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên" />
      </div>
      <button type="button" onClick={() => setAdv(!adv)} className="mt-5 flex items-center gap-1.5 text-[13.5px] font-[600] text-brand-ink">
        {adv ? <ChevronDown size={16} /> : <ChevronRight size={16} />} Tuỳ chọn nâng cao
      </button>
      {adv && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4 animate-fade-in">
          <Input label="Tên đăng nhập" optional value={f.login} onChange={s('login')} placeholder={uname || 'Mặc định giống tên người dùng'} />
          <Input label="Tên hiển thị" optional value={f.display} onChange={s('display')} placeholder="vd: Nguyễn Thanh Hương" />
          <Input label="Họ" optional value={f.last} onChange={s('last')} />
          <Input label="Tên" optional value={f.first} onChange={s('first')} />
          <Select label="Vai trò mặc định" value={f.role} onChange={s('role')} options={roles.map((r) => r.name)} />
          <Select label="Kho tính toán mặc định" value={f.warehouse} onChange={s('warehouse')} options={warehouses.map((w) => w.name)} />
          <Input className="sm:col-span-2" label="Không gian tên mặc định" optional value={f.namespace} onChange={s('namespace')} placeholder="<csdl>.<lược_đồ> — vd: PHO_NUI_DB.BAN_HANG" />
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Mời người dùng ---------------- */
function InviteModal({ open, onClose }) {
  const { roles, upsert } = useApp()
  const [emails, setEmails] = useState([])
  const [role, setRole] = useState('PHAN_TICH')
  const [done, setDone] = useState(null)
  useEffect(() => { if (open) { setEmails([]); setRole('PHAN_TICH'); setDone(null) } }, [open])
  const send = () => {
    emails.forEach((e) => upsert('users', {
      id: uid('u'), username: e.split('@')[0].toUpperCase().replace(/[^A-Z0-9_]/g, '_'), name: e.split('@')[0], email: e, role,
      status: 'Chờ kích hoạt', mfa: false, lastLogin: null, type: 'Người dùng', created: new Date().toISOString().slice(0, 10),
    }))
    setDone(emails)
  }
  if (done) {
    return (
      <Modal open={open} onClose={onClose} size="sm" hideClose footer={<><Button variant="outline" onClick={() => { setDone(null); setEmails([]) }}>Mời thêm</Button><Button variant="primary" onClick={onClose}>Xong</Button></>}>
        <div className="text-center pt-3">
          <CheckCircle2 size={40} className="mx-auto text-pos" />
          <h2 className="ds-h2 mt-3">Đã mời {done.length} người dùng</h2>
          <p className="ds-caption mt-1">Họ sẽ nhận email kèm liên kết kích hoạt (hiệu lực 7 ngày).</p>
          <ul className="mt-4 text-left rounded-xl border border-line divide-y divide-line">
            {done.map((e) => <li key={e} className="px-3 py-2 text-[13px] flex justify-between gap-2"><span className="truncate">{e}</span><Badge size="sm" tone="warn">Chờ kích hoạt</Badge></li>)}
          </ul>
        </div>
      </Modal>
    )
  }
  return (
    <Modal open={open} onClose={onClose} title="Mời người dùng" desc="Mỗi người được mời sẽ nhận email để tự đặt mật khẩu và bắt đầu dùng Lạc Việt Data."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" icon={Send} disabled={!emails.length} onClick={send}>Gửi lời mời</Button></>}>
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[13px] font-[550] text-dim mb-1.5">Email</div>
          <EmailChips value={emails} onChange={setEmails} />
        </div>
        <Select label="Vai trò hệ thống" value={role} onChange={(e) => setRole(e.target.value)} options={roles.map((r) => ({ value: r.name, label: `${r.name} — ${r.label}` }))} hint="Có thể đổi sau trong chi tiết người dùng." />
      </div>
    </Modal>
  )
}

/* ---------------- Vai trò ---------------- */
const HIERARCHY = [['QUAN_TRI', 'BAO_MAT'], ['QUAN_TRI', 'HE_THONG'], ['HE_THONG', 'PHAN_TICH'], ['HE_THONG', 'MARKETING'], ['PHAN_TICH', 'CONG_KHAI'], ['MARKETING', 'CONG_KHAI'], ['BAO_MAT', 'CONG_KHAI']]
const POS = { QUAN_TRI: [280, 30], BAO_MAT: [120, 110], HE_THONG: [420, 110], PHAN_TICH: [330, 190], MARKETING: [500, 190], CONG_KHAI: [280, 270] }

function RolesTab() {
  const { roles, users } = useApp()
  const [hover, setHover] = useState(null)
  const count = (r) => users.filter((u) => u.role === r.name).length || r.users
  const extra = roles.filter((r) => !POS[r.name])
  return (
    <div className="grid xl:grid-cols-[1fr_520px] gap-5">
      <div className="card overflow-hidden">
        <Table minWidth={560}>
          <THead><Th>Vai trò</Th><Th>Mô tả</Th><Th align="right">Người dùng</Th><Th>Loại</Th></THead>
          <tbody>
            {roles.map((r) => (
              <Tr key={r.name} onMouseEnter={() => setHover(r.name)} onMouseLeave={() => setHover(null)} selected={hover === r.name}>
                <Td><div className="font-mono font-[600] text-[12.5px]">{r.name}</div><div className="ds-caption">{r.label}</div></Td>
                <Td className="text-muted max-w-[260px]">{r.desc}</Td>
                <Td align="right" className="num">{count(r)}</Td>
                <Td>{r.system ? <Badge size="sm">Hệ thống</Badge> : <Badge size="sm" tone="brand">Tuỳ chỉnh</Badge>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="card p-5">
        <h3 className="ds-h3">Sơ đồ kế thừa vai trò</h3>
        <p className="ds-caption mt-0.5 mb-3">Vai trò ở trên thừa hưởng toàn bộ quyền của vai trò nối bên dưới. Rê chuột để làm nổi bật.</p>
        <svg viewBox="0 0 600 300" className="w-full h-auto">
          {HIERARCHY.map(([a, b]) => {
            const [x1, y1] = POS[a], [x2, y2] = POS[b]
            const on = hover === a || hover === b
            return <path key={a + b} d={`M${x1} ${y1 + 16} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2 - 16}`} fill="none" stroke={on ? 'var(--c-brand-500)' : 'var(--c-line-strong)'} strokeWidth={on ? 2 : 1.4} />
          })}
          {Object.entries(POS).map(([name, [x, y]]) => {
            const on = hover === name
            return (
              <g key={name} onMouseEnter={() => setHover(name)} onMouseLeave={() => setHover(null)}>
                <rect x={x - 64} y={y - 16} width="128" height="32" rx="9" fill={on ? 'var(--c-brand-500)' : 'var(--c-surface)'} stroke={on ? 'var(--c-brand-500)' : 'var(--c-line-strong)'} />
                <text x={x} y={y} dy="0.35em" textAnchor="middle" className={cn('text-[12px] font-mono font-[600]', on ? 'fill-white' : 'fill-[var(--c-fg)]')}>{name}</text>
              </g>
            )
          })}
        </svg>
        {extra.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="ds-caption">Vai trò tuỳ chỉnh:</span>
            {extra.map((r) => <span key={r.name} className="font-mono text-[12px] rounded-md bg-brand-50 text-brand-ink px-1.5 py-0.5">{r.parent || 'HE_THONG'} → {r.name}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateRoleModal({ open, onClose }) {
  const { roles, update } = useApp()
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [desc, setDesc] = useState('')
  const [parent, setParent] = useState('HE_THONG')
  useEffect(() => { if (open) { setName(''); setLabel(''); setDesc(''); setParent('HE_THONG') } }, [open])
  const n = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const exists = roles.some((r) => r.name === n)
  return (
    <Modal open={open} onClose={onClose} title="Tạo vai trò" desc="Vai trò mới được cấp cho một vai trò cha để giữ sơ đồ kế thừa gọn gàng."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!n || exists} onClick={() => {
        update('roles', (l) => [...l, { name: n, label: label || n, desc: desc || 'Vai trò tuỳ chỉnh', users: 0, parent }])
        toast(`Đã tạo vai trò ${n}`); onClose()
      }}>Tạo vai trò</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên vai trò" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: QUAN_LY_VUNG" error={exists ? 'Vai trò đã tồn tại' : ''} hint={n && !exists ? `Lưu thành ${n}` : undefined} />
        <Input label="Tên dễ đọc" optional value={label} onChange={(e) => setLabel(e.target.value)} placeholder="vd: Quản lý vùng" />
        <Textarea label="Mô tả" optional rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Select label="Cấp vai trò này cho" value={parent} onChange={(e) => setParent(e.target.value)} options={roles.map((r) => r.name)} />
        <div className="rounded-xl bg-subtle px-3.5 py-3 font-mono text-[12.5px] text-dim">CREATE ROLE {n || '<tên>'};<br />GRANT ROLE {n || '<tên>'} TO ROLE {parent};</div>
      </div>
    </Modal>
  )
}
