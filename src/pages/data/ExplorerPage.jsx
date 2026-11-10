import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Database, FolderTree, Table2, Eye, ChevronRight, ChevronDown, Plus, Play, Upload, MoreHorizontal, Trash2, Sparkles,
  RefreshCw, Lock, Hash, Type, Calendar, ToggleLeft, Copy, Users, ShieldCheck, Pencil, Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/layout/Page'
import {
  Button, IconButton, Badge, Card, CardHeader, Tabs, Table, THead, Th, Tr, Td, Modal, Confirm, Input, Popover, Menu,
  SearchInput, EmptyState, Skeleton, KeyValue, Avatar,
} from '@/components/ui'
import { DataGrid } from '@/components/data/DataGrid'
import { runSQL, dropObject } from '@/engine/db'
import { useApp, toast, engineHooks } from '@/store'
import { formatBytes, formatNumber, formatDate } from '@/lib/format'
import { useCatalog, useOpenSql, describeTable, describeColumn } from '@/features/data/shared'
import { Lineage } from '@/features/data/Lineage'

const TYPE_ICON = { NUMBER: Hash, VARCHAR: Type, DATE: Calendar, TIMESTAMP: Calendar, BOOLEAN: ToggleLeft }
const ident = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/Đ/g, 'D').replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '')

/* ---------------- Cây danh mục bên trái ---------------- */
function Tree({ tree, loading, params, onCreateDb }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({})
  const key = (...p) => p.join('.')
  useEffect(() => {
    if (params.db) setOpen((o) => ({ ...o, [key(params.db)]: true, ...(params.schema ? { [key(params.db, params.schema)]: true } : {}) }))
  }, [params.db, params.schema])
  const nq = q.trim().toUpperCase()
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }))
  const item = 'flex items-center gap-1.5 h-8 rounded-md pr-2 text-[13px] hover:bg-hover min-w-0'

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex gap-2 border-b border-line">
        <SearchInput value={q} onChange={setQ} placeholder="Lọc đối tượng" className="flex-1" />
        <IconButton icon={Plus} label="Tạo cơ sở dữ liệu" variant="outline" size="md" onClick={onCreateDb} />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && <div className="flex flex-col gap-2 p-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6" />)}</div>}
        {tree.map((d) => {
          const dOpen = nq || open[key(d.name)]
          const schemas = d.schemas.map((s) => ({ ...s, tables: s.tables.filter((t) => !nq || t.name.includes(nq)) })).filter((s) => !nq || s.tables.length || s.name.includes(nq))
          if (nq && !schemas.length && !d.name.includes(nq)) return null
          return (
            <div key={d.name}>
              <div className={cn(item, params.db === d.name && !params.schema && 'bg-brand-50 text-brand-ink font-[600]')}>
                <button onClick={() => toggle(key(d.name))} className="size-6 grid place-items-center text-faint shrink-0">{dOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                <Link to={`/du-lieu/${d.name}`} className="flex items-center gap-1.5 min-w-0 flex-1">
                  {d.system ? <Lock size={14} className="text-faint shrink-0" /> : <Database size={14} className="text-brand-ink shrink-0" />}
                  <span className="truncate">{d.name}</span>
                </Link>
              </div>
              {dOpen && schemas.map((s) => {
                const sOpen = nq || open[key(d.name, s.name)]
                return (
                  <div key={s.name} className="ml-4">
                    <div className={cn(item, params.db === d.name && params.schema === s.name && !params.table && 'bg-brand-50 text-brand-ink font-[600]')}>
                      <button onClick={() => toggle(key(d.name, s.name))} className="size-6 grid place-items-center text-faint shrink-0">{sOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                      <Link to={`/du-lieu/${d.name}/${s.name}`} className="flex items-center gap-1.5 min-w-0 flex-1">
                        <FolderTree size={14} className="text-muted shrink-0" /><span className="truncate">{s.name}</span>
                        {s.tables.length > 0 && <span className="ml-auto text-[11px] text-faint num">{s.tables.length}</span>}
                      </Link>
                    </div>
                    {sOpen && (
                      <div className="ml-7 border-l border-line pl-1.5">
                        {!s.tables.length && <div className="text-[12px] text-faint px-2 py-1">Chưa có bảng</div>}
                        {s.tables.map((t) => (
                          <Link key={t.name} to={`/du-lieu/${d.name}/${s.name}/${t.name}`}
                            className={cn(item, 'pl-2', params.table === t.name && params.schema === s.name ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-dim')}>
                            {t.kind === 'Bảng' ? <Table2 size={14} className="shrink-0 text-faint" /> : <Eye size={14} className="shrink-0 text-faint" />}
                            <span className="truncate">{t.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Hộp thoại tạo CSDL / lược đồ ---------------- */
function CreateModal({ open, onClose, kind, db, onDone }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) setName('') }, [open])
  const id = ident(name)
  const submit = async () => {
    if (!id) return
    setBusy(true)
    const sql = kind === 'db' ? `CREATE DATABASE ${id}` : `CREATE SCHEMA ${db}.${id}`
    const { results } = await runSQL(sql, { hooks: engineHooks, source: 'Trình duyệt dữ liệu' })
    setBusy(false)
    const r = results[0]
    if (r.error) { toast({ title: 'Không tạo được', desc: r.error, tone: 'neg' }); return }
    toast(kind === 'db' ? `Đã tạo cơ sở dữ liệu ${id}` : `Đã tạo lược đồ ${db}.${id}`)
    onClose()
    onDone(id)
  }
  return (
    <Modal open={open} onClose={onClose} size="sm" title={kind === 'db' ? 'Cơ sở dữ liệu mới' : 'Lược đồ mới'} desc={kind === 'db' ? 'Chủ sở hữu: vai trò hiện tại của bạn' : `Trong cơ sở dữ liệu ${db}`}
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" loading={busy} disabled={!id} onClick={submit}>Tạo</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Input autoFocus label="Tên" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'db' ? 'VD: PHAN_TICH_DB' : 'VD: TAM'} hint={id ? <>Sẽ tạo: <code className="font-mono text-fg">{kind === 'db' ? id : `${db}.${id}`}</code></> : 'Chỉ dùng chữ không dấu, số và dấu gạch dưới.'} />
        <pre className="mt-4 rounded-lg bg-subtle border border-line p-3 text-[12px] font-mono text-dim overflow-x-auto">{kind === 'db' ? `CREATE DATABASE ${id || '<TÊN>'};` : `CREATE SCHEMA ${db}.${id || '<TÊN>'};`}</pre>
      </form>
    </Modal>
  )
}

/* ---------------- Danh sách CSDL ---------------- */
function DatabaseList({ tree, onCreate }) {
  const navigate = useNavigate()
  return (
    <Page title="Cơ sở dữ liệu" desc="Mọi cơ sở dữ liệu trong tài khoản. Bấm vào một dòng để xem lược đồ và bảng." wide
      actions={<Button variant="primary" icon={Plus} onClick={onCreate}>Cơ sở dữ liệu</Button>}>
      <div className="ds-caption mb-2">{tree.length} cơ sở dữ liệu</div>
      <Card padded={false} className="overflow-hidden">
        <Table minWidth={640}>
          <THead><Th>Tên</Th><Th>Nguồn</Th><Th>Chủ sở hữu</Th><Th align="right">Số bảng</Th><Th>Ngày tạo</Th></THead>
          <tbody>
            {tree.map((d) => (
              <Tr key={d.name} onClick={() => navigate(`/du-lieu/${d.name}`)}>
                <Td><span className="flex items-center gap-2 font-[600]">{d.system ? <Lock size={15} className="text-faint" /> : <Database size={15} className="text-brand-ink" />}{d.name}</span>{d.comment && <div className="ds-caption">{d.comment}</div>}</Td>
                <Td>{d.system ? <Badge size="sm">Hệ thống</Badge> : d.name === 'DU_LIEU_MAU' ? <Badge tone="info" size="sm">Chia sẻ</Badge> : <Badge tone="brand" size="sm">Cục bộ</Badge>}</Td>
                <Td className="text-muted">{d.owner}</Td>
                <Td align="right" className="num">{d.schemas.reduce((s, x) => s + x.tables.length, 0)}</Td>
                <Td className="text-muted">{formatDate(d.created)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Page>
  )
}

/* ---------------- Chi tiết CSDL ---------------- */
const CONTACT_ROLES = [['Người phụ trách', 'Chịu trách nhiệm về độ chính xác, đầy đủ của dữ liệu'], ['Hỗ trợ', 'Giải đáp thắc mắc kỹ thuật về dữ liệu'], ['Phê duyệt', 'Duyệt yêu cầu truy cập'], ['Bảo mật & tuân thủ', 'Giám sát quyền riêng tư và bảo mật']]
function DatabaseDetail({ db, onCreateSchema }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('detail')
  const users = useApp((s) => s.users)
  const [contacts, setContacts] = useState(() => (db.name === 'PHO_NUI_DB' ? { 'Người phụ trách': 'Trần Minh Khoa', 'Hỗ trợ': 'Phạm Quốc Bảo' } : {}))
  return (
    <Page wide crumbs={[{ label: 'Cơ sở dữ liệu', to: '/du-lieu' }, { label: db.name }]}
      title={<span className="flex items-center gap-2.5"><Database size={22} className="text-brand-ink" />{db.name}</span>}
      desc={db.comment || 'Chưa có mô tả.'}
      actions={!db.system && <Button variant="primary" icon={Plus} onClick={onCreateSchema}>Lược đồ</Button>}>
      <div className="flex flex-wrap gap-2 -mt-3 mb-5 text-[12.5px] text-muted">
        <Badge>{db.system ? 'Hệ thống · chỉ đọc' : 'Cơ sở dữ liệu'}</Badge>
        <span className="flex items-center gap-1"><ShieldCheck size={13} />{db.owner}</span>
        <span>Tạo ngày {formatDate(db.created)}</span>
      </div>
      <Tabs value={tab} onChange={setTab} options={[{ value: 'detail', label: 'Chi tiết' }, { value: 'schemas', label: 'Lược đồ', count: db.schemas.length }]} className="mb-5" />
      {tab === 'detail' ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Người liên hệ" desc="Ai chịu trách nhiệm cho dữ liệu này" icon={Users} />
            <div className="flex flex-col divide-y divide-line">
              {CONTACT_ROLES.map(([r, desc]) => (
                <div key={r} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0"><div className="text-[13.5px] font-[550]">{r}</div><div className="ds-caption">{desc}</div></div>
                  <Popover align="end" width={240} trigger={(p) => (
                    <button {...p} className="flex items-center gap-2 text-[13px] rounded-lg px-2 py-1 hover:bg-hover shrink-0">
                      {contacts[r] ? <><Avatar name={contacts[r]} size={22} />{contacts[r]}</> : <span className="text-brand-ink font-[550]">+ Chọn</span>}
                    </button>
                  )}>
                    {(close) => <Menu onClose={close} items={[...users.filter((u) => u.type === 'Người dùng').map((u) => ({ label: u.name, desc: u.role, checked: contacts[r] === u.name, onClick: () => setContacts((c) => ({ ...c, [r]: u.name })) })), { divider: true }, { label: 'Bỏ chọn', onClick: () => setContacts((c) => ({ ...c, [r]: undefined })) }]} />}
                  </Popover>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Quyền truy cập" desc="Vai trò được cấp quyền trên cơ sở dữ liệu" icon={ShieldCheck} />
            {[[db.owner, ['OWNERSHIP']], ['PHAN_TICH', ['USAGE', 'MONITOR']], ['CONG_KHAI', db.system || db.name === 'DU_LIEU_MAU' ? ['USAGE'] : []]].filter(([, p]) => p.length).map(([role, privs]) => (
              <div key={role} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                <span className="flex items-center gap-2 text-[13.5px] font-[550]"><ShieldCheck size={15} className="text-muted" />{role}{role === db.owner && <span className="ds-caption font-normal">(chủ sở hữu)</span>}</span>
                <span className="flex gap-1">{privs.map((p) => <Badge key={p} size="sm" tone={p === 'OWNERSHIP' ? 'brand' : 'neutral'}>{p}</Badge>)}</span>
              </div>
            ))}
          </Card>
        </div>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <Table minWidth={520}>
            <THead><Th>Lược đồ</Th><Th>Chủ sở hữu</Th><Th align="right">Số bảng</Th><Th align="right">Tổng số dòng</Th></THead>
            <tbody>
              {db.schemas.map((s) => (
                <Tr key={s.name} onClick={() => navigate(`/du-lieu/${db.name}/${s.name}`)}>
                  <Td><span className="flex items-center gap-2 font-[600]"><FolderTree size={15} className="text-muted" />{s.name}</span></Td>
                  <Td className="text-muted">{db.owner}</Td>
                  <Td align="right" className="num">{s.tables.length}</Td>
                  <Td align="right" className="num">{formatNumber(s.tables.reduce((a, t) => a + (t.rows || 0), 0))}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </Page>
  )
}

/* ---------------- Chi tiết lược đồ ---------------- */
function SchemaDetail({ db, schema }) {
  const navigate = useNavigate()
  const openSql = useOpenSql()
  return (
    <Page wide crumbs={[{ label: 'Cơ sở dữ liệu', to: '/du-lieu' }, { label: db.name, to: `/du-lieu/${db.name}` }, { label: schema.name }]}
      title={<span className="flex items-center gap-2.5"><FolderTree size={22} className="text-muted" />{schema.name}</span>}
      desc={`Lược đồ trong ${db.name}`}
      actions={!db.system && (
        <Popover align="end" width={240} trigger={(p) => <Button {...p} variant="primary" icon={Plus}>Tạo</Button>}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Bảng bằng SQL', icon: Table2, onClick: () => openSql('tao_bang.sql', `USE SCHEMA ${db.name}.${schema.name};\n\nCREATE OR REPLACE TABLE BANG_MOI (\n  ID      INTEGER,\n  TEN     STRING,\n  NGAY    DATE,\n  GIA_TRI NUMBER(12, 2)\n);\n\nINSERT INTO BANG_MOI VALUES (1, 'Mẫu', '2026-11-10', 125000);\n\nSELECT * FROM BANG_MOI;\n`) },
            { label: 'Bảng từ tệp CSV', icon: Upload, onClick: () => navigate(`/nap-du-lieu?tai-len=1&db=${db.name}&schema=${schema.name}`) },
            { label: 'Khung nhìn bằng SQL', icon: Eye, onClick: () => openSql('tao_khung_nhin.sql', `USE SCHEMA ${db.name}.${schema.name};\n\nCREATE OR REPLACE VIEW KHUNG_NHIN_MOI AS\nSELECT DATE(NGAY_DAT) AS NGAY, SUM(TONG_TIEN) AS DOANH_THU\nFROM PHO_NUI_DB.BAN_HANG.DON_HANG\nGROUP BY 1;\n\nSELECT * FROM KHUNG_NHIN_MOI ORDER BY NGAY DESC LIMIT 20;\n`) },
          ]} />}
        </Popover>
      )}>
      <div className="ds-caption mb-2">{schema.tables.length} đối tượng</div>
      <Card padded={false} className="overflow-hidden">
        {!schema.tables.length ? (
          <EmptyState icon={Table2} title="Lược đồ chưa có bảng" desc="Tạo bảng bằng SQL hoặc tải tệp CSV lên." compact
            action={<Button variant="primary" icon={Upload} onClick={() => navigate(`/nap-du-lieu?tai-len=1&db=${db.name}&schema=${schema.name}`)}>Tải tệp lên</Button>} />
        ) : (
          <Table minWidth={720}>
            <THead><Th>Tên</Th><Th>Loại</Th><Th align="right">Số dòng</Th><Th align="right">Dung lượng</Th><Th>Chủ sở hữu</Th><Th>Thẻ</Th></THead>
            <tbody>
              {schema.tables.map((t) => (
                <Tr key={t.name} onClick={() => navigate(`/du-lieu/${db.name}/${schema.name}/${t.name}`)}>
                  <Td><span className="flex items-center gap-2 font-[600]">{t.kind === 'Bảng' ? <Table2 size={15} className="text-brand-ink" /> : <Eye size={15} className="text-ice" />}{t.name}</span></Td>
                  <Td className="text-muted">{t.kind}</Td>
                  <Td align="right" className="num">{t.rows != null ? formatNumber(t.rows) : '—'}</Td>
                  <Td align="right" className="num text-muted">{t.bytes != null && t.kind === 'Bảng' ? formatBytes(t.bytes) : '—'}</Td>
                  <Td className="text-muted">{t.owner}</Td>
                  <Td><span className="flex gap-1 flex-wrap">{(t.tags || []).slice(0, 2).map((g) => <Badge key={g} size="sm">{g}</Badge>)}</span></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  )
}

/* ---------------- Chi tiết bảng ---------------- */
function ddlOf(t) {
  const w = Math.max(...t.columns.map((c) => c.name.length)) + 2
  const cols = t.columns.map((c) => `  ${c.name.padEnd(w)}${c.type === 'NUMBER' ? 'NUMBER(38,0)' : c.type}${c.pk ? ' PRIMARY KEY' : ''}${!c.nullable && !c.pk ? ' NOT NULL' : ''}`)
  return `create or replace ${t.kind === 'Bảng' ? 'TABLE' : 'VIEW'} ${t.fqn} (\n${cols.join(',\n')}\n)${t.comment ? `\ncomment = '${t.comment.replace(/'/g, "''")}'` : ''};`
}

function TableDetail({ db, schema, table }) {
  const navigate = useNavigate()
  const openSql = useOpenSql()
  const [tab, setTab] = useState('detail')
  const [preview, setPreview] = useState(null)
  const [aiDesc, setAiDesc] = useState(null)
  const [aiCols, setAiCols] = useState(false)
  const [drop, setDrop] = useState(false)
  const t = table
  useEffect(() => { setTab('detail'); setPreview(null); setAiDesc(null); setAiCols(false) }, [t.fqn])
  useEffect(() => {
    if (tab !== 'preview' || preview) return
    runSQL(`SELECT * FROM "${t.name}" LIMIT 100`, { silent: true }).then(({ results }) => setPreview(results[0]))
  }, [tab, preview, t.name])
  const genDesc = () => { setAiDesc('…'); setTimeout(() => setAiDesc(describeTable(t)), 700) }
  const ddl = ddlOf(t)

  return (
    <Page wide crumbs={[{ label: 'Cơ sở dữ liệu', to: '/du-lieu' }, { label: db.name, to: `/du-lieu/${db.name}` }, { label: schema.name, to: `/du-lieu/${db.name}/${schema.name}` }, { label: t.name }]}
      title={<span className="flex items-center gap-2.5">{t.kind === 'Bảng' ? <Table2 size={22} className="text-brand-ink" /> : <Eye size={22} className="text-ice" />}{t.name}</span>}
      actions={<>
        <Button icon={Play} variant="primary" onClick={() => openSql(`${t.name.toLowerCase()}.sql`, `SELECT *\nFROM ${t.fqn}\nLIMIT 100;\n`)}>Truy vấn</Button>
        {t.kind === 'Bảng' && !db.system && <Button icon={Upload} variant="outline" onClick={() => navigate(`/nap-du-lieu?tai-len=1&bang=${t.name}&db=${db.name}&schema=${schema.name}`)}>Tải dữ liệu vào</Button>}
        <Popover align="end" width={220} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thêm" variant="outline" />}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Sao chép tên đầy đủ', icon: Copy, onClick: () => { navigator.clipboard?.writeText(t.fqn); toast('Đã sao chép ' + t.fqn) } },
            { label: 'Hỏi Tinh Ý về bảng này', icon: Sparkles, onClick: () => navigate(`/ai/hoi-du-lieu?q=${encodeURIComponent('Bảng ' + t.name + ' có những gì?')}`) },
            { divider: true },
            { label: `Xoá ${t.kind === 'Bảng' ? 'bảng' : 'khung nhìn'}`, icon: Trash2, danger: true, onClick: () => setDrop(true) },
          ]} />}
        </Popover>
      </>}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 -mt-3 mb-5 text-[12.5px] text-muted">
        <Badge tone={t.kind === 'Bảng' ? 'brand' : 'info'}>{t.kind}</Badge>
        <span className="flex items-center gap-1"><ShieldCheck size={13} />{t.owner}</span>
        {t.rows != null && <span className="num">{formatNumber(t.rows)} dòng</span>}
        {t.bytes != null && t.kind === 'Bảng' && <span className="num">{formatBytes(t.bytes)}</span>}
        <span className="font-mono text-[12px]">{t.fqn}</span>
      </div>
      <Tabs value={tab} onChange={setTab} className="mb-5" options={[
        { value: 'detail', label: 'Chi tiết' },
        { value: 'columns', label: 'Cột', count: t.columns.length },
        { value: 'preview', label: 'Xem trước dữ liệu' },
        { value: 'lineage', label: 'Dòng dõi dữ liệu' },
        { value: 'ddl', label: 'Định nghĩa' },
      ]} />

      {tab === 'detail' && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-4">
          <Card>
            <CardHeader title="Mô tả" action={<Button size="sm" variant="ghost" icon={Sparkles} onClick={genDesc}>{aiDesc ? 'Tạo lại' : 'Mô tả do AI tạo'}</Button>} />
            <p className="text-[14px] text-dim leading-relaxed">{t.comment || <span className="text-faint">Bảng chưa có mô tả.</span>}</p>
            {aiDesc && (
              <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4 animate-fade-in">
                <div className="flex items-center gap-1.5 text-[12px] font-[600] text-brand-ink"><Sparkles size={13} />TINH Ý ĐỀ XUẤT</div>
                {aiDesc === '…' ? <div className="mt-2 flex flex-col gap-1.5"><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-3/4" /></div> : <p className="mt-1.5 text-[13.5px] text-dim">{aiDesc}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mt-4">{(t.tags || []).map((g) => <Badge key={g}>{g}</Badge>)}</div>
          </Card>
          <Card>
            <KeyValue items={[
              { label: 'Cơ sở dữ liệu', value: db.name },
              { label: 'Lược đồ', value: schema.name },
              { label: 'Chủ sở hữu', value: t.owner },
              { label: 'Số dòng', value: t.rows != null ? formatNumber(t.rows) : '—' },
              { label: 'Dung lượng', value: t.bytes != null && t.kind === 'Bảng' ? formatBytes(t.bytes) : '—' },
              { label: 'Số cột', value: t.columns.length },
              { label: 'Lưu giữ dữ liệu', value: '90 ngày' },
            ]} />
          </Card>
        </div>
      )}

      {tab === 'columns' && (
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-line">
            <span className="ds-caption">{t.columns.length} cột</span>
            <Button size="sm" variant="ghost" icon={Sparkles} onClick={() => setAiCols(true)}>{aiCols ? 'Đã tạo mô tả cột' : 'Tạo mô tả cột bằng AI'}</Button>
          </div>
          <Table minWidth={640}>
            <THead><Th width={40}>#</Th><Th>Tên cột</Th><Th>Kiểu</Th><Th>Cho phép rỗng</Th><Th>Mô tả</Th></THead>
            <tbody>
              {t.columns.map((c, i) => {
                const Icon = TYPE_ICON[c.type] || Type
                return (
                  <Tr key={c.name}>
                    <Td className="text-faint num">{i + 1}</Td>
                    <Td><span className="flex items-center gap-2 font-mono text-[12.5px] font-[600]"><Icon size={13} className="text-faint" />{c.name}{c.pk && <Badge size="sm" tone="gold">Khoá</Badge>}</span></Td>
                    <Td className="font-mono text-[12.5px] text-muted">{c.type}</Td>
                    <Td className="text-muted">{c.nullable ? 'Có' : 'Không'}</Td>
                    <Td className="text-dim">{aiCols ? <span className="flex items-center gap-1.5 animate-fade-in"><Sparkles size={12} className="text-brand-ink shrink-0" />{describeColumn(c.name, c.type)}</span> : <span className="text-faint">—</span>}</Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'preview' && (
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="ds-caption">{preview ? `Hiển thị ${preview.rowCount} dòng đầu · ${preview.ms} ms` : 'Đang tải…'}</span>
            <IconButton icon={RefreshCw} label="Tải lại" size="sm" onClick={() => setPreview(null)} />
          </div>
          {!preview ? <div className="p-5 flex flex-col gap-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-7" />)}</div>
            : preview.error ? <EmptyState title="Không đọc được dữ liệu" desc={preview.error} compact />
            : <DataGrid columns={preview.columns} rows={preview.rows} maxHeight={560} />}
        </Card>
      )}

      {tab === 'lineage' && (
        <Card>
          <CardHeader title="Dòng dõi dữ liệu" desc="Dữ liệu đến từ đâu và đang được dùng ở những nơi nào" />
          <Lineage table={t.name} kind={t.kind} />
        </Card>
      )}

      {tab === 'ddl' && (
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="ds-caption">Câu lệnh định nghĩa {t.kind === 'Bảng' ? 'bảng' : 'khung nhìn'}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(ddl); toast('Đã sao chép câu lệnh') }}>Sao chép</Button>
              <Button size="sm" variant="ghost" icon={Pencil} onClick={() => openSql(`${t.name.toLowerCase()}_ddl.sql`, ddl + '\n')}>Mở trong trình soạn</Button>
            </div>
          </div>
          <pre className="p-5 text-[12.5px] font-mono leading-relaxed overflow-x-auto"><code>{ddl}</code></pre>
        </Card>
      )}

      <Confirm open={drop} onClose={() => setDrop(false)} danger confirmLabel="Xoá"
        title={`Xoá ${t.name}?`} desc="Thao tác này xoá bảng cùng toàn bộ dữ liệu trong bản demo. Bạn có thể khôi phục dữ liệu mẫu ban đầu trong Cài đặt."
        onConfirm={async () => { await dropObject(t.name, t.kind === 'Bảng' ? 'TABLE' : 'VIEW'); toast(`Đã xoá ${t.name}`); navigate(`/du-lieu/${db.name}/${schema.name}`) }} />
    </Page>
  )
}

/* ---------------- Trang ---------------- */
export default function ExplorerPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { tree, loading } = useCatalog()
  const [create, setCreate] = useState(null) // 'db' | 'schema'

  useEffect(() => {
    if (sp.get('tao') === '1') { setCreate('db'); sp.delete('tao'); setSp(sp, { replace: true }) }
  }, [sp, setSp])

  const db = useMemo(() => tree.find((d) => d.name === params.db), [tree, params.db])
  const schema = db?.schemas.find((s) => s.name === params.schema)
  const table = schema?.tables.find((t) => t.name === params.table)

  let body
  if (loading) body = <Page wide><Skeleton className="h-8 w-60" /><Skeleton className="h-4 w-96 mt-3" /><Skeleton className="h-64 mt-6 rounded-2xl" /></Page>
  else if (!params.db) body = <DatabaseList tree={tree} onCreate={() => setCreate('db')} />
  else if (!db) body = <Page wide><EmptyState icon={Search} title={`Không tìm thấy cơ sở dữ liệu ${params.db}`} desc="Có thể nó đã bị xoá hoặc bạn không có quyền truy cập." action={<Button onClick={() => navigate('/du-lieu')}>Về danh sách</Button>} /></Page>
  else if (!params.schema) body = <DatabaseDetail db={db} onCreateSchema={() => setCreate('schema')} />
  else if (!schema) body = <Page wide><EmptyState icon={Search} title={`Không tìm thấy lược đồ ${params.schema}`} action={<Button onClick={() => navigate(`/du-lieu/${db.name}`)}>Về {db.name}</Button>} /></Page>
  else if (!params.table) body = <SchemaDetail db={db} schema={schema} />
  else if (!table) body = <Page wide><EmptyState icon={Search} title={`Không tìm thấy bảng ${params.table}`} desc="Bảng có thể đã bị xoá." action={<Button onClick={() => navigate(`/du-lieu/${db.name}/${schema.name}`)}>Về lược đồ {schema.name}</Button>} /></Page>
  else body = <TableDetail db={db} schema={schema} table={table} />

  return (
    <div className="flex min-h-full">
      <aside className="hidden md:block w-[280px] shrink-0 border-r border-line bg-surface sticky top-0 h-[calc(100dvh-56px)] lg:h-dvh self-start">
        <div className="px-4 pt-5 pb-1">
          <div className="ds-h3">Trình duyệt dữ liệu</div>
          <div className="ds-caption">Danh mục tài khoản PHONUI-VN01</div>
        </div>
        <div className="h-[calc(100%-64px)]"><Tree tree={tree} loading={loading} params={params} onCreateDb={() => setCreate('db')} /></div>
      </aside>
      <div className="flex-1 min-w-0">{body}</div>
      <CreateModal open={!!create} kind={create} db={params.db || 'PHO_NUI_DB'} onClose={() => setCreate(null)}
        onDone={(id) => navigate(create === 'db' ? `/du-lieu/${id}` : `/du-lieu/${params.db || 'PHO_NUI_DB'}/${id}`)} />
    </div>
  )
}
