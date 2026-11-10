import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, ChevronLeft, Cloud, MailCheck, BookOpen, GraduationCap, Compass, Sparkles, ShieldCheck, Zap, Database } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Input, Select, Checkbox, Modal, Toaster } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { useAuth } from '@/store'
import { CLOUDS, REGIONS, EDITIONS } from '@/data/platform'
import { formatNumber } from '@/lib/format'
import { Contours } from '@/features/public/Contours'

const REASONS = [
  { value: 'evaluate', label: 'Công ty tôi đang cân nhắc dùng Lạc Việt Data' },
  { value: 'training', label: 'Đào tạo hoặc lấy chứng chỉ trên Lạc Việt Data' },
  { value: 'personal', label: 'Học tập và phát triển cá nhân' },
  { value: 'student', label: 'Tôi là sinh viên muốn tìm hiểu Lạc Việt Data' },
  { value: 'other', label: 'Lý do khác' },
]
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|icloud)\./i

const BENEFITS = {
  ent: [
    'Truy cập ngay đám mây dữ liệu AI: kho dữ liệu, SQL, sổ tay, tác tử',
    'Hỏi dữ liệu bằng tiếng Việt, AI tự viết SQL và vẽ biểu đồ',
    'Co giãn tức thì, tách biệt lưu trữ và tính toán, trả theo giây sử dụng',
    'Dữ liệu đặt tại trung tâm dữ liệu trong nước, mã hoá đầu cuối',
  ],
  dev: [
    'Trợ lý lập trình Tinh Ý Code chạy ngay trong terminal và trình soạn',
    'Sinh SQL, Python, đường ống dữ liệu từ mô tả tiếng Việt',
    'Kết nối kho dữ liệu của bạn chỉ với một dòng lệnh',
    'Miễn phí cho dự án cá nhân trong thời gian dùng thử',
  ],
}

function CheckField({ ok }) {
  return ok ? <CheckCircle2 size={16} className="text-pos" /> : null
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, setSignup } = useAuth()
  const [mode, setMode] = useState('ent')
  const [step, setStep] = useState(1)
  const [f, setF] = useState({
    first: signup.first || '', last: signup.last || '', email: signup.email || '', reason: signup.reason || '',
    company: signup.company || '', title: signup.title || '', edition: signup.edition || 'ent', cloud: signup.cloud || '', region: signup.region || '', agree: false,
  })
  const [touched, setTouched] = useState({})
  const [editionInfo, setEditionInfo] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const errs = useMemo(() => {
    const e = {}
    if (!f.first.trim()) e.first = 'Vui lòng nhập tên.'
    if (!f.last.trim()) e.last = 'Vui lòng nhập họ.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Email chưa đúng định dạng.'
    else if (FREE_MAIL.test(f.email) && mode === 'ent') e.emailWarn = 'Nên dùng email công việc để đồng nghiệp dễ tham gia.'
    if (!f.reason) e.reason = 'Hãy chọn một lý do.'
    if (!f.company.trim()) e.company = 'Vui lòng nhập tên công ty.'
    if (!f.title.trim()) e.title = 'Vui lòng nhập chức danh.'
    if (!f.cloud) e.cloud = 'Hãy chọn nhà cung cấp đám mây.'
    if (!f.region) e.region = 'Hãy chọn khu vực.'
    if (!f.agree) e.agree = 'Bạn cần đồng ý với điều khoản dịch vụ.'
    return e
  }, [f, mode])
  const step1Ok = !errs.first && !errs.last && !errs.email && !errs.reason
  const step2Ok = !errs.company && !errs.title && !errs.cloud && !errs.region && !errs.agree
  const show = (k) => (touched[k] || touched._all) && errs[k]

  const next = (e) => {
    e.preventDefault()
    if (!step1Ok) { setTouched({ _all: true }); return }
    setSignup({ first: f.first.trim(), last: f.last.trim(), email: f.email.trim(), reason: f.reason, mode })
    setTouched({})
    setStep(2)
  }
  const finish = (e) => {
    e.preventDefault()
    if (!step2Ok) { setTouched({ _all: true }); return }
    setLoading(true)
    setSignup({ company: f.company.trim(), title: f.title.trim(), edition: f.edition, cloud: f.cloud, region: f.region })
    setTimeout(() => { setLoading(false); setStep(3) }, 800)
  }

  return (
    <div className="relative min-h-dvh bg-canvas overflow-x-hidden">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand-50 to-transparent" />
      <Contours opacity={0.3} />
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-16">
        <Link to="/"><Logo size={26} /></Link>
        <span className="text-[13px] text-muted">Đã có tài khoản? <Link to="/dang-nhap" className="text-brand-ink font-[600] hover:underline underline-offset-4">Đăng nhập</Link></span>
      </header>

      <div className="relative z-10 mx-auto max-w-[1120px] px-4 sm:px-6 pb-16">
        <div className="text-center pt-4 sm:pt-8">
          <h1 className="text-[30px] sm:text-[44px] font-[800] tracking-[-0.035em] leading-[1.08]">
            DỰNG NHANH HƠN VỚI <span className="text-crystal">LẠC VIỆT DATA</span>
          </h1>
          <p className="text-muted mt-2">Một nền tảng cho dữ liệu, ứng dụng và quy trình AI của bạn</p>
          <div className="inline-flex mt-5 p-1 rounded-full bg-surface border border-line shadow-xs">
            {[['ent', 'Đám mây dữ liệu AI', 'Cho doanh nghiệp'], ['dev', 'Tinh Ý Code', 'Cho lập trình viên']].map(([v, a, b]) => (
              <button key={v} onClick={() => setMode(v)} className={cn('px-3 sm:px-4 h-9 rounded-full text-[12.5px] sm:text-[13px] transition-colors', mode === v ? 'bg-brand-500 text-white shadow-sm' : 'text-muted hover:text-fg')}>
                <b className="font-[650]">{a}</b> <span className={cn('hidden sm:inline', mode === v ? 'opacity-80' : 'text-faint')}>{b}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 sm:mt-12 grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-start">
          {/* Cột giới thiệu */}
          <section className="order-2 lg:order-1 lg:pt-6">
            <h2 className="text-[22px] font-[700] tracking-tight">{mode === 'ent' ? 'Hệ thống Dữ liệu & AI Lạc Việt' : 'Tinh Ý Code'}</h2>
            <p className="text-muted mt-1">{mode === 'ent' ? 'Dựng AI và ứng dụng chuẩn doanh nghiệp trên dữ liệu của bạn chỉ trong vài phút' : 'Trợ lý lập trình hiểu dữ liệu của bạn, nói tiếng Việt'}</p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {BENEFITS[mode].map((b) => (
                <li key={b} className="flex gap-3 text-[14px]">
                  <span className="mt-0.5 size-5 shrink-0 rounded-full bg-brand-500 text-white grid place-items-center"><Check size={12} strokeWidth={3} /></span>
                  <span className="text-dim">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[460px]">
              {[[ShieldCheck, 'Mã hoá đầu cuối'], [Zap, 'Tạo tài khoản < 1 phút'], [Database, 'Có sẵn dữ liệu mẫu']].map(([Icon, t]) => (
                <div key={t} className="rounded-xl bg-surface/80 border border-line px-3 py-3 text-center">
                  <Icon size={18} className="mx-auto text-brand-ink" />
                  <div className="text-[12px] text-dim mt-1.5 leading-snug">{t}</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[17px] font-[700] text-crystal">Dùng thử 30 ngày với 10 triệu đồng tín dụng</p>
            <p className="ds-caption mt-1">Không cần thẻ thanh toán. Hết thời gian dùng thử, tài khoản tự tạm dừng — không phát sinh phí.</p>
          </section>

          {/* Thẻ đăng ký */}
          <section className="order-1 lg:order-2 card shadow-lg p-6 sm:p-7 animate-pop-in">
            {step === 3 ? (
              <div className="text-center py-2">
                <span className="mx-auto size-14 rounded-full bg-pos-soft text-pos grid place-items-center"><MailCheck size={28} /></span>
                <h3 className="text-[20px] font-[700] mt-4">Kiểm tra hộp thư!</h3>
                <p className="text-muted text-[13.5px] mt-2">
                  Chúng tôi đã gửi email kích hoạt tới <b className="text-fg break-all">{f.email}</b>. Email có thể tới sau vài phút.
                </p>
                <Button variant="primary" size="lg" className="w-full mt-5" onClick={() => navigate('/kich-hoat')}>Mở email kích hoạt (mô phỏng)</Button>
                <div className="text-left mt-6">
                  <div className="ds-label mb-2">Trong lúc chờ, bạn có thể</div>
                  <ul className="flex flex-col gap-2">
                    {[[BookOpen, 'Bắt đầu với', 'Tài liệu hướng dẫn Lạc Việt Data'], [GraduationCap, 'Đăng ký buổi', 'Thực hành có hướng dẫn trực tuyến'], [Compass, 'Khám phá', 'Kịch bản sử dụng theo ngành tại Trung tâm giải pháp']].map(([Icon, a, b]) => (
                      <li key={b} className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5">
                        <Icon size={18} className="text-brand-ink mt-0.5 shrink-0" />
                        <span className="text-[13px] text-dim">{a} <span className="text-brand-ink font-[550]">{b}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-[17px] font-[650]">{step === 1 ? 'Tạo tài khoản Lạc Việt Data' : 'Giờ hãy thiết lập tài khoản'}</h3>
                    {step === 1 && <p className="ds-caption mt-0.5">Đã có tài khoản? <Link to="/dang-nhap" className="text-brand-ink hover:underline">Đăng nhập</Link></p>}
                  </div>
                  <span className="text-[12.5px] text-muted num shrink-0">{step}/2</span>
                </div>
                <div className="flex gap-1.5 mb-5">{[1, 2].map((s) => <span key={s} className={cn('h-1 flex-1 rounded-full transition-colors', s <= step ? 'bg-brand-500' : 'bg-line')} />)}</div>

                {step === 1 ? (
                  <form onSubmit={next} className="flex flex-col gap-4" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Họ" value={f.last} onChange={set('last')} onBlur={touch('last')} error={show('last')} autoComplete="family-name" suffix={<CheckField ok={!errs.last} />} />
                      <Input label="Tên" value={f.first} onChange={set('first')} onBlur={touch('first')} error={show('first')} autoComplete="given-name" suffix={<CheckField ok={!errs.first} />} />
                    </div>
                    <Input label="Email công việc" type="email" value={f.email} onChange={set('email')} onBlur={touch('email')} autoComplete="email"
                      error={show('email')} hint={!errs.email && errs.emailWarn} suffix={<CheckField ok={!errs.email} />} placeholder="ten@congty.vn" />
                    <Select label="Vì sao bạn đăng ký?" value={f.reason} onChange={(e) => { set('reason')(e); touch('reason')() }} options={REASONS} placeholder="Chọn một lý do" error={show('reason')} />
                    <p className="text-[11.5px] text-faint leading-relaxed">Khi bấm nút bên dưới, bạn hiểu rằng Lạc Việt Data sẽ xử lý thông tin cá nhân của bạn theo Chính sách quyền riêng tư (bản demo — không gửi dữ liệu đi đâu cả).</p>
                    <Button type="submit" variant="primary" size="lg" className="w-full">Tiếp tục</Button>
                  </form>
                ) : (
                  <form onSubmit={finish} className="flex flex-col gap-4" noValidate>
                    <Input label="Tên công ty" value={f.company} onChange={set('company')} onBlur={touch('company')} error={show('company')} autoFocus suffix={<CheckField ok={!errs.company} />} placeholder="vd: Công ty CP Phố Núi" />
                    <Input label="Chức danh" value={f.title} onChange={set('title')} onBlur={touch('title')} error={show('title')} suffix={<CheckField ok={!errs.title} />} placeholder="vd: Chuyên viên phân tích dữ liệu" />
                    <Select label="Chọn phiên bản" value={f.edition} onChange={set('edition')}
                      options={EDITIONS.map((e) => ({ value: e.id, label: `${e.name}${e.popular ? ' (phổ biến nhất)' : ''}` }))}
                      hint={<button type="button" onClick={() => setEditionInfo(true)} className="text-brand-ink hover:underline">Tìm hiểu thêm về các phiên bản</button>} />
                    <div>
                      <div className="text-[13px] font-[550] text-dim mb-1.5">Chọn nhà cung cấp đám mây</div>
                      <p className="ds-caption mb-2">Lạc Việt Data chạy trên hạ tầng đám mây bạn chọn, kể cả khi bạn đang dùng một nhà cung cấp khác.</p>
                      <div className="grid grid-cols-3 gap-2">
                        {CLOUDS.map((c) => {
                          const on = f.cloud === c.id
                          return (
                            <button type="button" key={c.id} onClick={() => { setF((x) => ({ ...x, cloud: c.id, region: x.region || 'hcm-1' })) }}
                              className={cn('relative rounded-xl border-2 px-2 pt-3 pb-2.5 text-center transition-colors', on ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-line-strong')}>
                              {on && <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-brand-500 text-white grid place-items-center"><Check size={10} strokeWidth={3.5} /></span>}
                              <span className="mx-auto size-10 rounded-xl grid place-items-center text-white" style={{ background: c.color }}><Cloud size={20} /></span>
                              <span className="block text-[12px] font-[600] mt-2 leading-tight">{c.name}</span>
                            </button>
                          )
                        })}
                      </div>
                      {show('cloud') && <p className="text-[12.5px] text-neg mt-1.5">{errs.cloud}</p>}
                    </div>
                    <Select label="Khu vực" value={f.region} onChange={set('region')} placeholder="Chọn khu vực" error={show('region')}
                      options={REGIONS.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))} />
                    <div>
                      <Checkbox checked={f.agree} onChange={(v) => setF((x) => ({ ...x, agree: v }))}
                        label={<span className="text-[13px]">Tôi đã đọc và đồng ý với <span className="text-brand-ink">Điều khoản dịch vụ Lạc Việt Data</span></span>} />
                      {show('agree') && <p className="text-[12.5px] text-neg mt-1">{errs.agree}</p>}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="secondary" size="lg" icon={ChevronLeft} onClick={() => setStep(1)}>Quay lại</Button>
                      <Button type="submit" variant="primary" size="lg" className="flex-1" loading={loading} icon={Sparkles}>Bắt đầu dùng thử</Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <Modal open={editionInfo} onClose={() => setEditionInfo(false)} title="So sánh các phiên bản" size="lg">
        <div className="grid sm:grid-cols-3 gap-3">
          {EDITIONS.map((e) => (
            <div key={e.id} className={cn('rounded-xl border p-4', e.popular ? 'border-brand-400 bg-brand-50' : 'border-line')}>
              <div className="font-[650]">{e.name}</div>
              <div className="text-[20px] font-[750] num mt-1">{formatNumber(e.price)} ₫<span className="text-[12px] font-normal text-muted"> / tín dụng</span></div>
              <p className="ds-caption mt-1">{e.desc}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {e.features.map((x) => <li key={x} className="flex gap-2 text-[12.5px]"><Check size={14} className="text-pos shrink-0 mt-0.5" />{x}</li>)}
              </ul>
              <Button size="sm" variant={f.edition === e.id ? 'primary' : 'outline'} className="w-full mt-4" onClick={() => { setF((x) => ({ ...x, edition: e.id })); setEditionInfo(false) }}>
                {f.edition === e.id ? 'Đang chọn' : 'Chọn phiên bản này'}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
      <Toaster />
    </div>
  )
}
