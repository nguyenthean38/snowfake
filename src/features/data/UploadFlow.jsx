/* ==========================================================
   Luồng "Tải tệp lên bảng": chọn tệp CSV → ánh xạ cột → nạp thật
   vào động cơ SQL trong trình duyệt.
   ========================================================== */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileText, X, CheckCircle2, Wand2, AlertTriangle, Table2, Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal, Button, Select, Input, Segmented, Checkbox, Badge, Callout } from '@/components/ui'
import { parseCSV, inferCsvTypes } from '@/components/data/DataGrid'
import { createTableFromRows, runSQL } from '@/engine/db'
import { useApp, useAuth, toast, uid } from '@/store'
import { formatBytes, formatNumber } from '@/lib/format'
import { seeded } from '@/lib/random'
import { STORES, FAMILY, MIDDLE_F, MIDDLE_M, GIVEN_F, GIVEN_M } from '@/data/reference'
import { useCatalog, toTableName, useOpenSql } from './shared'

const TYPES = ['VARCHAR', 'NUMBER', 'DATE', 'BOOLEAN']

/** Tệp mẫu cho người xem không có sẵn CSV */
export function sampleCSV() {
  const r = seeded(4040)
  const roles = [['Pha chế', 7200000], ['Thu ngân', 6500000], ['Phục vụ', 6000000], ['Quản lý ca', 9800000]]
  const lines = ['MA_NV,HO_TEN,MA_CH,CHUC_VU,NGAY_VAO_LAM,LUONG_CO_BAN,DIEM_DANH_GIA']
  for (let i = 1; i <= 40; i++) {
    const f = r.chance(0.55)
    const name = `${r.pick(FAMILY)} ${r.pick(f ? MIDDLE_F : MIDDLE_M)} ${r.pick(f ? GIVEN_F : GIVEN_M)}`
    const [role, base] = i % 10 === 1 ? roles[3] : r.pick(roles.slice(0, 3))
    const d = new Date(2022, r.int(0, 11), r.int(1, 28)); d.setMonth(d.getMonth() + r.int(0, 40))
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    lines.push([`NV${String(i).padStart(3, '0')}`, `"${name}"`, STORES[(i - 1) % STORES.length][0], role, ds, base + r.int(0, 8) * 100000, (3 + r.next() * 2).toFixed(1)].join(','))
  }
  return { name: 'nhan_vien_cua_hang.csv', text: lines.join('\n') + '\n' }
}

function esc(v, type) {
  if (v === '' || v == null) return 'NULL'
  if (type === 'NUMBER' && !isNaN(+v)) return String(+v)
  if (type === 'BOOLEAN') return /^(true|1|có)$/i.test(v) ? '1' : '0'
  return `'${String(v).replace(/'/g, "''")}'`
}
function badValue(v, type) {
  if (v === '' || v == null) return false
  if (type === 'NUMBER') return isNaN(+String(v).trim())
  if (type === 'DATE') return !/^\d{4}-\d{2}-\d{2}/.test(String(v).trim())
  if (type === 'BOOLEAN') return !/^(true|false|0|1|có|không)$/i.test(String(v).trim())
  return false
}

export function UploadFlow({ open, onClose, preset = {} }) {
  const navigate = useNavigate()
  const openSql = useOpenSql()
  const upsert = useApp((s) => s.upsert)
  const user = useAuth((s) => s.user)
  const { tree } = useCatalog({ withCounts: false })
  const fileRef = useRef(null)
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null) // { name, size, columns, rows }
  const [over, setOver] = useState(false)
  const [db, setDb] = useState(preset.db || 'PHO_NUI_DB')
  const [schema, setSchema] = useState(preset.schema || 'PUBLIC')
  const [mode, setMode] = useState(preset.table ? 'existing' : 'new')
  const [tname, setTname] = useState('')
  const [existing, setExisting] = useState(preset.table || '')
  const [cols, setCols] = useState([]) // { src, name, type, on, target }
  const [onError, setOnError] = useState('skip')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!open) return
    setStep(0); setFile(null); setDone(null); setBusy(false)
    setDb(preset.db || 'PHO_NUI_DB'); setSchema(preset.schema || (preset.db ? 'PUBLIC' : 'PUBLIC'))
    setMode(preset.table ? 'existing' : 'new'); setExisting(preset.table || ''); setTname('')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const dbs = tree.filter((d) => !d.system)
  const curDb = dbs.find((d) => d.name === db) || dbs[0]
  const schemas = curDb?.schemas || []
  const curSchema = schemas.find((s) => s.name === schema) || schemas[0]
  const tables = (curSchema?.tables || []).filter((t) => t.kind === 'Bảng')
  const target = tables.find((t) => t.name === existing)

  const load = (name, size, text) => {
    const { columns, rows } = parseCSV(text)
    if (!columns.length || !rows.length) { toast({ title: 'Tệp không có dữ liệu', desc: 'Hãy chọn tệp CSV có dòng tiêu đề và ít nhất một dòng dữ liệu.', tone: 'neg' }); return }
    const types = inferCsvTypes(columns, rows)
    setFile({ name, size, columns, rows })
    setCols(columns.map((c, i) => ({ src: c, name: toTableName(c) || `COT_${i + 1}`, type: types[i], on: true })))
    if (!tname) setTname(toTableName(name))
  }
  const pick = (f) => {
    if (!f) return
    if (f.size > 8 * 1024 * 1024) { toast({ title: 'Tệp quá lớn', desc: 'Bản demo nhận tệp tối đa 8 MB.', tone: 'neg' }); return }
    const rd = new FileReader()
    rd.onload = () => load(f.name, f.size, String(rd.result))
    rd.readAsText(f, 'utf-8')
  }
  const useSample = () => { const s = sampleCSV(); load(s.name, s.text.length, s.text); setTname('NHAN_VIEN_CUA_HANG') }

  // Ánh xạ cột sang bảng có sẵn
  const mapped = useMemo(() => {
    if (mode !== 'existing' || !target) return cols
    return cols.map((c) => {
      const t = target.columns.find((x) => x.name === c.name) || target.columns.find((x) => x.name === toTableName(c.src))
      return { ...c, target: t?.name || '', type: t ? (t.type === 'TIMESTAMP' ? 'DATE' : t.type) : c.type, on: c.on && !!t }
    })
  }, [cols, mode, target])
  const active = mapped.filter((c) => c.on)
  const errors = useMemo(() => {
    if (!file) return 0
    let n = 0
    for (const r of file.rows) if (active.some((c) => badValue(r[file.columns.indexOf(c.src)], c.type))) n++
    return n
  }, [file, active])
  const finalName = mode === 'new' ? toTableName(tname) : existing
  const canNext = file && (mode === 'new' ? !!finalName : !!target)

  const submit = async () => {
    setBusy(true)
    const idx = active.map((c) => file.columns.indexOf(c.src))
    let rows = file.rows.map((r) => idx.map((i) => (r[i] ?? '').trim()))
    const bad = rows.filter((r) => r.some((v, j) => badValue(v, active[j].type)))
    if (onError === 'stop' && bad.length) {
      setBusy(false)
      toast({ title: 'Đã dừng nạp', desc: `${bad.length} dòng có giá trị không khớp kiểu dữ liệu.`, tone: 'neg' })
      return
    }
    rows = rows.filter((r) => !r.some((v, j) => badValue(v, active[j].type)))
    let fqn, count
    try {
      if (mode === 'new') {
        const res = await createTableFromRows({ name: finalName, columns: active.map((c) => ({ name: toTableName(c.name), type: c.type })), rows, database: curDb.name, schema: curSchema.name })
        fqn = res.fqn; count = res.rows
      } else {
        const colList = active.map((c) => `"${c.target}"`).join(', ')
        const stmts = []
        for (let i = 0; i < rows.length; i += 200) {
          stmts.push(`INSERT INTO "${existing}" (${colList}) VALUES ${rows.slice(i, i + 200).map((r) => '(' + r.map((v, j) => esc(v, active[j].type)).join(',') + ')').join(',')}`)
        }
        const { results } = await runSQL(stmts.join(';\n'), { silent: true })
        const err = results.find((x) => x.error)
        if (err) throw new Error(err.error)
        fqn = `${curDb.name}.${curSchema.name}.${existing}`; count = rows.length
      }
      await new Promise((r) => setTimeout(r, 450))
      upsert('loads', { id: uid('ld'), file: file.name, size: file.size, table: fqn, rows: count, skipped: file.rows.length - rows.length, status: bad.length ? 'Nạp một phần' : 'Thành công', at: new Date().toISOString(), user: user.username, database: curDb.name })
      setDone({ fqn, count, skipped: file.rows.length - rows.length, name: fqn.split('.').pop() })
      setStep(2)
    } catch (e) {
      upsert('loads', { id: uid('ld'), file: file.name, size: file.size, table: `${curDb.name}.${curSchema.name}.${finalName}`, rows: 0, skipped: file.rows.length, status: 'Lỗi', error: e.message, at: new Date().toISOString(), user: user.username, database: curDb.name })
      toast({ title: 'Nạp thất bại', desc: e.message, tone: 'neg' })
    }
    setBusy(false)
  }

  const footer = step === 0 ? (
    <><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!canNext} onClick={() => setStep(1)}>Tiếp tục</Button></>
  ) : step === 1 ? (
    <><Button onClick={() => setStep(0)}>Quay lại</Button><Button variant="primary" loading={busy} disabled={!active.length} onClick={submit}>Nạp {formatNumber(file.rows.length - (onError === 'skip' ? errors : 0))} dòng</Button></>
  ) : (
    <><Button onClick={() => { onClose(); navigate(`/du-lieu/${done.fqn.split('.').join('/')}`) }}>Xem chi tiết bảng</Button>
      <Button variant="primary" icon={Play} onClick={() => { onClose(); openSql(`${done.name.toLowerCase()}.sql`, `-- Bảng vừa nạp từ tệp ${file.name}\nSELECT *\nFROM ${done.fqn}\nLIMIT 100;\n`) }}>Tạo SQL từ bảng</Button></>
  )

  return (
    <Modal open={open} onClose={onClose} size={step === 1 ? 'xl' : 'lg'} footer={footer}
      title={step === 2 ? null : 'Nạp dữ liệu vào bảng'} hideClose={step === 2}
      desc={step === 0 ? 'Bước 1/2 · Chọn tệp và nơi lưu' : step === 1 ? `Bước 2/2 · Kiểm tra cột cho ${curDb?.name}.${curSchema?.name}.${finalName}` : null}>
      {step === 0 && (
        <div className="flex flex-col gap-5">
          {!file ? (
            <div>
              <div onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]) }}
                className={cn('flex flex-col items-center justify-center text-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors', over ? 'border-brand-400 bg-brand-50' : 'border-line-strong hover:bg-subtle')}>
                <span className="size-12 grid place-items-center rounded-full bg-brand-50 text-brand-ink"><UploadCloud size={22} /></span>
                <div className="font-[600]">Kéo thả tệp vào đây hoặc <span className="text-brand-ink underline underline-offset-4">chọn từ máy</span></div>
                <div className="ds-caption">CSV hoặc TSV có dòng tiêu đề · tối đa 8 MB · mã hoá UTF-8</div>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 text-[13px] text-muted">
                Không có tệp sẵn?
                <Button size="sm" variant="outline" icon={Wand2} onClick={useSample}>Dùng tệp mẫu nhân viên cửa hàng</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle px-3.5 py-3">
              <span className="size-10 grid place-items-center rounded-lg bg-surface border border-line text-brand-ink"><FileText size={19} /></span>
              <div className="min-w-0 flex-1">
                <div className="font-[600] truncate">{file.name}</div>
                <div className="ds-caption">{formatBytes(file.size)} · {formatNumber(file.rows.length)} dòng · {file.columns.length} cột</div>
              </div>
              <button onClick={() => setFile(null)} className="text-faint hover:text-neg p-1" aria-label="Gỡ tệp"><X size={16} /></button>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Cơ sở dữ liệu" value={curDb?.name || ''} onChange={(e) => { setDb(e.target.value); setSchema(dbs.find((d) => d.name === e.target.value)?.schemas[0]?.name || 'PUBLIC') }} options={dbs.map((d) => d.name)} />
            <Select label="Lược đồ" value={curSchema?.name || ''} onChange={(e) => setSchema(e.target.value)} options={schemas.map((s) => s.name)} />
          </div>
          <div>
            <Segmented value={mode} onChange={setMode} options={[{ value: 'new', label: 'Tạo bảng mới' }, { value: 'existing', label: 'Bảng có sẵn' }]} />
            <div className="mt-3">
              {mode === 'new' ? (
                <Input label="Tên bảng" value={tname} onChange={(e) => setTname(e.target.value)} placeholder="VD: NHAN_VIEN_CUA_HANG"
                  hint={finalName ? <>Bảng sẽ là <code className="font-mono text-fg">{curDb?.name}.{curSchema?.name}.{finalName}</code>{tables.some((t) => t.name === finalName) && <span className="text-warn"> — đã tồn tại, sẽ được ghi đè</span>}</> : 'Tên tự đổi sang chữ in hoa không dấu.'} />
              ) : tables.length ? (
                <Select label="Chọn bảng" placeholder="— Chọn bảng —" value={existing} onChange={(e) => setExisting(e.target.value)} options={tables.map((t) => t.name)} />
              ) : (
                <Callout tone="warn" icon={AlertTriangle}>Lược đồ {curSchema?.name} chưa có bảng nào. Hãy chọn “Tạo bảng mới”.</Callout>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && file && (
        <div className="grid lg:grid-cols-[230px_1fr] gap-5">
          <div className="flex flex-col gap-4">
            <Select label="Định dạng tệp" value="csv" onChange={() => {}} options={[{ value: 'csv', label: 'Văn bản phân tách (CSV/TSV)' }]} />
            <Select label="Khi gặp dòng lỗi" value={onError} onChange={(e) => setOnError(e.target.value)} options={[{ value: 'skip', label: 'Bỏ qua dòng lỗi' }, { value: 'stop', label: 'Dừng nạp' }]} />
            <div className="rounded-xl border border-line p-3 text-[13px] flex flex-col gap-1.5">
              <div className="flex justify-between"><span className="text-muted">Số dòng</span><b className="num">{formatNumber(file.rows.length)}</b></div>
              <div className="flex justify-between"><span className="text-muted">Cột được nạp</span><b className="num">{active.length}/{cols.length}</b></div>
              <div className="flex justify-between"><span className="text-muted">Dòng lỗi kiểu</span><b className={cn('num', errors ? 'text-warn' : 'text-pos')}>{errors}</b></div>
            </div>
            {mode === 'new' && <p className="ds-caption">Kiểu dữ liệu được đoán từ 200 dòng đầu. Bạn có thể đổi trước khi nạp.</p>}
          </div>
          <div className="min-w-0 rounded-xl border border-line overflow-hidden">
            <div className="overflow-auto max-h-[52vh]">
              <table className="w-full text-[13px] border-collapse min-w-[620px]">
                <thead className="sticky top-0 bg-surface z-[1]">
                  <tr className="text-left text-muted text-[12px]">
                    <th className="px-3 h-9 border-b border-line w-8" />
                    <th className="px-3 border-b border-line font-[600]">Cột trong tệp</th>
                    <th className="px-3 border-b border-line font-[600]">{mode === 'new' ? 'Tên cột trong bảng' : 'Cột đích'}</th>
                    <th className="px-3 border-b border-line font-[600]">Kiểu</th>
                    <th className="px-3 border-b border-line font-[600]">Xem trước</th>
                  </tr>
                </thead>
                <tbody>
                  {mapped.map((c, i) => {
                    const ci = file.columns.indexOf(c.src)
                    const bad = file.rows.filter((r) => badValue(r[ci], c.type)).length
                    return (
                      <tr key={c.src} className={cn('border-b border-line last:border-0', !c.on && 'opacity-50')}>
                        <td className="px-3 py-2"><Checkbox checked={c.on} disabled={mode === 'existing' && !c.target} onChange={(v) => setCols((l) => l.map((x, j) => (j === i ? { ...x, on: v } : x)))} /></td>
                        <td className="px-3 py-2 font-mono text-[12.5px]">{c.src}</td>
                        <td className="px-3 py-2">
                          {mode === 'new' ? (
                            <input value={c.name} onChange={(e) => setCols((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value.toUpperCase() } : x)))}
                              className="w-full h-8 rounded-lg border border-line-strong bg-surface px-2 font-mono text-[12.5px] outline-none focus:border-brand-400" />
                          ) : c.target ? <span className="font-mono text-[12.5px]">{c.target}</span> : <Badge tone="warn" size="sm">Không có ở bảng đích</Badge>}
                        </td>
                        <td className="px-3 py-2">
                          {mode === 'new' ? (
                            <select value={c.type} onChange={(e) => setCols((l) => l.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                              className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-[12.5px] outline-none">
                              {TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                          ) : <span className="font-mono text-[12px] text-muted">{c.type}</span>}
                          {bad > 0 && c.on && <div className="text-[11.5px] text-warn mt-1">{bad} giá trị sai kiểu</div>}
                        </td>
                        <td className="px-3 py-2 text-muted text-[12.5px] max-w-[200px] truncate">{file.rows.slice(0, 3).map((r) => r[ci]).join(', ')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 2 && done && (
        <div className="flex flex-col items-center text-center py-6 animate-pop-in">
          <span className="size-16 rounded-full bg-pos-soft text-pos grid place-items-center"><CheckCircle2 size={34} /></span>
          <h2 className="ds-h2 mt-4">Đã nạp thành công {formatNumber(done.count)} dòng</h2>
          <p className="text-muted mt-1 flex items-center gap-1.5"><Table2 size={15} /><span className="font-mono text-[13px]">{done.fqn}</span></p>
          {done.skipped > 0 && <p className="ds-caption mt-2 text-warn">Đã bỏ qua {done.skipped} dòng lỗi kiểu dữ liệu.</p>}
        </div>
      )}
    </Modal>
  )
}
