import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/store'
import { stripAccents } from '@/lib/format'
import { AuthShell, AuthCard, AuthFooterLinks, PasswordChecklist, StrengthBar, passwordOk } from '@/features/public/AuthShell'

export default function ActivatePage() {
  const navigate = useNavigate()
  const signup = useAuth((s) => s.signup)
  const setSignup = useAuth((s) => s.setSignup)
  const fullName = [signup.last, signup.first].filter(Boolean).join(' ') || 'bạn'
  const suggested = stripAccents(`${signup.first || ''}${signup.last ? signup.last.split(' ')[0] : ''}`).toUpperCase().replace(/[^A-Z0-9_]/g, '') || ''
  const [username, setUsername] = useState(signup.username || suggested)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const userErr = username && !/^[A-Za-z0-9_.]{3,}$/.test(username) ? 'Chỉ dùng chữ không dấu, số, dấu gạch dưới hoặc dấu chấm (ít nhất 3 ký tự).' : ''
  const ok = username && !userErr && passwordOk(pw) && pw === pw2

  const submit = (e) => {
    e.preventDefault()
    if (!ok) return
    setLoading(true)
    setSignup({ username: username.toUpperCase() })
    setTimeout(() => navigate('/khoi-dong'), 600)
  }

  const eye = <button type="button" onClick={() => setShow(!show)} className="text-faint hover:text-fg grid place-items-center" aria-label="Hiện mật khẩu">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
  return (
    <AuthShell>
      <AuthCard title="Chào mừng tới Lạc Việt Data" desc={<><b className="text-fg">{fullName}</b>, hãy chọn tên đăng nhập và mật khẩu để bắt đầu.</>}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Input label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} autoFocus error={userErr}
            hint="Chỉ gồm chữ không dấu và số." suffix={username && !userErr ? <CheckCircle2 size={16} className="text-pos" /> : null} />
          <div>
            <Input label="Mật khẩu" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" suffix={eye} />
            <StrengthBar value={pw} />
            <PasswordChecklist value={pw} />
          </div>
          <Input label="Nhập lại mật khẩu" type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password"
            error={pw2 && pw !== pw2 ? 'Mật khẩu nhập lại không khớp.' : ''} suffix={pw2 && pw === pw2 ? <CheckCircle2 size={16} className="text-pos" /> : null} />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!ok} loading={loading}>Bắt đầu</Button>
        </form>
        <AuthFooterLinks />
      </AuthCard>
    </AuthShell>
  )
}
