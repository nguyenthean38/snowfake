import { useMemo, useState } from 'react'
import { Boxes, Download, Search, Server, Activity, Rocket, Check, Loader2, UserCog, ArrowRightLeft, Sparkles, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/layout/Page'
import {
  Button, Badge, Tabs, SearchInput, Select, Drawer, Modal, KeyValue, Toggle, EmptyState, FlowShell, Input, RadioCards, Callout, Progress,
} from '@/components/ui'
import { Table, THead, Th, Tr, Td } from '@/components/ui'
import { useApp, uid, toast } from '@/store'
import { formatDate, timeAgo } from '@/lib/format'

const KIND_TONE = { 'Sinh văn bản': 'brand', 'Nhúng văn bản': 'info', 'Đọc tài liệu': 'gold', 'Phân loại': 'pos', 'Dự báo chuỗi thời gian': 'warn' }

/** Kho mô hình mở (hư cấu) để nhập về */
const HUB = [
  { id: 'h1', handle: 'truongson/viet-instruct-7b', task: 'Sinh văn bản', size: '7B', downloads: '182 N', desc: 'Mô hình hội thoại tiếng Việt tinh chỉnh theo chỉ dẫn' },
  { id: 'h2', handle: 'truongson/viet-instruct-7b-reasoning', task: 'Sinh văn bản', size: '7B', downloads: '64 N', desc: 'Bản có suy luận nhiều bước' },
  { id: 'h3', handle: 'hongbang/phobert-cam-xuc', task: 'Phân loại văn bản', size: '135M', downloads: '920 N', desc: 'Phân loại cảm xúc đánh giá tiếng Việt' },
  { id: 'h4', handle: 'hongbang/ner-dia-danh-vi', task: 'Nhận dạng thực thể', size: '110M', downloads: '210 N', desc: 'Nhận dạng tên người, địa danh, tổ chức tiếng Việt' },
  { id: 'h5', handle: 'auco/embed-vi-small', task: 'Nhúng văn bản', size: '33M', downloads: '1,2 tr', desc: 'Vector 384 chiều, nhanh, phù hợp tìm kiếm' },
  { id: 'h6', handle: 'auco/embed-vi-large', task: 'Nhúng văn bản', size: '560M', downloads: '310 N', desc: 'Vector 1024 chiều, chính xác hơn' },
  { id: 'h7', handle: 'sontinh/tom-tat-tin-tuc', task: 'Tóm tắt', size: '1,2B', downloads: '88 N', desc: 'Tóm tắt văn bản tiếng Việt dài' },
  { id: 'h8', handle: 'sontinh/ocr-hoa-don-vi', task: 'Đọc tài liệu', size: '240M', downloads: '45 N', desc: 'Đọc hoá đơn GTGT dạng ảnh' },
  { id: 'h9', handle: 'thuytinh/dich-vi-en', task: 'Dịch máy', size: '600M', downloads: '402 N', desc: 'Dịch Việt – Anh hai chiều' },
  { id: 'h10', handle: 'thuytinh/asr-giong-mien', task: 'Nhận dạng giọng nói', size: '1,5B', downloads: '73 N', desc: 'Nhận dạng giọng nói ba miền' },
]

export default function ModelsPage() {
  const { models, upsert, roles } = useApp()
  const [tab, setTab] = useState('models')
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [source, setSource] = useState('')
  const [sel, setSel] = useState(null)
  const [owner, setOwner] = useState(null)
  const [importing, setImporting] = useState(false)
  const kinds = [...new Set(models.map((m) => m.kind))]
  const list = useMemo(() => models.filter((m) => (!q || m.name.toLowerCase().includes(q.toLowerCase())) && (!kind || m.kind === kind) && (!source || m.source === source)), [models, q, kind, source])
  const services = models.filter((m) => m.service)
  const model = models.find((m) => m.id === sel)

  return (
    <Page title="Mô hình" desc="Quản lý mô hình ngôn ngữ, nhúng văn bản và mô hình tự huấn luyện; triển khai thành dịch vụ suy luận."
      actions={<Button variant="primary" icon={Download} onClick={() => setImporting(true)}>Nhập mô hình</Button>}>
      <Tabs value={tab} onChange={setTab} className="mb-5" options={[{ value: 'models', label: 'Mô hình', count: models.length }, { value: 'services', label: 'Dịch vụ suy luận', count: services.length }]} />
      {tab === 'models' ? (
        <div className="card overflow-hidden">
          <div className="flex flex-col md:flex-row gap-2 p-3 border-b border-line">
            <SearchInput value={q} onChange={setQ} placeholder="Tìm mô hình" className="md:w-72" />
            <Select size="sm" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: '', label: 'Loại: Tất cả' }, ...kinds.map((k) => ({ value: k, label: k }))]} className="md:w-56" />
            <Select size="sm" value={source} onChange={(e) => setSource(e.target.value)} options={[{ value: '', label: 'Nguồn: Tất cả' }, { value: 'Lạc Việt Data', label: 'Lạc Việt Data cung cấp' }, { value: 'Phố Núi', label: 'Do Phố Núi huấn luyện' }, { value: 'Kho mô hình mở', label: 'Kho mô hình mở' }]} className="md:w-56" />
          </div>
          {!list.length ? <EmptyState compact icon={Boxes} title="Không có mô hình phù hợp" /> : (
            <Table minWidth={860}>
              <THead><Th>Tên</Th><Th>Loại</Th><Th>Nguồn</Th><Th align="right">Phiên bản</Th><Th>Dịch vụ</Th><Th>Vị trí</Th><Th>Ngày tạo</Th></THead>
              <tbody>
                {list.map((m) => (
                  <Tr key={m.id} onClick={() => setSel(m.id)}>
                    <Td><div className="flex items-center gap-2.5"><span className="size-8 rounded-lg bg-brand-50 text-brand-ink grid place-items-center shrink-0"><Boxes size={15} /></span><div className="min-w-0"><div className="font-[600] font-mono text-[13px]">{m.name}</div><div className="ds-caption truncate max-w-[300px]">{m.desc}</div></div></div></Td>
                    <Td><Badge size="sm" tone={KIND_TONE[m.kind] || 'neutral'}>{m.kind}</Badge></Td>
                    <Td className="text-muted">{m.source}</Td>
                    <Td align="right" className="num">{m.versions}</Td>
                    <Td>{m.service ? <Badge size="sm" tone="pos" dot>Đang chạy</Badge> : <span className="text-faint">—</span>}</Td>
                    <Td className="text-muted font-mono text-[12px]">{m.source === 'Lạc Việt Data' ? 'LAC_VIET.MO_HINH' : 'PHO_NUI_DB.MO_HINH'}</Td>
                    <Td className="text-muted">{formatDate(m.created)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      ) : services.length ? (
        <div className="grid md:grid-cols-2 gap-3">
          {services.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3"><span className="size-10 rounded-xl bg-pos-soft text-pos grid place-items-center"><Server size={18} /></span><div><div className="font-[650] font-mono text-[13.5px]">{m.name}_DICH_VU</div><div className="ds-caption">Cụm CUM_CPU_HE_THONG · 1–2 phiên bản chạy</div></div></div>
                <Badge tone="pos" dot>Đang chạy</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-[12.5px]">
                {[['Yêu cầu/phút', '42'], ['Độ trễ p50', '180 ms'], ['Lỗi', '0,1%']].map(([k, v]) => <div key={k} className="rounded-lg bg-subtle px-3 py-2"><div className="text-muted">{k}</div><div className="font-[650] num">{v}</div></div>)}
              </div>
              <div className="flex gap-2 mt-4"><Button size="sm" variant="outline" icon={Activity} onClick={() => setSel(m.id)}>Chi tiết</Button><Button size="sm" variant="ghost" onClick={() => { upsert('models', { ...m, service: false }); toast('Đã dừng dịch vụ suy luận') }}>Dừng dịch vụ</Button></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><EmptyState icon={Server} title="Chưa có dịch vụ suy luận" desc="Mở một mô hình và bật “Triển khai dịch vụ suy luận” để gọi mô hình qua API hoặc SQL." /></div>
      )}

      <Drawer open={!!model} onClose={() => setSel(null)} width={520}
        header={model && <div><div className="ds-label">Mô hình</div><h2 className="ds-h2 font-mono mt-0.5">{model.name}</h2><div className="flex gap-2 mt-2"><Badge size="sm" tone={KIND_TONE[model.kind] || 'neutral'}>{model.kind}</Badge><Badge size="sm">{model.source}</Badge></div></div>}
        footer={model && <><Button icon={UserCog} onClick={() => setOwner(model)}>Đổi chủ sở hữu</Button><Button variant="ghost" className="ml-auto" onClick={() => setSel(null)}>Đóng</Button></>}>
        {model && (
          <div className="flex flex-col gap-5">
            <p className="text-dim">{model.desc}</p>
            <div className="card p-4">
              <Toggle label="Triển khai dịch vụ suy luận" desc="Chạy mô hình trên cụm tính toán để gọi qua REST API hoặc hàm SQL." checked={!!model.service}
                onChange={(v) => { upsert('models', { ...model, service: v }); toast(v ? 'Đã bắt đầu triển khai dịch vụ suy luận' : 'Đã dừng dịch vụ suy luận') }} />
            </div>
            <Callout tone="brand" icon={Activity} title="Theo dõi mô hình">Bật giám sát để phát hiện độ lệch dữ liệu và độ chính xác giảm theo thời gian.</Callout>
            <div>
              <h3 className="ds-h3 mb-2">Chi tiết</h3>
              <KeyValue items={[
                { label: 'Tên', value: <span className="font-mono">{model.name}</span> },
                { label: 'Loại', value: model.kind }, { label: 'Nguồn', value: model.source },
                { label: 'Chủ sở hữu', value: model.owner || (model.source === 'Lạc Việt Data' ? 'LAC_VIET' : 'PHAN_TICH') },
                { label: 'Ngày tạo', value: formatDate(model.created) },
              ]} />
            </div>
            <div>
              <h3 className="ds-h3 mb-2">Phiên bản ({model.versions})</h3>
              <ul className="rounded-xl border border-line divide-y divide-line">
                {Array.from({ length: model.versions }, (_, i) => model.versions - i).map((v, i) => (
                  <li key={v} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
                    <span className="font-mono">V{v}</span>
                    {i === 0 ? <Badge size="sm" tone="brand">Mặc định</Badge> : <span className="text-faint">Lưu trữ</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="ds-h3 mb-2">Gọi trong SQL</h3>
              <pre className="rounded-xl bg-subtle border border-line p-3 text-[12px] font-mono overflow-x-auto">{model.kind === 'Sinh văn bản' ? `SELECT AI_HOAN_THANH('${model.name}',\n  'Tóm tắt góp ý của khách hôm nay') AS TRA_LOI;` : model.kind === 'Nhúng văn bản' ? `SELECT AI_NHUNG('${model.name}', NOI_DUNG) AS VECTOR\nFROM DANH_GIA LIMIT 10;` : `SELECT ${model.name}!DU_DOAN(*) FROM BANG_DAU_VAO;`}</pre>
            </div>
          </div>
        )}
      </Drawer>

      <OwnerModal model={owner} roles={roles} onClose={() => setOwner(null)} onSave={(role) => { upsert('models', { ...owner, owner: role }); toast(`Đã chuyển quyền sở hữu cho ${role}`); setOwner(null) }} />
      {importing && <ImportWizard onClose={() => setImporting(false)} onDone={(m) => { upsert('models', m); setImporting(false); setSel(m.id) }} />}
    </Page>
  )
}

function OwnerModal({ model, roles, onClose, onSave }) {
  const [role, setRole] = useState('')
  const sys = model?.source === 'Lạc Việt Data'
  return (
    <Modal open={!!model} onClose={onClose} title="Đổi chủ sở hữu" size="sm"
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!role || sys} onClick={() => onSave(role)}>Chuyển quyền sở hữu</Button></>}>
      {model && (
        <div className="flex flex-col gap-4">
          {sys && <Callout tone="neg" title="Không thể đổi chủ sở hữu">Mô hình do Lạc Việt Data cung cấp được quản lý trong ứng dụng hệ thống; quyền trên đối tượng chỉ được cấp hoặc thu hồi qua vai trò ứng dụng.</Callout>}
          <Input label="Chủ sở hữu hiện tại" value={model.owner || (sys ? 'LAC_VIET' : 'PHAN_TICH')} disabled />
          <Select label="Vai trò sở hữu mới" placeholder="Chọn vai trò" value={role} onChange={(e) => setRole(e.target.value)} options={roles.map((r) => ({ value: r.name, label: `${r.name} — ${r.label}` }))} />
        </div>
      )}
    </Modal>
  )
}

function ImportWizard({ onClose, onDone }) {
  const [step, setStep] = useState(0)
  const [pick, setPick] = useState(null)
  const [q, setQ] = useState('')
  const [task, setTask] = useState('')
  const [name, setName] = useState('')
  const [version, setVersion] = useState('V1')
  const [loc, setLoc] = useState('PHO_NUI_DB.MO_HINH')
  const [deploy, setDeploy] = useState('yes')
  const [progress, setProgress] = useState(0)
  const hub = HUB.filter((h) => !q || (h.handle + h.desc).toLowerCase().includes(q.toLowerCase()))
  const steps = ['Chọn mô hình', 'Thông tin mô hình', 'Cấu hình', 'Triển khai']
  const choose = (h) => {
    setPick(h); setTask(h.task)
    setName(h.handle.split('/')[1].toUpperCase().replace(/[^A-Z0-9]/g, '_'))
  }
  const start = () => {
    setStep(3)
    let p = 0
    const t = setInterval(() => { p += 12 + Math.random() * 14; setProgress(Math.min(100, p)); if (p >= 100) clearInterval(t) }, 380)
  }
  const done = progress >= 100
  return (
    <FlowShell title="Nhập mô hình" steps={steps} current={step} onClose={onClose} onBack={step > 0 && step < 3 ? () => setStep(step - 1) : undefined}
      footer={<>
        <Button onClick={onClose}>Huỷ</Button>
        {step < 2 && <Button variant="primary" disabled={step === 0 ? !pick : !name.trim()} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
        {step === 2 && <Button variant="primary" icon={Rocket} onClick={start}>{deploy === 'yes' ? 'Nhập và triển khai' : 'Nhập mô hình'}</Button>}
        {step === 3 && <Button variant="primary" disabled={!done} onClick={() => onDone({ id: uid('m'), name, kind: task === 'Nhúng văn bản' ? 'Nhúng văn bản' : task === 'Sinh văn bản' ? 'Sinh văn bản' : task === 'Đọc tài liệu' ? 'Đọc tài liệu' : 'Phân loại', source: 'Kho mô hình mở', versions: 1, created: new Date().toISOString().slice(0, 10), desc: pick.desc, service: deploy === 'yes', owner: 'PHAN_TICH' })}>Xong</Button>}
      </>}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Duyệt kho mô hình mở</h2><p className="text-muted mt-1">Các mô hình đã được kiểm tra bảo mật. Mô hình chạy trong tài khoản của bạn, dữ liệu không rời đi.</p></div>
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên hoặc tác vụ" />
          <div className="grid sm:grid-cols-2 gap-2">
            {hub.map((h) => (
              <button key={h.id} onClick={() => choose(h)} className={cn('text-left rounded-xl border p-3 transition', pick?.id === h.id ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line hover:border-line-strong bg-surface')}>
                <div className="flex items-start justify-between gap-2"><span className="font-mono text-[12.5px] font-[600] break-all">{h.handle}</span>{pick?.id === h.id && <Check size={15} className="text-brand-ink shrink-0" />}</div>
                <div className="ds-caption mt-1">{h.desc}</div>
                <div className="flex items-center gap-2 mt-2 text-[11.5px] text-muted"><Badge size="sm">{h.task}</Badge><span>{h.size}</span><span>↓ {h.downloads}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 1 && pick && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Thông tin mô hình</h2><p className="text-muted mt-1 font-mono text-[13px]">{pick.handle}</p></div>
          <Select label="Tác vụ" value={task} onChange={(e) => setTask(e.target.value)} options={[...new Set(HUB.map((h) => h.task))]} />
          <Callout tone="neutral">Mô hình có mã tuỳ chỉnh cần bật “Tin cậy mã từ xa”. Mô hình này không cần.</Callout>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div><h2 className="ds-h1">Cấu hình mô hình nhập</h2></div>
          <Input label="Tên mô hình" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} />
          <Input label="Tên phiên bản" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Select label="Cơ sở dữ liệu và lược đồ" value={loc} onChange={(e) => setLoc(e.target.value)} options={['PHO_NUI_DB.MO_HINH', 'PHO_NUI_DB.PUBLIC']} />
          <RadioCards value={deploy} onChange={setDeploy} options={[
            { value: 'yes', label: 'Nhập và triển khai dịch vụ suy luận', desc: 'Chạy trên CUM_CPU_HE_THONG, tạo REST API' },
            { value: 'no', label: 'Chỉ nhập vào sổ đăng ký mô hình', desc: 'Triển khai sau' },
          ]} />
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col items-center text-center gap-4 pt-6">
          <span className={cn('size-16 rounded-2xl grid place-items-center', done ? 'bg-pos-soft text-pos' : 'bg-brand-50 text-brand-ink')}>{done ? <Check size={30} /> : <Loader2 size={28} className="animate-spin" />}</span>
          <div>
            <h2 className="ds-h1">{done ? 'Đã nhập và sẵn sàng' : 'Đang nhập và triển khai…'}</h2>
            <p className="text-muted mt-1">{done ? `${name} (${version}) đã có trong ${loc}.` : 'Tải trọng số, kiểm tra bảo mật, đóng gói dịch vụ.'}</p>
          </div>
          <Progress value={progress} auto={false} className="max-w-sm" />
          {done && <div className="rounded-xl bg-subtle border border-line px-4 py-2 text-[12.5px] font-mono">Mã truy vấn: 01c6f13e-000a-63c6-0005-52820033f622</div>}
        </div>
      )}
    </FlowShell>
  )
}
