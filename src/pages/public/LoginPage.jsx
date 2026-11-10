import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Sparkles, User, X } from 'lucide-react'
import { Button, Input, Divider } from '@/components/ui'
import { useAuth, toast } from '@/store'
import { ORG, ME } from '@/data/platform'
import { AuthShell, AuthCard, AuthFooterLinks } from '@/features/public/AuthShell'

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const signup = useAuth((s) => s.signup)
  const next = params.get('next') || '/trang-chu'
  const choose = params.get('chon-tai-khoan') === '1'
  const [account, setAccount] = useState(choose ? null : ORG.locator)
  const [username, setUsername] = useState(params.get('u') || '')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const go = (patch) => {
    setLoading(true)
    setTimeout(() => {
      signIn(patch)
      navigate(next, { replace: true })
    }, 450)
  }
  const submit = (e) => {
    e.preventDefault()
    if (!username.trim() || password.length < 4) {
      setErr('Tên đăng nhập hoặc mật khẩu không đúng. Mã yêu cầu: 3f9a6d4f-9c13-4a7b-8c1e-4b2f0e1a77c2.')
      return
    }
    setErr('')
    const u = username.trim().toUpperCase().replace(/\s+/g, '')
    go(u === ME.username ? {} : { username: u, name: signup.first ? `${signup.last || ''} ${signup.first}`.trim() : u, first: signup.first || u })
  }

  if (!account) {
    return (
      <AuthShell>
        <AuthCard title="Chọn tài khoản để đăng nhập" desc="Bạn có quyền truy cập vào 2 tài khoản Lạc Việt Data.">
          <div className="flex flex-col gap-2">
            {[ORG.locator, 'PN24814'].map((a, i) => (
              <button key={a} onClick={() => setAccount(a)} className="flex items-center justify-between rounded-xl border border-line px-4 h-12 hover:border-brand-300 hover:bg-brand-50 text-left">
                <span><span className="font-[600] num">{a}</span><span className="ds-caption ml-2">{i === 0 ? ORG.name : 'Phố Núi — Thử nghiệm'}</span></span>
                <span className="text-brand-ink text-[13px]">Chọn ›</span>
              </button>
            ))}
          </div>
          <Divider label="hoặc" className="my-5" />
          <Button variant="primary" className="w-full" to="/dang-ky">Đăng ký tài khoản mới</Button>
        </AuthCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      {err && (
        <div role="alert" className="mb-3 flex items-start gap-2.5 rounded-xl border border-neg/30 bg-neg-soft text-neg px-3.5 py-2.5 text-[13px] animate-pop-in">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{err}</span>
          <button onClick={() => setErr('')} aria-label="Đóng"><X size={14} /></button>
        </div>
      )}
      <AuthCard title={choose ? `Đăng nhập vào ${account}` : 'Đăng nhập Lạc Việt Data'} desc={choose ? null : `Tài khoản ${ORG.short} · ${ORG.url}`}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Input label="Tên đăng nhập" prefix={User} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus placeholder="vd: MINHKHOA" />
          <div>
            <Input label="Mật khẩu" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              suffix={<button type="button" onClick={() => setShow(!show)} className="text-faint hover:text-fg grid place-items-center" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
            <Link to="/quen-mat-khau" className="inline-block mt-2 text-[12.5px] text-brand-ink hover:underline underline-offset-4">Quên mật khẩu?</Link>
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!username || !password}>Đăng nhập</Button>
        </form>
        <Divider label="hoặc" className="my-5" />
        <Button variant="outline" size="lg" icon={Sparkles} className="w-full" disabled={loading}
          onClick={() => { toast({ title: 'Đang vào bằng tài khoản demo', desc: 'Dữ liệu là dữ liệu mô phỏng của chuỗi cà phê Phố Núi.' }); go({}) }}>
          Vào bằng tài khoản demo
        </Button>
        <p className="text-center text-[13px] text-muted mt-5">
          Chưa có tài khoản? <Link to="/dang-ky" className="text-brand-ink font-[600] hover:underline underline-offset-4">Dùng thử miễn phí 30 ngày</Link>
        </p>
        {choose && <button onClick={() => setAccount(null)} className="block mx-auto mt-2 text-[12.5px] text-muted hover:text-fg">Đổi tài khoản khác</button>}
        <AuthFooterLinks />
      </AuthCard>
    </AuthShell>
  )
}
