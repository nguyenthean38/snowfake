import { cn } from '@/lib/cn'

/** Tiêu đề một mục cài đặt */
export function SectionTitle({ title, desc, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div><h2 className="ds-h1">{title}</h2>{desc && <p className="text-muted mt-1">{desc}</p>}</div>
      {action}
    </div>
  )
}
/** Nhóm cài đặt có viền */
export function Group({ title, desc, children, className, action }) {
  return (
    <section className={cn('mb-7', className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <div>{title && <h3 className="ds-h3">{title}</h3>}{desc && <p className="ds-caption mt-0.5">{desc}</p>}</div>
          {action}
        </div>
      )}
      <div className="card divide-y divide-line">{children}</div>
    </section>
  )
}
/** Một dòng cài đặt: nhãn bên trái, điều khiển bên phải */
export function Row({ label, desc, children, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4', className)}>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-[550]">{label}</div>
        {desc && <div className="ds-caption mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0 sm:max-w-[60%]">{children}</div>
    </div>
  )
}
