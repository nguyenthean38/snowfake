import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Columns3, Sparkles, Filter, X, History } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, IconButton, Select, SearchInput, Tabs, Table, THead, Th, Tr, Td, Popover, Checkbox, EmptyState, Badge,
} from '@/components/ui'
import { useApp, toast } from '@/store'
import { formatDuration, formatNumber, formatDateTime } from '@/lib/format'
import { QueryStatus, DurationBar, hashSQL, normalizeSQL, ExplainModal, ago, nowRef } from '@/features/monitor/shared'

const RANGES = [
  { value: '1h', label: '1 giờ qua', ms: 3600e3 },
  { value: '1d', label: '1 ngày qua', ms: 86400e3 },
  { value: '7d', label: '7 ngày qua', ms: 7 * 86400e3 },
  { value: 'all', label: 'Mọi thời điểm', ms: Infinity },
]
const COLS = [
  { key: 'sql', label: 'Câu SQL' },
  { key: 'id', label: 'Mã truy vấn' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'user', label: 'Người dùng' },
  { key: 'warehouse', label: 'Kho tính toán' },
  { key: 'ms', label: 'Thời lượng' },
  { key: 'rows', label: 'Số dòng' },
  { key: 'source', label: 'Nguồn' },
  { key: 'start', label: 'Bắt đầu' },
]

export default function QueryHistoryPage() {
  const history = useApp((s) => s.history)
  const navigate = useNavigate()
  const [tab, setTab] = useState('each')
  const [status, setStatus] = useState('')
  const [user, setUser] = useState('')
  const [wh, setWh] = useState('')
  const [range, setRange] = useState('7d')
  const [q, setQ] = useState('')
  const [hash, setHash] = useState(null)
  const [cols, setCols] = useState(['sql', 'id', 'status', 'user', 'warehouse', 'ms', 'rows', 'start'])
  const [explain, setExplain] = useState(null)
  const [tick, setTick] = useState(0)

  const users = useMemo(() => [...new Set(history.map((h) => h.user))].sort(), [history])
  const whs = useMemo(() => [...new Set(history.map((h) => h.warehouse))].sort(), [history])

  const filtered = useMemo(() => {
    const lim = RANGES.find((r) => r.value === range).ms
    const now = nowRef()
    const nq = q.trim().toLowerCase()
    return [...history]
      .sort((a, b) => b.startedAt - a.startedAt)
      .filter((h) => (!status || h.status === status) && (!user || h.user === user) && (!wh || h.warehouse === wh))
      .filter((h) => now - h.startedAt <= lim)
      .filter((h) => !nq || h.sql.toLowerCase().includes(nq) || h.id.toLowerCase().includes(nq))
      .filter((h) => !hash || hashSQL(h.sql) === hash)
  }, [history, status, user, wh, range, q, hash, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxMs = Math.max(1, ...filtered.map((h) => h.ms))
  const groups = useMemo(() => {
    const m = new Map()
    for (const h of filtered) {
      const k = hashSQL(h.sql)
      const g = m.get(k) || { hash: k, sample: h.sql, count: 0, total: 0, errors: 0, users: new Set(), last: 0 }
      g.count++; g.total += h.ms
      if (h.status === 'Lỗi') g.errors++
      g.users.add(h.user)
      if (h.startedAt > g.last) { g.last = h.startedAt; g.sample = h.sql }
      m.set(k, g)
    }
    return [...m.values()].sort((a, b) => b.total - a.total)
  }, [filtered])
  const maxTotal = Math.max(1, ...groups.map((g) => g.total))

  const failed = filtered.filter((h) => h.status === 'Lỗi').length
  const avg = filtered.length ? filtered.reduce((s, h) => s + h.ms, 0) / filtered.length : 0
  const show = (k) => cols.includes(k)
  const anyFilter = status || user || wh || q || hash

  return (
    <Page wide title="Lịch sử truy vấn" desc="Mọi câu lệnh chạy trên tài khoản trong 14 ngày gần nhất — gồm cả những truy vấn bạn vừa chạy trong trình soạn SQL."
      actions={<>
        <Button icon={Sparkles} onClick={() => setExplain(filtered[0]?.sql || '')} disabled={!filtered.length}>Phân tích với Tinh Ý</Button>
        <IconButton icon={RefreshCw} label="Làm mới" variant="outline" onClick={() => { setTick((t) => t + 1); toast('Đã làm mới lịch sử truy vấn') }} />
      </>}>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ['Truy vấn', formatNumber(filtered.length)],
          ['Lỗi', formatNumber(failed), failed ? 'text-neg' : ''],
          ['Thời lượng trung bình', formatDuration(avg)],
          ['Nhóm truy vấn', formatNumber(groups.length)],
        ].map(([l, v, c]) => (
          <div key={l} className="card px-4 py-3">
            <div className="text-[12.5px] text-muted">{l}</div>
            <div className={`text-[20px] font-[650] num tracking-tight ${c || ''}`}>{v}</div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onChange={(v) => { setTab(v); if (v === 'group') setHash(null) }} options={[
        { value: 'each', label: 'Từng truy vấn', count: filtered.length },
        { value: 'group', label: 'Nhóm truy vấn', count: groups.length },
      ]} className="mb-4" />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: '', label: 'Trạng thái: Tất cả' }, { value: 'Thành công', label: 'Thành công' }, { value: 'Lỗi', label: 'Lỗi' }]} className="w-44" />
        <Select size="sm" value={user} onChange={(e) => setUser(e.target.value)} options={[{ value: '', label: 'Người dùng: Tất cả' }, ...users]} className="w-48" />
        <Select size="sm" value={wh} onChange={(e) => setWh(e.target.value)} options={[{ value: '', label: 'Kho: Tất cả' }, ...whs]} className="w-48" />
        <Select size="sm" value={range} onChange={(e) => setRange(e.target.value)} options={RANGES} className="w-40" />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo SQL hoặc mã truy vấn" className="w-full sm:w-72 h-8" />
        {hash && <Badge tone="brand" icon={Filter}>Nhóm {hash.slice(0, 10)}… <button onClick={() => setHash(null)} className="ml-1" aria-label="Bỏ lọc nhóm"><X size={12} /></button></Badge>}
        {anyFilter && <Button size="sm" variant="ghost" onClick={() => { setStatus(''); setUser(''); setWh(''); setQ(''); setHash(null) }}>Xoá bộ lọc</Button>}
        {tab === 'each' && (
          <Popover align="end" width={220} trigger={(p) => <Button {...p} size="sm" variant="outline" icon={Columns3} className="ml-auto">{cols.length} cột</Button>}>
            <div className="p-1.5 flex flex-col gap-2">
              <div className="ds-label px-1">Hiển thị cột</div>
              {COLS.map((c) => (
                <Checkbox key={c.key} label={c.label} checked={show(c.key)} disabled={c.key === 'sql'}
                  onChange={(v) => setCols((x) => (v ? [...x, c.key] : x.filter((k) => k !== c.key)))} />
              ))}
            </div>
          </Popover>
        )}
      </div>

      <div className="card overflow-hidden">
        {tab === 'each' ? (
          !filtered.length ? (
            <EmptyState icon={History} title="Không có truy vấn nào" desc="Thử nới rộng khoảng thời gian hoặc xoá bộ lọc." />
          ) : (
            <Table minWidth={1100}>
              <THead>
                {show('sql') && <Th>Câu SQL</Th>}
                {show('id') && <Th>Mã truy vấn</Th>}
                {show('status') && <Th>Trạng thái</Th>}
                {show('user') && <Th>Người dùng</Th>}
                {show('warehouse') && <Th>Kho tính toán</Th>}
                {show('ms') && <Th align="right">Thời lượng</Th>}
                {show('rows') && <Th align="right">Số dòng</Th>}
                {show('source') && <Th>Nguồn</Th>}
                {show('start') && <Th>Bắt đầu</Th>}
              </THead>
              <tbody>
                {filtered.slice(0, 200).map((h) => (
                  <Tr key={h.id} onClick={() => navigate(`/giam-sat/truy-van/${h.id}`)}>
                    {show('sql') && <Td className="max-w-[380px]"><span className="block truncate font-mono text-[12.5px]" title={h.sql}>{h.sql.replace(/\s+/g, ' ')}</span></Td>}
                    {show('id') && <Td><span className="font-mono text-[12px] text-muted">{h.id.slice(0, 18)}…</span></Td>}
                    {show('status') && <Td><QueryStatus value={h.status} /></Td>}
                    {show('user') && <Td className="text-[13px]">{h.user}</Td>}
                    {show('warehouse') && <Td className="text-[13px] whitespace-nowrap">{h.warehouse}<span className="text-faint ml-1">({h.size || 'X-Small'})</span></Td>}
                    {show('ms') && <Td align="right"><span className="inline-flex items-center gap-2 num whitespace-nowrap">{formatDuration(h.ms)}<DurationBar ms={h.ms} max={maxMs} /></span></Td>}
                    {show('rows') && <Td align="right" className="num">{formatNumber(h.rows || 0)}</Td>}
                    {show('source') && <Td className="text-[13px] text-muted">{h.source}</Td>}
                    {show('start') && <Td className="text-[13px] whitespace-nowrap" title={formatDateTime(h.startedAt)}>{ago(h.startedAt)}</Td>}
                  </Tr>
                ))}
              </tbody>
            </Table>
          )
        ) : !groups.length ? (
          <EmptyState icon={History} title="Không có nhóm truy vấn nào" />
        ) : (
          <Table minWidth={1000}>
            <THead>
              <Th>Mẫu truy vấn (đã chuẩn hoá)</Th>
              <Th>Mã băm tham số</Th>
              <Th align="right">Số lần</Th>
              <Th align="right">Tổng thời lượng</Th>
              <Th align="right">Trung bình</Th>
              <Th align="right">Lỗi</Th>
              <Th align="right">Người dùng</Th>
              <Th>Lần cuối</Th>
            </THead>
            <tbody>
              {groups.map((g) => (
                <Tr key={g.hash} onClick={() => { setHash(g.hash); setTab('each') }}>
                  <Td className="max-w-[420px]"><span className="block truncate font-mono text-[12.5px]" title={normalizeSQL(g.sample)}>{normalizeSQL(g.sample)}</span></Td>
                  <Td><span className="font-mono text-[12px] text-muted">{g.hash}</span></Td>
                  <Td align="right" className="num font-[600]">{g.count}</Td>
                  <Td align="right"><span className="inline-flex items-center gap-2 num whitespace-nowrap">{formatDuration(g.total)}<DurationBar ms={g.total} max={maxTotal} /></span></Td>
                  <Td align="right" className="num">{formatDuration(g.total / g.count)}</Td>
                  <Td align="right" className={g.errors ? 'num text-neg font-[600]' : 'num text-faint'}>{g.errors}</Td>
                  <Td align="right" className="num">{g.users.size}</Td>
                  <Td className="text-[13px] whitespace-nowrap">{ago(g.last)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
      {tab === 'each' && filtered.length > 200 && <p className="ds-caption mt-2">Đang hiển thị 200 truy vấn mới nhất trên {formatNumber(filtered.length)}.</p>}

      <ExplainModal open={explain != null} onClose={() => setExplain(null)} sql={explain || ''}
        extra={<p className="ds-caption">Tinh Ý phân tích truy vấn mới nhất trong danh sách đang lọc. Mở chi tiết từng truy vấn để xem hồ sơ thực thi.</p>} />
    </Page>
  )
}
