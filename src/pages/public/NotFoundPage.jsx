import { Link } from 'react-router-dom'
import { Home, FileCode2, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { Contours } from '@/features/public/Contours'

/** Khối hình vỡ — minh hoạ cho trang 404 */
function BrokenCrystal() {
  return (
    <svg viewBox="0 0 240 200" className="w-[220px] sm:w-[260px] h-auto animate-float" aria-hidden>
      <defs>
        <linearGradient id="nf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c6cff" />
          <stop offset="1" stopColor="#22c3d6" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="186" rx="70" ry="8" fill="var(--c-line)" />
      <g transform="translate(-6 0) rotate(-8 90 100)">
        <path d="M110 20 L70 43 V96 L110 119 Z" fill="url(#nf-g)" opacity=".18" stroke="url(#nf-g)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M110 20 V119 M70 43 L110 70" stroke="url(#nf-g)" strokeWidth="1.5" opacity=".6" />
      </g>
      <g transform="translate(14 8) rotate(10 150 110)">
        <path d="M122 30 L162 53 V106 L122 129 Z" fill="url(#nf-g)" opacity=".18" stroke="url(#nf-g)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M122 30 V129 M162 53 L122 80" stroke="url(#nf-g)" strokeWidth="1.5" opacity=".6" />
      </g>
      <path d="M116 60 l-6 14 8 6 -7 16" fill="none" stroke="var(--c-neg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {[[60, 150, 5], [178, 150, 4], [96, 162, 3], [150, 168, 3.5]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} fill="url(#nf-g)" opacity=".7" />
      ))}
    </svg>
  )
}

export default function NotFoundPage() {
  return (
    <div className="relative min-h-dvh bg-canvas flex flex-col">
      <Contours opacity={0.3} />
      <header className="relative z-10 px-5 sm:px-8 h-16 flex items-center"><Link to="/"><Logo size={26} /></Link></header>
      <main className="relative z-10 flex-1 grid place-items-center px-4 py-10 text-center">
        <div className="flex flex-col items-center">
          <BrokenCrystal />
          <div className="mt-4 text-[13px] font-[650] tracking-[.2em] text-brand-ink">LỖI 404</div>
          <h1 className="text-[28px] sm:text-[36px] font-[800] tracking-[-0.03em] mt-1">Không tìm thấy trang này</h1>
          <p className="text-muted mt-2 max-w-[440px]">
            Đường dẫn có thể đã đổi hoặc không tồn tại. Giống như một câu truy vấn trỏ tới bảng chưa được tạo — thử quay lại một nơi quen thuộc nhé.
          </p>
          <div className="font-mono text-[12.5px] mt-5 rounded-xl border border-line bg-surface px-4 py-2.5 text-left max-w-full overflow-x-auto">
            <span className="text-[var(--c-code-kw)]">SELECT</span> * <span className="text-[var(--c-code-kw)]">FROM</span> TRANG_NAY;<br />
            <span className="text-neg">-- Không tìm thấy bảng 'TRANG_NAY' hoặc bạn không có quyền truy cập.</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 justify-center">
            <Button variant="primary" icon={Home} to="/">Về trang giới thiệu</Button>
            <Button variant="outline" icon={FileCode2} to="/khong-gian">Mở trình soạn SQL</Button>
            <Button variant="ghost" icon={MessageSquareText} to="/ai/hoi-du-lieu">Hỏi dữ liệu</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
