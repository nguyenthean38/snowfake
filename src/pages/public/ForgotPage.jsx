import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck, User } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthShell, AuthCard, AuthFooterLinks } from '@/features/public/AuthShell'

export default function ForgotPage() {
  const [username, setUsername] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!username.trim()) { setErr('Vui lòng nhập tên đăng nhập hoặc email.'); return }
    setErr('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setSent(true) }, 700)
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="card shadow-md px-6 sm:px-8 py-8 text-center animate-pop-in">
          <span className="mx-auto size-14 rounded-2xl bg-pos-soft text-pos grid place-items-center"><MailCheck size={28} /></span>
          <h1 className="text-[20px] font-[650] mt-4">Đã gửi liên kết đặt lại</h1>
          <p className="text-muted text-[13.5px] mt-2">
            Nếu <b className="text-fg">{username.trim()}</b> khớp với một tài khoản, bạn sẽ nhận được email trong vài phút. Hãy kiểm tra cả thư mục Spam. Nếu vẫn không đăng nhập được, liên hệ bộ phận hỗ trợ của Lạc Việt Data.
          </p>
          <Button variant="primary" size="lg" className="w-full mt-6" to={`/dat-lai-mat-khau?u=${encodeURIComponent(username.trim().toUpperCase())}`}>Mở email đặt lại (mô phỏng)</Button>
          <Button variant="ghost" className="w-full mt-2" to="/dang-nhap">Quay lại đăng nhập</Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthCard title="Quên mật khẩu" desc="Chúng tôi sẽ gửi email kèm liên kết để bạn đặt lại mật khẩu.">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Input label="Tên đăng nhập hoặc email" prefix={User} value={username} error={err} autoFocus
            onChange={(e) => { setUsername(e.target.value); setErr('') }} placeholder="vd: MINHKHOA" />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>Gửi liên kết</Button>
          <Link to="/dang-nhap" className="text-center text-[13px] text-muted hover:text-fg">Quay lại đăng nhập</Link>
        </form>
        <AuthFooterLinks />
      </AuthCard>
    </AuthShell>
  )
}
