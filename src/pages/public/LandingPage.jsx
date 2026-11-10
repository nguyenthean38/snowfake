import { useEffect, useState } from 'react'
import { MessageSquareText, Hammer, ArrowRight, PlayCircle, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Toaster } from '@/components/ui'
import { Contours } from '@/features/public/Contours'
import { PublicNav, ContactModal } from '@/features/public/PublicNav'
import { LiveDemo } from '@/features/public/LiveDemo'
import { SectionTitle, DemoFacts, FeatureGrid, HowItWorks, Industries, SecurityStrip, Pricing, Faq, Footer } from '@/features/public/LandingSections'

const MODES = {
  hoi: { lead: 'Hỏi mọi thứ bằng tiếng Việt với Tinh Ý.', rest: 'Dựng mọi thứ trên dữ liệu của bạn.' },
  dung: { lead: 'Dựng mọi thứ trên dữ liệu của bạn.', rest: 'Hỏi mọi thứ bằng tiếng Việt với Tinh Ý.' },
}

/** Cặp chữ khổng lồ HỎI ⇄ DỰNG với công tắc trượt ở giữa */
function HeroWords({ mode, onToggle }) {
  const on = mode === 'hoi'
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 select-none">
      <button onClick={() => onToggle('hoi')} className={cn('ds-display transition-all duration-700', on ? 'text-crystal scale-100' : 'text-[#c3c6d6] dark:text-[#3a3d5c] scale-[.94]')} aria-label="Chế độ Hỏi">HỎI</button>
      <button onClick={() => onToggle(on ? 'dung' : 'hoi')} aria-label="Đổi chế độ"
        className="relative shrink-0 h-[44px] w-[84px] sm:h-[64px] sm:w-[124px] rounded-full bg-surface border border-line shadow-md">
        <span className={cn('absolute top-1/2 -translate-y-1/2 size-[36px] sm:size-[52px] rounded-full grid place-items-center text-white shadow-[0_6px_20px_-4px_rgba(91,70,229,.6)] transition-all duration-700 ease-[cubic-bezier(.65,0,.35,1)]',
          on ? 'left-[4px] sm:left-[6px] bg-brand-500' : 'left-[calc(100%-40px)] sm:left-[calc(100%-58px)] bg-ice')}>
          {on ? <MessageSquareText className="size-[18px] sm:size-[24px]" /> : <Hammer className="size-[18px] sm:size-[24px]" />}
        </span>
        <span className={cn('absolute top-1/2 -translate-y-1/2 transition-opacity duration-500 text-faint', on ? 'right-3 sm:right-5 opacity-100' : 'left-3 sm:left-5 opacity-100')}>
          {on ? <Hammer className="size-[15px] sm:size-[20px]" /> : <MessageSquareText className="size-[15px] sm:size-[20px]" />}
        </span>
      </button>
      <button onClick={() => onToggle('dung')} className={cn('ds-display transition-all duration-700', !on ? 'text-crystal scale-100' : 'text-[#c3c6d6] dark:text-[#3a3d5c] scale-[.94]')} aria-label="Chế độ Dựng">DỰNG</button>
    </div>
  )
}

export default function LandingPage() {
  const [mode, setMode] = useState('hoi')
  const [auto, setAuto] = useState(true)
  const [contact, setContact] = useState(false)
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setMode((m) => (m === 'hoi' ? 'dung' : 'hoi')), 3400)
    return () => clearInterval(t)
  }, [auto])
  useEffect(() => { document.title = 'Lạc Việt Data — Hệ thống dữ liệu & AI cho doanh nghiệp Việt' }, [])
  const toggle = (m) => { setAuto(false); setMode(m) }

  return (
    <div className="min-h-dvh bg-canvas text-fg overflow-x-clip [&_section]:scroll-mt-20">
      <PublicNav />

      {/* ---------- Hero ---------- */}
      <section className="relative -mt-16 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef0ff] via-canvas to-canvas dark:from-[#16153a]" />
        <Contours />
        <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 pt-14 sm:pt-20 pb-10 text-center">
          <a href="#demo" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 backdrop-blur pl-1.5 pr-3.5 h-8 text-[12.5px] text-dim hover:border-brand-300 shadow-xs">
            <span className="rounded-full bg-crystal text-white px-2 h-5 inline-flex items-center text-[11px] font-[700]">MỚI</span>
            Hàm AI hiểu tiếng Việt chạy ngay trong SQL <ArrowRight size={13} />
          </a>
          <div className="mt-8"><HeroWords mode={mode} onToggle={toggle} /></div>
          <h1 className="mt-8 text-[26px] sm:text-[40px] font-[750] tracking-[-0.03em] leading-[1.15]">Đưa AI tới mọi dữ liệu của doanh nghiệp</h1>
          <p className="mt-3 text-[15.5px] sm:text-[18px] text-muted max-w-[640px] mx-auto leading-relaxed min-h-[56px]">
            <span key={mode} className="text-fg font-[600] animate-fade-in">{MODES[mode].lead}</span>{' '}
            {MODES[mode].rest} Một nơi duy nhất cho cả doanh nghiệp, từ kế toán tới quản lý cửa hàng.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="primary" size="lg" pill className="h-12 px-7 text-[15px] w-full sm:w-auto" to="/dang-ky" iconRight={ArrowRight}>Dùng thử miễn phí</Button>
            <Button variant="outline" size="lg" pill className="h-12 px-7 text-[15px] w-full sm:w-auto" to="/trang-chu?demo=1" icon={PlayCircle}>Xem bản demo</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-muted">
            {['Không cần thẻ thanh toán', '10 triệu đồng tín dụng dùng thử', 'Chọn nơi đặt dữ liệu tại Việt Nam'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><Check size={14} className="text-pos" />{t}</span>
            ))}
          </div>
        </div>

        {/* ---------- Bản demo chạy thật ---------- */}
        <div id="demo" className="relative mx-auto max-w-[1180px] px-4 sm:px-6 pb-16 sm:pb-24 scroll-mt-20">
          <div className="absolute inset-x-10 top-10 bottom-24 rounded-[40px] bg-gradient-to-r from-brand-400/30 to-ice/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4 text-[13px] font-[600] text-brand-ink">
              <Sparkles size={15} />Chạy thật ngay trên trình duyệt của bạn — thử hỏi một câu
            </div>
            <LiveDemo />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6"><DemoFacts /></div>

      {/* ---------- Nền tảng ---------- */}
      <section id="nen-tang" className="mx-auto max-w-[1240px] px-4 sm:px-6 py-20 sm:py-28">
        <SectionTitle eyebrow="Nền tảng" title="Nền tảng gồm những gì" desc="Từ kho dữ liệu tới tác tử AI, mọi thứ chạy trên cùng một bản dữ liệu — không sao chép, không lệch số giữa các phòng ban." />
        <div className="mt-12"><FeatureGrid /></div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionTitle eyebrow="Cách hoạt động" title="Ba bước từ dữ liệu rời rạc tới quyết định" />
        <div className="mt-10"><HowItWorks /></div>
      </section>

      {/* ---------- Theo ngành ---------- */}
      <section id="nganh" className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionTitle eyebrow="Giải pháp" title="Mỗi ngành một cách hỏi dữ liệu" desc="Những câu hỏi đội ngũ của bạn đặt ra mỗi ngày, giờ có câu trả lời trong vài giây." />
        <div className="mt-10"><Industries /></div>
      </section>

      {/* ---------- Bảo mật ---------- */}
      <section id="bao-mat" className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20 sm:pb-28">
        <SecurityStrip />
      </section>

      {/* ---------- Bảng giá ---------- */}
      <section id="bang-gia" className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionTitle eyebrow="Bảng giá" title="Trả theo mức dùng, không phí cố định" desc="Tính theo tín dụng tính toán dùng thực tế cộng dung lượng lưu trữ. Đặt ngân sách để không bao giờ bị bất ngờ." />
        <div className="mt-10"><Pricing onContact={() => setContact(true)} /></div>
      </section>

      {/* ---------- Hỏi đáp ---------- */}
      <section id="hoi-dap" className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20 sm:pb-28">
        <SectionTitle eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" />
        <div className="mt-10"><Faq /></div>
      </section>

      {/* ---------- Lời kêu gọi cuối ---------- */}
      <section className="mx-auto max-w-[1240px] px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-crystal text-white px-6 sm:px-12 py-12 sm:py-16 text-center">
          <Contours opacity={0.35} className="mix-blend-overlay" />
          <h2 className="relative text-[28px] sm:text-[42px] font-[800] tracking-[-0.035em] leading-[1.1]">Hỏi câu đầu tiên với dữ liệu của bạn hôm nay</h2>
          <p className="relative mt-3 text-white/85 max-w-[560px] mx-auto">Tạo tài khoản trong chưa đầy một phút, có sẵn dữ liệu mẫu để thử ngay.</p>
          <div className="relative mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" pill className="h-12 px-7 bg-white text-[#2a2470] hover:bg-white/90" to="/dang-ky" iconRight={ArrowRight}>Dùng thử miễn phí</Button>
            <Button size="lg" pill className="h-12 px-7 bg-white/15 text-white hover:bg-white/25 border border-white/30" onClick={() => setContact(true)}>Liên hệ tư vấn</Button>
          </div>
        </div>
      </section>

      <Footer />
      <ContactModal open={contact} onClose={() => setContact(false)} />
      <Toaster />
    </div>
  )
}
