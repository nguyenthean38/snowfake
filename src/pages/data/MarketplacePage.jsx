import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Sparkles, ArrowRight, Store, Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/layout/Page'
import { Button, Tabs, EmptyState, Badge } from '@/components/ui'
import { useApp } from '@/store'
import { LISTINGS } from '@/data/platform'
import { stripAccents } from '@/lib/format'
import { ListingCard, ListingIcon } from '@/features/data/ListingCard'

const norm = (s) => stripAccents(s).toLowerCase()

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { installed, requested } = useApp()
  const [tab, setTab] = useState('discover')
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const [cat, setCat] = useState('Tất cả')
  const cats = ['Tất cả', 'Sẵn sàng cho AI', ...new Set(LISTINGS.map((l) => l.category))]
  const suggest = q.trim() ? LISTINGS.filter((l) => norm(l.title + ' ' + l.provider + ' ' + l.category).includes(norm(q.trim()))) : []
  const list = useMemo(() => LISTINGS.filter((l) => {
    if (cat === 'Sẵn sàng cho AI' && !l.tags.includes('Sẵn sàng cho AI')) return false
    if (cat !== 'Tất cả' && cat !== 'Sẵn sàng cho AI' && l.category !== cat) return false
    return !q.trim() || norm(l.title + ' ' + l.provider + ' ' + l.desc).includes(norm(q.trim()))
  }), [cat, q])
  const providers = [...new Map(LISTINGS.map((l) => [l.provider, l])).values()].slice(0, 5)
  const mine = LISTINGS.filter((l) => installed.includes(l.id))
  const reqs = LISTINGS.filter((l) => requested.includes(l.id))

  return (
    <Page wide>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="ds-h1 flex items-center gap-2.5"><Store size={24} className="text-brand-ink" />Chợ dữ liệu</h1>
        <Tabs value={tab} onChange={setTab} options={[{ value: 'discover', label: 'Khám phá' }, { value: 'mine', label: 'Dữ liệu đã nhận', count: mine.length }, { value: 'req', label: 'Yêu cầu của tôi', count: reqs.length }]} />
      </div>

      {tab === 'discover' && (
        <>
          <div className="relative rounded-2xl overflow-hidden border border-line bg-gradient-to-br from-brand-50 via-surface to-ice-soft p-6 sm:p-10">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-crystal opacity-20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1fr_380px] gap-8 items-center">
              <div>
                <Badge tone="brand" icon={Sparkles}>Sẵn sàng cho AI</Badge>
                <h2 className="text-[30px] sm:text-[38px] font-[800] tracking-[-0.03em] leading-[1.08] mt-3">
                  Khám phá dữ liệu và ứng dụng <span className="text-crystal">giúp AI hiểu doanh nghiệp bạn</span>
                </h2>
                <p className="text-muted mt-3 max-w-xl">Nhận dữ liệu tham chiếu, thời tiết, tỷ giá, hành vi tiêu dùng… trực tiếp vào tài khoản. Không sao chép tệp, không đường ống phức tạp — truy vấn ngay bằng SQL.</p>
                <div className="relative mt-5 max-w-xl">
                  <div className="flex items-center gap-2 h-12 px-4 rounded-xl border border-line-strong bg-surface shadow-sm focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100">
                    <Search size={18} className="text-faint" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
                      placeholder="Tìm nhà cung cấp và bộ dữ liệu" className="flex-1 bg-transparent outline-none" />
                  </div>
                  {focus && suggest.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-xl border border-line bg-surface shadow-md p-1.5 animate-pop-in">
                      {suggest.slice(0, 5).map((l) => (
                        <button key={l.id} onMouseDown={() => navigate(`/cho-du-lieu/${l.id}`)} className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-hover text-left">
                          <ListingIcon l={l} size={30} />
                          <span className="min-w-0"><span className="block text-[13.5px] font-[550] truncate">{l.title}</span><span className="block ds-caption">{l.provider}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-2"><span className="ds-label">Nhà cung cấp nổi bật</span></div>
                <div className="flex flex-col">
                  {providers.map((l) => (
                    <Link key={l.provider} to={`/cho-du-lieu/${l.id}`} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 group">
                      <ListingIcon l={l} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-[600] group-hover:text-brand-ink">{l.provider}</span>
                        <span className="block ds-caption truncate">{l.title}</span>
                      </span>
                      <ArrowRight size={15} className="text-faint group-hover:text-brand-ink" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-6">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn('h-8 px-3 rounded-full text-[13px] font-[550] border transition-colors', cat === c ? 'bg-fg text-canvas border-fg' : 'bg-surface border-line text-dim hover:border-faint')}>{c}</button>
            ))}
          </div>
          <div className="ds-caption mt-3 mb-2">{list.length} sản phẩm dữ liệu</div>
          {!list.length ? <EmptyState icon={Search} title="Không tìm thấy sản phẩm phù hợp" desc="Thử từ khoá khác hoặc bỏ bớt bộ lọc." />
            : <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">{list.map((l) => <ListingCard key={l.id} l={l} installed={installed.includes(l.id)} />)}</div>}

          <div className="mt-8 rounded-2xl border border-line bg-surface p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="ds-h3">Bạn có dữ liệu muốn chia sẻ?</div>
              <p className="ds-caption mt-0.5">Đăng sản phẩm dữ liệu cho khách hàng, đối tác nhượng quyền hoặc các phòng ban trong công ty.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/chia-se')}>Chia sẻ dữ liệu</Button>
          </div>
        </>
      )}

      {tab === 'mine' && (mine.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">{mine.map((l) => <ListingCard key={l.id} l={l} installed />)}</div>
        : <EmptyState icon={Inbox} title="Chưa nhận dữ liệu nào" desc="Dữ liệu bạn nhận từ Chợ dữ liệu sẽ hiện ở đây." action={<Button onClick={() => setTab('discover')}>Khám phá</Button>} />)}
      {tab === 'req' && (reqs.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">{reqs.map((l) => <ListingCard key={l.id} l={l} />)}</div>
        : <EmptyState icon={Inbox} title="Chưa có yêu cầu nào" desc="Khi bạn yêu cầu dữ liệu trả phí, trạng thái duyệt của nhà cung cấp hiện ở đây." />)}
    </Page>
  )
}
