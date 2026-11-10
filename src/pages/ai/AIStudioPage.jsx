import { Link, useNavigate } from 'react-router-dom'
import {
  MessageSquareText, Search, Bot, FlaskConical, FileScan, Boxes, LineChart, Radar, Sparkles, ArrowRight, Play,
} from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Badge, Button } from '@/components/ui'
import { useApp, useUI, toast } from '@/store'

function ToolCard({ icon: Icon, title, desc, to, onClick, badge, tint = 'brand' }) {
  const navigate = useNavigate()
  const go = onClick || (() => navigate(to))
  const tints = {
    brand: 'bg-brand-50 text-brand-ink',
    ice: 'bg-ice-soft text-ice',
    gold: 'bg-gold-soft text-gold',
    pos: 'bg-pos-soft text-pos',
    neg: 'bg-neg-soft text-neg',
  }
  return (
    <div className="card p-5 flex gap-4 items-start hover:shadow-sm hover:border-line-strong transition group">
      <span className={`size-11 rounded-xl grid place-items-center shrink-0 ${tints[tint]}`}><Icon size={21} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="ds-h3">{title}</h3>
          {badge && <Badge size="sm" tone={badge === 'Mới' ? 'brand' : 'neutral'}>{badge}</Badge>}
        </div>
        <p className="ds-caption mt-1">{desc}</p>
      </div>
      <Button size="sm" variant="outline" icon={Play} onClick={go} className="shrink-0">Thử</Button>
    </div>
  )
}

export default function AIStudioPage() {
  const agents = useApp((s) => s.agents)
  const models = useApp((s) => s.models)
  const soon = (name) => () => toast({ title: `${name} sẽ có trong bản cập nhật tới`, desc: 'Bản demo tập trung vào Hỏi dữ liệu, tác tử và hàm AI.', tone: 'info' })
  return (
    <Page title="AI Studio" desc="Xây dựng ứng dụng AI ngay trên dữ liệu của bạn — dữ liệu không rời khỏi tài khoản Lạc Việt Data.">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface mb-8">
        <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(600px 220px at 85% 0%, color-mix(in srgb, var(--c-ice) 22%, transparent), transparent), radial-gradient(520px 260px at 0% 100%, color-mix(in srgb, var(--c-brand-500) 18%, transparent), transparent)' }} />
        <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <Badge tone="brand" icon={Sparkles}>Tinh Ý</Badge>
            <h2 className="text-[26px] sm:text-[30px] font-[750] tracking-[-0.03em] leading-tight mt-3">Hỏi dữ liệu bằng tiếng Việt,<br />nhận câu trả lời kèm biểu đồ.</h2>
            <p className="text-muted mt-2 max-w-xl">Tinh Ý hiểu câu hỏi về doanh thu, món bán chạy, khách hàng và đánh giá; tự viết SQL, chạy trên kho tính toán và giải thích kết quả.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="primary" icon={MessageSquareText} to="/ai/hoi-du-lieu">Bắt đầu hỏi</Button>
              <Button variant="outline" icon={Sparkles} onClick={() => useUI.getState().setAssistant(true)}>Mở ngăn Tinh Ý</Button>
            </div>
          </div>
          <div className="lg:w-[360px] shrink-0 rounded-xl border border-line bg-canvas/80 backdrop-blur p-4 text-[13px] shadow-sm">
            <div className="flex justify-end"><span className="rounded-2xl rounded-br-md bg-brand-500 text-white px-3 py-2">Món nào bán chạy nhất tháng 10?</span></div>
            <div className="mt-3 rounded-xl border border-line bg-surface p-3">
              <div className="font-[600]">Món bán chạy nhất (tháng 10/2026)</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {[['Cà phê sữa đá', 100], ['Cà phê muối', 82], ['Trà đào cam sả', 74], ['Bạc xỉu', 63]].map(([n, v]) => (
                  <div key={n} className="grid grid-cols-[110px_1fr] items-center gap-2"><span className="truncate text-dim">{n}</span><span className="h-3 rounded bg-crystal" style={{ width: `${v}%` }} /></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <div><h2 className="ds-h2">Tác tử</h2><p className="ds-caption">Trợ lý trả lời câu hỏi dựa trên dữ liệu có cấu trúc và văn bản</p></div>
          <Link to="/ai/tac-tu" className="text-[13px] font-[550] text-brand-ink hover:underline inline-flex items-center gap-1">{agents.length} tác tử <ArrowRight size={14} /></Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <ToolCard icon={MessageSquareText} title="Hỏi dữ liệu" badge="Mới" to="/ai/hoi-du-lieu" desc="Hỏi bằng tiếng Việt, Tinh Ý viết SQL và vẽ biểu đồ từ dữ liệu bán hàng." />
          <ToolCard icon={Search} tint="ice" title="Tìm kiếm ngữ nghĩa" onClick={soon('Tìm kiếm ngữ nghĩa')} desc="Tìm trong đánh giá, tài liệu nội bộ theo ý nghĩa, không chỉ theo từ khoá (mô hình SEN-EMBED-VI)." />
          <ToolCard icon={Bot} tint="gold" title="Tác tử AI" to="/ai/tac-tu" desc="Kết hợp hỏi dữ liệu, tìm kiếm và công cụ tuỳ chỉnh thành trợ lý cho từng phòng ban." />
          <ToolCard icon={FlaskConical} tint="pos" title="Đánh giá tác tử" to={agents[0] ? `/ai/tac-tu/${agents[0].id}?tab=danh-gia` : '/ai/tac-tu'} desc="Đo độ chính xác câu trả lời trên bộ câu hỏi mẫu trước khi xuất bản." />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3"><h2 className="ds-h2">Mô hình ngôn ngữ</h2><p className="ds-caption">Gọi mô hình ngay trong câu SQL hoặc qua giao diện thử nghiệm</p></div>
        <div className="grid md:grid-cols-2 gap-3">
          <ToolCard icon={Sparkles} title="Sân chơi hàm AI" to="/ai/ham" desc="Thử AI_CAM_XUC, AI_PHAN_LOAI, AI_TOM_TAT, AI_TRICH_XUAT, AI_DICH với văn bản tiếng Việt." />
          <ToolCard icon={FileScan} tint="ice" title="Xử lý tài liệu" onClick={soon('Xử lý tài liệu')} desc="Đọc hoá đơn, chứng từ scan tiếng Việt thành bảng dữ liệu (mô hình HOA-SEN-OCR)." />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div><h2 className="ds-h2">Học máy</h2><p className="ds-caption">Huấn luyện, quản lý và triển khai mô hình dự đoán</p></div>
          <Link to="/ai/mo-hinh" className="text-[13px] font-[550] text-brand-ink hover:underline inline-flex items-center gap-1">{models.length} mô hình <ArrowRight size={14} /></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <ToolCard icon={Boxes} title="Kho mô hình" to="/ai/mo-hinh" desc="Mô hình ngôn ngữ, nhúng văn bản và mô hình tự huấn luyện." />
          <ToolCard icon={LineChart} tint="pos" title="Dự báo" to="/ai/mo-hinh" desc="Dự báo doanh thu từng cửa hàng 30 ngày tới (DU_BAO_DOANH_THU_CH)." />
          <ToolCard icon={Radar} tint="neg" title="Phát hiện bất thường" onClick={soon('Phát hiện bất thường')} desc="Cảnh báo khi doanh thu, đơn huỷ lệch khỏi xu hướng." />
        </div>
      </section>
    </Page>
  )
}
