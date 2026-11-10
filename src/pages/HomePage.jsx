import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, FileCode2, Upload, MessageSquareText, UserPlus, Plus, LayoutGrid, Zap, Activity, Coins, ArrowRight, ChevronDown } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Card, Tabs, Table, THead, Th, Tr, Td, Badge, DynIcon, Kbd, Popover, Menu, Progress, Button, EmptyState, MoreLink } from '@/components/ui'
import { Sparkline } from '@/components/charts'
import { useApp, useAuth, useUI } from '@/store'
import { PROJECT_TEMPLATES, TRIAL, seedConsumption, CREDIT_PRICE } from '@/data/platform'
import { formatCompact, formatCredits, timeAgo } from '@/lib/format'
import { useCreateItems } from '@/components/layout/Sidebar'
import { TEMPLATE_SQL, useOpenSql } from '@/features/data/shared'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { files, apps, history, warehouses, openFile, newFile } = useApp()
  const setCommand = useUI((s) => s.setCommand)
  const openSql = useOpenSql()
  const createItems = useCreateItems()
  const [tab, setTab] = useState('all')
  const consumption = useMemo(() => seedConsumption(), [])

  const recent = useMemo(() => {
    const f = files.map((x) => ({ id: x.id, name: x.name, kind: 'Tệp SQL', icon: FileCode2, at: x.updated, open: () => { openFile(x.id); navigate('/khong-gian') } }))
    const a = apps.map((x) => ({ id: x.id, name: x.name, kind: 'Ứng dụng', icon: LayoutGrid, at: x.updated, open: () => navigate(`/ung-dung/${x.id}`) }))
    const all = [...f, ...a].sort((x, y) => (x.at < y.at ? 1 : -1))
    return tab === 'sql' ? all.filter((x) => x.kind === 'Tệp SQL') : tab === 'app' ? all.filter((x) => x.kind === 'Ứng dụng') : all
  }, [files, apps, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Truy vấn trong 24 giờ gần nhất (tính theo mốc thời gian của bản ghi)
  const latest = history.reduce((m, h) => Math.max(m, h.startedAt), 0)
  const today = history.filter((h) => latest - h.startedAt < 86400000)
  const failed = today.filter((h) => h.status === 'Lỗi').length
  const running = warehouses.filter((w) => w.state === 'Đang chạy')
  const credits = consumption.map((d) => d.KHO_PHAN_TICH + d.KHO_NAP_DU_LIEU + d.KHO_AI + d.DICH_VU_DAM_MAY + d.LUU_TRU)
  const tenDays = credits.slice(-10).reduce((a, b) => a + b, 0)
  const left = TRIAL.total - TRIAL.used

  const quick = [
    { title: 'Truy vấn dữ liệu', desc: 'Mở tệp SQL mới và chạy ngay', icon: FileCode2, run: () => { newFile(); navigate('/khong-gian') } },
    { title: 'Tải tệp lên', desc: 'Biến tệp CSV thành bảng trong vài giây', icon: Upload, run: () => navigate('/nap-du-lieu?tai-len=1') },
    { title: 'Hỏi dữ liệu', desc: 'Đặt câu hỏi bằng tiếng Việt, AI viết SQL', icon: MessageSquareText, run: () => navigate('/ai/hoi-du-lieu'), accent: true },
    { title: 'Mời người dùng', desc: 'Cộng tác với đồng nghiệp trong nhóm', icon: UserPlus, run: () => navigate('/quan-tri/nguoi-dung?tao=1') },
  ]

  return (
    <Page>
      <div className="mb-6">
        <p className="text-muted text-[13.5px]">{greeting()}, {user.first || user.name}</p>
        <h1 className="ds-h1 mt-0.5">Trang chủ</h1>
      </div>

      <button onClick={() => setCommand(true)} className="w-full h-12 flex items-center gap-3 px-4 rounded-xl border border-line-strong bg-surface text-left text-muted hover:border-faint shadow-xs transition-colors">
        <Search size={18} className="text-faint" />
        <span className="flex-1 text-[14px] truncate">Tìm trong tài khoản, Chợ dữ liệu và tài liệu…</span>
        <span className="hidden sm:flex items-center gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
      </button>

      <h2 className="ds-h2 mt-8 mb-3">Thao tác nhanh</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {quick.map((q) => (
          <button key={q.title} onClick={q.run}
            className={`group text-left rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5 ${q.accent ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-ice-soft' : 'border-line bg-surface'}`}>
            <span className={`size-9 grid place-items-center rounded-lg ${q.accent ? 'bg-crystal text-white' : 'bg-brand-50 text-brand-ink'}`}><q.icon size={18} /></span>
            <div className="font-[600] mt-3 flex items-center gap-1">{q.title}<ArrowRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /></div>
            <div className="ds-caption mt-0.5">{q.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6 mt-8">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="ds-h2">Dự án gần đây</h2>
            <Popover align="end" width={250} trigger={(p) => <Button {...p} size="sm" variant="outline" icon={Plus} iconRight={ChevronDown}>Dự án mới</Button>}>
              {(close) => <Menu onClose={close} items={createItems} />}
            </Popover>
          </div>
          <Tabs value={tab} onChange={setTab} options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'sql', label: 'Tệp SQL', count: files.length },
            { value: 'app', label: 'Ứng dụng', count: apps.length },
          ]} />
          <Card padded={false} className="mt-3 overflow-hidden">
            {!recent.length ? (
              <EmptyState icon={FileCode2} title="Tạo dự án đầu tiên" desc="Bắt đầu truy vấn bằng SQL, dựng ứng dụng dữ liệu hoặc hỏi dữ liệu bằng tiếng Việt." compact
                action={<Button variant="primary" icon={Plus} onClick={() => { newFile(); navigate('/khong-gian') }}>Tệp SQL mới</Button>} />
            ) : (
              <Table minWidth={520}>
                <THead><Th>Tên</Th><Th>Loại</Th><Th>Cập nhật</Th></THead>
                <tbody>
                  {recent.slice(0, 8).map((r) => (
                    <Tr key={r.kind + r.id} onClick={r.open}>
                      <Td><span className="flex items-center gap-2.5 font-[550]"><r.icon size={16} className="text-brand-ink shrink-0" /><span className="truncate">{r.name}</span></span></Td>
                      <Td className="text-muted">{r.kind}</Td>
                      <Td className="text-muted">{timeAgo(r.at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <div className="flex items-center justify-between mt-8 mb-3">
            <h2 className="ds-h2">Bắt đầu với mẫu dự án</h2>
            <MoreLink to="/mau-du-an">Xem thêm</MoreLink>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROJECT_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => openSql(t.file, TEMPLATE_SQL[t.id])}
                className="group text-left rounded-xl border border-line bg-surface p-4 hover:border-brand-200 hover:shadow-sm transition-all flex flex-col min-h-[108px]">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-[600] text-[13.5px] leading-snug">{t.title}</span>
                  <Plus size={16} className="text-faint group-hover:text-brand-ink shrink-0 mt-0.5" />
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2 text-[12px] text-muted">
                  <DynIcon name={t.icon} size={13} />{t.kind}<span className="text-faint">•</span>{t.topic}
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 ds-h3"><Coins size={16} className="text-brand-ink" />Tình trạng tài khoản</div>
            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="ds-caption">Tín dụng dùng thử còn lại</div>
                  <div className="ds-amount mt-0.5">{formatCompact(left)} <span className="text-[15px] text-muted font-[500]">₫</span></div>
                </div>
                <Sparkline values={credits} width={96} height={34} />
              </div>
              <Progress value={left} max={TRIAL.total} auto={false} className="mt-3" />
              <div className="ds-caption mt-1.5">Còn {TRIAL.daysLeft} ngày · {formatCredits(tenDays, 1)} tín dụng trong 10 ngày qua (~{formatCompact(tenDays * CREDIT_PRICE)} ₫)</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
              <Link to="/giam-sat/truy-van" className="rounded-lg hover:bg-subtle -m-1.5 p-1.5">
                <div className="flex items-center gap-1.5 ds-caption"><Activity size={13} />Truy vấn 24 giờ</div>
                <div className="text-[20px] font-[650] num">{today.length}</div>
                {failed > 0 ? <Badge tone="neg" size="sm">{failed} lỗi</Badge> : <Badge tone="pos" size="sm">Không lỗi</Badge>}
              </Link>
              <Link to="/tinh-toan/kho" className="rounded-lg hover:bg-subtle -m-1.5 p-1.5 min-w-0">
                <div className="flex items-center gap-1.5 ds-caption"><Zap size={13} />Kho đang chạy</div>
                <div className="text-[20px] font-[650] num">{running.length}<span className="text-muted text-[14px] font-[500]">/{warehouses.length}</span></div>
                <div className="text-[11.5px] text-muted truncate">{running.map((w) => w.name).join(', ') || 'Tất cả đang tạm dừng'}</div>
              </Link>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-brand-50 to-ice-soft border-brand-100">
            <div className="ds-h3">Thử hỏi Tinh Ý</div>
            <p className="ds-caption mt-1">Trợ lý AI đọc được dữ liệu bán hàng của Phố Núi và trả lời bằng biểu đồ.</p>
            <div className="flex flex-col gap-1.5 mt-3">
              {['Món nào bán chạy nhất tháng 10?', 'Khung giờ nào đông khách nhất?', 'Những đánh giá tiêu cực gần đây'].map((q) => (
                <button key={q} onClick={() => navigate(`/ai/hoi-du-lieu?q=${encodeURIComponent(q)}`)} className="text-left text-[13px] rounded-lg bg-surface/80 border border-line px-3 py-2 hover:border-brand-300">“{q}”</button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  )
}
