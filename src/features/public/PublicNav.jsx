import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, Menu as MenuIcon, X, Database, MessageSquareText, Bot, Sparkles, Store, ShieldCheck, Coins,
  ShoppingBag, Landmark, Truck, GraduationCap, BookOpen, PlayCircle, LifeBuoy, FileCode2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Logo } from '@/components/brand/Logo'
import { Button, Input, Select, Textarea, Modal } from '@/components/ui'
import { toast } from '@/store'

export const MENUS = [
  {
    label: 'Sản phẩm',
    items: [
      { icon: Database, title: 'Kho dữ liệu & SQL', desc: 'Lưu trữ, truy vấn hàng tỷ dòng, trả theo giây', href: '#nen-tang' },
      { icon: MessageSquareText, title: 'Hỏi dữ liệu', desc: 'Đặt câu hỏi tiếng Việt, nhận SQL và biểu đồ', href: '#demo' },
      { icon: Bot, title: 'Tác tử AI', desc: 'Trợ lý tự động cho từng phòng ban', href: '#nen-tang' },
      { icon: Sparkles, title: 'Hàm AI trong SQL', desc: 'Cảm xúc, phân loại, tóm tắt văn bản tiếng Việt', href: '#nen-tang' },
      { icon: Store, title: 'Chợ dữ liệu', desc: 'Dữ liệu và ứng dụng sẵn dùng từ đối tác', href: '#nen-tang' },
      { icon: ShieldCheck, title: 'Quản trị & bảo mật', desc: 'Phân quyền, che dữ liệu, nhật ký truy cập', href: '#bao-mat' },
    ],
  },
  {
    label: 'Giải pháp',
    items: [
      { icon: ShoppingBag, title: 'Bán lẻ & F&B', desc: 'Doanh thu cửa hàng, khách hàng thân thiết', href: '#nganh' },
      { icon: Landmark, title: 'Tài chính', desc: 'Báo cáo quản trị, phát hiện bất thường', href: '#nganh' },
      { icon: Truck, title: 'Logistics', desc: 'Đơn giao, tuyến đường, tồn kho', href: '#nganh' },
      { icon: GraduationCap, title: 'Giáo dục', desc: 'Kết quả học tập, tuyển sinh', href: '#nganh' },
    ],
  },
  {
    label: 'Tài nguyên',
    items: [
      { icon: PlayCircle, title: 'Xem bản demo', desc: 'Vào thẳng tài khoản mẫu Phố Núi', to: '/trang-chu?demo=1' },
      { icon: FileCode2, title: 'Trình soạn SQL', desc: 'Thử viết truy vấn ngay', to: '/khong-gian?demo=1' },
      { icon: BookOpen, title: 'Câu hỏi thường gặp', desc: 'Giải đáp nhanh về Lạc Việt Data', href: '#hoi-dap' },
      { icon: LifeBuoy, title: 'Liên hệ tư vấn', desc: 'Chuyên gia gọi lại trong 1 ngày làm việc', contact: true },
    ],
  },
]

export function ContactModal({ open, onClose }) {
  const [f, setF] = useState({ name: '', email: '', company: '', size: '', note: '' })
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const errs = {
    name: !f.name.trim() && 'Vui lòng nhập họ tên.',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) && 'Email chưa đúng định dạng.',
    company: !f.company.trim() && 'Vui lòng nhập tên công ty.',
  }
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (errs.name || errs.email || errs.company) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false); onClose()
      toast({ title: 'Đã nhận yêu cầu tư vấn', desc: `Cảm ơn ${f.name.trim()}! Đây là bản demo nên không có email nào được gửi đi.` })
      setF({ name: '', email: '', company: '', size: '', note: '' }); setTouched(false)
    }, 700)
  }
  return (
    <Modal open={open} onClose={onClose} title="Liên hệ tư vấn" desc="Để lại thông tin, chuyên gia của Lạc Việt Data sẽ liên hệ trong 1 ngày làm việc."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" loading={loading} onClick={submit}>Gửi yêu cầu</Button></>}>
      <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Họ và tên" value={f.name} onChange={set('name')} error={touched && errs.name} autoFocus />
          <Input label="Email công việc" type="email" value={f.email} onChange={set('email')} error={touched && errs.email} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Công ty" value={f.company} onChange={set('company')} error={touched && errs.company} />
          <Select label="Quy mô" value={f.size} onChange={set('size')} placeholder="Chọn quy mô" options={['Dưới 50 người', '50 – 200 người', '200 – 1.000 người', 'Trên 1.000 người']} />
        </div>
        <Textarea label="Bạn cần hỗ trợ gì?" optional rows={3} value={f.note} onChange={set('note')} placeholder="vd: Hợp nhất dữ liệu bán hàng từ 30 cửa hàng và dựng báo cáo tự động" />
      </form>
    </Modal>
  )
}

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(null)
  const [mobile, setMobile] = useState(false)
  const [contact, setContact] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { document.documentElement.style.overflow = mobile ? 'hidden' : ''; return () => { document.documentElement.style.overflow = '' } }, [mobile])

  const Item = ({ it, onDone }) => {
    const Icon = it.icon
    const inner = (
      <>
        <span className="size-9 shrink-0 rounded-lg bg-brand-50 text-brand-ink grid place-items-center"><Icon size={18} /></span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-[600] text-fg">{it.title}</span>
          <span className="block text-[12.5px] text-muted leading-snug">{it.desc}</span>
        </span>
      </>
    )
    const cls = 'flex items-start gap-3 rounded-xl p-2.5 hover:bg-subtle text-left w-full'
    if (it.contact) return <button className={cls} onClick={() => { onDone(); setContact(true) }}>{inner}</button>
    if (it.to) return <Link className={cls} to={it.to} onClick={onDone}>{inner}</Link>
    return <a className={cls} href={it.href} onClick={onDone}>{inner}</a>
  }

  return (
    <>
      <header className={cn('sticky top-0 z-50 transition-[background,box-shadow,border-color] duration-200 border-b', scrolled ? 'bg-surface/85 backdrop-blur-md border-line shadow-xs' : 'bg-transparent border-transparent')}>
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 h-16 flex items-center gap-6">
          <Link to="/" aria-label="Lạc Việt Data"><Logo size={28} /></Link>
          <nav className="hidden lg:flex items-center gap-1" onMouseLeave={() => setMenu(null)}>
            {MENUS.map((m) => (
              <div key={m.label} className="relative" onMouseEnter={() => setMenu(m.label)}>
                <button onClick={() => setMenu(menu === m.label ? null : m.label)} aria-expanded={menu === m.label}
                  className={cn('h-10 px-3 rounded-lg inline-flex items-center gap-1 text-[14px] font-[550]', menu === m.label ? 'text-fg bg-hover' : 'text-dim hover:text-fg')}>
                  {m.label}<ChevronDown size={15} className={cn('transition-transform', menu === m.label && 'rotate-180')} />
                </button>
                {menu === m.label && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className={cn('rounded-2xl border border-line bg-surface shadow-lg p-2 grid gap-0.5 animate-pop-in', m.items.length > 4 ? 'w-[620px] grid-cols-2' : 'w-[340px]')}>
                      {m.items.map((it) => <Item key={it.title} it={it} onDone={() => setMenu(null)} />)}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <a href="#bang-gia" className="h-10 px-3 rounded-lg inline-flex items-center text-[14px] font-[550] text-dim hover:text-fg">Bảng giá</a>
          </nav>
          <div className="ml-auto hidden lg:flex items-center gap-2">
            <Link to="/dang-nhap" className="h-10 px-3 inline-flex items-center text-[14px] font-[600] text-dim hover:text-fg">Đăng nhập</Link>
            <Button variant="outline" pill onClick={() => setContact(true)}>Liên hệ tư vấn</Button>
            <Button variant="primary" pill to="/dang-ky">Dùng thử miễn phí</Button>
          </div>
          <button className="ml-auto lg:hidden size-10 grid place-items-center rounded-lg hover:bg-hover" onClick={() => setMobile(true)} aria-label="Mở menu"><MenuIcon size={21} /></button>
        </div>
      </header>

      {mobile && (
        <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-fade-in lg:hidden">
          <div className="flex items-center justify-between px-4 h-16 border-b border-line">
            <Logo size={26} />
            <button className="size-10 grid place-items-center rounded-lg hover:bg-hover" onClick={() => setMobile(false)} aria-label="Đóng menu"><X size={21} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {MENUS.map((m) => (
              <div key={m.label} className="mb-4">
                <div className="px-2.5 pb-1 ds-label">{m.label}</div>
                {m.items.map((it) => <Item key={it.title} it={it} onDone={() => setMobile(false)} />)}
              </div>
            ))}
            <a href="#bang-gia" onClick={() => setMobile(false)} className="block px-2.5 py-2 font-[600]">Bảng giá</a>
          </div>
          <div className="p-4 border-t border-line grid gap-2">
            <Button variant="primary" size="lg" to="/dang-ky">Dùng thử miễn phí</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" to="/dang-nhap">Đăng nhập</Button>
              <Button variant="secondary" size="lg" onClick={() => { setMobile(false); setContact(true) }}>Liên hệ</Button>
            </div>
          </div>
        </div>
      )}
      <ContactModal open={contact} onClose={() => setContact(false)} />
    </>
  )
}
