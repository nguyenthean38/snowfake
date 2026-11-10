import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MoreHorizontal, Play, Pause, Star, Pencil, Trash2, Zap, Columns3, Info, Gauge, Hourglass, Coins, ChevronDown } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, IconButton, Input, Textarea, Select, Toggle, Badge, SearchInput, Table, THead, Th, Tr, Td, Popover, Menu, Modal, Drawer, Confirm, Callout, Segmented,
} from '@/components/ui'
import { useApp, toast, uid } from '@/store'
import { SIZES, CREDIT_PRICE, seedConsumption } from '@/data/platform'
import { formatNumber, formatCredits } from '@/lib/format'
import { WarehouseState, sizeCredits } from '@/features/monitor/shared'
import { cn } from '@/lib/cn'

const TYPES = ['Tiêu chuẩn', 'Tối ưu bộ nhớ']
const vnd = (n) => `${formatNumber(Math.round(n))} ₫`

function SizePicker({ value, onChange, type }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SIZES.map((s) => {
        const credits = s.credits * (type === 'Tối ưu bộ nhớ' ? 1.5 : 1)
        const on = value === s.id
        return (
          <button key={s.id} type="button" onClick={() => onChange(s.id)} className={cn('rounded-xl border px-3 py-2.5 text-left transition', on ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-line-strong')}>
            <div className="font-[650] text-[13.5px]">{s.id}</div>
            <div className="ds-caption num">{formatCredits(credits)} tín dụng/giờ</div>
            <div className="text-[11.5px] text-faint num">≈ {vnd(credits * CREDIT_PRICE)}/giờ</div>
          </button>
        )
      })}
    </div>
  )
}

function WarehouseForm({ open, onClose, wh }) {
  const { warehouses, upsert } = useApp()
  const [f, setF] = useState(null)
  const [adv, setAdv] = useState(false)
  useEffect(() => {
    if (open) {
      setAdv(!!wh)
      setF(wh ? { ...wh, minC: wh.clusters[0], maxC: wh.clusters[1], autoResume: wh.autoResume ?? true, suspendOn: wh.autoSuspend > 0, policy: wh.policy || 'Tiêu chuẩn' }
        : { name: '', comment: '', type: 'Tiêu chuẩn', size: 'X-Small', autoSuspend: 60, suspendOn: true, autoResume: true, minC: 1, maxC: 1, policy: 'Tiêu chuẩn' })
    }
  }, [open, wh])
  if (!open || !f) return null
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const exists = !wh && warehouses.some((w) => w.name === f.name.toUpperCase())
  const valid = /^[A-Za-z_]\w*$/.test(f.name) && !exists && f.maxC >= f.minC
  const credits = sizeCredits(f.size) * (f.type === 'Tối ưu bộ nhớ' ? 1.5 : 1)
  const save = () => {
    const item = {
      id: wh?.id || uid('w'), name: f.name.toUpperCase(), size: f.size, type: f.type, comment: f.comment,
      autoSuspend: f.suspendOn ? +f.autoSuspend : 0, autoResume: f.autoResume, clusters: [+f.minC, +f.maxC], policy: f.policy,
      state: wh?.state || 'Đang chạy', owner: wh?.owner || useApp.getState().currentRole, running: wh?.running || 0, queued: wh?.queued || 0,
      created: wh?.created || new Date().toISOString().slice(0, 10), resumedAt: wh?.resumedAt || new Date().toISOString(),
    }
    upsert('warehouses', item)
    toast(wh ? `Đã cập nhật ${item.name}` : { title: `Đã tạo kho ${item.name}`, desc: `${item.size} · ${formatCredits(credits)} tín dụng/giờ khi chạy` })
    onClose()
  }
  const body = (
    <div className="flex flex-col gap-4">
      <Input label="Tên kho tính toán" autoFocus={!wh} disabled={!!wh} value={f.name} onChange={(e) => set({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })} placeholder="VD: KHO_BAO_CAO"
        error={exists ? 'Tên này đã được dùng.' : f.name && !/^[A-Za-z_]\w*$/.test(f.name) ? 'Chỉ dùng chữ không dấu, số và dấu gạch dưới.' : undefined} />
      <Textarea label="Mô tả" optional rows={2} value={f.comment} onChange={(e) => set({ comment: e.target.value })} placeholder="Kho dùng cho việc gì?" />
      <div>
        <div className="text-[13px] font-[550] text-dim mb-1.5">Loại</div>
        <Segmented value={f.type} onChange={(v) => set({ type: v })} options={TYPES} />
        {f.type === 'Tối ưu bộ nhớ' && <p className="ds-caption mt-1.5">Bộ nhớ gấp 16 lần mỗi nút — hợp với huấn luyện mô hình, hàm AI trên dữ liệu lớn. Giá gấp 1,5 lần.</p>}
      </div>
      <div><div className="text-[13px] font-[550] text-dim mb-1.5">Cỡ</div><SizePicker value={f.size} onChange={(v) => set({ size: v })} type={f.type} /></div>
      <Callout tone="brand" icon={Coins}>Khi chạy liên tục: <b className="num">{formatCredits(credits)}</b> tín dụng/giờ ≈ <b className="num">{vnd(credits * CREDIT_PRICE)}</b>/giờ. Kho tạm dừng không tốn phí.</Callout>
      <button type="button" onClick={() => setAdv(!adv)} className="flex items-center gap-1.5 text-[13px] font-[600] text-brand-ink self-start">
        <ChevronDown size={15} className={cn('transition-transform', !adv && '-rotate-90')} />Tuỳ chọn nâng cao
      </button>
      {adv && (
        <div className="flex flex-col gap-4 rounded-xl border border-line p-4 animate-fade-in">
          <Toggle checked={f.autoResume} onChange={(v) => set({ autoResume: v })} label="Tự khởi động" desc="Kho tự bật khi có truy vấn gửi tới." />
          <Toggle checked={f.suspendOn} onChange={(v) => set({ suspendOn: v })} label="Tự tạm dừng" desc="Tạm dừng khi không có truy vấn để tiết kiệm tín dụng." />
          {f.suspendOn && (
            <Select label="Tạm dừng sau" value={f.autoSuspend} onChange={(e) => set({ autoSuspend: +e.target.value })}
              options={[{ value: 60, label: '1 phút không hoạt động' }, { value: 300, label: '5 phút' }, { value: 600, label: '10 phút' }, { value: 1800, label: '30 phút' }, { value: 3600, label: '1 giờ' }]} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Số cụm tối thiểu" type="number" min={1} max={10} value={f.minC} onChange={(e) => set({ minC: Math.max(1, +e.target.value || 1) })} />
            <Input label="Số cụm tối đa" type="number" min={1} max={10} value={f.maxC} onChange={(e) => set({ maxC: Math.max(1, +e.target.value || 1) })} error={f.maxC < f.minC ? 'Phải lớn hơn hoặc bằng tối thiểu' : undefined} />
          </div>
          {f.maxC > 1 && <Select label="Chính sách mở rộng" value={f.policy} onChange={(e) => set({ policy: e.target.value })} options={[{ value: 'Tiêu chuẩn', label: 'Tiêu chuẩn — bật cụm mới ngay khi có hàng đợi' }, { value: 'Tiết kiệm', label: 'Tiết kiệm — chỉ bật khi đủ tải trong 6 phút' }]} />}
        </div>
      )}
    </div>
  )
  const footer = <><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!valid} onClick={save}>{wh ? 'Lưu thay đổi' : 'Tạo kho'}</Button></>
  if (wh) return <Drawer open onClose={onClose} width={560} title={`Sửa ${wh.name}`} footer={footer}>{body}</Drawer>
  return <Modal open onClose={onClose} size="lg" title="Kho tính toán mới" desc={`Chủ sở hữu: ${useApp.getState().currentRole}`} footer={footer}>{body}</Modal>
}

export default function WarehousesPage() {
  const { warehouses, currentWarehouse, setWarehouseState, useWarehouse: makeDefault, update, remove, history } = useApp()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState(params.get('tao') === '1' ? { wh: null } : null)
  const [del, setDel] = useState(null)
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [size, setSize] = useState('')
  const today = useMemo(() => { const c = seedConsumption(); return c[c.length - 1] }, [])
  const list = warehouses.filter((w) => (!q || w.name.toLowerCase().includes(q.toLowerCase())) && (!state || w.state === state) && (!size || w.size === size))
  const running = warehouses.filter((w) => w.state === 'Đang chạy')
  const creditsToday = warehouses.reduce((s, w) => s + (today[w.name] || 0), 0)
  const recentQueries = history.filter((h) => Date.now() - h.startedAt < 3600e3).length

  const toggle = (w) => {
    const next = w.state === 'Đang chạy' ? 'Tạm dừng' : 'Đang chạy'
    if (next === 'Đang chạy') {
      setWarehouseState(w.name, 'Đang khởi động')
      setTimeout(() => { update('warehouses', (l) => l.map((x) => (x.name === w.name ? { ...x, state: 'Đang chạy', resumedAt: new Date().toISOString() } : x))); toast(`${w.name} đã sẵn sàng`) }, 900)
    } else {
      setWarehouseState(w.name, 'Tạm dừng')
      toast(`Đã tạm dừng ${w.name}`)
    }
  }

  return (
    <Page wide title="Kho tính toán" desc="Cụm máy chạy truy vấn của bạn. Chỉ tính tín dụng theo giây khi kho đang chạy; kho tự tạm dừng khi rảnh."
      actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ wh: null })}>Kho tính toán</Button>}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          [Gauge, 'Đang chạy', `${running.length} / ${warehouses.length} kho`, running.map((w) => w.name).join(', ') || 'Tất cả đang tạm dừng'],
          [Coins, 'Tín dụng hôm nay', `${formatCredits(creditsToday)} tín dụng`, `≈ ${vnd(creditsToday * CREDIT_PRICE)}`],
          [Hourglass, 'Truy vấn đang chờ', formatNumber(warehouses.reduce((s, w) => s + (w.queued || 0), 0)), `${recentQueries} truy vấn trong 1 giờ qua`],
        ].map(([Icon, l, v, sub]) => (
          <div key={l} className="card px-4 py-3.5 flex items-start gap-3">
            <span className="size-9 rounded-lg bg-brand-50 text-brand-ink grid place-items-center shrink-0"><Icon size={18} /></span>
            <div className="min-w-0"><div className="text-[12.5px] text-muted">{l}</div><div className="text-[19px] font-[650] num tracking-tight">{v}</div><div className="ds-caption truncate">{sub}</div></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm kho" className="w-full sm:w-60" />
        <Select size="sm" value={state} onChange={(e) => setState(e.target.value)} options={[{ value: '', label: 'Trạng thái: Tất cả' }, 'Đang chạy', 'Tạm dừng']} className="w-44" />
        <Select size="sm" value={size} onChange={(e) => setSize(e.target.value)} options={[{ value: '', label: 'Cỡ: Tất cả' }, ...SIZES.map((s) => s.id)]} className="w-36" />
        <span className="ds-caption ml-auto flex items-center gap-1"><Columns3 size={14} />{list.length} kho</span>
      </div>

      <div className="card overflow-hidden">
        <Table minWidth={1120}>
          <THead>
            <Th>Tên</Th><Th>Trạng thái</Th><Th>Cỡ</Th><Th>Loại</Th><Th align="right">Cụm</Th><Th align="right">Đang chạy</Th><Th align="right">Đang chờ</Th>
            <Th align="right">Tín dụng/giờ</Th><Th>Chủ sở hữu</Th><Th>Tiếp tục lúc</Th><Th width={48} />
          </THead>
          <tbody>
            {list.map((w) => {
              const cr = sizeCredits(w.size) * (w.type === 'Tối ưu bộ nhớ' ? 1.5 : 1)
              const isDef = w.name === currentWarehouse
              return (
                <Tr key={w.id} onClick={() => setForm({ wh: w })}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Zap size={15} className={w.state === 'Đang chạy' ? 'text-pos' : 'text-faint'} />
                      <span className="font-mono text-[12.5px] font-[600]">{w.name}</span>
                      {isDef && <Badge size="sm" tone="brand" icon={Star}>Mặc định</Badge>}
                    </div>
                    {w.comment && <div className="ds-caption truncate max-w-[280px] ml-6">{w.comment}</div>}
                  </Td>
                  <Td><WarehouseState value={w.state} /></Td>
                  <Td className="text-[13px]">{w.size}</Td>
                  <Td className="text-[13px]">{w.type}</Td>
                  <Td align="right" className="num text-[13px]">{w.clusters[0] === w.clusters[1] ? w.clusters[0] : `${w.clusters[0]}–${w.clusters[1]}`}</Td>
                  <Td align="right" className="num">{w.state === 'Đang chạy' ? (w.running || (isDef ? 1 : 0)) : 0}</Td>
                  <Td align="right" className="num">{w.queued || 0}</Td>
                  <Td align="right" className="num" title={`≈ ${vnd(cr * CREDIT_PRICE)}/giờ`}>{formatCredits(cr)}</Td>
                  <Td className="text-[13px]">{w.owner}</Td>
                  <Td className="text-[13px] whitespace-nowrap">{w.state === 'Đang chạy' ? (w.resumedAt ? new Date(w.resumedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Hôm nay 07:58') : '—'}</Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Popover align="end" width={220} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác" size="sm" />}>
                      {(close) => <Menu onClose={close} items={[
                        w.state === 'Đang chạy' ? { label: 'Tạm dừng', icon: Pause, onClick: () => toggle(w) } : { label: 'Khởi động', icon: Play, onClick: () => toggle(w) },
                        { label: 'Đặt làm kho mặc định', icon: Star, disabled: isDef, onClick: () => { makeDefault(w.name); toast({ title: `${w.name} là kho mặc định`, desc: 'Trình soạn SQL sẽ chạy truy vấn trên kho này.' }) } },
                        { label: 'Sửa', icon: Pencil, onClick: () => setForm({ wh: w }) },
                        { divider: true },
                        { label: 'Xoá', icon: Trash2, danger: true, disabled: isDef, onClick: () => setDel(w) },
                      ]} />}
                    </Popover>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
        {!list.length && <div className="p-8 text-center text-muted text-[13px]">Không có kho nào khớp bộ lọc.</div>}
      </div>
      <p className="ds-caption mt-3 flex items-center gap-1.5"><Info size={13} />Giá tham khảo theo gói Doanh nghiệp: {vnd(CREDIT_PRICE)} / tín dụng.</p>

      <WarehouseForm open={!!form} wh={form?.wh} onClose={() => { setForm(null); if (params.get('tao')) setParams({}, { replace: true }) }} />
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={`Xoá kho ${del?.name}?`} desc="Các truy vấn và tác vụ đang dùng kho này sẽ lỗi cho tới khi chọn kho khác." confirmLabel="Xoá kho"
        onConfirm={() => { remove('warehouses', del.id); toast(`Đã xoá ${del.name}`) }} />
    </Page>
  )
}
