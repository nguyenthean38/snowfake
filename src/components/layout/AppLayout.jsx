import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Menu as MenuIcon, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth, useUI } from '@/store'
import { Toaster } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { getDB } from '@/engine/db'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { NotificationsPanel } from './Notifications'
import { Assistant } from './Assistant'

/** Khung ứng dụng sau đăng nhập: thanh bên + nội dung + các lớp phủ toàn cục */
export function AppLayout() {
  const signedIn = useAuth((s) => s.signedIn)
  const signIn = useAuth((s) => s.signIn)
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const ui = useUI()
  const fullBleed = pathname.startsWith('/khong-gian') // trình soạn SQL chiếm toàn màn hình
  const rail = ui.collapsed || fullBleed

  // ?demo=1 → vào thẳng bằng tài khoản demo (dùng khi nhúng vào trang giới thiệu)
  const demo = params.get('demo') === '1'
  useEffect(() => { if (demo && !signedIn) signIn() }, [demo, signedIn, signIn])

  // Khởi động động cơ SQL ngay khi vào ứng dụng để các trang dữ liệu mở tức thì
  useEffect(() => {
    const t = setTimeout(() => getDB().catch(() => {}), 300)
    return () => clearTimeout(t)
  }, [])

  // Phím tắt toàn cục
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.setCommand(!useUI.getState().command) }
      if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); ui.setAssistant(!useUI.getState().assistant) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { ui.setMobileNav(false) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!signedIn && !demo) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(pathname)}`} replace />

  return (
    <div className="h-dvh flex bg-canvas text-fg overflow-hidden">
      <div className="hidden lg:flex h-full">
        <Sidebar rail={rail} />
      </div>
      {ui.mobileNav && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-[rgba(14,14,40,.4)] animate-fade-in" onClick={() => ui.setMobileNav(false)} />
          <div className="absolute inset-y-0 left-0 animate-slide-in shadow-lg"><Sidebar onNavigate={() => ui.setMobileNav(false)} /></div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between h-14 px-3 border-b border-line bg-side shrink-0">
          <button onClick={() => ui.setMobileNav(true)} className="size-10 grid place-items-center rounded-lg hover:bg-hover" aria-label="Mở menu"><MenuIcon size={20} /></button>
          <Logo size={24} />
          <div className="flex">
            <button onClick={() => ui.setCommand(true)} className="size-10 grid place-items-center rounded-lg hover:bg-hover" aria-label="Tìm kiếm"><Search size={19} /></button>
            <button onClick={() => ui.setAssistant(true)} className="size-10 grid place-items-center rounded-lg hover:bg-hover text-brand-ink" aria-label="Tinh Ý"><Sparkles size={19} /></button>
          </div>
        </header>
        <main id="main" className={cn('flex-1 min-h-0', fullBleed ? 'overflow-hidden' : 'overflow-y-auto')}>
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <NotificationsPanel />
      <Assistant hideLauncher={fullBleed || pathname.startsWith('/ai/hoi-du-lieu') || /^\/ai\/tac-tu\/[^/]+/.test(pathname)} />
      <Toaster />
    </div>
  )
}
