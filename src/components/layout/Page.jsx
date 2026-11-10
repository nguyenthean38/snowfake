import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Khung trang chuẩn trong ứng dụng.
 * <Page title="Kho tính toán" desc="…" actions={<Button/>} crumbs={[{ label, to }]} wide>…</Page>
 * - wide: dùng toàn bộ chiều rộng (bảng nhiều cột); mặc định tối đa 1280px
 */
export function Page({ title, desc, actions, crumbs, badge, children, wide, className, headerClassName }) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 lg:py-8', wide ? 'max-w-none' : 'max-w-[1280px]', className)}>
      {crumbs?.length > 0 && (
        <nav className="flex items-center gap-1 text-[12.5px] text-muted mb-2 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} className="text-faint" />}
              {c.to ? <Link to={c.to} className="hover:text-fg hover:underline underline-offset-4">{c.label}</Link> : <span className="text-dim">{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      {(title || actions) && (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6', headerClassName)}>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="ds-h1">{title}</h1>
              {badge}
            </div>
            {desc && <p className="text-muted mt-1 max-w-3xl">{desc}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

/** Trang đang xây dựng (dùng tạm khi chưa có nội dung) */
export function Placeholder({ title }) {
  return <Page title={title} desc="Trang này đang được hoàn thiện." />
}
