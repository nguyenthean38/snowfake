import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Plus, MoreHorizontal, Pin, PinOff, Pencil, Trash2, Store, Search, BarChart3, MessageSquareHeart, FileCode2 } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, IconButton, Badge, Card, Tabs, Modal, Input, Select, RadioCards, Popover, Menu, Confirm, Table, THead, Th, Tr, Td, EmptyState, SearchInput } from '@/components/ui'
import { useApp, toast, uid } from '@/store'
import { timeAgo, stripAccents } from '@/lib/format'

export const APP_KINDS = [
  { value: 'revenue', label: 'Bảng doanh thu', desc: 'Chỉ số, biểu đồ doanh thu theo ngày, món bán chạy', icon: BarChart3 },
  { value: 'reviews', label: 'Theo dõi đánh giá', desc: 'Lọc đánh giá theo cảm xúc và chủ đề bằng hàm AI', icon: MessageSquareHeart },
  { value: 'blank', label: 'Ứng dụng trống', desc: 'Bắt đầu từ một truy vấn và bảng kết quả', icon: FileCode2 },
]

export default function AppsPage() {
  const navigate = useNavigate()
  const { apps, warehouses, upsert, remove, currentRole } = useApp()
  const [tab, setTab] = useState('mine')
  const [q, setQ] = useState('')
  const [create, setCreate] = useState(false)
  const [rename, setRename] = useState(null)
  const [del, setDel] = useState(null)
  const [form, setForm] = useState({ name: '', warehouse: 'KHO_UNG_DUNG', kind: 'revenue' })
  const shared = apps.filter((a) => a.owner !== 'QUAN_TRI')
  const base = tab === 'mine' ? apps : shared
  const list = base.filter((a) => !q || stripAccents(a.name).toLowerCase().includes(stripAccents(q).toLowerCase()))
  const pinned = list.filter((a) => a.pinned)

  const submit = () => {
    const id = uid('app')
    upsert('apps', { id, name: form.name.trim() || 'Ứng dụng mới', owner: currentRole, warehouse: form.warehouse, updated: new Date().toISOString(), status: 'Đang chạy', views: 0, kind: form.kind, desc: APP_KINDS.find((k) => k.value === form.kind).desc })
    setCreate(false)
    setForm({ name: '', warehouse: 'KHO_UNG_DUNG', kind: 'revenue' })
    toast('Đã tạo ứng dụng')
    navigate(`/ung-dung/${id}`)
  }
  const row = (a) => (
    <Tr key={a.id} onClick={() => navigate(`/ung-dung/${a.id}`)}>
      <Td>
        <span className="flex items-center gap-3">
          <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-ink"><LayoutGrid size={17} /></span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-[600]">{a.name}{a.pinned && <Pin size={12} className="text-brand-ink" />}</span>
            <span className="block ds-caption truncate max-w-[380px]">{a.desc}</span>
          </span>
        </span>
      </Td>
      <Td className="text-muted">{timeAgo(a.updated)}</Td>
      <Td className="text-muted">{a.owner}</Td>
      <Td>{a.source === 'Chợ dữ liệu' ? <Badge tone="info" size="sm" icon={Store}>Chợ dữ liệu</Badge> : <Badge tone="pos" dot size="sm">{a.status}</Badge>}</Td>
      <Td align="right" onClick={(e) => e.stopPropagation()}>
        <Popover align="end" width={200} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Tuỳ chọn" size="sm" />}>
          {(close) => <Menu onClose={close} items={[
            { label: a.pinned ? 'Bỏ ghim' : 'Ghim lên đầu', icon: a.pinned ? PinOff : Pin, onClick: () => upsert('apps', { id: a.id, pinned: !a.pinned }) },
            { label: 'Đổi tên', icon: Pencil, onClick: () => setRename({ id: a.id, name: a.name }) },
            { divider: true },
            { label: 'Xoá ứng dụng', icon: Trash2, danger: true, onClick: () => setDel(a) },
          ]} />}
        </Popover>
      </Td>
    </Tr>
  )

  return (
    <Page title="Ứng dụng" wide
      actions={<><Button variant="outline" icon={Store} onClick={() => navigate('/cho-du-lieu')}>Duyệt Chợ dữ liệu</Button><Button variant="primary" icon={Plus} onClick={() => setCreate(true)}>Ứng dụng mới</Button></>}>
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-brand-100 via-brand-50 to-ice-soft border border-brand-100 mb-6">
        <div className="relative z-[1] max-w-xl">
          <h2 className="text-[22px] font-[750] tracking-tight">Khám phá ứng dụng dữ liệu</h2>
          <p className="text-dim mt-1">Biến truy vấn thành ứng dụng tương tác cho cả nhóm: thanh trượt, bộ lọc, biểu đồ — chạy ngay trên dữ liệu trong tài khoản, không cần máy chủ riêng.</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex gap-2 opacity-90">
          {[BarChart3, MessageSquareHeart, LayoutGrid].map((I, i) => (
            <span key={i} className="size-16 rounded-2xl bg-surface shadow-md grid place-items-center text-brand-ink animate-float" style={{ animationDelay: `${i * 0.6}s` }}><I size={26} /></span>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
        <Tabs value={tab} onChange={setTab} options={[{ value: 'mine', label: 'Ứng dụng của tôi', count: apps.length }, { value: 'shared', label: 'Được chia sẻ với tôi', count: shared.length }]} />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm ứng dụng theo tên" className="sm:w-72" />
      </div>
      <Card padded={false} className="overflow-hidden">
        {!list.length ? (
          <EmptyState icon={q ? Search : LayoutGrid} title={q ? 'Không có ứng dụng phù hợp' : 'Chưa có ứng dụng nào'} desc="Tạo ứng dụng từ mẫu có sẵn hoặc cài từ Chợ dữ liệu." action={<Button icon={Plus} onClick={() => setCreate(true)}>Ứng dụng mới</Button>} />
        ) : (
          <Table minWidth={760}>
            <THead><Th>Tên</Th><Th>Sửa lần cuối</Th><Th>Vai trò sở hữu</Th><Th>Trạng thái</Th><Th align="right" width={56} /></THead>
            <tbody>
              {pinned.map(row)}
              {list.filter((a) => !a.pinned).map(row)}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={create} onClose={() => setCreate(false)} size="lg" title="Ứng dụng mới" desc="Ứng dụng chạy bằng quyền của vai trò hiện tại và tính phí theo kho tính toán bạn chọn."
        footer={<><Button onClick={() => setCreate(false)}>Huỷ</Button><Button variant="primary" onClick={submit}>Tạo</Button></>}>
        <div className="flex flex-col gap-4">
          <Input autoFocus label="Tên ứng dụng" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Doanh thu vùng miền Nam" />
          <Select label="Kho tính toán chạy truy vấn" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} options={warehouses.map((w) => ({ value: w.name, label: `${w.name} (${w.size})` }))} />
          <div>
            <div className="text-[13px] font-[550] text-dim mb-2">Bắt đầu từ</div>
            <RadioCards value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={APP_KINDS} columns={3} />
          </div>
        </div>
      </Modal>
      <Modal open={!!rename} onClose={() => setRename(null)} size="sm" title="Đổi tên ứng dụng"
        footer={<><Button onClick={() => setRename(null)}>Huỷ</Button><Button variant="primary" disabled={!rename?.name.trim()} onClick={() => { upsert('apps', { id: rename.id, name: rename.name.trim(), updated: new Date().toISOString() }); setRename(null); toast('Đã đổi tên') }}>Lưu</Button></>}>
        {rename && <Input autoFocus value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} />}
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} danger confirmLabel="Xoá" title={`Xoá “${del?.name}”?`} desc="Người được chia sẻ cũng sẽ mất quyền truy cập ứng dụng."
        onConfirm={() => { remove('apps', del.id); toast('Đã xoá ứng dụng') }} />
    </Page>
  )
}
