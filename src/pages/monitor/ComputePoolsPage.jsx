import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MoreHorizontal, Play, Pause, Trash2, Cpu, Server } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, IconButton, Input, Select, Toggle, Table, THead, Th, Tr, Td, Popover, Menu, Modal, Confirm, Callout, SearchInput, EmptyState } from '@/components/ui'
import { useApp, toast, uid } from '@/store'
import { WarehouseState } from '@/features/monitor/shared'
import { cn } from '@/lib/cn'

const FAMILIES = [
  { value: 'CPU_X64_XS', label: 'CPU_X64_XS — 1 vCPU, 6 GB', credits: 0.06 },
  { value: 'CPU_X64_S', label: 'CPU_X64_S — 3 vCPU, 13 GB', credits: 0.11 },
  { value: 'CPU_X64_M', label: 'CPU_X64_M — 6 vCPU, 28 GB', credits: 0.22 },
  { value: 'HIGHMEM_X64_S', label: 'HIGHMEM_X64_S — 6 vCPU, 58 GB', credits: 0.28 },
  { value: 'GPU_NV_S', label: 'GPU_NV_S — 1 GPU 24 GB', credits: 0.57 },
  { value: 'GPU_NV_M', label: 'GPU_NV_M — 4 GPU 24 GB', credits: 2.68 },
]

function PoolForm({ open, onClose }) {
  const { pools, upsert } = useApp()
  const [f, setF] = useState(null)
  useEffect(() => { if (open) setF({ name: '', family: 'CPU_X64_S', min: 1, max: 2, autoResume: true, autoSuspend: 3600 }) }, [open])
  if (!open || !f) return null
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const exists = pools.some((p) => p.name === f.name)
  const valid = /^[A-Z_][A-Z0-9_]*$/.test(f.name) && !exists && f.max >= f.min
  const fam = FAMILIES.find((x) => x.value === f.family)
  return (
    <Modal open onClose={onClose} title="Cụm tính toán mới" desc="Cụm máy chạy dịch vụ dạng container: ứng dụng dữ liệu, sổ tay Python, mô hình AI tự triển khai."
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!valid} onClick={() => {
        upsert('pools', { id: uid('cp'), name: f.name, family: f.family, state: 'Đang khởi động', nodes: [f.min, f.max], active: 0, services: 0 })
        toast({ title: `Đang khởi động ${f.name}`, desc: 'Cụm sẽ sẵn sàng sau khoảng 1 phút.' })
        setTimeout(() => useApp.getState().update('pools', (l) => l.map((p) => (p.name === f.name ? { ...p, state: 'Đang chạy', active: f.min } : p))), 2500)
        onClose()
      }}>Tạo cụm</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên cụm" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })} placeholder="VD: CUM_UNG_DUNG"
          error={exists ? 'Tên này đã được dùng.' : undefined} />
        <Select label="Loại máy" value={f.family} onChange={(e) => set({ family: e.target.value })} options={FAMILIES} hint={`≈ ${fam.credits.toLocaleString('vi-VN')} tín dụng/giờ cho mỗi nút đang chạy`} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Số nút tối thiểu" type="number" min={1} value={f.min} onChange={(e) => set({ min: Math.max(1, +e.target.value || 1) })} />
          <Input label="Số nút tối đa" type="number" min={1} value={f.max} onChange={(e) => set({ max: Math.max(1, +e.target.value || 1) })} error={f.max < f.min ? 'Phải ≥ tối thiểu' : undefined} />
        </div>
        <Toggle checked={f.autoResume} onChange={(v) => set({ autoResume: v })} label="Tự khởi động khi có dịch vụ cần chạy" />
        <Select label="Tự tạm dừng sau" value={f.autoSuspend} onChange={(e) => set({ autoSuspend: +e.target.value })} options={[{ value: 600, label: '10 phút không hoạt động' }, { value: 3600, label: '1 giờ' }, { value: 0, label: 'Không bao giờ' }]} />
        {f.family.startsWith('GPU') && <Callout tone="warn">Cụm GPU tốn tín dụng cao — nên đặt tự tạm dừng.</Callout>}
      </div>
    </Modal>
  )
}

export default function ComputePoolsPage() {
  const { pools, update, remove } = useApp()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState(params.get('tao') === '1')
  const [del, setDel] = useState(null)
  const [q, setQ] = useState('')
  const list = pools.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
  const setState = (p, state) => update('pools', (l) => l.map((x) => (x.id === p.id ? { ...x, state, active: state === 'Đang chạy' ? x.nodes[0] : 0 } : x)))

  return (
    <Page wide title="Cụm tính toán" desc="Hạ tầng chạy container cho ứng dụng dữ liệu, sổ tay và mô hình AI tự triển khai — tách biệt với kho tính toán chạy SQL."
      actions={<Button variant="primary" icon={Plus} onClick={() => setForm(true)}>Cụm tính toán</Button>}>
      <div className="flex mb-3"><SearchInput value={q} onChange={setQ} placeholder="Tìm cụm" className="w-full sm:w-64" /></div>
      <div className="card overflow-hidden">
        {!list.length ? <EmptyState icon={Server} title="Không có cụm tính toán" /> : (
          <Table minWidth={900}>
            <THead><Th>Tên</Th><Th>Loại máy</Th><Th>Trạng thái</Th><Th align="right">Số nút (tối thiểu–tối đa)</Th><Th align="right">Nút đang chạy</Th><Th align="right">Dịch vụ</Th><Th width={48} /></THead>
            <tbody>
              {list.map((p) => (
                <Tr key={p.id}>
                  <Td><span className="flex items-center gap-2"><Cpu size={15} className={cn(p.state === 'Đang chạy' ? 'text-pos' : 'text-faint')} /><span className="font-mono text-[12.5px] font-[600]">{p.name}</span></span></Td>
                  <Td className="font-mono text-[12.5px]">{p.family}</Td>
                  <Td><WarehouseState value={p.state} /></Td>
                  <Td align="right" className="num">{p.nodes[0]}–{p.nodes[1]}</Td>
                  <Td align="right" className="num">{p.active}</Td>
                  <Td align="right" className="num">{p.services}</Td>
                  <Td>
                    <Popover align="end" width={180} trigger={(pp) => <IconButton {...pp} icon={MoreHorizontal} label="Thao tác" size="sm" />}>
                      {(close) => <Menu onClose={close} items={[
                        p.state === 'Đang chạy'
                          ? { label: 'Tạm dừng', icon: Pause, onClick: () => { setState(p, 'Tạm dừng'); toast(`Đã tạm dừng ${p.name}`) } }
                          : { label: 'Khởi động', icon: Play, onClick: () => { setState(p, 'Đang chạy'); toast(`${p.name} đang chạy`) } },
                        { divider: true },
                        { label: 'Xoá', icon: Trash2, danger: true, disabled: p.services > 0, onClick: () => setDel(p) },
                      ]} />}
                    </Popover>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      <p className="ds-caption mt-3">Cụm đang chạy dịch vụ không thể xoá. Hãy dừng các dịch vụ trước.</p>
      <PoolForm open={form} onClose={() => { setForm(false); if (params.get('tao')) setParams({}, { replace: true }) }} />
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={`Xoá cụm ${del?.name}?`} confirmLabel="Xoá cụm" onConfirm={() => { remove('pools', del.id); toast(`Đã xoá ${del.name}`) }} />
    </Page>
  )
}
