import { useEffect, useRef, useState } from 'react'
import {
  Camera, KeyRound, Smartphone, Fingerprint, Plus, Trash2, CheckCircle2, AlertTriangle, Copy, Plug, ShieldCheck, Loader2, Eye, EyeOff,
} from 'lucide-react'
import {
  Button, Input, Select, Toggle, Modal, Badge, Avatar, EmptyState, Callout, Segmented, OtpInput, QrCode, Confirm, Textarea, RadioCards,
} from '@/components/ui'
import { useApp, useAuth, useUI, toast, uid } from '@/store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { SectionTitle, Group, Row } from './shared'

const NONE = []

/* ---------------- Hồ sơ ---------------- */
export function Profile() {
  const user = useAuth((s) => s.user)
  const updateUser = useAuth((s) => s.updateUser)
  const upsertUsers = useApp((s) => s.update)
  const first0 = user.first || user.name.split(' ').slice(-1)[0]
  const last0 = user.name.slice(0, user.name.length - first0.length).trim()
  const [f, setF] = useState({ first: first0, last: last0, email: user.email })
  const [avatar, setAvatar] = useState(user.avatar || null)
  const fileRef = useRef(null)
  const dirty = f.first !== first0 || f.last !== last0 || f.email !== user.email || avatar !== (user.avatar || null)
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)
  const pick = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast({ title: 'Vui lòng chọn tệp ảnh', tone: 'neg' })
    if (file.size > 2 * 1024 * 1024) return toast({ title: 'Ảnh tối đa 2 MB', tone: 'neg' })
    const r = new FileReader()
    r.onload = () => {
      // thu nhỏ về 160px để lưu gọn trong trình duyệt
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas'); const s = 160
        c.width = s; c.height = s
        const ctx = c.getContext('2d')
        const m = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s)
        setAvatar(c.toDataURL('image/jpeg', 0.85))
      }
      img.src = r.result
    }
    r.readAsDataURL(file)
  }
  const save = () => {
    const name = `${f.last} ${f.first}`.trim()
    updateUser({ first: f.first, name, email: f.email, avatar })
    upsertUsers('users', (l) => l.map((u) => (u.username === user.username ? { ...u, name, email: f.email } : u)))
    toast('Đã lưu hồ sơ')
  }
  return (
    <>
      <SectionTitle title="Hồ sơ" desc="Thông tin hiển thị với đồng nghiệp trong tài khoản Phố Núi." />
      <Group>
        <Row label="Ảnh đại diện" desc="JPG hoặc PNG, tối đa 2 MB">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar name={`${f.last} ${f.first}`} color={user.color} size={56} src={avatar} />
              <button onClick={() => fileRef.current?.click()} className="absolute -right-1 -bottom-1 size-7 rounded-full bg-surface border border-line grid place-items-center shadow-sm hover:bg-subtle" aria-label="Tải ảnh lên"><Camera size={14} /></button>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Tải ảnh mới</Button>
              {avatar && <button onClick={() => setAvatar(null)} className="text-[12.5px] text-neg hover:underline">Gỡ ảnh</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </Row>
        <Row label="Tên người dùng" desc="Không thể thay đổi"><span className="font-mono text-[13px] rounded-md bg-subtle px-2.5 py-1.5 inline-block">{user.username}</span></Row>
        <Row label="Họ"><Input className="sm:w-72" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} /></Row>
        <Row label="Tên"><Input className="sm:w-72" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} /></Row>
        <Row label="Email" desc="Dùng để nhận thông báo và đặt lại mật khẩu"><Input className="sm:w-72" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={!emailOk ? 'Email chưa hợp lệ' : ''} /></Row>
      </Group>
      <div className="flex items-center justify-end gap-2">
        {dirty && <span className="ds-caption mr-auto">Có thay đổi chưa lưu</span>}
        <Button variant="secondary" disabled={!dirty} onClick={() => { setF({ first: first0, last: last0, email: user.email }); setAvatar(user.avatar || null) }}>Huỷ</Button>
        <Button variant="primary" disabled={!dirty || !emailOk || !f.first.trim()} onClick={save}>Lưu thay đổi</Button>
      </div>
    </>
  )
}

/* ---------------- Tuỳ chọn ---------------- */
export function Preferences() {
  const { theme, setTheme } = useUI()
  const { prefs, update, roles, warehouses } = useApp()
  const set = (patch, msg = 'Đã lưu tuỳ chọn') => { update('prefs', patch); toast(msg) }
  return (
    <>
      <SectionTitle title="Tuỳ chọn" desc="Thiết lập giao diện và giá trị mặc định khi bạn làm việc." />
      <Group title="Chung">
        <Row label="Giao diện" desc="Chọn chế độ hiển thị khi dùng Lạc Việt Data">
          <Segmented value={theme} onChange={(v) => { setTheme(v); toast('Đã đổi giao diện') }} options={[{ value: 'light', label: 'Sáng' }, { value: 'dark', label: 'Tối' }, { value: 'system', label: 'Theo hệ thống' }]} />
        </Row>
        <Row label="Ngôn ngữ" desc="Ngôn ngữ của giao diện">
          <div className="relative w-56">
            <select value={prefs.language} onChange={(e) => set({ language: e.target.value })} className="appearance-none w-full h-10 rounded-[10px] border border-line-strong bg-surface pl-3 pr-8 text-[14px] outline-none focus:border-brand-400">
              <option value="vi">Tiếng Việt</option>
              <option value="en" disabled>English (sắp ra mắt)</option>
              <option value="ja" disabled>日本語 (sắp ra mắt)</option>
            </select>
          </div>
        </Row>
      </Group>
      <Group title="Mặc định khi làm việc">
        <Row label="Vai trò mặc định" desc="Vai trò dùng khi chạy truy vấn và quản lý đối tượng">
          <Select className="w-56" value={prefs.defaultRole} onChange={(e) => set({ defaultRole: e.target.value })} options={roles.map((r) => r.name)} />
        </Row>
        <Row label="Kho tính toán mặc định" desc="Kho dùng khi mở tệp SQL mới">
          <Select className="w-56" value={prefs.defaultWarehouse} onChange={(e) => set({ defaultWarehouse: e.target.value })} options={warehouses.map((w) => w.name)} />
        </Row>
      </Group>
      <Group title="Sản phẩm">
        <Row label="Gợi ý mô tả cột bằng AI" desc="Khi mở một bảng, Tinh Ý đọc vài dòng mẫu để đề xuất mô tả cho các cột chưa có ghi chú. Dữ liệu không rời khỏi tài khoản.">
          <Toggle checked={prefs.aiDescriptions} onChange={(v) => set({ aiDescriptions: v }, v ? 'Đã bật gợi ý mô tả bằng AI' : 'Đã tắt gợi ý mô tả bằng AI')} aria-label="Gợi ý mô tả cột bằng AI" />
        </Row>
      </Group>
    </>
  )
}

/* ---------------- Thông báo ---------------- */
export function Notifications() {
  const { prefs, update } = useApp()
  const T = ({ k, label, desc, def = true }) => (
    <Row label={label} desc={desc}>
      <Toggle checked={prefs[k] ?? def} onChange={(v) => { update('prefs', { [k]: v }); toast(v ? 'Đã bật thông báo' : 'Đã tắt thông báo') }} aria-label={label} />
    </Row>
  )
  return (
    <>
      <SectionTitle title="Thông báo" desc="Chọn những gì Lạc Việt Data sẽ báo cho bạn qua ứng dụng và email." />
      <Group title="Lịch sử truy vấn"><T k="notifyQueries" label="Báo khi truy vấn chạy nền hoàn tất" desc="Hiện thông báo khi một truy vấn dài chạy xong trong lúc bạn ở trang khác." /></Group>
      <Group title="Quản lý chi phí"><T k="notifyCost" label="Email từ bộ giám sát tài nguyên" desc="Nhận email khi bộ giám sát tài nguyên chạm ngưỡng đã đặt." /></Group>
      <Group title="Trung tâm bảo mật">
        <T k="notifySecurity" label="Thông báo về xác thực mạnh" desc="Nhắc bạn khi có người dùng chưa đạt yêu cầu xác thực mạnh." />
        <T k="weeklyDigest" label="Bản tin bảo mật hằng tuần" desc="Tóm tắt phát hiện bảo mật gửi qua email mỗi sáng thứ hai." />
      </Group>
    </>
  )
}

/* ---------------- Xác thực ---------------- */
export function Authentication() {
  const { mfa, update } = useApp()
  const tokens = useApp((s) => s.tokens || NONE)
  const policies = useApp((s) => s.networkPolicies || NONE)
  const [pw, setPw] = useState(false)
  const [addMfa, setAddMfa] = useState(false)
  const [delMfa, setDelMfa] = useState(null)
  const [genTok, setGenTok] = useState(false)
  const [revoke, setRevoke] = useState(null)
  const [tokTab, setTokTab] = useState('active')
  const isExpired = (t) => new Date(t.expires) < new Date('2026-11-10T10:15:00')
  const shownTokens = tokens.filter((t) => (tokTab === 'active' ? !isExpired(t) : isExpired(t)))
  return (
    <>
      <SectionTitle title="Xác thực" desc="Quản lý cách bạn đăng nhập và cách công cụ bên ngoài truy cập Lạc Việt Data thay bạn." />
      <Group title="Chung">
        <Row label="Mật khẩu" desc="Đổi lần gần nhất 94 ngày trước"><Button size="sm" variant="outline" onClick={() => setPw(true)}>Đổi mật khẩu</Button></Row>
      </Group>
      <Group title="Xác thực đa yếu tố (MFA)" desc="Tăng bảo mật cho tài khoản bằng nhiều phương thức xác thực."
        action={<Button size="sm" variant="outline" icon={Plus} onClick={() => setAddMfa(true)}>Thêm phương thức</Button>}>
        <div className="px-5 py-3 ds-caption">{mfa.length} phương thức MFA đã đăng ký</div>
        {mfa.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-5 py-3">
            <span className="size-9 rounded-lg grid place-items-center bg-brand-50 text-brand-ink">{m.kind === 'Khoá truy cập' ? <Fingerprint size={17} /> : <Smartphone size={17} />}</span>
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-[600]">{m.name}</div><div className="ds-caption">{m.kind} · thêm ngày {formatDate(m.added)}</div></div>
            <Button size="sm" variant="ghost" icon={Trash2} disabled={mfa.length <= 1} onClick={() => setDelMfa(m)}>Gỡ</Button>
          </div>
        ))}
      </Group>
      <Group title="Mã truy cập lập trình" desc="Tạo mã để công cụ dòng lệnh, trình kết nối hoặc ứng dụng khác xác thực thay bạn."
        action={<Button size="sm" variant="outline" icon={Plus} onClick={() => setGenTok(true)}>Tạo mã</Button>}>
        <div className="px-5 pt-3 pb-1">
          <Segmented size="sm" value={tokTab} onChange={setTokTab} options={[{ value: 'active', label: `Đang hiệu lực (${tokens.filter((t) => !isExpired(t)).length})` }, { value: 'expired', label: 'Đã hết hạn' }]} />
        </div>
        {shownTokens.length ? shownTokens.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3">
            <span className="size-9 rounded-lg grid place-items-center bg-subtle text-dim"><KeyRound size={16} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-[600] font-mono">{t.name}</div>
              <div className="ds-caption truncate">{t.comment || 'Không có ghi chú'} · {t.role} · ••••{t.last4}</div>
            </div>
            <span className="ds-caption text-right shrink-0">Hết hạn<br />{formatDate(t.expires)}</span>
            <Button size="sm" variant="ghost" onClick={() => setRevoke(t)}>Thu hồi</Button>
          </div>
        )) : <div className="px-5 py-5 text-center ds-caption">{tokTab === 'active' ? 'Không có mã truy cập nào đang hiệu lực.' : 'Không có mã đã hết hạn.'}</div>}
        {!policies.length && (
          <div className="px-5 py-3">
            <Callout tone="warn" icon={AlertTriangle} title="Thiếu chính sách mạng">Mã truy cập chỉ dùng được khi tài khoản có chính sách mạng. Quản trị viên có thể tạo trong Trung tâm bảo mật, hoặc cấp ngoại lệ tạm thời cho mã của bạn.</Callout>
          </div>
        )}
      </Group>

      <PasswordModal open={pw} onClose={() => setPw(false)} />
      <AddMfaModal open={addMfa} onClose={() => setAddMfa(false)} />
      <TokenModal open={genTok} onClose={() => setGenTok(false)} />
      <Confirm open={!!delMfa} onClose={() => setDelMfa(null)} danger confirmLabel="Gỡ phương thức" title="Gỡ phương thức MFA?" desc={delMfa ? `“${delMfa.name}” sẽ không dùng để đăng nhập được nữa.` : ''}
        onConfirm={() => { update('mfa', (l) => l.filter((x) => x.id !== delMfa.id)); toast('Đã gỡ phương thức MFA') }} />
      <Confirm open={!!revoke} onClose={() => setRevoke(null)} danger confirmLabel="Thu hồi" title="Thu hồi mã truy cập?" desc={revoke ? `Mọi công cụ đang dùng ${revoke.name} sẽ mất quyền truy cập ngay.` : ''}
        onConfirm={() => { update('tokens', (l) => (l || []).filter((x) => x.id !== revoke.id)); toast(`Đã thu hồi ${revoke.name}`) }} />
    </>
  )
}

function PasswordModal({ open, onClose }) {
  const [f, setF] = useState({ cur: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  useEffect(() => { if (open) setF({ cur: '', next: '', confirm: '' }) }, [open])
  const rules = [
    [f.next.length >= 14, 'Ít nhất 14 ký tự'],
    [/[A-Z]/.test(f.next) && /[a-z]/.test(f.next), 'Có chữ hoa và chữ thường'],
    [/\d/.test(f.next), 'Có ít nhất 1 chữ số'],
    [/[^A-Za-z0-9]/.test(f.next), 'Có ít nhất 1 ký tự đặc biệt'],
  ]
  const ok = f.cur && rules.every((r) => r[0]) && f.next === f.confirm && f.next !== f.cur
  return (
    <Modal open={open} onClose={onClose} title="Đổi mật khẩu" size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={() => { toast({ title: 'Đã đổi mật khẩu', desc: 'Các phiên đăng nhập khác đã được đăng xuất.' }); onClose() }}>Đổi mật khẩu</Button></>}>
      <div className="flex flex-col gap-3.5">
        <Input label="Mật khẩu hiện tại" type={show ? 'text' : 'password'} value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} autoFocus />
        <Input label="Mật khẩu mới" type={show ? 'text' : 'password'} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
        <ul className="grid grid-cols-2 gap-1">
          {rules.map(([pass, t]) => <li key={t} className={cn('text-[12px] flex items-center gap-1.5', pass ? 'text-pos' : 'text-faint')}><CheckCircle2 size={13} />{t}</li>)}
        </ul>
        <Input label="Xác nhận mật khẩu mới" type={show ? 'text' : 'password'} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={f.confirm && f.confirm !== f.next ? 'Mật khẩu không khớp' : ''} />
        <button type="button" onClick={() => setShow(!show)} className="self-start flex items-center gap-1.5 text-[12.5px] text-muted hover:text-fg">{show ? <EyeOff size={14} /> : <Eye size={14} />}{show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
      </div>
    </Modal>
  )
}

const SECRET = 'JBSW Y3DP EHPK 3PXP N4XC'
function AddMfaModal({ open, onClose }) {
  const { update } = useApp()
  const user = useAuth((s) => s.user)
  const [step, setStep] = useState('choose')
  const [kind, setKind] = useState('app')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [nick, setNick] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setStep('choose'); setKind('app'); setCode(''); setErr(''); setNick(''); setBusy(false) } }, [open])
  const next = () => {
    if (kind === 'app') return setStep('qr')
    setStep('passkey'); setBusy(true)
    setTimeout(() => { setBusy(false); setNick('Khoá truy cập trên máy tính'); setStep('done') }, 1600)
  }
  const verify = () => {
    if (code === '000000') { setErr('Mã không đúng. Hãy nhập mã 6 số đang hiển thị trong ứng dụng xác thực.'); return }
    setBusy(true)
    setTimeout(() => { setBusy(false); setNick('Ứng dụng xác thực'); setStep('done') }, 700)
  }
  const finish = () => {
    update('mfa', (l) => [...l, { id: uid('mfa'), kind: kind === 'app' ? 'Ứng dụng xác thực' : 'Khoá truy cập', name: nick.trim() || 'Phương thức mới', added: new Date().toISOString().slice(0, 10) }])
    toast('Đã thêm phương thức xác thực'); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} size="sm" title={step === 'done' ? undefined : step === 'qr' ? 'Thiết lập ứng dụng xác thực' : 'Thêm phương thức MFA'} hideClose={step === 'done'}
      footer={step === 'choose' ? <><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={next}>Tiếp tục</Button></>
        : step === 'qr' ? <><Button variant="secondary" onClick={() => setStep('choose')}>Quay lại</Button><Button variant="primary" loading={busy} disabled={code.length !== 6} onClick={verify}>Xác minh</Button></>
          : step === 'done' ? <Button variant="primary" className="w-full" onClick={finish}>Tiếp tục</Button> : null}>
      {step === 'choose' && (
        <RadioCards value={kind} onChange={setKind} options={[
          { value: 'passkey', label: 'Khoá truy cập', desc: 'Khuyến nghị · Đăng nhập bằng vân tay, khuôn mặt hoặc mã PIN của thiết bị', icon: Fingerprint },
          { value: 'app', label: 'Ứng dụng xác thực', desc: 'Dùng ứng dụng tạo mã 6 số trên điện thoại', icon: Smartphone },
        ]} />
      )}
      {step === 'qr' && (
        <div className="flex flex-col items-center text-center gap-3">
          <p className="ds-caption">Mở ứng dụng xác thực trên điện thoại và quét mã QR để thêm tài khoản <b className="text-fg">{user.username}</b>.</p>
          <div className="rounded-xl border border-line p-3 bg-white"><QrCode value={`lacviet:${user.username}`} size={150} /></div>
          <details className="text-[12.5px] text-muted">
            <summary className="cursor-pointer hover:text-fg">Không quét được mã?</summary>
            <div className="mt-2 flex items-center gap-2 justify-center font-mono text-fg">{SECRET}<button onClick={() => { navigator.clipboard?.writeText(SECRET.replace(/ /g, '')); toast('Đã sao chép khoá') }} aria-label="Sao chép"><Copy size={13} /></button></div>
          </details>
          <div className="text-[13px] font-[600] mt-1">Nhập mã 6 số từ ứng dụng</div>
          <OtpInput value={code} onChange={(v) => { setCode(v); setErr('') }} />
          {err && <p className="text-[12.5px] text-neg">{err}</p>}
          <p className="ds-caption">Bản demo chấp nhận mọi mã 6 số (trừ 000000).</p>
        </div>
      )}
      {step === 'passkey' && (
        <div className="py-8 text-center"><Loader2 size={32} className="mx-auto animate-spin text-brand-500" /><div className="font-[600] mt-3">Đang chờ thiết bị xác nhận…</div><div className="ds-caption mt-1">Làm theo hướng dẫn trên màn hình của trình duyệt.</div></div>
      )}
      {step === 'done' && (
        <div className="text-center pt-2">
          <CheckCircle2 size={44} className="mx-auto text-pos" />
          <h2 className="ds-h2 mt-3">Đã thêm {kind === 'app' ? 'ứng dụng xác thực' : 'khoá truy cập'}</h2>
          <p className="ds-caption mt-1">Từ lần sau, bạn có thể dùng phương thức này để đăng nhập Lạc Việt Data. Đặt tên gợi nhớ để dễ quản lý.</p>
          <Input className="mt-4 text-left" label="Tên gợi nhớ" value={nick} onChange={(e) => setNick(e.target.value)} autoFocus />
        </div>
      )}
    </Modal>
  )
}

function TokenModal({ open, onClose }) {
  const { roles, update, currentRole } = useApp()
  const [f, setF] = useState({})
  const [token, setToken] = useState(null)
  useEffect(() => { if (open) { setToken(null); setF({ name: '', comment: '', days: '30', scope: 'one', role: currentRole }) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const gen = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    let t = 'tt_pat_'
    for (let i = 0; i < 40; i++) t += chars[Math.floor(Math.random() * chars.length)]
    const exp = new Date('2026-11-10T10:15:00'); exp.setDate(exp.getDate() + +f.days)
    const name = f.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    update('tokens', (l) => [{ id: uid('tok'), name, comment: f.comment, role: f.scope === 'one' ? f.role : 'Tất cả vai trò', expires: exp.toISOString(), created: new Date().toISOString(), last4: t.slice(-4) }, ...(l || [])])
    setToken(t)
  }
  if (token) {
    return (
      <Modal open={open} onClose={onClose} size="sm" hideClose footer={<Button variant="primary" className="w-full" icon={Copy} onClick={() => { navigator.clipboard?.writeText(token); toast('Đã sao chép mã truy cập'); onClose() }}>Sao chép & đóng</Button>}>
        <div className="text-center pt-2">
          <CheckCircle2 size={40} className="mx-auto text-pos" />
          <h2 className="ds-h2 mt-3">Đã tạo mã truy cập</h2>
          <p className="ds-caption mt-1">Hãy sao chép và lưu ở nơi an toàn. Bạn sẽ <b>không xem lại được</b> mã này.</p>
        </div>
        <div className="mt-4 rounded-xl bg-subtle border border-line px-3 py-2.5 font-mono text-[12.5px] break-all select-all">{token}</div>
      </Modal>
    )
  }
  const ok = f.name?.trim()
  return (
    <Modal open={open} onClose={onClose} title="Mã truy cập lập trình mới" desc="Dùng thay mật khẩu cho công cụ dòng lệnh, trình kết nối, quy trình tự động."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={gen}>Tạo mã</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên" autoFocus value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="vd: dbt_dong_bo_hang_dem" />
        <Textarea label="Ghi chú" optional rows={2} value={f.comment || ''} onChange={(e) => setF({ ...f, comment: e.target.value })} placeholder="Mã này dùng cho việc gì, ai giữ?" />
        <Select label="Hết hạn sau" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} options={[{ value: '1', label: '1 ngày' }, { value: '7', label: '7 ngày' }, { value: '15', label: '15 ngày' }, { value: '30', label: '30 ngày' }, { value: '90', label: '90 ngày' }]} />
        <div>
          <div className="text-[13px] font-[550] text-dim mb-1.5">Phạm vi quyền</div>
          <RadioCards value={f.scope} onChange={(v) => setF({ ...f, scope: v })} options={[{ value: 'one', label: 'Một vai trò (khuyến nghị)', desc: 'Mã chỉ có quyền của vai trò được chọn' }, { value: 'all', label: 'Mọi vai trò của tôi', desc: 'Kế thừa toàn bộ quyền bạn đang có' }]} />
          {f.scope === 'one' && <Select className="mt-2" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} options={roles.map((r) => r.name)} />}
        </div>
      </div>
    </Modal>
  )
}

/* ---------------- Kết nối công cụ AI ---------------- */
export function AIConnections() {
  const list = useApp((s) => s.mcpConnections || NONE)
  const { update } = useApp()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', url: '', auth: 'oauth' })
  return (
    <>
      <SectionTitle title="Kết nối công cụ AI" desc="Kết nối máy chủ công cụ bên ngoài (giao thức MCP) để Tinh Ý và tác tử AI dùng thêm công cụ: tìm kiếm web, lịch, hệ thống bán hàng…"
        action={<Button variant="primary" icon={Plus} onClick={() => { setF({ name: '', url: '', auth: 'oauth' }); setOpen(true) }}>Thêm kết nối</Button>} />
      {!list.length ? (
        <div className="card"><EmptyState icon={Plug} title="Chưa có kết nối nào" desc="Khi quản trị viên cấu hình, các kết nối bạn được dùng sẽ hiện ở đây." /></div>
      ) : (
        <div className="card divide-y divide-line">
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="size-9 rounded-lg grid place-items-center bg-brand-50 text-brand-ink"><Plug size={16} /></span>
              <div className="min-w-0 flex-1"><div className="font-[600] text-[13.5px]">{c.name}</div><div className="ds-caption font-mono truncate">{c.url}</div></div>
              <Badge tone="pos" dot>Đã kết nối</Badge>
              <button onClick={() => { update('mcpConnections', () => list.filter((x) => x.id !== c.id)); toast(`Đã gỡ ${c.name}`) }} className="text-faint hover:text-neg p-1" aria-label="Gỡ"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Thêm kết nối công cụ AI"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Huỷ</Button><Button variant="primary" disabled={!f.name.trim() || !/^https:\/\/\S+/.test(f.url)} onClick={() => {
          update('mcpConnections', () => [...list, { id: uid('mcp'), ...f }]); toast(`Đã kết nối ${f.name}`); setOpen(false)
        }}>Kết nối</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="Tên hiển thị" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="vd: Lịch làm việc cửa hàng" />
          <Input label="Địa chỉ máy chủ" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://mcp.phonui.demo/lich" error={f.url && !/^https:\/\/\S+/.test(f.url) ? 'Địa chỉ phải bắt đầu bằng https://' : ''} />
          <Select label="Xác thực" value={f.auth} onChange={(e) => setF({ ...f, auth: e.target.value })} options={[{ value: 'oauth', label: 'OAuth (đăng nhập qua trình duyệt)' }, { value: 'token', label: 'Mã bí mật' }, { value: 'none', label: 'Không xác thực (chỉ mạng nội bộ)' }]} />
          <Callout tone="info" icon={ShieldCheck}>Tinh Ý luôn hỏi bạn trước khi gọi một công cụ có thể thay đổi dữ liệu.</Callout>
        </div>
      </Modal>
    </>
  )
}

