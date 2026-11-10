import { useEffect, useState } from 'react'
import {
  Copy, Building2, Cloud, MapPin, Gem, Info, Plus, CheckCircle2, Download, Landmark, Mail, KeyRound, Check, Sparkles,
} from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Tabs, Badge, Modal, Input, Select, Textarea, EmptyState, Progress, Callout, Popover, Menu, KeyValue, Checkbox } from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui/Table'
import { useApp, useAuth, toast, uid } from '@/store'
import { ORG, EDITIONS, CLOUDS, REGIONS, TRIAL, CREDIT_PRICE } from '@/data/platform'
import { formatVND, formatCompact, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CodeBox } from '@/features/admin/shared'

const TABS = [
  { value: 'account', label: 'Tài khoản' },
  { value: 'billing', label: 'Thanh toán' },
  { value: 'terms', label: 'Điều khoản' },
  { value: 'integrations', label: 'Tích hợp' },
]

export default function AccountPage() {
  const [tab, setTab] = useState('account')
  return (
    <Page title="Tài khoản & thanh toán" desc="Thông tin tài khoản Lạc Việt Data của Phố Núi, gói dịch vụ, hoá đơn và các tích hợp hệ thống.">
      <Tabs value={tab} onChange={setTab} options={TABS} className="mb-6" />
      {tab === 'account' && <AccountTab />}
      {tab === 'billing' && <BillingTab />}
      {tab === 'terms' && <TermsTab />}
      {tab === 'integrations' && <IntegrationsTab />}
    </Page>
  )
}

const copy = (t, msg = 'Đã sao chép') => { navigator.clipboard?.writeText(t); toast(msg) }

/* ---------------- Tài khoản ---------------- */
function AccountTab() {
  const accounts = useApp((s) => s.orgAccounts) || []
  const [details, setDetails] = useState(false)
  const [create, setCreate] = useState(false)
  const cloud = CLOUDS.find((c) => c.name === ORG.cloud)
  const cards = [
    { icon: Building2, label: 'Mã định danh tài khoản', value: ORG.account, mono: true },
    { icon: Info, label: 'Mã định vị', value: ORG.locator, mono: true },
    { icon: Gem, label: 'Phiên bản', value: ORG.edition },
    { icon: Cloud, label: 'Nhà cung cấp đám mây', value: ORG.cloud },
    { icon: MapPin, label: 'Vùng', value: `${ORG.region} (${ORG.regionId})` },
  ]
  return (
    <div className="flex flex-col gap-5">
      <Callout tone="brand" icon={Sparkles} title="Nâng cấp lên tài khoản tổ chức" action={<Button size="sm" variant="primary" onClick={() => setCreate(true)}>Tạo tài khoản tổ chức</Button>}>
        Quản lý nhiều tài khoản (vd: tài khoản thử nghiệm và vận hành) dưới một tổ chức, xem chi phí gộp và sao chép dữ liệu giữa các vùng.
      </Callout>
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="size-11 rounded-xl grid place-items-center text-white font-[700]" style={{ background: cloud?.color }}>PN</span>
            <div>
              <div className="ds-h2">{ORG.name}</div>
              <button onClick={() => copy(`https://${ORG.url}`, 'Đã sao chép địa chỉ tài khoản')} className="flex items-center gap-1.5 text-[13px] text-brand-ink hover:underline font-mono">https://{ORG.url}<Copy size={13} /></button>
            </div>
          </div>
          <Button variant="outline" onClick={() => setDetails(true)}>Xem chi tiết kết nối</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl bg-subtle px-3.5 py-3">
              <div className="flex items-center gap-1.5 ds-caption"><c.icon size={13} />{c.label}</div>
              <div className={cn('mt-1 font-[600] text-[13.5px] break-all', c.mono && 'font-mono')}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between"><h3 className="ds-h3">Tất cả tài khoản</h3><Button size="sm" variant="outline" icon={Plus} onClick={() => setCreate(true)}>Tài khoản</Button></div>
        <Table minWidth={820}>
          <THead><Th>Tài khoản</Th><Th>Phiên bản</Th><Th>Đám mây</Th><Th>Vùng</Th><Th>Ngày tạo</Th><Th>Mã định vị</Th><Th>Vai trò tổ chức</Th></THead>
          <tbody>
            <Tr>
              <Td><div className="font-mono font-[600] text-[12.5px]">{ORG.account}</div><div className="ds-caption">Tài khoản hiện tại</div></Td>
              <Td>{ORG.edition}</Td><Td>{ORG.cloud}</Td><Td>{ORG.region}</Td><Td>{formatDate(ORG.created)}</Td>
              <Td className="font-mono text-[12.5px]">{ORG.locator}</Td><Td><Badge tone="pos" dot>Đã bật</Badge></Td>
            </Tr>
            {accounts.map((a) => (
              <Tr key={a.id}>
                <Td><div className="font-mono font-[600] text-[12.5px]">{a.name}</div><div className="ds-caption">Quản trị: {a.admin}</div></Td>
                <Td>{a.edition}</Td><Td>{a.cloud}</Td><Td>{a.region}</Td><Td>{formatDate(a.created)}</Td>
                <Td className="font-mono text-[12.5px]">{a.locator}</Td><Td><Badge size="sm">Thành viên</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <AccountDetailsModal open={details} onClose={() => setDetails(false)} />
      <CreateOrgAccountModal open={create} onClose={() => setCreate(false)} />
    </div>
  )
}

function AccountDetailsModal({ open, onClose }) {
  const user = useAuth((s) => s.user)
  const { currentRole, currentWarehouse } = useApp()
  const [tab, setTab] = useState('acc')
  const [wh, setWh] = useState(currentWarehouse)
  const config = `[connections.phonui]\naccount = "${ORG.account}"\nhost = "${ORG.url}"\nuser = "${user.username}"\nauthenticator = "externalbrowser"\nrole = "${currentRole}"\nwarehouse = "${wh}"\ndatabase = "PHO_NUI_DB"\nschema = "BAN_HANG"`
  const rows = [
    ['Mã định danh tài khoản', `${ORG.locator}-${ORG.account}`, 'SELECT CURRENT_ORGANIZATION_NAME() || \'-\' || CURRENT_ACCOUNT_NAME();'],
    ['Mã chia sẻ dữ liệu', `${ORG.locator}.${ORG.account}`, 'SELECT CURRENT_ACCOUNT();'],
    ['Tên tổ chức', ORG.locator, 'SELECT CURRENT_ORGANIZATION_NAME();'],
    ['Tên tài khoản', ORG.account, 'SELECT CURRENT_ACCOUNT_NAME();'],
    ['Địa chỉ máy chủ', ORG.url, 'SELECT CURRENT_ACCOUNT_URL();'],
    ['Tên đăng nhập', user.username, 'SELECT CURRENT_USER();'],
    ['Vai trò', currentRole, 'SELECT CURRENT_ROLE();'],
    ['Đám mây', ORG.cloud, 'SELECT CURRENT_REGION();'],
    ['Phiên bản', ORG.edition, 'SELECT CURRENT_VERSION();'],
  ]
  return (
    <Modal open={open} onClose={onClose} size="xl" title="Thông tin tài khoản" footer={<Button variant="secondary" onClick={onClose}>Đóng</Button>}>
      <Tabs value={tab} onChange={setTab} className="mb-4 -mt-2" options={[{ value: 'acc', label: 'Tài khoản' }, { value: 'cfg', label: 'Tệp cấu hình' }, { value: 'drv', label: 'Trình kết nối' }, { value: 'sql', label: 'Lệnh SQL' }]} />
      {tab === 'acc' && (
        <div className="rounded-xl border border-line divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
              <span className="w-48 text-muted shrink-0">{k}</span><span className="flex-1 font-mono break-all">{v}</span>
              <button onClick={() => copy(v)} className="text-faint hover:text-fg" aria-label="Sao chép"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {tab === 'cfg' && (
        <div className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Kho tính toán" value={wh} onChange={(e) => setWh(e.target.value)} options={useApp.getState().warehouses.map((w) => w.name)} />
            <Select label="Phương thức kết nối" options={['Trình duyệt web (SSO)', 'Khoá bí mật', 'Mã truy cập lập trình']} />
          </div>
          <CodeBox label="~/.lacviet/config.toml">{config}</CodeBox>
        </div>
      )}
      {tab === 'drv' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[['Python', 'pip install lacviet-connector'], ['Node.js', 'npm install @lacviet/sdk'], ['JDBC', 'lacviet-jdbc-3.21.0.jar'], ['Công cụ dòng lệnh', 'lv connection test -c phonui']].map(([n, c]) => (
            <div key={n} className="rounded-xl border border-line p-4">
              <div className="font-[600]">{n}</div>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 font-mono text-[12.5px]"><span className="truncate">{c}</span><button onClick={() => copy(c)} className="text-faint hover:text-fg shrink-0" aria-label="Sao chép"><Copy size={13} /></button></div>
            </div>
          ))}
        </div>
      )}
      {tab === 'sql' && (
        <div className="rounded-xl border border-line divide-y divide-line">
          {rows.map(([k, , q]) => (
            <div key={k} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
              <span className="w-48 text-muted shrink-0">{k}</span><span className="flex-1 font-mono text-brand-ink break-all">{q}</span>
              <button onClick={() => copy(q)} className="text-faint hover:text-fg" aria-label="Sao chép"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function CreateOrgAccountModal({ open, onClose }) {
  const { update } = useApp()
  const [step, setStep] = useState(0)
  const [f, setF] = useState({})
  const [done, setDone] = useState(null)
  useEffect(() => { if (open) { setStep(0); setDone(null); setF({ cloud: CLOUDS[0].name, region: REGIONS[0].name, edition: 'Doanh nghiệp', name: '', admin: '', password: '', confirm: '', email: '' }) } }, [open])
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const n = (f.name || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const errPw = f.password && f.password.length < 8 ? 'Ít nhất 8 ký tự' : f.confirm && f.confirm !== f.password ? 'Mật khẩu không khớp' : ''
  const ok1 = n && f.admin && f.password && !errPw && f.confirm === f.password && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email || '')
  const create = () => {
    const acc = { id: uid('acc'), name: n, admin: f.admin, email: f.email, cloud: f.cloud, region: f.region, edition: f.edition, created: new Date().toISOString().slice(0, 10), locator: 'PN' + Math.floor(10000 + Math.random() * 89999), url: `phonui-${n.toLowerCase().replace(/_/g, '-')}.lacviet.demo` }
    update('orgAccounts', (l) => [...(l || []), acc])
    setDone(acc)
  }
  if (done) {
    return (
      <Modal open={open} onClose={onClose} hideClose size="md" footer={<Button variant="primary" onClick={onClose}>Xong</Button>}>
        <div className="text-center pt-2"><CheckCircle2 size={44} className="mx-auto text-pos" /><h2 className="ds-h2 mt-3">Đã tạo tài khoản thành công</h2><p className="ds-caption">Có thể mất tới 30 giây để địa chỉ tài khoản sẵn sàng.</p></div>
        <div className="mt-5 ds-label">Chi tiết tài khoản</div>
        <KeyValue items={[
          { label: 'Tên tài khoản', value: done.name }, { label: 'Địa chỉ', value: <span className="font-mono text-[12.5px]">https://{done.url}</span> },
          { label: 'Mã định vị', value: done.locator }, { label: 'Phiên bản', value: done.edition }, { label: 'Đám mây', value: done.cloud }, { label: 'Vùng', value: done.region },
        ]} />
        <div className="mt-4 ds-label">Đăng nhập quản trị</div>
        <KeyValue items={[{ label: 'Tên người dùng', value: done.admin }, { label: 'Email', value: done.email }]} />
      </Modal>
    )
  }
  return (
    <Modal open={open} onClose={onClose} title="Tạo tài khoản tổ chức" desc={step === 0 ? 'Bước 1/2 · Chọn nơi đặt dữ liệu' : `Bước 2/2 · ${f.cloud} · ${f.region} · ${f.edition}`}
      footer={step === 0
        ? <><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => setStep(1)}>Tiếp tục</Button></>
        : <><Button variant="secondary" onClick={() => setStep(0)}>Quay lại</Button><Button variant="primary" disabled={!ok1} onClick={create}>Tạo tài khoản</Button></>}>
      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <Select label="Nhà cung cấp đám mây" value={f.cloud} onChange={s('cloud')} options={CLOUDS.map((c) => ({ value: c.name, label: `${c.name} — ${c.desc}` }))} />
          <Select label="Vùng" value={f.region} onChange={s('region')} options={REGIONS.map((r) => r.name)} />
          <Select label="Phiên bản" value={f.edition} onChange={s('edition')} options={EDITIONS.map((e) => ({ value: e.name, label: `${e.name} — ${formatVND(e.price)}/tín dụng` }))} />
          <Callout tone="info" icon={Info}>Tài khoản mới dùng chung hợp đồng và hoá đơn với {ORG.account}. Dữ liệu không tự sao chép giữa các tài khoản.</Callout>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input className="sm:col-span-2" label="Tên tài khoản" autoFocus value={f.name} onChange={s('name')} placeholder="vd: THU_NGHIEM" hint={n ? `Lưu thành ${n}` : undefined} />
          <Input label="Tên quản trị viên" value={f.admin} onChange={s('admin')} placeholder="vd: thuha_admin" />
          <Input label="Email quản trị viên" type="email" value={f.email} onChange={s('email')} placeholder="ha.le@phonui.demo" />
          <Input label="Mật khẩu" type="password" value={f.password} onChange={s('password')} error={f.password && f.password.length < 8 ? 'Ít nhất 8 ký tự' : ''} />
          <Input label="Xác nhận mật khẩu" type="password" value={f.confirm} onChange={s('confirm')} error={f.confirm && f.confirm !== f.password ? 'Mật khẩu không khớp' : ''} />
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Thanh toán ---------------- */
const STATEMENTS = ['2026-10', '2026-09', '2026-08', '2026-07', '2026-06'].map((m, i) => ({ id: m, month: m, credits: [148.2, 131.6, 126.9, 140.3, 118.4][i] }))
function BillingTab() {
  const payment = useApp((s) => s.billing)
  const { update } = useApp()
  const [edit, setEdit] = useState(false)
  const [upgrade, setUpgrade] = useState(null)
  const plan = useApp((s) => s.plan) || 'Doanh nghiệp'
  const left = TRIAL.total - TRIAL.used
  return (
    <div className="flex flex-col gap-5">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <div className="card p-5">
          <h3 className="ds-h3">Tín dụng dùng thử</h3>
          <div className="flex items-baseline gap-2 mt-3"><span className="text-[28px] font-[650] num">{formatCompact(left)} ₫</span><span className="text-muted">/ {formatCompact(TRIAL.total)} ₫</span></div>
          <Progress value={left} max={TRIAL.total} auto={false} className="mt-2" />
          <div className="ds-caption mt-1.5">Còn {TRIAL.daysLeft} ngày dùng thử. Sau thời gian này, tài khoản tạm ngưng nếu chưa có phương thức thanh toán.</div>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="ds-h3">Phương thức thanh toán</h3><p className="ds-caption mt-0.5">Thanh toán bằng chuyển khoản theo hoá đơn GTGT hằng tháng. Lạc Việt Data không lưu thông tin thẻ.</p></div>
            <Button size="sm" variant={payment ? 'outline' : 'primary'} icon={payment ? undefined : Plus} onClick={() => setEdit(true)}>{payment ? 'Sửa' : 'Thêm'}</Button>
          </div>
          {payment ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-line p-3.5">
              <span className="size-10 rounded-lg grid place-items-center bg-brand-50 text-brand-ink shrink-0"><Landmark size={18} /></span>
              <div className="min-w-0 text-[13.5px]">
                <div className="font-[600]">{payment.company}</div>
                <div className="text-muted">MST {payment.tax} · {payment.address}</div>
                <div className="text-muted flex items-center gap-1.5"><Mail size={13} />{payment.email}</div>
              </div>
              <Badge tone="pos" className="ml-auto shrink-0">Đã xác minh</Badge>
            </div>
          ) : <EmptyState compact icon={Landmark} title="Chưa có phương thức thanh toán" desc="Thêm thông tin xuất hoá đơn để tiếp tục dùng sau thời gian thử." />}
        </div>
      </div>
      <div>
        <h3 className="ds-h2 mb-3">Gói dịch vụ</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {EDITIONS.map((e) => {
            const cur = e.name === plan
            return (
              <div key={e.id} className={cn('card p-5 flex flex-col', cur && 'ring-2 ring-brand-400 border-brand-300')}>
                <div className="flex items-center justify-between gap-2"><span className="font-[650] text-[16px]">{e.name}</span>{cur ? <Badge tone="brand">Gói hiện tại</Badge> : e.popular ? <Badge tone="gold">Phổ biến</Badge> : null}</div>
                <div className="mt-2"><span className="text-[24px] font-[700] num">{formatVND(e.price)}</span><span className="text-muted text-[13px]"> / tín dụng</span></div>
                <p className="ds-caption mt-1">{e.desc}</p>
                <ul className="mt-3 flex flex-col gap-1.5 flex-1">{e.features.map((x) => <li key={x} className="flex gap-2 text-[13px]"><Check size={15} className="text-pos shrink-0 mt-0.5" />{x}</li>)}</ul>
                <Button className="mt-4" variant={cur ? 'secondary' : 'outline'} disabled={cur} onClick={() => setUpgrade(e)}>{cur ? 'Đang sử dụng' : 'Chuyển sang gói này'}</Button>
              </div>
            )
          })}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Bảng kê sử dụng</h3><p className="ds-caption">Bảng kê theo tháng (giá trị tham khảo trong thời gian dùng thử, chưa phát sinh thanh toán)</p></div>
        <Table minWidth={620}>
          <THead><Th>Kỳ</Th><Th align="right">Tín dụng</Th><Th align="right">Thành tiền (tham khảo)</Th><Th>Trạng thái</Th><Th /></THead>
          <tbody>
            {STATEMENTS.map((s) => (
              <Tr key={s.id}>
                <Td>Tháng {+s.month.slice(5)}/{s.month.slice(0, 4)}</Td>
                <Td align="right" className="num">{s.credits.toLocaleString('vi-VN')}</Td>
                <Td align="right" className="num font-[600]">{formatVND(s.credits * CREDIT_PRICE)}</Td>
                <Td><Badge tone="info" size="sm">Trừ vào tín dụng thử</Badge></Td>
                <Td align="right"><Button size="xs" variant="ghost" icon={Download} onClick={() => toast({ title: `Đang tải bảng kê tháng ${+s.month.slice(5)}`, desc: `bang_ke_${s.month}.pdf` })}>PDF</Button></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <PaymentModal open={edit} onClose={() => setEdit(false)} value={payment} onSave={(v) => { update('billing', () => v); toast('Đã lưu thông tin xuất hoá đơn') }} />
      <Modal open={!!upgrade} onClose={() => setUpgrade(null)} size="sm" title={`Chuyển sang gói ${upgrade?.name}?`} desc={`Giá mới ${upgrade ? formatVND(upgrade.price) : ''}/tín dụng, áp dụng từ kỳ thanh toán tiếp theo.`}
        footer={<><Button variant="secondary" onClick={() => setUpgrade(null)}>Huỷ</Button><Button variant="primary" onClick={() => { update('plan', () => upgrade.name); toast(`Đã chuyển sang gói ${upgrade.name}`); setUpgrade(null) }}>Xác nhận</Button></>}>
        <p className="text-[13.5px] text-muted">Tính năng thay đổi có hiệu lực ngay. Bạn có thể đổi lại bất cứ lúc nào trong thời gian dùng thử.</p>
      </Modal>
    </div>
  )
}

function PaymentModal({ open, onClose, value, onSave }) {
  const [f, setF] = useState({})
  useEffect(() => { if (open) setF(value || { company: 'Công ty CP Phố Núi', tax: '', address: '', email: 'ketoan@phonui.demo', note: '' }) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const taxOk = /^\d{10}(-\d{3})?$/.test(f.tax || '')
  const ok = f.company && taxOk && f.address && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email || '')
  return (
    <Modal open={open} onClose={onClose} title="Chuyển khoản theo hoá đơn GTGT" desc="Mỗi tháng Lạc Việt Data gửi hoá đơn điện tử tới email kế toán; bạn chuyển khoản trong 15 ngày."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={() => { onSave(f); onClose() }}>Lưu</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên công ty (theo đăng ký kinh doanh)" value={f.company || ''} onChange={s('company')} />
        <Input label="Mã số thuế" value={f.tax || ''} onChange={s('tax')} placeholder="10 số, vd: 0312345678" error={f.tax && !taxOk ? 'Mã số thuế gồm 10 số (hoặc 13 ký tự với chi nhánh)' : ''} inputMode="numeric" />
        <Textarea label="Địa chỉ xuất hoá đơn" rows={2} value={f.address || ''} onChange={s('address')} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" />
        <Input label="Email nhận hoá đơn" type="email" value={f.email || ''} onChange={s('email')} />
        <Callout tone="neutral" icon={Info}>Bản demo không thu thập hay xử lý thanh toán thật.</Callout>
      </div>
    </Modal>
  )
}

/* ---------------- Điều khoản ---------------- */
function TermsTab() {
  const accepted = useApp((s) => s.acceptedTerms) || ['cho', 'nha-cung-cap']
  const { update } = useApp()
  const [open, setOpen] = useState(null)
  const [agree, setAgree] = useState(false)
  const terms = [
    { id: 'lien-vung', name: 'Tuyên bố xử lý liên vùng', desc: 'Cho phép tự động sao chép dữ liệu Chợ dữ liệu từ vùng khác về vùng TP. Hồ Chí Minh.' },
    { id: 'cho', name: 'Điều khoản sử dụng Chợ dữ liệu', desc: 'Áp dụng khi tài khoản nhận dữ liệu từ nhà cung cấp.' },
    { id: 'nha-cung-cap', name: 'Điều khoản nhà cung cấp & người dùng', desc: 'Quy định quyền và nghĩa vụ khi chia sẻ hoặc nhận dữ liệu.' },
    { id: 'ai', name: 'Điều khoản sử dụng hàm AI', desc: 'Dữ liệu gửi tới hàm AI xử lý trong vùng, không dùng để huấn luyện mô hình.' },
  ]
  const cur = terms.find((t) => t.id === open)
  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-2"><h3 className="ds-h3">Điều khoản của Chợ dữ liệu & dịch vụ</h3></div>
      <Table minWidth={640}>
        <THead><Th>Điều khoản</Th><Th>Mô tả</Th><Th>Trạng thái</Th><Th /></THead>
        <tbody>
          {terms.map((t) => {
            const ok = accepted.includes(t.id)
            return (
              <Tr key={t.id}>
                <Td className="font-[600]">{t.name}</Td>
                <Td className="text-muted max-w-[360px]">{t.desc}</Td>
                <Td>{ok ? <Badge tone="pos" icon={Check}>Đã chấp nhận</Badge> : <Badge tone="warn">Chưa chấp nhận</Badge>}</Td>
                <Td align="right"><Button size="sm" variant={ok ? 'ghost' : 'outline'} onClick={() => { setOpen(t.id); setAgree(false) }}>{ok ? 'Xem' : 'Xem xét & chấp nhận'}</Button></Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
      <Modal open={!!cur} onClose={() => setOpen(null)} title={cur?.name} size="lg"
        footer={cur && accepted.includes(cur.id) ? <Button variant="secondary" onClick={() => setOpen(null)}>Đóng</Button> : <><Button variant="secondary" onClick={() => setOpen(null)}>Để sau</Button><Button variant="primary" disabled={!agree} onClick={() => { update('acceptedTerms', () => [...accepted, cur.id]); toast(`Đã chấp nhận ${cur.name}`); setOpen(null) }}>Chấp nhận</Button></>}>
        <div className="rounded-xl bg-subtle p-4 max-h-64 overflow-y-auto text-[13.5px] leading-relaxed text-dim flex flex-col gap-2">
          <p><b>1. Phạm vi.</b> {cur?.desc}</p>
          <p><b>2. Dữ liệu của bạn.</b> Phố Núi giữ toàn quyền sở hữu dữ liệu. Lạc Việt Data chỉ xử lý dữ liệu để cung cấp dịch vụ theo yêu cầu của bạn.</p>
          <p><b>3. Vị trí lưu trữ.</b> Dữ liệu được lưu tại vùng đã chọn. Mọi sao chép liên vùng đều được ghi nhật ký và có thể tắt bất cứ lúc nào.</p>
          <p><b>4. Chi phí.</b> Việc sao chép và xử lý phát sinh tín dụng tính toán, hiển thị trong mục Quản lý chi phí.</p>
          <p className="text-faint">Đây là văn bản minh hoạ cho bản demo, không có giá trị pháp lý.</p>
        </div>
        {cur && !accepted.includes(cur.id) && <Checkbox className="mt-4" checked={agree} onChange={setAgree} label="Tôi đã đọc và đồng ý thay mặt Công ty CP Phố Núi" />}
      </Modal>
    </div>
  )
}

/* ---------------- Tích hợp ---------------- */
const INTEGRATIONS = [
  { id: 'i1', name: 'CANH_BAO_EMAIL', category: 'Thông báo (Email)', state: 'Bật', created: '2026-11-03', comment: 'Gửi cảnh báo chi phí và chất lượng dữ liệu' },
  { id: 'i2', name: 'UNG_DUNG_NOI_BO_OAUTH', category: 'Bảo mật (OAuth — ứng dụng cục bộ)', state: 'Bật', created: '2026-09-21', comment: 'Đăng nhập công cụ dòng lệnh và trình kết nối' },
]
function IntegrationsTab() {
  const list = useApp((s) => s.integrations) || INTEGRATIONS
  const { update } = useApp()
  const [kind, setKind] = useState(null)
  const [name, setName] = useState('')
  const [extra, setExtra] = useState('')
  const KINDS = {
    email: { label: 'Thông báo qua email', category: 'Thông báo (Email)', field: 'Email được phép nhận', ph: 'khoa.tran@phonui.demo, ha.le@phonui.demo' },
    webhook: { label: 'Thông báo qua webhook', category: 'Thông báo (Webhook)', field: 'Địa chỉ webhook', ph: 'https://chat.phonui.demo/hooks/du-lieu' },
    storage: { label: 'Kho lưu trữ ngoài', category: 'Lưu trữ (Kho đối tượng)', field: 'Đường dẫn bucket', ph: 'truongson://phonui-pos-export/' },
    oauth: { label: 'OAuth cho ứng dụng', category: 'Bảo mật (OAuth)', field: 'Địa chỉ chuyển hướng', ph: 'https://bi.phonui.demo/oauth/callback' },
  }
  const k = KINDS[kind]
  return (
    <>
      <div className="flex justify-end mb-3">
        <Popover align="end" width={260} trigger={(p) => <Button {...p} variant="primary" icon={Plus}>Tạo</Button>}>
          {(close) => <Menu onClose={close} items={Object.entries(KINDS).map(([id, v]) => ({ label: v.label, desc: v.category, onClick: () => { setKind(id); setName(''); setExtra('') } }))} />}
        </Popover>
      </div>
      <div className="card overflow-hidden">
        <Table minWidth={720}>
          <THead><Th>Tên</Th><Th>Loại</Th><Th>Trạng thái</Th><Th>Ghi chú</Th><Th>Ngày tạo</Th></THead>
          <tbody>
            {list.map((i) => (
              <Tr key={i.id}>
                <Td className="font-mono font-[600] text-[12.5px]">{i.name}</Td>
                <Td>{i.category}</Td>
                <Td><Badge tone="pos" dot>{i.state}</Badge></Td>
                <Td className="text-muted">{i.comment}</Td>
                <Td className="text-muted">{formatDate(i.created)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Modal open={!!k} onClose={() => setKind(null)} title={k?.label} desc="Tích hợp cho phép Lạc Việt Data kết nối an toàn tới dịch vụ bên ngoài."
        footer={<><Button variant="secondary" onClick={() => setKind(null)}>Huỷ</Button><Button variant="primary" disabled={!name.trim() || !extra.trim()} onClick={() => {
          const n = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
          update('integrations', () => [{ id: uid('i'), name: n, category: k.category, state: 'Bật', created: new Date().toISOString().slice(0, 10), comment: extra }, ...list])
          toast(`Đã tạo tích hợp ${n}`); setKind(null)
        }}>Tạo tích hợp</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="Tên tích hợp" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: CANH_BAO_KENH_DU_LIEU" />
          <Input label={k?.field} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={k?.ph} />
          {kind === 'webhook' && <Callout tone="info" icon={KeyRound}>Khoá bí mật của webhook được lưu trong đối tượng bí mật, không hiển thị lại sau khi tạo.</Callout>}
        </div>
      </Modal>
    </>
  )
}

