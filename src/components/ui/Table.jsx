import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Bảng dữ liệu nhẹ. Dùng các phần tử con để tự do bố cục:
 * <Table><THead><Th>…</Th></THead><tbody><Tr onClick>…<Td>…</Td></Tr></tbody></Table>
 */
export function Table({ children, className, minWidth = 720, fixed }) {
  return (
    <div className={cn('relative w-full overflow-x-auto', className)}>
      <table className={cn('w-full border-collapse text-[13.5px]', fixed && 'table-fixed')} style={{ minWidth }}>{children}</table>
    </div>
  )
}
export function THead({ children, sticky }) {
  return (
    <thead className={cn(sticky && 'sticky top-0 z-10')}>
      <tr className="bg-surface">{children}</tr>
    </thead>
  )
}
/** Ô tiêu đề cột; sort = 'asc' | 'desc' | null, onSort để bật sắp xếp */
export function Th({ children, className, align = 'left', sort, onSort, width }) {
  const content = (
    <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
      {children}
      {sort === 'asc' && <ArrowUp size={13} />}
      {sort === 'desc' && <ArrowDown size={13} />}
    </span>
  )
  return (
    <th style={{ width }} className={cn('h-10 px-3 first:pl-5 last:pr-5 border-b border-line text-[12.5px] font-[550] text-muted whitespace-nowrap', align === 'right' ? 'text-right' : 'text-left', className)}>
      {onSort ? <button onClick={onSort} className="hover:text-fg">{content}</button> : content}
    </th>
  )
}
export function Tr({ children, onClick, selected, className, ...props }) {
  return (
    <tr onClick={onClick} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onClick(e) } : undefined}
      {...props} className={cn('group border-b border-line last:border-0 transition-colors', onClick && 'cursor-pointer hover:bg-subtle', selected && 'bg-brand-50 hover:bg-brand-50', className)}>
      {children}
    </tr>
  )
}
export function Td({ children, className, align = 'left', ...props }) {
  return <td className={cn('h-[52px] px-3 first:pl-5 last:pr-5 align-middle', align === 'right' && 'text-right', className)} {...props}>{children}</td>
}
