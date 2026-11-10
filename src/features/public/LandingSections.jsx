/* Các khu vực của trang giới thiệu Lạc Việt Data */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, MessageSquareText, Bot, Sparkles, Store, ShieldCheck, Coins, Check, Plus, Minus, Lock, KeyRound,
  EyeOff, ScrollText, MapPin, ShoppingBag, Landmark, Truck, GraduationCap, ArrowRight, Plug, Wand2, Share2,
  CalendarDays, CloudSun, Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'
import { LogoMark, Logo } from '@/components/brand/Logo'
import { EDITIONS, SIZES } from '@/data/platform'
import { formatNumber, formatCompact } from '@/lib/format'
import { SqlCode } from './SqlCode'

export function SectionTitle({ eyebrow, title, desc, center = true, className }) {
  return (
    <div className={cn(center && 'text-center mx-auto', 'max-w-[760px]', className)}>
      {eyebrow && <div className="text-[12.5px] font-[700] tracking-[.14em] uppercase text-brand-ink">{eyebrow}</div>}
      <h2 className="text-[28px] sm:text-[40px] font-[800] tracking-[-0.035em] leading-[1.1] mt-2">{title}</h2>
      {desc && <p className="text-muted text-[15px] sm:text-[16.5px] mt-3 leading-relaxed">{desc}</p>}
    </div>
  )
}

/* ---------------- Dải số liệu của bản demo (đúng sự thật) ---------------- */
export function DemoFacts() {
  const facts = [
    ['~14.000', 'đơn hàng mẫu chạy được ngay'],
    ['8', 'bảng dữ liệu của chuỗi Phố Núi'],
    ['6', 'hàm AI xử lý tiếng Việt trong SQL'],
    ['0', 'dòng cài đặt — mở trình duyệt là dùng'],
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-line bg-line">
      {facts.map(([n, l]) => (
        <div key={l} className="bg-surface px-5 py-5 sm:py-6">
          <div className="text-[28px] sm:text-[34px] font-[800] tracking-[-0.03em] text-crystal num">{n}</div>
          <div className="text-[13px] text-muted mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- Lưới tính năng (bento) ---------------- */
function Card({ icon: Icon, title, desc, children, className, tone = 'brand' }) {
  return (
    <div className={cn('group relative card p-5 sm:p-6 overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md flex flex-col', className)}>
      <span className={cn('size-10 rounded-xl grid place-items-center', tone === 'ice' ? 'bg-ice-soft text-ice' : 'bg-brand-50 text-brand-ink')}><Icon size={20} /></span>
      <h3 className="text-[17px] font-[700] tracking-tight mt-4">{title}</h3>
      <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed">{desc}</p>
      {children && <div className="mt-5 flex-1 flex flex-col justify-end">{children}</div>}
    </div>
  )
}

export function FeatureGrid() {
  const bars = [32, 44, 38, 52, 47, 61, 58, 72, 66, 80, 74, 41]
  return (
    <div className="grid md:grid-cols-6 gap-4">
      <Card icon={Database} title="Kho dữ liệu & SQL" className="md:col-span-3"
        desc="Gom dữ liệu bán hàng, kế toán, marketing về một nơi. Viết SQL với gợi ý tự hoàn thành, xem thống kê từng cột, lưu lịch sử phiên bản.">
        <div className="rounded-xl border border-line bg-[var(--c-code-bg)] px-4 py-3">
          <SqlCode sql={"SELECT TINH_THANH, SUM(TONG_TIEN) AS DOANH_THU\nFROM DON_HANG d JOIN CUA_HANG c USING (MA_CH)\nGROUP BY 1 ORDER BY 2 DESC;"} />
        </div>
      </Card>
      <Card icon={MessageSquareText} title="Hỏi dữ liệu bằng tiếng Việt" className="md:col-span-3" tone="ice"
        desc="Người không biết SQL cũng tự lấy được số liệu: hỏi như nói chuyện, Tinh Ý viết truy vấn, chạy và vẽ biểu đồ.">
        <div className="flex flex-col gap-2">
          <div className="self-end rounded-2xl rounded-br-md bg-brand-500 text-white px-3.5 py-2 text-[13px]">Tháng 10 cửa hàng nào bán tốt nhất?</div>
          <div className="self-start flex gap-2 items-start max-w-[92%]">
            <LogoMark size={22} />
            <div className="rounded-2xl rounded-tl-md bg-subtle px-3.5 py-2 text-[13px] text-dim">Phố Núi Bến Thành dẫn đầu, tiếp theo là Thảo Điền và Hồ Gươm. Mình đã vẽ biểu đồ xếp hạng 20 cửa hàng.</div>
          </div>
        </div>
      </Card>
      <Card icon={Bot} title="Tác tử AI" className="md:col-span-2"
        desc="Dựng trợ lý riêng cho quản lý cửa hàng, kế toán, chăm sóc khách hàng — chỉ đọc đúng dữ liệu được cấp quyền.">
        <div className="flex flex-wrap gap-1.5">
          {['Hỏi dữ liệu bán hàng', 'Tìm trong đánh giá', 'Gửi báo cáo tuần'].map((t) => <span key={t} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-dim">{t}</span>)}
        </div>
      </Card>
      <Card icon={Sparkles} title="Hàm AI ngay trong SQL" className="md:col-span-2" tone="ice"
        desc="Đọc cảm xúc, phân loại chủ đề, trích thông tin từ văn bản tiếng Việt chỉ bằng một hàm.">
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          {[['“Cà phê muối ngon tuyệt, sẽ quay lại”', 'Tích cực', 'pos'], ['“Chờ hơn 30 phút mới có nước”', 'Tiêu cực', 'neg'], ['“Đồ uống ổn, chưa ấn tượng”', 'Trung tính', 'neutral']].map(([t, l, c]) => (
            <div key={t} className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-2.5 py-1.5">
              <span className="truncate text-dim">{t}</span>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-[650]', c === 'pos' ? 'bg-pos-soft text-pos' : c === 'neg' ? 'bg-neg-soft text-neg' : 'bg-hover text-muted')}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card icon={Store} title="Chợ dữ liệu" className="md:col-span-2"
        desc="Bổ sung ngày lễ, thời tiết, tỷ giá… vào phân tích chỉ với một cú bấm, không cần sao chép tệp.">
        <div className="flex flex-col gap-1.5">
          {[[CalendarDays, 'Ngày lễ & sự kiện Việt Nam 2026', 'Miễn phí'], [CloudSun, 'Thời tiết theo tháng', 'Dùng thử']].map(([I, t, p]) => (
            <div key={t} className="flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2 text-[12.5px]">
              <I size={15} className="text-brand-ink shrink-0" /><span className="flex-1 truncate">{t}</span><span className="text-pos font-[600] shrink-0">{p}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card icon={ShieldCheck} title="Quản trị & bảo mật" className="md:col-span-3"
        desc="Phân quyền theo vai trò tới từng bảng, che số điện thoại và email với người không đủ quyền, theo dõi ai đã truy vấn gì.">
        <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
          {[['QUAN_TRI', 'Toàn quyền'], ['PHAN_TICH', 'Đọc bán hàng'], ['MARKETING', 'Đã che PII']].map(([r, d]) => (
            <div key={r} className="rounded-lg bg-subtle px-2 py-2.5"><div className="font-mono font-[600] text-[11.5px] truncate">{r}</div><div className="text-muted mt-0.5">{d}</div></div>
          ))}
        </div>
      </Card>
      <Card icon={Coins} title="Kiểm soát chi phí" className="md:col-span-3" tone="ice"
        desc="Kho tính toán tự tạm dừng khi rảnh, đặt ngân sách theo tháng và cảnh báo trước khi vượt hạn mức.">
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((h, i) => (
            <span key={i} className={cn('flex-1 rounded-t-md transition-[height] duration-700', i === bars.length - 1 ? 'bg-ice' : 'bg-brand-400/70')} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-[11.5px] text-faint mt-1.5"><span>Tháng 11</span><span>Ngân sách: 180 tín dụng</span></div>
      </Card>
    </div>
  )
}

/* ---------------- Cách hoạt động ---------------- */
export function HowItWorks() {
  const steps = [
    [Plug, 'Kết nối dữ liệu', 'Tải tệp CSV, kéo dữ liệu từ phần mềm bán hàng, kế toán hoặc nhận dữ liệu từ Chợ dữ liệu.'],
    [Wand2, 'Hỏi và dựng', 'Hỏi bằng tiếng Việt hoặc viết SQL. Dựng tác tử AI, ứng dụng dữ liệu, tác vụ chạy định kỳ.'],
    [Share2, 'Chia sẻ và tự động hoá', 'Cấp quyền theo vai trò, chia sẻ bảng cho đối tác, gửi báo cáo tự động mỗi sáng.'],
  ]
  return (
    <div className="grid md:grid-cols-3 gap-4 relative">
      {steps.map(([Icon, t, d], i) => (
        <div key={t} className="relative rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <span className="size-11 rounded-2xl bg-crystal text-white grid place-items-center shadow-sm"><Icon size={20} /></span>
            <span className="text-[13px] font-[700] text-faint num">0{i + 1}</span>
          </div>
          <h3 className="text-[17px] font-[700] mt-4">{t}</h3>
          <p className="text-[13.5px] text-muted mt-1.5 leading-relaxed">{d}</p>
          {i < 2 && <ArrowRight size={18} className="hidden md:block absolute -right-[13px] top-1/2 -translate-y-1/2 text-line-strong bg-canvas rounded-full z-10" />}
        </div>
      ))}
    </div>
  )
}

/* ---------------- Theo ngành ---------------- */
const INDUSTRIES = [
  { id: 'retail', icon: ShoppingBag, name: 'Bán lẻ & F&B', lead: 'Theo dõi doanh thu từng cửa hàng theo giờ, hiểu khách thân thiết và phản hồi đánh giá trước khi lan rộng.',
    qs: ['Hôm qua cửa hàng nào bán tốt nhất?', 'Món nào đang giảm doanh số so với tháng trước?', 'Khách hạng Vàng nào lâu chưa quay lại?', 'Khách phàn nàn gì nhiều nhất tuần này?'],
    kpi: [['Doanh thu hôm nay', '41,8 tr ₫'], ['Đơn trung bình', '91.789 ₫'], ['Đánh giá tiêu cực', '−18%']], demo: true },
  { id: 'finance', icon: Landmark, name: 'Tài chính', lead: 'Hợp nhất số liệu nhiều chi nhánh, dựng báo cáo quản trị tự động và phát hiện giao dịch bất thường.',
    qs: ['Chi phí vận hành quý 3 tăng ở khoản mục nào?', 'Chi nhánh nào có công nợ quá hạn trên 60 ngày?', 'Liệt kê giao dịch lệch hơn 3 lần mức trung bình', 'Dự báo dòng tiền 4 tuần tới'],
    kpi: [['Báo cáo tự động', 'Mỗi 6:00'], ['Thời gian chốt sổ', '−2 ngày'], ['Cảnh báo bất thường', '3 mục']] },
  { id: 'logistics', icon: Truck, name: 'Logistics', lead: 'Theo dõi đơn giao, tỷ lệ giao trễ theo tuyến và tồn kho theo kho hàng trên một bảng điều khiển.',
    qs: ['Tuyến nào có tỷ lệ giao trễ cao nhất tuần qua?', 'Kho nào sắp hết hàng trong 7 ngày tới?', 'Thời gian giao trung bình theo tỉnh', 'Tài xế nào hoàn thành nhiều đơn nhất?'],
    kpi: [['Đơn đúng hẹn', '96,4%'], ['Tồn kho cảnh báo', '12 mã'], ['Tuyến cần xem', '4 tuyến']] },
  { id: 'edu', icon: GraduationCap, name: 'Giáo dục', lead: 'Phân tích kết quả học tập, tỷ lệ chuyên cần và hiệu quả tuyển sinh theo từng kênh.',
    qs: ['Lớp nào có điểm trung bình môn Toán giảm?', 'Học viên nào nghỉ quá 3 buổi tháng này?', 'Kênh tuyển sinh nào có chi phí thấp nhất?', 'Tóm tắt góp ý của phụ huynh học kỳ này'],
    kpi: [['Chuyên cần', '93%'], ['Học viên mới', '+214'], ['Góp ý cần xử lý', '9']] },
]

export function Industries() {
  const [tab, setTab] = useState('retail')
  const it = INDUSTRIES.find((x) => x.id === tab)
  return (
    <div className="rounded-3xl border border-line bg-surface shadow-sm overflow-hidden">
      <div className="flex overflow-x-auto no-scrollbar border-b border-line">
        {INDUSTRIES.map((x) => {
          const Icon = x.icon
          return (
            <button key={x.id} onClick={() => setTab(x.id)}
              className={cn('flex-1 min-w-[150px] flex items-center justify-center gap-2 h-14 text-[14px] font-[600] border-b-2 -mb-px transition-colors', tab === x.id ? 'border-brand-500 text-brand-ink bg-brand-50/50' : 'border-transparent text-muted hover:text-fg')}>
              <Icon size={17} />{x.name}
            </button>
          )
        })}
      </div>
      <div key={tab} className="grid lg:grid-cols-[1.1fr_1fr] gap-8 p-6 sm:p-8 animate-fade-in">
        <div>
          <p className="text-[16px] text-dim leading-relaxed">{it.lead}</p>
          <div className="mt-5 ds-label">Câu hỏi bạn có thể đặt</div>
          <ul className="mt-2 flex flex-col gap-2">
            {it.qs.map((q) => (
              <li key={q} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-[14px]">
                <MessageSquareText size={16} className="text-brand-ink shrink-0" />{q}
              </li>
            ))}
          </ul>
          {it.demo
            ? <Button variant="primary" className="mt-5" to={`/ai/hoi-du-lieu?demo=1&q=${encodeURIComponent('Doanh thu theo tháng của các cửa hàng ở Hà Nội')}`} iconRight={ArrowRight}>Thử với dữ liệu Phố Núi</Button>
            : <p className="ds-caption mt-4">Kịch bản minh hoạ. Bản demo hiện có sẵn dữ liệu mẫu ngành bán lẻ & F&B.</p>}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-ice-soft p-5 sm:p-6 border border-line">
          <div className="flex items-center gap-2 text-[13px] font-[650]"><Zap size={15} className="text-brand-ink" />Bảng điều khiển mẫu · {it.name}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 mt-4">
            {it.kpi.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface border border-line px-4 py-3">
                <div className="text-[12px] text-muted">{k}</div>
                <div className="text-[20px] font-[750] tracking-tight num mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-surface border border-line p-4">
            <div className="flex items-end gap-1 h-24">
              {Array.from({ length: 16 }, (_, i) => 30 + ((i * 37 + it.id.length * 13) % 60)).map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-ice opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-[11.5px] text-faint mt-2">Số liệu minh hoạ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bảo mật ---------------- */
export function SecurityStrip() {
  const items = [
    [Lock, 'Mã hoá mọi lúc', 'Dữ liệu được mã hoá khi lưu trữ và khi truyền đi.'],
    [KeyRound, 'Xác thực đa yếu tố', 'Ứng dụng xác thực, khoá bảo mật, mã truy cập có hạn dùng.'],
    [EyeOff, 'Che dữ liệu nhạy cảm', 'Tự động che số điện thoại, email theo vai trò người xem.'],
    [ScrollText, 'Nhật ký truy cập', 'Biết ai đã truy vấn bảng nào, lúc nào, từ đâu.'],
    [MapPin, 'Chọn nơi đặt dữ liệu', 'Hà Nội, TP. Hồ Chí Minh, Đà Nẵng hoặc Singapore.'],
  ]
  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#121130] text-white px-6 sm:px-10 py-10 sm:py-14">
      <div className="absolute -right-24 -top-24 size-[380px] rounded-full bg-[#5b46e5] opacity-30 blur-3xl" />
      <div className="absolute -left-20 -bottom-28 size-[320px] rounded-full bg-[#0fb5c9] opacity-20 blur-3xl" />
      <div className="relative grid lg:grid-cols-[1fr_1.6fr] gap-10 items-start">
        <div>
          <div className="text-[12.5px] font-[700] tracking-[.14em] uppercase text-[#8fe8f2]">Quản trị & bảo mật</div>
          <h2 className="text-[28px] sm:text-[36px] font-[800] tracking-[-0.03em] leading-[1.12] mt-2">Dữ liệu của bạn, quyền kiểm soát của bạn</h2>
          <p className="text-white/70 mt-3 leading-relaxed">AI chỉ đọc đúng phần dữ liệu mà vai trò của người hỏi được phép xem. Mọi câu trả lời đều kèm câu SQL để kiểm tra lại.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl bg-white/[.06] border border-white/10 p-4 backdrop-blur">
              <Icon size={19} className="text-[#8fe8f2]" />
              <div className="font-[650] mt-2.5">{t}</div>
              <div className="text-[13px] text-white/65 mt-1 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Bảng giá + ước tính chi phí ---------------- */
export function Pricing({ onContact }) {
  const [edition, setEdition] = useState('ent')
  const [size, setSize] = useState('X-Small')
  const [hours, setHours] = useState(4)
  const [days, setDays] = useState(22)
  const price = EDITIONS.find((e) => e.id === edition).price
  const credits = SIZES.find((s) => s.id === size).credits
  const monthly = useMemo(() => credits * hours * days * price + 520000 * 0.2, [credits, hours, days, price])
  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-3 gap-4">
        {EDITIONS.map((e) => (
          <div key={e.id} className={cn('relative rounded-3xl border p-6 flex flex-col', e.popular ? 'border-brand-400 bg-surface shadow-md ring-4 ring-brand-100' : 'border-line bg-surface')}>
            {e.popular && <span className="absolute -top-3 left-6 rounded-full bg-crystal text-white text-[11.5px] font-[700] px-3 h-6 inline-flex items-center">Phổ biến</span>}
            <div className="text-[17px] font-[700]">{e.name}</div>
            <p className="ds-caption mt-1 min-h-[38px]">{e.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[34px] font-[800] tracking-[-0.03em] num">{formatNumber(e.price)}</span>
              <span className="text-muted text-[14px]">₫ / tín dụng</span>
            </div>
            <ul className="mt-4 flex flex-col gap-2 flex-1">
              {e.features.map((f) => <li key={f} className="flex gap-2 text-[13.5px]"><Check size={16} className="text-pos shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <Button variant={e.popular ? 'primary' : 'outline'} size="lg" className="mt-6 w-full" to="/dang-ky">Dùng thử 30 ngày</Button>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 grid lg:grid-cols-[1.3fr_1fr] gap-8">
        <div>
          <div className="text-[17px] font-[700]">Ước tính chi phí hằng tháng</div>
          <p className="ds-caption mt-1">Kho tính toán chỉ tính tiền khi đang chạy (theo giây) và tự tạm dừng khi rảnh.</p>
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <div className="text-[13px] font-[550] text-dim mb-2">Phiên bản</div>
              <div className="flex flex-wrap gap-1.5">
                {EDITIONS.map((e) => <button key={e.id} onClick={() => setEdition(e.id)} className={cn('h-9 px-3.5 rounded-lg text-[13px] border', edition === e.id ? 'border-brand-500 bg-brand-50 text-brand-ink font-[650]' : 'border-line text-dim hover:border-line-strong')}>{e.name}</button>)}
              </div>
            </div>
            <div>
              <div className="text-[13px] font-[550] text-dim mb-2">Cỡ kho tính toán</div>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.slice(0, 5).map((s) => <button key={s.id} onClick={() => setSize(s.id)} className={cn('h-9 px-3 rounded-lg text-[13px] border', size === s.id ? 'border-brand-500 bg-brand-50 text-brand-ink font-[650]' : 'border-line text-dim hover:border-line-strong')}>{s.id} <span className="text-faint">· {s.credits}/giờ</span></button>)}
              </div>
            </div>
            <label className="block">
              <div className="flex justify-between text-[13px]"><span className="font-[550] text-dim">Số giờ chạy mỗi ngày</span><b className="num">{hours} giờ</b></div>
              <input type="range" min={1} max={24} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full mt-2 accent-[var(--c-brand-500)]" />
            </label>
            <label className="block">
              <div className="flex justify-between text-[13px]"><span className="font-[550] text-dim">Số ngày làm việc mỗi tháng</span><b className="num">{days} ngày</b></div>
              <input type="range" min={1} max={31} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full mt-2 accent-[var(--c-brand-500)]" />
            </label>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-[#2a8fd6] text-white p-6 flex flex-col">
          <div className="text-white/80 text-[13px]">Chi phí ước tính</div>
          <div className="text-[40px] font-[800] tracking-[-0.03em] num leading-tight mt-1">{formatCompact(monthly)} ₫</div>
          <div className="text-white/80 text-[13px]">mỗi tháng</div>
          <div className="mt-5 flex flex-col gap-2 text-[13px] text-white/85">
            <div className="flex justify-between"><span>Tính toán</span><span className="num">{formatNumber(credits * hours * days)} tín dụng</span></div>
            <div className="flex justify-between"><span>Đơn giá</span><span className="num">{formatNumber(price)} ₫ / tín dụng</span></div>
            <div className="flex justify-between"><span>Lưu trữ (200 GB)</span><span className="num">{formatNumber(104000)} ₫</span></div>
          </div>
          <div className="mt-auto pt-6 grid gap-2">
            <Button variant="inverse" className="bg-white text-[#14152b] hover:opacity-95" to="/dang-ky">Bắt đầu với 10 triệu đồng tín dụng</Button>
            <button onClick={onContact} className="text-[13px] text-white/85 hover:text-white underline underline-offset-4">Cần báo giá cho doanh nghiệp lớn?</button>
          </div>
        </div>
      </div>
      <p className="text-center ds-caption">Giá trong bản demo chỉ mang tính minh hoạ.</p>
    </div>
  )
}

/* ---------------- Hỏi đáp ---------------- */
const FAQ = [
  ['Lạc Việt Data là gì?', 'Lạc Việt Data (Hệ thống Dữ liệu Lạc Việt) là nền tảng dữ liệu và AI trên đám mây: bạn đưa dữ liệu về một nơi, truy vấn bằng SQL hoặc hỏi bằng tiếng Việt, dựng tác tử AI, ứng dụng dữ liệu và chia sẻ an toàn cho đồng nghiệp, đối tác.'],
  ['Tôi không biết SQL thì có dùng được không?', 'Có. Tính năng Hỏi dữ liệu cho phép bạn đặt câu hỏi như nói chuyện. Trợ lý Tinh Ý tự viết SQL, chạy và vẽ biểu đồ; bạn luôn xem được câu SQL để kiểm tra.'],
  ['Bản demo này có chạy thật không?', 'Có. Khung “Hỏi dữ liệu” ở đầu trang và trình soạn SQL trong ứng dụng chạy một cơ sở dữ liệu thật (SQLite biên dịch sang WebAssembly) ngay trên trình duyệt của bạn, với khoảng 14.000 đơn hàng mẫu. Dữ liệu không được gửi đi đâu.'],
  ['Dữ liệu được lưu ở đâu?', 'Bạn chọn khu vực khi tạo tài khoản: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng hoặc Singapore. Dữ liệu được mã hoá khi lưu trữ và khi truyền.'],
  ['Tính phí như thế nào?', 'Bạn trả theo tín dụng tính toán dùng thực tế (tính theo giây khi kho tính toán đang chạy) cộng dung lượng lưu trữ. Không có phí cố định, có thể đặt ngân sách và hạn mức để tránh phát sinh.'],
  ['Hết thời gian dùng thử thì sao?', 'Tài khoản tự tạm dừng, không phát sinh phí. Bạn có thể nâng cấp bất cứ lúc nào để giữ nguyên dữ liệu và cấu hình.'],
]
export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="max-w-[820px] mx-auto flex flex-col gap-2.5">
      {FAQ.map(([q, a], i) => (
        <div key={q} className={cn('rounded-2xl border bg-surface transition-colors', open === i ? 'border-brand-200' : 'border-line')}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
            <span className="font-[650] text-[15px]">{q}</span>
            <span className={cn('size-7 shrink-0 rounded-full grid place-items-center transition-colors', open === i ? 'bg-brand-500 text-white' : 'bg-subtle text-muted')}>{open === i ? <Minus size={15} /> : <Plus size={15} />}</span>
          </button>
          {open === i && <p className="px-5 pb-5 -mt-1 text-muted text-[14px] leading-relaxed animate-fade-in">{a}</p>}
        </div>
      ))}
    </div>
  )
}

/* ---------------- Chân trang ---------------- */
export function Footer() {
  const cols = [
    ['Sản phẩm', [['Kho dữ liệu & SQL', '#nen-tang'], ['Hỏi dữ liệu', '#demo'], ['Tác tử AI', '#nen-tang'], ['Chợ dữ liệu', '#nen-tang'], ['Bảng giá', '#bang-gia']]],
    ['Giải pháp', [['Bán lẻ & F&B', '#nganh'], ['Tài chính', '#nganh'], ['Logistics', '#nganh'], ['Giáo dục', '#nganh']]],
    ['Bắt đầu', [['Dùng thử miễn phí', '/dang-ky'], ['Đăng nhập', '/dang-nhap'], ['Xem bản demo', '/trang-chu?demo=1'], ['Câu hỏi thường gặp', '#hoi-dap']]],
  ]
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo size={28} />
          <p className="text-muted text-[13.5px] mt-3 max-w-[300px] leading-relaxed">Hệ thống Dữ liệu Lạc Việt — dữ liệu & AI cho doanh nghiệp Việt. Hỏi mọi thứ, dựng mọi thứ trên dữ liệu của bạn.</p>
        </div>
        {cols.map(([t, links]) => (
          <div key={t}>
            <div className="font-[650] text-[13.5px]">{t}</div>
            <ul className="mt-3 flex flex-col gap-2">
              {links.map(([l, h]) => (
                <li key={l}>{h.startsWith('/') ? <Link to={h} className="text-[13.5px] text-muted hover:text-fg">{l}</Link> : <a href={h} className="text-[13.5px] text-muted hover:text-fg">{l}</a>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[12.5px] text-muted">
          <p className="max-w-[760px] leading-relaxed">
            Bản demo giao diện do <a href="https://ntahientech.com" target="_blank" rel="noreferrer" className="text-brand-ink font-[600] hover:underline">Ntahien Tech</a> (ntahientech.com) thiết kế và lập trình. Lạc Việt Data, Phố Núi và các nhà cung cấp đám mây trong bản demo đều là tên hư cấu, không liên quan tới doanh nghiệp nào trùng tên; dữ liệu là dữ liệu mô phỏng.
          </p>
          <span className="shrink-0">© 2026 Lạc Việt Data (demo)</span>
        </div>
      </div>
    </footer>
  )
}
