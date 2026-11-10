import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  PanelLeftClose, PanelLeftOpen, Plus, Search, Bell, ChevronDown, Info, FileCode2, MessageSquareText, Bot, Zap,
  UserPlus, Upload, Database, Settings, LogOut, Sun, Moon, Monitor, UserCog, BookOpen, Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { Popover, Menu, Avatar, Progress } from '@/components/ui'
import { useApp, useAuth, useUI } from '@/store'
import { TRIAL } from '@/data/platform'
import { formatCompact } from '@/lib/format'
import { NAV, HOME } from './nav'

function isActive(pathname, item) {
  if (item.children) return item.children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/'))
  return pathname === item.to || pathname.startsWith(item.to + '/')
}

/** Mục con khớp dài nhất với đường dẫn hiện tại (tránh tô sáng cả /ai lẫn /ai/hoi-du-lieu) */
function bestChild(pathname, item) {
  return item.children
    .filter((c) => pathname === c.to || pathname.startsWith(c.to + '/'))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to
}

/** Menu "Tạo mới" dùng chung cho thanh bên và trang chủ */
export function useCreateItems() {
  const navigate = useNavigate()
  const newFile = useApp((s) => s.newFile)
  return [
    { label: 'Tệp SQL', icon: FileCode2, desc: 'Viết và chạy truy vấn', onClick: () => { newFile(); navigate('/khong-gian') } },
    { label: 'Hỏi dữ liệu', icon: MessageSquareText, desc: 'Hỏi bằng tiếng Việt', onClick: () => navigate('/ai/hoi-du-lieu') },
    { label: 'Tác tử AI', icon: Bot, onClick: () => navigate('/ai/tac-tu?tao=1') },
    { divider: true },
    { label: 'Tải tệp lên', icon: Upload, onClick: () => navigate('/nap-du-lieu?tai-len=1') },
    { label: 'Cơ sở dữ liệu', icon: Database, onClick: () => navigate('/du-lieu?tao=1') },
    { label: 'Kho tính toán', icon: Zap, onClick: () => navigate('/tinh-toan/kho?tao=1') },
    { label: 'Người dùng', icon: UserPlus, onClick: () => navigate('/quan-tri/nguoi-dung?tao=1') },
  ]
}

function UserMenu({ close }) {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const { theme, setTheme } = useUI()
  const { roles, currentRole, update } = useApp()
  const [sub, setSub] = useState(null)
  if (sub === 'role') {
    return (
      <div className="w-64">
        <div className="px-2.5 pt-1.5 pb-1 ds-label">Chuyển vai trò</div>
        <Menu onClose={close} items={roles.map((r) => ({ label: r.name, desc: r.label, checked: r.name === currentRole, onClick: () => update('currentRole', r.name) }))} />
      </div>
    )
  }
  return (
    <div className="w-64">
      <div className="flex items-center gap-3 px-2.5 py-2">
        <Avatar name={user.name} color={user.color} size={36} />
        <div className="min-w-0">
          <div className="font-[600] truncate">{user.name}</div>
          <div className="ds-caption truncate">{user.email}</div>
        </div>
      </div>
      <div className="my-1 h-px bg-line" />
      <Menu onClose={close} items={[
        { label: 'Chuyển vai trò', icon: UserCog, desc: `Đang dùng ${currentRole}`, keepOpen: true, onClick: () => setSub('role') },
        { label: 'Cài đặt cá nhân', icon: Settings, onClick: () => navigate('/cai-dat') },
        { label: 'Phím tắt', icon: Keyboard, onClick: () => useUI.getState().setCommand(true) },
        { label: 'Tài liệu hướng dẫn', icon: BookOpen, onClick: () => navigate('/mau-du-an') },
        { divider: true },
        { heading: 'Giao diện' },
        { label: 'Sáng', icon: Sun, checked: theme === 'light', keepOpen: true, onClick: () => setTheme('light') },
        { label: 'Tối', icon: Moon, checked: theme === 'dark', keepOpen: true, onClick: () => setTheme('dark') },
        { label: 'Theo hệ thống', icon: Monitor, checked: theme === 'system', keepOpen: true, onClick: () => setTheme('system') },
        { divider: true },
        { label: 'Đăng xuất', icon: LogOut, danger: true, onClick: () => { signOut(); navigate('/dang-nhap') } },
      ]} />
    </div>
  )
}

export function Sidebar({ rail, onNavigate }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ui = useUI()
  const user = useAuth((s) => s.user)
  const currentRole = useApp((s) => s.currentRole)
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length)
  const createItems = useCreateItems()
  const [open, setOpen] = useState(() => Object.fromEntries(NAV.flatMap((g) => g.items).filter((i) => i.children).map((i) => [i.label, isActive(pathname, i)])))
  useEffect(() => {
    setOpen((o) => ({ ...o, ...Object.fromEntries(NAV.flatMap((g) => g.items).filter((i) => i.children && isActive(pathname, i)).map((i) => [i.label, true])) }))
  }, [pathname])
  const left = TRIAL.total - TRIAL.used

  /* ----- Dải biểu tượng thu gọn ----- */
  if (rail) {
    return (
      <aside className="h-full w-[60px] shrink-0 flex flex-col items-center border-r border-line bg-side py-3 gap-1">
        <Link to="/trang-chu" className="mb-1.5" title="Trang chủ Lạc Việt Data"><LogoMark size={28} /></Link>
        <RailBtn icon={PanelLeftOpen} label="Mở rộng thanh bên" onClick={() => ui.setCollapsed(false)} />
        <div className="w-8 h-px bg-line my-1.5" />
        <RailLink item={HOME} active={pathname === '/trang-chu'} />
        <Popover align="start" width={240} trigger={(p) => <RailBtn {...p} icon={Plus} label="Tạo mới" />}>
          {(close) => <Menu onClose={close} items={createItems} />}
        </Popover>
        <RailBtn icon={Search} label="Tìm kiếm (Ctrl K)" onClick={() => ui.setCommand(true)} />
        <div className="w-8 h-px bg-line my-1.5" />
        <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto no-scrollbar">
          {NAV.map((g, gi) => (
            <div key={g.group} className="flex flex-col items-center gap-1">
              {gi > 0 && <div className="w-8 h-px bg-line my-1.5" />}
              {g.items.map((it) => <RailLink key={it.label} item={it} active={isActive(pathname, it)} />)}
            </div>
          ))}
        </div>
        <RailBtn icon={Bell} label="Thông báo" onClick={() => ui.setNotif(true)} badge={unread} />
        <Popover align="start" width={260} trigger={(p) => <button {...p} className="mt-1 rounded-full" title={user.name}><Avatar name={user.name} color={user.color} size={34} /></button>}>
          {(close) => <UserMenu close={close} />}
        </Popover>
      </aside>
    )
  }

  /* ----- Thanh bên đầy đủ ----- */
  return (
    <aside className="h-full w-[264px] shrink-0 flex flex-col border-r border-line bg-side">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link to="/trang-chu" onClick={onNavigate}><Logo size={28} /></Link>
        <button onClick={() => ui.setCollapsed(true)} className="hidden lg:grid size-8 place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg" title="Thu gọn thanh bên"><PanelLeftClose size={17} /></button>
      </div>
      <div className="mx-3 grid grid-cols-3 gap-1 border-b border-line pb-3">
        <NavLink to="/trang-chu" onClick={onNavigate} title="Trang chủ" className={({ isActive: a }) => cn('h-9 grid place-items-center rounded-lg', a ? 'bg-brand-50 text-brand-ink' : 'text-muted hover:bg-hover hover:text-fg')}><HOME.icon size={17} /></NavLink>
        <Popover align="start" width={250} trigger={(p) => <button {...p} title="Tạo mới" className="h-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><Plus size={18} /></button>}>
          {(close) => <Menu onClose={() => { close(); onNavigate?.() }} items={createItems} />}
        </Popover>
        <button onClick={() => ui.setCommand(true)} title="Tìm kiếm (Ctrl K)" className="h-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"><Search size={17} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="px-2.5 mb-1 text-[12px] font-[600] text-muted">{g.group}</div>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const act = isActive(pathname, it)
                const Icon = it.icon
                if (!it.children) {
                  return (
                    <li key={it.label}>
                      <NavLink to={it.to} onClick={onNavigate} className={cn('flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13.5px]', act ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-dim hover:bg-hover hover:text-fg')}>
                        <Icon size={17} strokeWidth={1.9} className="shrink-0" />{it.label}
                      </NavLink>
                    </li>
                  )
                }
                const isOpen = open[it.label]
                return (
                  <li key={it.label}>
                    <button onClick={() => setOpen((o) => ({ ...o, [it.label]: !o[it.label] }))}
                      className={cn('w-full flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13.5px]', act ? 'text-fg font-[600]' : 'text-dim hover:bg-hover hover:text-fg')}>
                      <Icon size={17} strokeWidth={1.9} className={cn('shrink-0', act && 'text-brand-ink')} />
                      <span className="flex-1 text-left">{it.label}</span>
                      <ChevronDown size={15} className={cn('text-faint transition-transform', isOpen ? '' : '-rotate-90')} />
                    </button>
                    {isOpen && (
                      <ul className="mt-0.5 mb-1 ml-[21px] pl-3 border-l border-line flex flex-col gap-0.5">
                        {it.children.map((c) => (
                          <li key={c.to}>
                            <NavLink end to={c.to} onClick={onNavigate} className={() => cn('flex items-center rounded-md px-2.5 h-8 text-[13px]', bestChild(pathname, it) === c.to ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-muted hover:bg-hover hover:text-fg')}>
                              {c.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="rounded-xl bg-surface border border-line p-3">
          <div className="flex items-center justify-between text-[12.5px]">
            <span><b className="font-[650] num">{formatCompact(left)}</b> <span className="text-muted">/ {formatCompact(TRIAL.total)} ₫ tín dụng</span></span>
            <span title="Tín dụng dùng thử dùng cho kho tính toán, lưu trữ và hàm AI" className="text-faint"><Info size={14} /></span>
          </div>
          <Progress value={left} max={TRIAL.total} height={5} auto={false} className="mt-2" />
          <div className="ds-caption mt-1.5">Còn {TRIAL.daysLeft} ngày dùng thử</div>
          <button onClick={() => { navigate('/quan-tri/tai-khoan'); onNavigate?.() }} className="mt-2 w-full h-8 rounded-lg bg-crystal text-white text-[13px] font-[600] hover:brightness-105">Nâng cấp</button>
        </div>
        <div className="flex items-center gap-1">
          <Popover align="start" width={260} trigger={(p) => (
            <button {...p} className="flex-1 min-w-0 flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover text-left">
              <Avatar name={user.name} color={user.color} size={32} />
              <span className="min-w-0">
                <span className="block text-[13px] font-[600] truncate">{user.username}</span>
                <span className="block text-[11.5px] text-muted truncate">{currentRole}</span>
              </span>
            </button>
          )}>
            {(close) => <UserMenu close={close} />}
          </Popover>
          <button onClick={() => ui.setNotif(true)} className="relative size-9 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg" title="Thông báo">
            <Bell size={17} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-neg text-white text-[10px] font-[700] grid place-items-center">{unread}</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

function RailBtn({ icon: Icon, label, badge, className, ...p }) {
  return (
    <button {...p} title={label} aria-label={label} className={cn('relative size-10 grid place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg', className)}>
      <Icon size={18} strokeWidth={1.9} />
      {badge > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-neg ring-2 ring-side" />}
    </button>
  )
}

function RailLink({ item, active }) {
  const Icon = item.icon
  return (
    <div className="relative group">
      <Link to={item.to} aria-label={item.label} className={cn('size-10 grid place-items-center rounded-lg', active ? 'bg-brand-50 text-brand-ink' : 'text-muted hover:bg-hover hover:text-fg')}>
        <Icon size={18} strokeWidth={1.9} />
      </Link>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity absolute left-full top-0 pl-2 z-50">
        <div className="rounded-xl border border-line bg-surface shadow-md p-1.5 min-w-48">
          <div className="px-2.5 pt-1 pb-1.5 text-[12px] font-[650] text-muted">{item.label}</div>
          {(item.children || [{ label: item.label, to: item.to }]).map((c) => (
            <Link key={c.to} to={c.to} className="block rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-hover whitespace-nowrap">{c.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}

