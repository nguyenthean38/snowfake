import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Button, Checkbox } from '@/components/ui'
import { useApp, useAuth, toast } from '@/store'
import { AuthShell } from '@/features/public/AuthShell'

const USES = [
  'Chạy phân tích dữ liệu và dựng biểu đồ',
  'Dựng hoặc phân phối ứng dụng dữ liệu',
  'Nạp, biến đổi dữ liệu, dựng đường ống hoặc chuyển đổi kho dữ liệu cũ',
  'Mua hoặc dùng dữ liệu từ Chợ dữ liệu',
  'Dùng Lạc Việt Data làm kho dữ liệu và hồ dữ liệu',
  'Dùng AI (tác tử, hàm AI, hỏi dữ liệu bằng tiếng Việt)',
  'Dựng hoặc huấn luyện mô hình học máy',
]
const LANGS = ['SQL', 'Python', 'Java', 'Scala', 'Khác']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { signup, signIn, updateUser } = useAuth()
  const update = useApp((s) => s.update)
  const [step, setStep] = useState(0)
  const [uses, setUses] = useState([])
  const [langs, setLangs] = useState([])
  const [noCode, setNoCode] = useState(false)
  const [other, setOther] = useState('')
  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const done = (skipped) => {
    update('onboarding', skipped ? { skipped: true } : { uses, langs: noCode ? [] : langs, other, noCode })
    if (signup.first) {
      const name = [signup.last, signup.first].filter(Boolean).join(' ')
      const patch = { name, first: signup.first, email: signup.email, username: signup.username, title: signup.title }
      updateUser(Object.fromEntries(Object.entries(patch).filter(([, v]) => v)))
    }
    signIn()
    toast({ title: `Chào mừng ${signup.first || 'bạn'} tới Lạc Việt Data!`, desc: 'Tài khoản đã sẵn sàng, kèm bộ dữ liệu mẫu chuỗi cà phê Phố Núi để bạn thử ngay.' })
    navigate('/trang-chu', { replace: true })
  }

  return (
    <AuthShell wide>
      <div className="card shadow-md px-6 sm:px-8 py-7 animate-pop-in" key={step}>
        <h1 className="text-[20px] font-[650] tracking-tight">Sắp xong rồi…</h1>
        <p className="text-muted text-[13.5px] mt-1">Chúng tôi đang thiết lập tài khoản. Trả lời vài câu hỏi để Lạc Việt Data gợi ý đúng thứ bạn cần.</p>

        {step === 0 ? (
          <div className="mt-6">
            <div className="font-[600] text-[14px] mb-3">Bạn định dùng Lạc Việt Data để làm gì?</div>
            <div className="flex flex-col gap-2.5">
              {USES.map((u) => (
                <Checkbox key={u} checked={uses.includes(u)} onChange={() => toggle(uses, setUses, u)} label={u}
                  className={cn('rounded-xl border px-3 py-2.5 w-full transition-colors', uses.includes(u) ? 'border-brand-300 bg-brand-50' : 'border-line hover:border-line-strong')} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="font-[600] text-[14px] mb-3">Bạn thường làm việc với ngôn ngữ lập trình nào?</div>
            <div className={cn('flex flex-col gap-2.5 transition-opacity', noCode && 'opacity-40 pointer-events-none')}>
              {LANGS.map((l) => (
                <div key={l} className="flex items-center gap-3">
                  <Checkbox checked={langs.includes(l)} onChange={() => toggle(langs, setLangs, l)} label={l} />
                  {l === 'Khác' && langs.includes('Khác') && (
                    <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Ghi rõ…" className="flex-1 h-8 rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] outline-none focus:border-brand-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 my-4 text-[12px] text-faint"><span className="h-px flex-1 bg-line" />HOẶC<span className="h-px flex-1 bg-line" /></div>
            <Checkbox checked={noCode} onChange={setNoCode} label="Tôi chưa có kinh nghiệm lập trình" desc="Tinh Ý sẽ giúp bạn hỏi dữ liệu bằng tiếng Việt, không cần viết mã." />
          </div>
        )}

        <div className="mt-7 flex items-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1].map((i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-brand-500' : 'w-1.5 bg-line-strong')} />)}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => (step === 0 ? setStep(1) : done(true))}>Bỏ qua</Button>
            {step === 0
              ? <Button variant="primary" disabled={!uses.length} onClick={() => setStep(1)}>Tiếp tục</Button>
              : <Button variant="primary" disabled={!langs.length && !noCode} onClick={() => done(false)}>Hoàn tất</Button>}
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
