import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LogoMark, Logo } from '@/components/brand/Logo'
import { Toaster } from '@/components/ui'
import { Contours } from './Contours'

/** Khung trang xác thực: thẻ giữa màn hình, nền đường đồng mức nhạt */
export function AuthShell({ children, wide, footer = true }) {
  return (
    <div className="relative min-h-dvh bg-canvas flex flex-col">
      <Contours opacity={0.35} />
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-16">
        <Link to="/" aria-label="Về trang chủ Lạc Việt Data"><Logo size={26} /></Link>
        <Link to="/" className="text-[13px] text-muted hover:text-fg">← Về trang giới thiệu</Link>
      </header>
      <main className="relative z-10 flex-1 grid place-items-center px-4 py-8">
        <div className={cn('w-full', wide ? 'max-w-[440px]' : 'max-w-[400px]')}>{children}</div>
      </main>
      {footer && (
        <footer className="relative z-10 py-5 text-center text-[12px] text-faint px-4">
          Bản demo do Ntahien Tech thiết kế. Không nhập mật khẩu thật của bạn.
        </footer>
      )}
      <Toaster />
    </div>
  )
}

/** Thẻ trắng có biểu tượng thương hiệu ở đầu */
export function AuthCard({ title, desc, children, className }) {
  return (
    <div className={cn('card shadow-md px-6 sm:px-8 py-8 animate-pop-in', className)}>
      <div className="flex flex-col items-center text-center mb-6">
        <LogoMark size={34} />
        <h1 className="text-[20px] font-[650] tracking-tight mt-3">{title}</h1>
        {desc && <p className="text-muted text-[13.5px] mt-1.5">{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/** Chân thẻ: ngôn ngữ + chính sách riêng tư */
export function AuthFooterLinks() {
  return (
    <div className="mt-6 text-center">
      <div className="flex justify-center gap-4 text-[12.5px] text-muted">
        <span className="font-[600] text-fg">Tiếng Việt</span>
        <button type="button" className="hover:text-fg" title="Bản demo chỉ có tiếng Việt">English</button>
      </div>
      <p className="mt-3 text-[11.5px] text-faint leading-relaxed">
        Chúng tôi xử lý thông tin cá nhân của bạn theo <span className="underline underline-offset-2">Chính sách quyền riêng tư</span> (bản demo).
      </p>
    </div>
  )
}

/** Quy tắc mật khẩu dùng chung */
export const PASSWORD_RULES = [
  { id: 'len', label: 'Ít nhất 14 ký tự', test: (p) => p.length >= 14 },
  { id: 'up', label: 'Có chữ hoa', test: (p) => /[A-ZÀ-Ỹ]/.test(p) },
  { id: 'low', label: 'Có chữ thường', test: (p) => /[a-zà-ỹ]/.test(p) },
  { id: 'num', label: 'Có chữ số', test: (p) => /\d/.test(p) },
]
export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p))

export function PasswordChecklist({ value }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value)
        return (
          <li key={r.id} className={cn('flex items-center gap-1.5 text-[12px] transition-colors', ok ? 'text-pos' : 'text-muted')}>
            <span className={cn('size-3.5 rounded-full grid place-items-center', ok ? 'bg-pos text-white' : 'bg-subtle text-faint')}>
              {ok ? <Check size={9} strokeWidth={3.5} /> : <X size={9} strokeWidth={3} />}
            </span>
            {r.label}
          </li>
        )
      })}
    </ul>
  )
}

/** Thanh đo độ mạnh mật khẩu */
export function StrengthBar({ value }) {
  const score = PASSWORD_RULES.filter((r) => r.test(value)).length + (value.length >= 18 ? 1 : 0)
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh']
  const tone = score >= 4 ? 'bg-pos' : score >= 3 ? 'bg-warn' : 'bg-neg'
  if (!value) return null
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cn('h-1 flex-1 rounded-full', i < score ? tone : 'bg-line')} />)}
      </div>
      <span className="text-[11.5px] text-muted w-16 text-right">{labels[score]}</span>
    </div>
  )
}
