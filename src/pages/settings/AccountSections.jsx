import { useMemo, useState } from 'react'
import { Pencil, Plus, ChevronLeft, ChevronRight, ChevronDown, Search, Trash2, Route, RotateCcw } from 'lucide-react'
import { Button, Toggle, Modal, Select, Checkbox, Badge, Tabs, Input, Callout } from '@/components/ui'
import { useApp, toast, uid } from '@/store'
import { CLOUDS, ORG } from '@/data/platform'
import { stripAccents, timeAgo } from '@/lib/format'
import { cn } from '@/lib/cn'
import { EmailChips } from '@/features/admin/shared'
import { SectionTitle, Group, Row } from './shared'


/* ---------------- Chung ---------------- */
export function General() {
  const { prefs, update, users } = useApp()
  const contacts = useApp((s) => s.commContacts) || { steward: 'THUHA', support: 'QUOCBAO', approver: '', security: 'HOANGNAM' }
  const set = (patch, msg) => { update('prefs', patch); toast(msg) }
  const setC = (k, v) => { update('commContacts', () => ({ ...contacts, [k]: v })); toast('Đã cập nhật người liên hệ') }
  const opts = [{ value: '', label: 'Chưa chọn' }, ...users.filter((u) => u.type !== 'Dịch vụ').map((u) => ({ value: u.username, label: `${u.name} (${u.username})` }))]
  return (
    <>
      <SectionTitle title="Chung" desc="Cài đặt áp dụng cho toàn bộ tài khoản Phố Núi. Cần vai trò QUAN_TRI." />
      <Group title="Dự án">
        <Row label="Đặt Không gian làm việc làm trình soạn SQL mặc định" desc="Mọi người dùng mở tệp SQL trong Không gian làm việc thay cho bảng tính cũ.">
          <Toggle checked={prefs.workspaceDefault ?? true} onChange={(v) => set({ workspaceDefault: v }, 'Đã lưu cài đặt')} aria-label="Không gian làm việc mặc định" />
        </Row>
        <Row label="Khôi phục bảng tính của người dùng đã xoá" desc="Chuyển các tệp SQL của người dùng đã bị xoá sang thư mục của bạn.">
          <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => toast({ title: 'Không có tệp nào cần khôi phục', tone: 'info' })}>Khôi phục</Button>
        </Row>
      </Group>
      <Group title="Liên lạc" desc="Người phụ trách được hiển thị trên trang chi tiết của cơ sở dữ liệu và bảng để đồng nghiệp biết nên hỏi ai.">
        {[
          ['steward', 'Người quản lý dữ liệu', 'Chịu trách nhiệm về độ chính xác, đầy đủ, tin cậy của dữ liệu'],
          ['support', 'Hỗ trợ kỹ thuật', 'Trả lời câu hỏi kỹ thuật về dữ liệu'],
          ['approver', 'Người duyệt truy cập', 'Duyệt yêu cầu cấp quyền đọc dữ liệu'],
          ['security', 'Bảo mật & tuân thủ', 'Liên hệ khi có sự cố bảo mật'],
        ].map(([k, l, d]) => (
          <Row key={k} label={l} desc={d}><Select className="w-64" value={contacts[k]} onChange={(e) => setC(k, e.target.value)} options={opts} /></Row>
        ))}
      </Group>
    </>
  )
}

/* ---------------- Liên hệ quản trị ---------------- */
const SUBCATS = ['Thay đổi hành vi', 'Hỗ trợ trình kết nối', 'Tình trạng vận hành', 'Cập nhật khẩn cấp']
const DEFAULT_CONTACTS = {
  org: {
    security: { label: 'Cập nhật bảo mật', desc: 'Thông báo lỗ hổng, sự cố bảo mật', emails: ['khoa.tran@phonui.demo'] },
    privacy: { label: 'Cập nhật quyền riêng tư', desc: 'Thay đổi chính sách xử lý dữ liệu cá nhân', emails: ['ha.le@phonui.demo'] },
    product: { label: 'Cập nhật sản phẩm', desc: 'Tính năng mới và thay đổi hành vi', emails: ['khoa.tran@phonui.demo'], sub: {} },
  },
  account: {
    billing: { label: 'Thanh toán', desc: 'Hoá đơn, bảng kê sử dụng', emails: ['ketoan@phonui.demo'] },
    ops: { label: 'Bảo trì & sự cố', desc: 'Lịch bảo trì của vùng TP. Hồ Chí Minh', emails: ['bao.pham@phonui.demo'] },
  },
}
export function AdminContacts() {
  const stored = useApp((s) => s.adminContacts)
  const { update } = useApp()
  const data = stored || DEFAULT_CONTACTS
  const [tab, setTab] = useState('org')
  const [edit, setEdit] = useState(null)
  const save = (scope, key, val) => { update('adminContacts', () => ({ ...data, [scope]: { ...data[scope], [key]: { ...data[scope][key], ...val } } })); toast(`Đã cập nhật ${data[scope][key].label.toLowerCase()}`) }
  const cur = edit && data[edit.scope][edit.key]
  return (
    <>
      <SectionTitle title="Liên hệ quản trị" desc="Lạc Việt Data sẽ liên hệ những địa chỉ này về các vấn đề của tổ chức. Nên dùng email nhóm (vd: bao-mat@phonui.demo) để không gián đoạn khi nhân sự thay đổi." />
      <Tabs value={tab} onChange={setTab} options={[{ value: 'org', label: 'Tổ chức' }, { value: 'account', label: 'Tài khoản' }]} className="mb-4" />
      <div className="card divide-y divide-line">
        {Object.entries(data[tab]).map(([k, c]) => (
          <div key={k} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13.5px] font-[600]">{c.label}</div>
                <div className="ds-caption">{c.desc}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">{c.emails.length ? c.emails.map((e) => <Badge key={e} size="sm">{e}</Badge>) : <span className="ds-caption">Chưa có liên hệ</span>}</div>
              </div>
              <button onClick={() => setEdit({ scope: tab, key: k })} className="size-8 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg shrink-0" aria-label={`Sửa ${c.label}`}><Pencil size={15} /></button>
            </div>
            {c.sub && (
              <ul className="mt-3 ml-1 pl-3 border-l border-line flex flex-col gap-1.5">
                {SUBCATS.map((s) => <li key={s} className="text-[12.5px]"><span className="text-dim">{s}</span>{c.sub[s]?.length ? <span className="text-muted"> · {c.sub[s].join(', ')}</span> : <span className="text-faint"> · theo liên hệ chung</span>}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      {cur && <ContactModal c={cur} onClose={() => setEdit(null)} onSave={(v) => { save(edit.scope, edit.key, v); setEdit(null) }} />}
    </>
  )
}
function ContactModal({ c, onClose, onSave }) {
  const [emails, setEmails] = useState(c.emails)
  const [sub, setSub] = useState(c.sub || null)
  const [subOn, setSubOn] = useState(() => Object.fromEntries(SUBCATS.map((s) => [s, !!c.sub?.[s]?.length])))
  return (
    <Modal open onClose={onClose} title={c.label} desc={c.desc}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!emails.length} onClick={() => onSave({ emails, ...(sub ? { sub: Object.fromEntries(Object.entries(sub).filter(([s]) => subOn[s])) } : {}) })}>Lưu</Button></>}>
      <div className="text-[13px] font-[550] text-dim mb-1.5">Email nhận {c.label.toLowerCase()}</div>
      <EmailChips value={emails} onChange={setEmails} />
      <p className="ds-caption mt-1">Mọi liên hệ đều nhận tất cả thông báo của danh mục con bên dưới.</p>
      {sub && (
        <div className="mt-5">
          <div className="text-[13px] font-[600] mb-2">Thêm người nhận cho từng danh mục con</div>
          <div className="flex flex-col gap-3">
            {SUBCATS.map((s) => (
              <div key={s}>
                <Checkbox checked={subOn[s]} onChange={(v) => setSubOn({ ...subOn, [s]: v })} label={s} />
                {subOn[s] && <div className="mt-2 ml-7"><EmailChips value={sub[s] || []} onChange={(v) => setSub({ ...sub, [s]: v })} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Ứng dụng gốc: định tuyến dữ liệu sự kiện ---------------- */
const REGION_TREE = [
  { area: 'Châu Á', regions: [
    ['truongson', 'TP. Hồ Chí Minh (truongson-hcm-1)'], ['truongson', 'Hà Nội (truongson-hn-1)'], ['truongson', 'Đà Nẵng (truongson-dn-1)'],
    ['auco', 'TP. Hồ Chí Minh (auco-hcm-1)'], ['auco', 'Hà Nội (auco-hn-1)'],
    ['hongbang', 'Singapore (hongbang-sg-1)'], ['hongbang', 'Tokyo (hongbang-tyo-1)'], ['hongbang', 'Seoul (hongbang-sel-1)'],
  ] },
  { area: 'Châu Âu', regions: [['hongbang', 'Frankfurt (hongbang-fra-1)'], ['hongbang', 'Paris (hongbang-par-1)'], ['auco', 'Amsterdam (auco-ams-1)']] },
  { area: 'Bắc Mỹ', regions: [['hongbang', 'Virginia (hongbang-va-1)'], ['hongbang', 'Oregon (hongbang-or-1)'], ['auco', 'Toronto (auco-tor-1)']] },
  { area: 'Châu Đại Dương', regions: [['hongbang', 'Sydney (hongbang-syd-1)']] },
]
const ACCOUNTS = [`${ORG.account} · TP. Hồ Chí Minh`, 'THU_NGHIEM · Hà Nội']
export function NativeApps() {
  const stored = useApp((s) => s.routingRules)
  const { update } = useApp()
  const rules = stored || { def: null, custom: [] }
  const [editor, setEditor] = useState(false)
  return (
    <>
      <SectionTitle title="Ứng dụng gốc" desc="Ứng dụng của bạn trên Chợ dữ liệu ghi lại sự kiện sử dụng từ khách hàng ở nhiều vùng. Quy tắc định tuyến quyết định dữ liệu sự kiện được sao chép về tài khoản nào." />
      <Group title="Quy tắc định tuyến dữ liệu sự kiện" desc={rules.def ? `${1 + rules.custom.length} quy tắc · cập nhật ${timeAgo(rules.updated)}` : 'Chưa có quy tắc'}
        action={<Button size="sm" variant={rules.def ? 'outline' : 'primary'} icon={rules.def ? Pencil : Plus} onClick={() => setEditor(true)}>{rules.def ? 'Sửa' : 'Thêm'}</Button>}>
        {!rules.def ? (
          <div className="px-5 py-8 text-center"><Route size={22} className="mx-auto text-faint" /><div className="ds-caption mt-2">Chưa có quy tắc. Mặc định, dữ liệu sự kiện ở lại vùng nơi khách hàng cài ứng dụng.</div></div>
        ) : (
          <>
            <div className="px-5 py-3.5">
              <div className="ds-label">Mặc định</div>
              <div className="text-[13.5px] mt-1"><span className="text-muted">Tài khoản đích:</span> <b>{rules.def}</b></div>
              <div className="ds-caption">Mọi vùng hiện tại và tương lai được sao chép về tài khoản này, trừ vùng có quy tắc riêng.</div>
            </div>
            {rules.custom.map((r) => (
              <div key={r.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3"><span className="font-mono font-[600] text-[12.5px]">{r.name}</span><Badge size="sm" tone="brand">{r.regions.length} vùng</Badge></div>
                <div className="text-[13px] mt-1"><span className="text-muted">Tài khoản đích:</span> {r.account}</div>
                <div className="ds-caption mt-0.5">{r.regions.join(' · ')}</div>
              </div>
            ))}
          </>
        )}
      </Group>
      {editor && <RoutingEditor initial={rules} onClose={() => setEditor(false)} onApply={(v) => { update('routingRules', () => ({ ...v, updated: new Date().toISOString() })); toast('Đã áp dụng quy tắc định tuyến'); setEditor(false) }} />}
    </>
  )
}

function RoutingEditor({ initial, onClose, onApply }) {
  const [step, setStep] = useState('edit') // edit | rule | review
  const [def, setDef] = useState(initial.def || ACCOUNTS[0])
  const [custom, setCustom] = useState(initial.custom || [])
  const [rule, setRule] = useState(null)
  const startRule = (r) => { setRule(r || { id: uid('rr'), name: '', account: ACCOUNTS[1], regions: [] }); setStep('rule') }
  if (step === 'rule') {
    return <RuleModal rule={rule} onBack={() => setStep('edit')} onDone={(r) => { setCustom((l) => (l.some((x) => x.id === r.id) ? l.map((x) => (x.id === r.id ? r : x)) : [...l, r])); setStep('edit') }} />
  }
  if (step === 'review') {
    return (
      <Modal open onClose={onClose} title="Xem lại quy tắc định tuyến" desc="Sau khi áp dụng, quy tắc có hiệu lực ngay với mọi gói ứng dụng của tổ chức."
        footer={<><Button variant="secondary" onClick={() => setStep('edit')}>Quay lại sửa</Button><Button variant="primary" onClick={() => onApply({ def, custom })}>Áp dụng</Button></>}>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-line p-3.5"><div className="ds-label">Mặc định</div><div className="text-[13.5px] mt-1">Tài khoản đích: <b>{def}</b></div><div className="ds-caption">Mọi vùng hiện tại và tương lai, trừ các vùng có quy tắc riêng.</div></div>
          {custom.map((r) => (
            <div key={r.id} className="rounded-xl border border-line p-3.5"><div className="font-mono font-[600] text-[12.5px]">{r.name}</div><div className="text-[13px] mt-1">Tài khoản đích: {r.account}</div><div className="ds-caption mt-0.5">{r.regions.join(' · ')}</div></div>
          ))}
        </div>
      </Modal>
    )
  }
  return (
    <Modal open onClose={onClose} title="Quy tắc định tuyến dữ liệu sự kiện" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={() => setStep('review')}>Xem lại</Button></>}>
      <Select label="Quy tắc mặc định — tài khoản đích" value={def} onChange={(e) => setDef(e.target.value)} options={ACCOUNTS} hint="Nhận dữ liệu sự kiện từ mọi vùng, kể cả vùng mở trong tương lai." />
      <div className="mt-5 flex items-center justify-between">
        <div><div className="text-[13.5px] font-[600]">Quy tắc tuỳ chỉnh</div><div className="ds-caption">Định tuyến một số vùng cụ thể về tài khoản khác (ghi đè quy tắc mặc định).</div></div>
        <Button size="sm" variant="outline" icon={Plus} onClick={() => startRule()}>Thêm</Button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {!custom.length && <div className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center ds-caption">Chưa có quy tắc tuỳ chỉnh</div>}
        {custom.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-xl border border-line px-4 py-3">
            <div className="min-w-0 flex-1"><div className="font-mono font-[600] text-[12.5px]">{r.name}</div><div className="ds-caption">{r.account} · {r.regions.length} vùng</div></div>
            <button onClick={() => startRule(r)} className="p-1 text-muted hover:text-fg" aria-label="Sửa"><Pencil size={14} /></button>
            <button onClick={() => setCustom(custom.filter((x) => x.id !== r.id))} className="p-1 text-muted hover:text-neg" aria-label="Xoá"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function RuleModal({ rule, onBack, onDone }) {
  const [name, setName] = useState(rule.name)
  const [account, setAccount] = useState(rule.account)
  const [sel, setSel] = useState(new Set(rule.regions))
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({ 'Châu Á': true })
  const cloudName = (id) => CLOUDS.find((c) => c.id === id)?.name
  const tree = useMemo(() => {
    const nq = stripAccents(q).toLowerCase()
    return REGION_TREE.map((a) => ({ ...a, regions: a.regions.filter(([c, r]) => !nq || stripAccents(`${r} ${cloudName(c)}`).toLowerCase().includes(nq)) })).filter((a) => a.regions.length)
  }, [q])
  const toggle = (r) => { const s = new Set(sel); s.has(r) ? s.delete(r) : s.add(r); setSel(s) }
  const n = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  return (
    <Modal open onClose={onBack} title={rule.name ? 'Sửa quy tắc tuỳ chỉnh' : 'Quy tắc tuỳ chỉnh mới'} size="lg"
      footer={<><Button variant="secondary" icon={ChevronLeft} onClick={onBack}>Quay lại</Button><Button variant="primary" disabled={!n || !sel.size} onClick={() => onDone({ ...rule, name: n, account, regions: [...sel] })}>Xong</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Tên quy tắc" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: KHACH_HANG_CHAU_A" />
        <Select label="Tài khoản đích" value={account} onChange={(e) => setAccount(e.target.value)} options={ACCOUNTS} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[13.5px] font-[600]">Vùng định tuyến về tài khoản này <span className="text-muted font-normal">({sel.size} đã chọn)</span></div>
        {sel.size > 0 && <button onClick={() => setSel(new Set())} className="text-[12.5px] text-brand-ink hover:underline">Bỏ chọn tất cả</button>}
      </div>
      <div className="mt-2 flex items-center gap-2 h-9 rounded-[10px] border border-line-strong px-3"><Search size={15} className="text-faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm vùng hoặc nhà cung cấp" className="flex-1 bg-transparent outline-none text-[13.5px]" /></div>
      <div className="mt-2 rounded-xl border border-line max-h-[300px] overflow-y-auto">
        {tree.map((a) => {
          const isOpen = open[a.area] || !!q
          const all = a.regions.map(([, r]) => r)
          const cnt = all.filter((r) => sel.has(r)).length
          return (
            <div key={a.area} className="border-b border-line last:border-0">
              <div className="flex items-center gap-2 px-3 h-10">
                <button onClick={() => setOpen({ ...open, [a.area]: !isOpen })} className="text-muted" aria-label="Mở rộng">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button>
                <Checkbox checked={cnt === all.length} indeterminate={cnt > 0 && cnt < all.length} onChange={(v) => { const s = new Set(sel); all.forEach((r) => (v ? s.add(r) : s.delete(r))); setSel(s) }} label={<span className="font-[600]">{a.area} <span className="text-muted font-normal">({all.length})</span></span>} />
              </div>
              {isOpen && CLOUDS.map((c) => {
                const regs = a.regions.filter(([cid]) => cid === c.id)
                if (!regs.length) return null
                return (
                  <div key={c.id} className="pl-11 pb-2">
                    <div className="ds-label mb-1" style={{ color: c.color }}>{c.name}</div>
                    <div className="flex flex-col gap-1.5">
                      {regs.map(([, r]) => <div key={r} className={cn('rounded-md px-2 py-1', sel.has(r) && 'bg-brand-50')}><Checkbox checked={sel.has(r)} onChange={() => toggle(r)} label={r} /></div>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
        {!tree.length && <div className="p-6 text-center ds-caption">Không tìm thấy vùng phù hợp.</div>}
      </div>
      <Callout tone="info" className="mt-3">Dữ liệu sự kiện sao chép liên vùng phát sinh chi phí truyền dữ liệu, hiển thị trong mục Quản lý chi phí.</Callout>
    </Modal>
  )
}

