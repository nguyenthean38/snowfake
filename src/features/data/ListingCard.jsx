import { Link } from 'react-router-dom'
import { Star, CheckCircle2 } from 'lucide-react'
import { Badge, DynIcon } from '@/components/ui'

export function ListingIcon({ l, size = 44 }) {
  return (
    <span className="shrink-0 grid place-items-center rounded-xl" style={{ width: size, height: size, background: `color-mix(in srgb, ${l.color} 14%, var(--c-surface))`, color: l.color }}>
      <DynIcon name={l.icon} size={Math.round(size * 0.45)} />
    </span>
  )
}

export function ListingCard({ l, installed }) {
  return (
    <Link to={`/cho-du-lieu/${l.id}`} className="group card p-4 flex flex-col hover:shadow-sm hover:border-brand-200 transition-all">
      <div className="flex items-start gap-3">
        <ListingIcon l={l} />
        <div className="min-w-0">
          <div className="font-[600] leading-snug group-hover:text-brand-ink">{l.title}</div>
          <div className="ds-caption mt-0.5">{l.provider}</div>
        </div>
      </div>
      <p className="text-[13px] text-dim mt-3 line-clamp-2">{l.desc}</p>
      <div className="mt-auto pt-4 flex items-center gap-2 flex-wrap">
        {installed ? <Badge tone="pos" icon={CheckCircle2} size="sm">Đã nhận</Badge> : <Badge size="sm" tone={l.price.startsWith('Miễn phí') ? 'pos' : 'neutral'}>{l.price}</Badge>}
        {l.app && <Badge size="sm" tone="brand">Ứng dụng</Badge>}
        <span className="ml-auto flex items-center gap-1 text-[12px] text-muted num"><Star size={12} className="fill-gold text-gold" />{l.rating.toLocaleString('vi-VN')}</span>
      </div>
    </Link>
  )
}
