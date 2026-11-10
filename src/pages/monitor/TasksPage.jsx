import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Play, Pause, CalendarClock, Workflow, ArrowDown, Loader2, Clock, MoreHorizontal, Trash2 } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import {
  Button, IconButton, Tabs, Select, Input, Textarea, Badge, Drawer, Modal, Table, THead, Th, Tr, Td, KeyValue, Progress, EmptyState, Popover, Menu, Confirm,
} from '@/components/ui'
import { BarChart, Sparkline } from '@/components/charts'
import { useApp, toast, uid } from '@/store'
import { formatDuration, formatDateTime, formatNumber } from '@/lib/format'
import { ago, Legend } from '@/features/monitor/shared'
import { SCHEDULE_PRESETS, dailyCounts, recentRuns } from '@/features/monitor/taskRuns'
import { cn } from '@/lib/cn'

function RunDots({ runs }) {
  return (
    <span className="inline-flex gap-1">
      {runs.slice(0, 8).reverse().map((r) => <span key={r.id} title={`${r.status} · ${formatDateTime(r.at)}`} className={cn('size-2.5 rounded-full', r.status === 'Lỗi' ? 'bg-neg' : 'bg-pos')} />)}
    </span>
  )
}
function StateBadge({ value }) {
  return <Badge size="sm" dot tone={value === 'Đang chạy' ? 'pos' : 'neutral'}>{value === 'Đang chạy' ? 'Đã kích hoạt' : 'Tạm dừng'}</Badge>
}
function RunStatus({ value }) {
  return <Badge size="sm" dot tone={value === 'Lỗi' ? 'neg' : value === 'Đang chạy' ? 'info' : 'pos'}>{value}</Badge>
}

function TaskForm({ open, onClose, task }) {
  const { tasks, warehouses, upsert } = useApp()
  const [f, setF] = useState(null)
  useEffect(() => {
    if (open) setF(task ? { ...task, preset: SCHEDULE_PRESETS.some((p) => p.value === task.cron) ? task.cron : 'custom' } : { name: '', warehouse: 'KHO_NAP_DU_LIEU', preset: '0 6 * * *', cron: '0 6 * * *', after: '', database: 'PHO_NUI_DB', schema: 'BAN_HANG', sql: 'INSERT INTO BAO_CAO_NGAY\nSELECT DATE(NGAY_DAT), MA_CH, SUM(TONG_TIEN)\nFROM DON_HANG\nWHERE DATE(NGAY_DAT) = DATEADD(day, -1, CURRENT_DATE())\nGROUP BY 1, 2;' })
  }, [open, task])
  if (!open || !f) return null
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const cron = f.preset === 'custom' ? f.cron : f.preset
  const valid = /^[A-Za-z_]\w*$/.test(f.name) && cron.trim().split(/\s+/).length === 5 && f.sql.trim()
  const save = () => {
    const label = SCHEDULE_PRESETS.find((p) => p.value === cron)?.label || `Cron: ${cron}`
    upsert('tasks', { id: task?.id || uid('k'), name: f.name.toUpperCase(), warehouse: f.warehouse, cron, schedule: f.after ? `Sau ${f.after}` : label, after: f.after || undefined, database: f.database, schema: f.schema, sql: f.sql, owner: task?.owner || useApp.getState().currentRole, state: task?.state || 'Tạm dừng', successRate: task?.successRate ?? 1, avgMs: task?.avgMs ?? 3000 })
    toast(task ? `Đã cập nhật ${f.name.toUpperCase()}` : { title: `Đã tạo tác vụ ${f.name.toUpperCase()}`, desc: 'Tác vụ mới ở trạng thái tạm dừng — bấm Tiếp tục để kích hoạt.' })
    onClose()
  }
  return (
    <Modal open onClose={onClose} size="lg" title={task ? `Sửa tác vụ ${task.name}` : 'Tạo tác vụ'} desc="Tác vụ chạy một câu SQL theo lịch hoặc sau khi tác vụ khác hoàn tất."
      footer={<><Button onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!valid} onClick={save}>{task ? 'Lưu thay đổi' : 'Tạo tác vụ'}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Tên tác vụ" value={f.name} disabled={!!task} onChange={(e) => set({ name: e.target.value.toUpperCase().replace(/\s+/g, '_') })} placeholder="VD: TONG_HOP_BAO_CAO_NGAY" className="sm:col-span-2" />
        <Select label="Kho tính toán" value={f.warehouse} onChange={(e) => set({ warehouse: e.target.value })} options={[...warehouses.map((w) => w.name), 'Không máy chủ']} />
        <Select label="Chạy sau tác vụ" optional value={f.after || ''} onChange={(e) => set({ after: e.target.value })} options={[{ value: '', label: '— Chạy theo lịch —' }, ...tasks.filter((t) => t.name !== f.name).map((t) => t.name)]} />
        {!f.after && <>
          <Select label="Lịch chạy" value={f.preset} onChange={(e) => set({ preset: e.target.value, cron: e.target.value === 'custom' ? f.cron : e.target.value })} options={[...SCHEDULE_PRESETS, { value: 'custom', label: 'Tuỳ chỉnh (biểu thức cron)' }]} />
          <Input label="Biểu thức cron" value={cron} disabled={f.preset !== 'custom'} onChange={(e) => set({ cron: e.target.value })} inputClassName="font-mono" hint="phút giờ ngày tháng thứ · múi giờ Asia/Ho_Chi_Minh" />
        </>}
        <Select label="Cơ sở dữ liệu" value={f.database} onChange={(e) => set({ database: e.target.value })} options={['PHO_NUI_DB', 'DU_LIEU_MAU']} />
        <Select label="Lược đồ" value={f.schema} onChange={(e) => set({ schema: e.target.value })} options={['BAN_HANG', 'MARKETING', 'PUBLIC']} />
        <Textarea label="Câu SQL" rows={7} value={f.sql} onChange={(e) => set({ sql: e.target.value })} className="sm:col-span-2 [&_textarea]:font-mono [&_textarea]:text-[12.5px]" />
      </div>
    </Modal>
  )
}

function DagView({ task, tasks }) {
  // gốc của đồ thị chứa tác vụ này
  let root = task
  while (root?.after) root = tasks.find((t) => t.name === root.after) || null
  if (!root) root = task
  const chain = [root]
  let cur = root
  for (;;) {
    const next = tasks.find((t) => t.after === cur.name)
    if (!next || chain.includes(next)) break
    chain.push(next); cur = next
  }
  return (
    <div className="rounded-xl border border-line dot-grid p-6 flex flex-col items-center">
      {chain.map((t, i) => (
        <div key={t.id} className="flex flex-col items-center">
          {i > 0 && <><div className="w-px h-4 bg-line-strong" /><ArrowDown size={14} className="text-faint -my-1" /><div className="w-px h-2 bg-line-strong" /></>}
          <div className={cn('w-[280px] rounded-xl border bg-surface px-4 py-3 shadow-xs', t.id === task.id ? 'border-brand-400 ring-2 ring-brand-100' : 'border-line')}>
            <div className="flex items-center justify-between gap-2"><span className="font-mono text-[12.5px] font-[650] truncate">{t.name}</span><StateBadge value={t.state} /></div>
            <div className="ds-caption mt-1 flex items-center gap-1.5"><Clock size={12} />{t.after ? `Sau ${t.after}` : t.schedule} · {t.warehouse}</div>
          </div>
        </div>
      ))}
      {chain.length === 1 && <p className="ds-caption mt-4">Tác vụ đơn lẻ — chưa có tác vụ nào chạy sau tác vụ này.</p>}
    </div>
  )
}

function TaskDrawer({ task, onClose, onEdit }) {
  const { tasks, update, taskRuns = [] } = useApp()
  const [tab, setTab] = useState('overview')
  const [progress, setProgress] = useState(null)
  useEffect(() => { setTab('overview'); setProgress(null) }, [task?.id])
  if (!task) return <Drawer open={false} onClose={onClose} />
  const runs = [...taskRuns.filter((r) => r.task === task.name), ...recentRuns(task)].sort((a, b) => b.at - a.at)
  const ok = runs.filter((r) => r.status === 'Thành công').length
  const runNow = () => {
    setProgress(0)
    const t0 = Date.now(), dur = 1600 + Math.random() * 1200
    const iv = setInterval(() => {
      const p = Math.min(100, ((Date.now() - t0) / dur) * 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(iv)
        const failed = Math.random() > (task.successRate ?? 1)
        const run = { id: uid('run'), task: task.name, at: Date.now(), ms: Math.round(dur), status: failed ? 'Lỗi' : 'Thành công', ret: failed ? 'Vượt thời gian chờ' : 'OK', database: task.database, schema: task.schema, manual: true }
        update('taskRuns', (l = []) => [run, ...(l || [])].slice(0, 100))
        setProgress(null)
        toast(failed ? { title: `${task.name} chạy lỗi`, desc: run.ret, tone: 'neg' } : { title: `${task.name} đã chạy xong`, desc: `Thời lượng ${formatDuration(run.ms)}` })
      }
    }, 120)
  }
  const toggle = () => {
    const state = task.state === 'Đang chạy' ? 'Tạm dừng' : 'Đang chạy'
    update('tasks', (l) => l.map((t) => (t.id === task.id ? { ...t, state } : t)))
    toast(state === 'Đang chạy' ? `Đã tiếp tục ${task.name}` : `Đã tạm dừng ${task.name}`)
  }
  return (
    <Drawer open onClose={onClose} width={640}
      header={<div><div className="flex items-center gap-2 flex-wrap"><h2 className="ds-h2 font-mono">{task.name}</h2><StateBadge value={task.state} /></div><p className="ds-caption mt-1">{task.database}.{task.schema} · {task.owner}</p></div>}
      footer={<>
        <Button variant="primary" icon={progress != null ? Loader2 : Play} disabled={progress != null} onClick={runNow} className={progress != null ? '[&_svg]:animate-spin' : ''}>{progress != null ? 'Đang chạy…' : 'Chạy ngay'}</Button>
        <Button icon={task.state === 'Đang chạy' ? Pause : Play} onClick={toggle}>{task.state === 'Đang chạy' ? 'Tạm dừng' : 'Tiếp tục'}</Button>
        <Button icon={CalendarClock} variant="ghost" onClick={() => onEdit(task)} className="ml-auto">Sửa lịch</Button>
      </>}>
      {progress != null && <div className="mb-4"><div className="flex justify-between ds-caption mb-1"><span>Đang thực thi trên {task.warehouse}</span><span className="num">{Math.round(progress)}%</span></div><Progress value={progress} auto={false} /></div>}
      <Tabs value={tab} onChange={setTab} className="mb-4" options={[{ value: 'overview', label: 'Tổng quan' }, { value: 'graph', label: 'Đồ thị' }, { value: 'sql', label: 'Định nghĩa' }, { value: 'runs', label: 'Lượt chạy', count: runs.length }]} />
      {tab === 'overview' && (
        <KeyValue items={[
          { label: 'Lịch', value: task.after ? `Sau ${task.after}` : task.schedule },
          { label: 'Biểu thức cron', value: task.after ? '—' : <span className="font-mono text-[12.5px]">{task.cron}</span> },
          { label: 'Kho tính toán', value: task.warehouse },
          { label: 'Chủ sở hữu', value: task.owner },
          { label: 'Vị trí', value: `${task.database}.${task.schema}` },
          { label: 'Tỷ lệ thành công (12 lần gần nhất)', value: `${Math.round((ok / Math.max(1, runs.length)) * 100)}%` },
          { label: 'Thời lượng trung bình', value: formatDuration(task.avgMs || 0) },
          { label: 'Lần chạy gần nhất', value: runs[0] ? `${ago(runs[0].at)} · ${runs[0].status}` : 'Chưa chạy' },
        ]} />
      )}
      {tab === 'graph' && <DagView task={task} tasks={tasks} />}
      {tab === 'sql' && <pre className="rounded-xl border border-line bg-[var(--c-code-bg)] p-4 text-[12.5px] font-mono whitespace-pre-wrap leading-relaxed">{task.sql}</pre>}
      {tab === 'runs' && (
        <div className="card overflow-hidden">
          <Table minWidth={520}>
            <THead><Th>Thời điểm</Th><Th>Trạng thái</Th><Th align="right">Thời lượng</Th><Th>Kết quả trả về</Th></THead>
            <tbody>{runs.map((r) => (
              <Tr key={r.id}><Td className="text-[13px] whitespace-nowrap">{formatDateTime(r.at)}{r.manual && <Badge size="sm" tone="brand" className="ml-2">Thủ công</Badge>}</Td><Td><RunStatus value={r.status} /></Td><Td align="right" className="num">{formatDuration(r.ms)}</Td><Td className="text-[13px] text-muted">{r.ret}</Td></Tr>
            ))}</tbody>
          </Table>
        </div>
      )}
    </Drawer>
  )
}

export default function TasksPage() {
  const { tasks, taskRuns = [], remove } = useApp()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('graphs')
  const [range, setRange] = useState(7)
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState(params.get('tao') === '1' ? { task: null } : null)
  const [del, setDel] = useState(null)
  const daily = useMemo(() => dailyCounts(tasks, range), [tasks, range])
  const selected = tasks.find((t) => t.id === sel)
  const allRuns = useMemo(() => [...taskRuns, ...tasks.flatMap((t) => recentRuns(t, 6))].sort((a, b) => b.at - a.at), [tasks, taskRuns])
  const totalOk = daily.reduce((s, d) => s + d.ok, 0), totalFail = daily.reduce((s, d) => s + d.fail, 0)

  return (
    <Page wide title="Tác vụ định kỳ" desc="Tự động chạy SQL theo lịch: đồng bộ dữ liệu từ máy POS, tổng hợp doanh thu, chấm điểm cảm xúc đánh giá bằng AI."
      actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ task: null })}>Tác vụ</Button>}>
      <Tabs value={tab} onChange={setTab} className="mb-4" options={[{ value: 'graphs', label: 'Đồ thị tác vụ', count: tasks.length }, { value: 'runs', label: 'Lượt chạy' }]} />
      <div className="flex items-center gap-2 mb-4">
        <Select size="sm" value={range} onChange={(e) => setRange(+e.target.value)} options={[{ value: 1, label: 'Hôm nay' }, { value: 7, label: '7 ngày qua' }, { value: 14, label: '14 ngày qua' }]} className="w-36" />
        <span className="ds-caption ml-2"><b className="text-pos num">{formatNumber(totalOk)}</b> thành công · <b className="text-neg num">{formatNumber(totalFail)}</b> lỗi</span>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-2"><h3 className="ds-h3">Lượt chạy theo ngày</h3><Legend items={[{ label: 'Thành công', color: 'var(--c-pos)' }, { label: 'Lỗi', color: 'var(--c-neg)' }]} /></div>
        <BarChart data={daily} stacked height={200} series={[{ key: 'ok', label: 'Thành công', color: 'var(--c-pos)' }, { key: 'fail', label: 'Lỗi', color: 'var(--c-neg)' }]} />
      </div>

      {tab === 'graphs' ? (
        <div className="card overflow-hidden">
          {!tasks.length ? <EmptyState icon={Workflow} title="Chưa có tác vụ nào" action={<Button variant="primary" icon={Plus} onClick={() => setForm({ task: null })}>Tạo tác vụ</Button>} /> : (
            <Table minWidth={1040}>
              <THead><Th>Tác vụ gốc</Th><Th>Lịch</Th><Th>Lần gần nhất</Th><Th>Các lần trước</Th><Th>Xu hướng thời lượng</Th><Th>CSDL</Th><Th>Chủ sở hữu</Th><Th width={48} /></THead>
              <tbody>
                {tasks.map((t) => {
                  const runs = [...taskRuns.filter((r) => r.task === t.name), ...recentRuns(t)].sort((a, b) => b.at - a.at)
                  return (
                    <Tr key={t.id} onClick={() => setSel(t.id)}>
                      <Td><div className="font-mono text-[12.5px] font-[600]">{t.name}</div><div className="mt-1"><StateBadge value={t.state} /></div></Td>
                      <Td className="text-[13px] whitespace-nowrap">{t.after ? `Sau ${t.after}` : t.schedule}</Td>
                      <Td>{runs[0] ? <div><RunStatus value={runs[0].status} /><div className="ds-caption mt-0.5">{ago(runs[0].at)}</div></div> : '—'}</Td>
                      <Td><RunDots runs={runs} /></Td>
                      <Td><Sparkline values={runs.slice(0, 12).reverse().map((r) => r.ms)} width={110} height={26} /></Td>
                      <Td className="text-[13px]">{t.database}</Td>
                      <Td className="text-[13px]">{t.owner}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <Popover align="end" width={180} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác" size="sm" />}>
                          {(close) => <Menu onClose={close} items={[
                            { label: 'Sửa', icon: CalendarClock, onClick: () => setForm({ task: t }) },
                            { label: 'Xoá', icon: Trash2, danger: true, onClick: () => setDel(t) },
                          ]} />}
                        </Popover>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <Table minWidth={940}>
            <THead><Th>Tác vụ</Th><Th>Trạng thái</Th><Th>Thời điểm</Th><Th align="right">Thời lượng</Th><Th>Kết quả trả về</Th><Th>CSDL</Th><Th>Lược đồ</Th></THead>
            <tbody>
              {allRuns.slice(0, 60).map((r) => (
                <Tr key={r.id} onClick={() => setSel(tasks.find((t) => t.name === r.task)?.id)}>
                  <Td className="font-mono text-[12.5px]">{r.task}</Td><Td><RunStatus value={r.status} /></Td>
                  <Td className="text-[13px] whitespace-nowrap">{formatDateTime(r.at)}</Td><Td align="right" className="num">{formatDuration(r.ms)}</Td>
                  <Td className="text-[13px] text-muted">{r.ret}</Td><Td className="text-[13px]">{r.database}</Td><Td className="text-[13px]">{r.schema}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <TaskDrawer task={selected} onClose={() => setSel(null)} onEdit={(t) => setForm({ task: t })} />
      <TaskForm open={!!form} task={form?.task} onClose={() => { setForm(null); if (params.get('tao')) setParams({}, { replace: true }) }} />
      <Confirm open={!!del} onClose={() => setDel(null)} danger title={`Xoá tác vụ ${del?.name}?`} desc="Lịch chạy sẽ bị huỷ. Các tác vụ chạy sau tác vụ này sẽ không còn được kích hoạt." confirmLabel="Xoá tác vụ"
        onConfirm={() => { remove('tasks', del.id); if (sel === del.id) setSel(null); toast(`Đã xoá ${del.name}`) }} />
    </Page>
  )
}
