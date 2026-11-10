import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, Plus, Building2, Users, Inbox, Table2, X, Database, ArrowDownLeft, ArrowUpRight, Trash2, BookOpen } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Card, Tabs, Modal, Drawer, Input, Textarea, Checkbox, SearchInput, EmptyState, KeyValue, Confirm } from '@/components/ui'
import { useApp, toast, uid } from '@/store'
import { formatDate, formatNumber } from '@/lib/format'
import { useCatalog, flatTables, toTableName } from '@/features/data/shared'

const DEPARTMENTS = ['Ban giám đốc', 'Vận hành cửa hàng', 'Marketing', 'Tài chính – Kế toán', 'Nhân sự']

function ShareModal({ open, onClose, internal }) {
  const { tree } = useCatalog({ withCounts: true })
  const update = useApp((s) => s.update)
  const tables = flatTables(tree).filter((t) => t.database !== 'LAC_VIET')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [acct, setAcct] = useState('')
  const [targets, setTargets] = useState([])
  const shown = tables.filter((t) => !q || t.fqn.toLowerCase().includes(q.toLowerCase()))
  const reset = () => { setSel([]); setName(''); setDesc(''); setTargets([]); setAcct(''); setQ('') }
  const ok = sel.length && targets.length
  const submit = () => {
    const share = {
      id: uid('sh'), name: toTableName(name) || `CHIA_SE_${sel[0].split('.').pop()}`, to: targets, objects: sel.length, tables: sel,
      created: new Date().toISOString().slice(0, 10), desc, internal,
    }
    update('shares', (s) => ({ ...s, outbound: [share, ...s.outbound] }))
    toast({ title: 'Đã chia sẻ dữ liệu', desc: `${sel.length} bảng tới ${targets.join(', ')}` })
    reset(); onClose()
  }
  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} size="lg" title={internal ? 'Chia sẻ trong công ty' : 'Chia sẻ dữ liệu ra ngoài'}
      desc={internal ? 'Các phòng ban truy cập dữ liệu dùng chung, luôn là bản mới nhất.' : 'Tài khoản Lạc Việt Data khác cùng vùng truy cập trực tiếp, không sao chép tệp.'}
      footer={<><Button onClick={() => { reset(); onClose() }}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={submit}>Tạo chia sẻ</Button></>}>
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-[13px] font-[550] text-dim mb-2">Chọn dữ liệu <span className="text-faint font-normal">({sel.length} đã chọn)</span></div>
          <SearchInput value={q} onChange={setQ} placeholder="Lọc bảng" />
          <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-line divide-y divide-line">
            {shown.map((t) => (
              <label key={t.fqn} className="flex items-center gap-3 px-3 py-2 hover:bg-subtle cursor-pointer">
                <Checkbox checked={sel.includes(t.fqn)} onChange={(v) => setSel((s) => (v ? [...s, t.fqn] : s.filter((x) => x !== t.fqn)))} />
                <Table2 size={14} className="text-muted" />
                <span className="font-mono text-[12.5px] flex-1 truncate">{t.fqn}</span>
                <span className="ds-caption num">{t.rows != null ? formatNumber(t.rows) + ' dòng' : ''}</span>
              </label>
            ))}
          </div>
        </div>
        <Input label="Tên chia sẻ" optional value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: DOANH_THU_CHO_DOI_TAC" />
        <div>
          <div className="text-[13px] font-[550] text-dim mb-2">{internal ? 'Phòng ban được truy cập' : 'Tài khoản nhận'}</div>
          {internal ? (
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((d) => (
                <button key={d} onClick={() => setTargets((t) => (t.includes(d) ? t.filter((x) => x !== d) : [...t, d]))}
                  className={`h-8 px-3 rounded-full border text-[13px] ${targets.includes(d) ? 'bg-brand-50 border-brand-300 text-brand-ink font-[600]' : 'border-line hover:border-faint'}`}>{d}</button>
              ))}
            </div>
          ) : (
            <>
              <form onSubmit={(e) => { e.preventDefault(); const v = toTableName(acct); if (v && !targets.includes(v)) setTargets([...targets, v]); setAcct('') }} className="flex gap-2">
                <Input className="flex-1" value={acct} onChange={(e) => setAcct(e.target.value)} placeholder="Mã tài khoản, VD: DOI_TAC_DA_LAT" />
                <Button type="submit" disabled={!acct.trim()}>Thêm</Button>
              </form>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {targets.map((t) => <Badge key={t} tone="brand">{t}<button onClick={() => setTargets(targets.filter((x) => x !== t))}><X size={12} /></button></Badge>)}
              </div>
            </>
          )}
        </div>
        <Textarea label="Mô tả" optional rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Dữ liệu gì, cập nhật bao lâu một lần, ai liên hệ khi có thắc mắc" />
      </div>
    </Modal>
  )
}

export default function SharingPage() {
  const navigate = useNavigate()
  const { shares, update } = useApp()
  const [tab, setTab] = useState('out')
  const [create, setCreate] = useState(null)
  const [sel, setSel] = useState(null)
  const [del, setDel] = useState(null)
  const [addAcct, setAddAcct] = useState('')
  const internal = shares.outbound.filter((s) => s.internal)
  const outbound = shares.outbound.filter((s) => !s.internal)
  const list = tab === 'internal' ? internal : tab === 'out' ? outbound : shares.inbound
  const cur = useMemo(() => sel && (shares.outbound.find((s) => s.id === sel) || shares.inbound.find((s) => s.id === sel)), [sel, shares])
  const isIn = cur && shares.inbound.some((s) => s.id === cur.id)
  const patchOut = (id, patch) => update('shares', (s) => ({ ...s, outbound: s.outbound.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))

  return (
    <Page title="Chia sẻ dữ liệu" desc="Chia sẻ trực tiếp, an toàn với phòng ban khác hoặc đối tác — người nhận luôn thấy dữ liệu mới nhất mà không cần sao chép." wide
      actions={tab !== 'in' && <Button variant="primary" icon={Plus} onClick={() => setCreate(tab === 'internal' ? 'internal' : 'out')}>Chia sẻ dữ liệu</Button>}>
      <Tabs value={tab} onChange={setTab} className="mb-5" options={[
        { value: 'internal', label: 'Chia sẻ nội bộ', count: internal.length },
        { value: 'out', label: 'Chia sẻ ra ngoài', count: outbound.length },
        { value: 'in', label: 'Được chia sẻ với tôi', count: shares.inbound.length },
      ]} />

      {tab === 'internal' && !internal.length && (
        <Card className="bg-gradient-to-br from-brand-50 to-ice-soft border-brand-100">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h2 className="ds-h2">Tạo, quản lý và chia sẻ sản phẩm dữ liệu trong công ty</h2>
              <p className="text-muted mt-1 max-w-2xl">Gom các bảng hay dùng thành “sản phẩm dữ liệu” có mô tả, người phụ trách và quyền truy cập rõ ràng để các phòng ban tự phục vụ.</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                {[['Một nguồn sự thật', 'Mọi phòng ban dùng chung số liệu doanh thu'], ['Kiểm soát truy cập', 'Cấp theo phòng ban, thu hồi bất cứ lúc nào'], ['Không sao chép', 'Không tốn thêm chi phí lưu trữ']].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-surface/80 border border-line p-3"><div className="font-[600] text-[13.5px]">{t}</div><div className="ds-caption mt-0.5">{d}</div></div>
                ))}
              </div>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setCreate('internal')}>Tạo sản phẩm dữ liệu</Button>
          </div>
        </Card>
      )}

      {list.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((s) => (
            <button key={s.id} onClick={() => setSel(s.id)} className="text-left card p-4 hover:shadow-sm hover:border-brand-200 transition-all">
              <div className="flex items-start gap-3">
                <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-brand-50 text-brand-ink">{tab === 'in' ? <ArrowDownLeft size={18} /> : tab === 'internal' ? <Building2 size={18} /> : <ArrowUpRight size={18} />}</span>
                <div className="min-w-0">
                  <div className="font-[600] font-mono text-[13px] truncate">{s.name}</div>
                  <div className="ds-caption mt-0.5">{tab === 'in' ? `Từ ${s.from}` : `Tới ${s.to.join(', ')}`}</div>
                </div>
              </div>
              {s.desc && <p className="text-[13px] text-dim mt-3 line-clamp-2">{s.desc}</p>}
              <div className="flex items-center gap-3 mt-4 text-[12px] text-muted">
                <span className="flex items-center gap-1"><Database size={12} />{s.objects} đối tượng</span>
                <span>Tạo {formatDate(s.created)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {tab === 'out' && !outbound.length && <EmptyState icon={Share2} title="Chưa chia sẻ ra ngoài" desc="Chia sẻ dữ liệu với tài khoản đối tác cùng vùng." action={<Button icon={Plus} onClick={() => setCreate('out')}>Chia sẻ dữ liệu</Button>} />}
      {tab === 'in' && !shares.inbound.length && <EmptyState icon={Inbox} title="Chưa có dữ liệu được chia sẻ" />}

      <ShareModal open={!!create} internal={create === 'internal'} onClose={() => setCreate(null)} />

      <Drawer open={!!cur} onClose={() => setSel(null)} width={520}
        header={cur && <div><div className="ds-caption">{isIn ? 'Được chia sẻ với tôi' : cur.internal ? 'Chia sẻ nội bộ' : 'Chia sẻ ra ngoài'}</div><h2 className="ds-h2 font-mono break-all">{cur.name}</h2></div>}
        footer={cur && (isIn
          ? <Button variant="primary" icon={BookOpen} onClick={() => navigate(`/du-lieu/${cur.name === 'DU_LIEU_MAU' ? 'DU_LIEU_MAU' : 'LAC_VIET'}`)}>Xem dữ liệu</Button>
          : <Button variant="danger-soft" icon={Trash2} onClick={() => setDel(cur)}>Thu hồi chia sẻ</Button>)}>
        {cur && (
          <div className="flex flex-col gap-5">
            {cur.desc && <p className="text-dim">{cur.desc}</p>}
            <KeyValue items={[
              { label: isIn ? 'Nhà cung cấp' : 'Chủ sở hữu', value: isIn ? cur.from : 'QUAN_TRI' },
              { label: 'Số đối tượng', value: cur.objects },
              { label: 'Ngày tạo', value: formatDate(cur.created) },
            ]} />
            {!isIn && (
              <div>
                <div className="ds-label mb-2">Được chia sẻ với</div>
                <div className="flex flex-col gap-1.5">
                  {cur.to.map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                      {cur.internal ? <Users size={15} className="text-muted" /> : <Building2 size={15} className="text-muted" />}
                      <span className="flex-1 text-[13.5px]">{t}</span>
                      <button className="text-faint hover:text-neg" onClick={() => patchOut(cur.id, { to: cur.to.filter((x) => x !== t) })} aria-label="Gỡ"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                {!cur.internal && (
                  <form className="flex gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); const v = toTableName(addAcct); if (v) patchOut(cur.id, { to: [...new Set([...cur.to, v])] }); setAddAcct('') }}>
                    <Input className="flex-1" size="sm" value={addAcct} onChange={(e) => setAddAcct(e.target.value)} placeholder="Thêm tài khoản" />
                    <Button size="sm" type="submit">Thêm</Button>
                  </form>
                )}
              </div>
            )}
            <div>
              <div className="ds-label mb-2">Dữ liệu</div>
              <div className="rounded-xl border border-line divide-y divide-line">
                {(cur.tables || (isIn ? ['TINH_THANH', 'NGAY_LE_VN', 'THOI_TIET_THANG'].slice(0, cur.objects).map((t) => `${cur.name}.CONG_KHAI.${t}`) : ['PHO_NUI_DB.BAN_HANG.DOANH_THU_NGAY'])).map((t) => (
                  <div key={t} className="flex items-center gap-2 px-3 py-2 font-mono text-[12.5px]"><Table2 size={14} className="text-muted" />{t}</div>
                ))}
                {isIn && cur.objects > 3 && <div className="px-3 py-2 ds-caption">+ {cur.objects - 3} đối tượng hệ thống khác</div>}
              </div>
            </div>
          </div>
        )}
      </Drawer>
      <Confirm open={!!del} onClose={() => setDel(null)} danger confirmLabel="Thu hồi" title={`Thu hồi ${del?.name}?`} desc="Người nhận sẽ mất quyền truy cập ngay lập tức."
        onConfirm={() => { update('shares', (s) => ({ ...s, outbound: s.outbound.filter((x) => x.id !== del.id) })); setSel(null); toast('Đã thu hồi chia sẻ') }} />
    </Page>
  )
}
