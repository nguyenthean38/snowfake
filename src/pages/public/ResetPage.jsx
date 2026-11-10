import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { toast } from '@/store'
import { AuthShell, AuthCard, AuthFooterLinks, PasswordChecklist, StrengthBar, passwordOk } from '@/features/public/AuthShell'

export default function ResetPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = params.get('u') || 'MINHKHOA'
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const mismatch = pw2 && pw !== pw2
  const ok = passwordOk(pw) && pw === pw2

  const submit = (e) => {
    e.preventDefault()
    if (!ok) return
    setLoading(true)
    setTimeout(() => {
      toast({ title: 'Đã đặt lại mật khẩu', desc: 'Hãy đăng nhập bằng mật khẩu mới.' })
      navigate(`/dang-nhap?u=${encodeURIComponent(user)}`)
    }, 600)
  }

  const eye = <button type="button" onClick={() => setShow(!show)} className="text-faint hover:text-fg grid place-items-center" aria-label="Hiện mật khẩu">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
  return (
    <AuthShell>
      <AuthCard title="Đặt lại mật khẩu" desc={<>Chọn mật khẩu mới cho <b className="text-fg">{user}</b></>}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div>
            <Input label="Mật khẩu mới" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" autoFocus suffix={eye} />
            <StrengthBar value={pw} />
            <PasswordChecklist value={pw} />
          </div>
          <Input label="Nhập lại mật khẩu" type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password"
            error={mismatch ? 'Mật khẩu nhập lại không khớp.' : ''} />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!ok} loading={loading}>Đặt lại mật khẩu</Button>
        </form>
        <AuthFooterLinks />
      </AuthCard>
    </AuthShell>
  )
}
