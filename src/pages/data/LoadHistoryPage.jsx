import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, History } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Card, Select, SearchInput, Table, THead, Th, Tr, Td, EmptyState, Drawer, KeyValue } from '@/components/ui'
import { useApp } from '@/store'
import { TODAY, formatBytes, formatNumber, formatDateTime, timeAgo, stripAccents } from '@/lib/format'

const SEED = [
  { id: 'ld-s1', file: 'don_hang_2026-11-10_0945.csv', size: 182400, table: 'PHO_NUI_DB.BAN_HANG.DON_HANG', rows: 412, skipped: 0, status: 'Thành công', h: 0.5, user: 'DONG_BO_POS', database: 'PHO_NUI_DB', via: 'Tác vụ' },
  { id: 'ld-s2', file: 'don_hang_2026-11-10_0930.csv', size: 171200, table: 'PHO_NUI_DB.BAN_HANG.DON_HANG', rows: 388, skipped: 0, status: 'Thành công', h: 0.75, user: 'DONG_BO_POS', database: 'PHO_NUI_DB', via: 'Tác vụ' },
  { id: 'ld-s3', file: 'danh_gia_ung_dung_1109.csv', size: 48200, table: 'PHO_NUI_DB.MARKETING.DANH_GIA', rows: 57, skipped: 3, status: 'Nạp một phần', h: 18, user: 'NGOCANH', database: 'PHO_NUI_DB', via: 'Tải tệp lên', error: '3 dòng có SO_SAO không phải số' },
  { id: 'ld-s4', file: 'muc_tieu_q4.csv', size: 5100, table: 'PHO_NUI_DB.PUBLIC.MUC_TIEU_Q4', rows: 0, skipped: 20, status: 'Lỗi', h: 50, user: 'THUHA', database: 'PHO_NUI_DB', via: 'Tải tệp lên', error: 'Tệp dùng mã hoá Windows-1258, hãy lưu lại dưới dạng UTF-8' },
  { id: 'ld-s5', file: 'khach_hang_moi_t10.csv', size: 96300, table: 'PHO_NUI_DB.BAN_HANG.KHACH_HANG', rows: 214, skipped: 0, status: 'Thành công', h: 120, user: 'MAILINH', database: 'PHO_NUI_DB', via: 'Tải tệp lên' },
].map((x) => ({ ...x, at: new Date(TODAY.getTime() - x.h * 3600000).toISOString() }))

const TONE = { 'Thành công': 'pos', 'Nạp một phần': 'warn', 'Lỗi': 'neg' }
const RANGES = { '1': 1, '7': 7, '30': 30, all: 3650 }

export default function LoadHistoryPage() {
  const navigate = useNavigate()
  const loads = useApp((s) => s.loads) || []
  const [range, setRange] = useState('7')
  const [status, setStatus] = useState('')
  const [dbf, setDbf] = useState('')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const all = useMemo(() => [...loads.map((l) => ({ ...l, via: l.via || 'Tải tệp lên' })), ...SEED].sort((a, b) => (a.at < b.at ? 1 : -1)), [loads])
  const list = all.filter((l) => {
    const ref = l.id.startsWith('ld-s') ? TODAY.getTime() : Date.now()
    const age = (ref - new Date(l.at).getTime()) / 86400000
    const nq = stripAccents(q).toLowerCase()
    return age <= RANGES[range] && (!status || l.status === status) && (!dbf || l.database === dbf) && (!nq || stripAccents(l.file + ' ' + l.table).toLowerCase().includes(nq))
  })
  const dbs = [...new Set(all.map((l) => l.database))]

  return (
    <Page title="Lịch sử nạp dữ liệu" desc="Mọi lượt nạp tệp vào bảng trong tài khoản, gồm cả các tác vụ đồng bộ tự động." wide
      actions={<Button variant="primary" icon={Upload} onClick={() => navigate('/nap-du-lieu?tai-len=1')}>Tải tệp lên</Button>}>
      <div className="flex flex-wrap gap-2 mb-4">
        <Select size="sm" value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: '1', label: '24 giờ qua' }, { value: '7', label: '7 ngày qua' }, { value: '30', label: '30 ngày qua' }, { value: 'all', label: 'Tất cả' }]} className="w-40" />
        <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Mọi trạng thái" options={['Thành công', 'Nạp một phần', 'Lỗi']} className="w-44" />
        <Select size="sm" value={dbf} onChange={(e) => setDbf(e.target.value)} placeholder="Mọi cơ sở dữ liệu" options={dbs} className="w-48" />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tệp hoặc bảng" className="w-64 h-8" />
        <span className="ds-caption self-center ml-auto">{list.length} lượt nạp</span>
      </div>
      <Card padded={false} className="overflow-hidden">
        {!list.length ? (
          <EmptyState icon={History} title="Không có lượt nạp nào" desc="Không có lượt nạp nào khớp bộ lọc trong khoảng thời gian đã chọn." action={<Button icon={Upload} onClick={() => navigate('/nap-du-lieu?tai-len=1')}>Tải tệp lên</Button>} />
        ) : (
          <Table minWidth={900}>
            <THead><Th>Tệp</Th><Th>Bảng đích</Th><Th>Trạng thái</Th><Th align="right">Dòng đã nạp</Th><Th align="right">Kích thước</Th><Th>Người nạp</Th><Th>Thời điểm</Th></THead>
            <tbody>
              {list.map((l) => (
                <Tr key={l.id} onClick={() => setSel(l)}>
                  <Td><span className="flex items-center gap-2 font-[550]"><FileText size={15} className="text-muted shrink-0" /><span className="truncate max-w-[240px]">{l.file}</span></span></Td>
                  <Td className="font-mono text-[12px] text-dim">{l.table}</Td>
                  <Td><Badge tone={TONE[l.status]} dot size="sm">{l.status}</Badge></Td>
                  <Td align="right" className="num">{formatNumber(l.rows)}</Td>
                  <Td align="right" className="num text-muted">{formatBytes(l.size || 0)}</Td>
                  <Td className="text-muted">{l.user}</Td>
                  <Td className="text-muted">{timeAgo(l.at)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <Drawer open={!!sel} onClose={() => setSel(null)} title="Chi tiết lượt nạp"
        footer={sel && sel.status !== 'Lỗi' && <Button variant="primary" onClick={() => navigate(`/du-lieu/${sel.table.split('.').join('/')}`)}>Xem bảng</Button>}>
        {sel && (
          <>
            <Badge tone={TONE[sel.status]} dot>{sel.status}</Badge>
            {sel.error && <p className="mt-3 rounded-lg bg-neg-soft text-neg px-3 py-2 text-[13px]">{sel.error}</p>}
            <KeyValue className="mt-4" items={[
              { label: 'Tệp', value: sel.file },
              { label: 'Bảng đích', value: <span className="font-mono text-[12px]">{sel.table}</span> },
              { label: 'Dòng đã nạp', value: formatNumber(sel.rows) },
              { label: 'Dòng bỏ qua', value: formatNumber(sel.skipped || 0) },
              { label: 'Kích thước', value: formatBytes(sel.size || 0) },
              { label: 'Cách nạp', value: sel.via },
              { label: 'Người nạp', value: sel.user },
              { label: 'Thời điểm', value: formatDateTime(sel.at) },
            ]} />
          </>
        )}
      </Drawer>
    </Page>
  )
}
