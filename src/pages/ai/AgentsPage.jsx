import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Bot, BookOpen, Settings2, MessagesSquare, Info } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Badge, SearchInput, Modal, Input, Select, EmptyState, DynIcon, Tabs, Callout } from '@/components/ui'
import { useApp, uid, toast } from '@/store'
import { timeAgo, formatNumber } from '@/lib/format'
import { cn } from '@/lib/cn'

const LOCATIONS = [
  { value: 'PHO_NUI_DB.BAN_HANG', label: 'PHO_NUI_DB.BAN_HANG' },
  { value: 'PHO_NUI_DB.MARKETING', label: 'PHO_NUI_DB.MARKETING' },
  { value: 'PHO_NUI_DB.PUBLIC', label: 'PHO_NUI_DB.PUBLIC' },
]

export function CreateAgentModal({ open, onClose }) {
  const navigate = useNavigate()
  const { upsert, agents } = useApp()
  const [loc, setLoc] = useState('')
  const [name, setName] = useState('')
  const [display, setDisplay] = useState('')
  const obj = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const dup = agents.some((a) => a.name === obj)
  const valid = loc && obj && display.trim() && !dup
  useEffect(() => { if (open) { setLoc(''); setName(''); setDisplay('') } }, [open])
  const create = () => {
    const [database, schema] = loc.split('.')
    const a = {
      id: uid('a'), name: obj, display: display.trim(), color: '#5b46e5', icon: 'Bot', desc: '', status: 'Bản nháp', version: 0,
      model: 'VAN-LANG-8B', database, schema, instructions: 'Luôn trả lời bằng tiếng Việt, ngắn gọn và có số liệu cụ thể.', style: 'Ngắn gọn',
      tools: ['Hỏi dữ liệu bán hàng'], questions: [], access: ['QUAN_TRI'], updated: new Date().toISOString(), sessions: 0, readiness: 20, versions: [], evals: [],
    }
    upsert('agents', a)
    toast({ title: 'Đã tạo tác tử', desc: `${a.display} đang ở trạng thái bản nháp.` })
    onClose()
    navigate(`/ai/tac-tu/${a.id}?tab=cau-hinh`)
  }
  return (
    <Modal open={open} onClose={onClose} title="Tạo tác tử" desc="Tác tử là trợ lý AI trả lời câu hỏi dựa trên dữ liệu và công cụ bạn cấp quyền."
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!valid} onClick={create}>Tạo tác tử</Button></>}>
      <div className="flex flex-col gap-4">
        <Select label="Cơ sở dữ liệu và lược đồ" placeholder="Chọn nơi lưu tác tử" options={LOCATIONS} value={loc} onChange={(e) => setLoc(e.target.value)} />
        <Input label="Tên đối tượng" placeholder="vd: TRO_LY_CSKH" value={name} onChange={(e) => setName(e.target.value)}
          hint={obj ? `Đường dẫn API: …/agents/${loc || '<CSDL.LƯỢC_ĐỒ>'}.${obj}` : 'Chỉ dùng chữ không dấu, số và dấu gạch dưới.'} error={dup ? 'Tên này đã được dùng.' : undefined} />
        <Input label="Tên hiển thị" placeholder="vd: Trợ lý chăm sóc khách hàng" value={display} onChange={(e) => setDisplay(e.target.value)} />
        <Callout tone="neutral" icon={Info}>Đổi tên đối tượng sau khi tạo sẽ làm thay đổi đường dẫn API của tác tử.</Callout>
      </div>
    </Modal>
  )
}

export default function AgentsPage() {
  const agents = useApp((s) => s.agents)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const creating = params.get('tao') === '1'
  const list = useMemo(() => agents.filter((a) => (!q || (a.display + a.name).toLowerCase().includes(q.toLowerCase())) && (tab === 'all' || (tab === 'pub' ? a.status === 'Đã xuất bản' : a.status !== 'Đã xuất bản'))), [agents, q, tab])
  const setCreating = (v) => { const p = new URLSearchParams(params); v ? p.set('tao', '1') : p.delete('tao'); setParams(p, { replace: true }) }

  return (
    <Page title="Tác tử AI" desc="Trợ lý AI cho từng phòng ban: trả lời câu hỏi bằng dữ liệu của bạn, trong phạm vi quyền bạn cấp."
      actions={<>
        <Button variant="ghost" icon={BookOpen} to="/mau-du-an">Tài liệu</Button>
        <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo tác tử</Button>
      </>}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Tabs value={tab} onChange={setTab} options={[{ value: 'all', label: 'Tất cả', count: agents.length }, { value: 'pub', label: 'Đã xuất bản' }, { value: 'draft', label: 'Bản nháp' }]} className="border-0" />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tác tử" className="sm:w-64" />
      </div>
      {!agents.length ? (
        <div className="card">
          <EmptyState icon={Bot} title="Bắt đầu với tác tử AI" desc="Tác tử giúp tự động hoá trả lời câu hỏi, tìm thông tin và làm việc nhanh hơn."
            action={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo tác tử</Button>} />
        </div>
      ) : !list.length ? (
        <div className="card"><EmptyState compact title="Không có tác tử phù hợp" desc="Thử từ khoá hoặc bộ lọc khác." /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((a) => (
            <button key={a.id} onClick={() => navigate(`/ai/tac-tu/${a.id}`)} className="card p-5 text-left hover:shadow-sm hover:border-line-strong transition flex flex-col">
              <div className="flex items-start gap-3">
                <span className="size-11 rounded-xl grid place-items-center text-white shrink-0" style={{ background: a.color }}><DynIcon name={a.icon} size={21} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-[650] truncate">{a.display}</div>
                  <div className="text-[12px] text-faint font-mono truncate">{a.database}.{a.schema}.{a.name}</div>
                </div>
                <Badge size="sm" tone={a.status === 'Đã xuất bản' ? 'pos' : 'neutral'} dot>{a.status}</Badge>
              </div>
              <p className="ds-caption mt-3 line-clamp-2 min-h-[36px]">{a.desc || 'Chưa có mô tả.'}</p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-line text-[12px] text-muted">
                <span className="inline-flex items-center gap-1"><Settings2 size={13} />{a.model}</span>
                <span className="inline-flex items-center gap-1"><MessagesSquare size={13} />{formatNumber(a.sessions)} phiên</span>
                <span className={cn('ml-auto')}>{a.version ? `v${a.version} · ` : ''}{timeAgo(a.updated)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <CreateAgentModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  )
}
