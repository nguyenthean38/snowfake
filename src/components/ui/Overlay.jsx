import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, IconButton } from './Button'

/* ---------- Khoá cuộn trang + Esc + trả focus ---------- */
let locks = 0
function useOverlay(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    locks++
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // chỉ lớp trên cùng đóng
        const layers = document.querySelectorAll('[data-overlay]')
        if (layers[layers.length - 1] === panelRef.current?.closest('[data-overlay]')) { e.stopPropagation(); onClose?.() }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      // giữ focus nếu React đã tự focus ô có autoFocus; nếu không thì focus vào khung
      if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus?.({ preventScroll: true })
    }, 30)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      if (--locks <= 0) { locks = 0; document.documentElement.style.overflow = '' }
      prev?.focus?.()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Hộp thoại giữa màn hình.
 * <Modal open onClose title desc footer size="sm|md|lg">nội dung</Modal>
 */
export function Modal({ open, onClose, title, desc, children, footer, size = 'md', className, hideClose }) {
  const ref = useRef(null)
  useOverlay(open, onClose, ref)
  if (!open) return null
  const w = { sm: 'max-w-[420px]', md: 'max-w-[520px]', lg: 'max-w-[680px]', xl: 'max-w-[880px]' }[size]
  return createPortal(
    <div data-overlay className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-[rgba(12,16,14,.42)] backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} tabIndex={-1}
        className={cn('relative w-full bg-surface rounded-t-2xl sm:rounded-2xl shadow-lg border border-line animate-pop-in outline-none max-h-[92vh] flex flex-col', w, className)}>
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
            <div className="min-w-0">
              {title && <h2 className="ds-h2">{title}</h2>}
              {desc && <p className="text-muted text-[13.5px] mt-1">{desc}</p>}
            </div>
            {!hideClose && <IconButton data-close icon={X} label="Đóng" size="sm" onClick={onClose} className="-mr-2 -mt-1" />}
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-1">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Hộp xác nhận nhanh */
export function Confirm({ open, onClose, onConfirm, title, desc, confirmLabel = 'Xác nhận', cancelLabel = 'Huỷ', danger, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title} desc={desc} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.() }}>{confirmLabel}</Button>
      </>}>
      {children}
    </Modal>
  )
}

/**
 * Ngăn kéo bên phải (chi tiết giao dịch, thẻ, hoá đơn…).
 * header: nội dung đầu ngăn kéo; footer: thanh nút dưới cùng.
 */
export function Drawer({ open, onClose, title, header, children, footer, width = 460, className }) {
  const ref = useRef(null)
  useOverlay(open, onClose, ref)
  if (!open) return null
  return createPortal(
    <div data-overlay className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[rgba(12,16,14,.28)] animate-fade-in" onClick={onClose} />
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Chi tiết'} tabIndex={-1}
        style={{ maxWidth: width }}
        className={cn('absolute right-0 top-0 h-full w-full bg-surface border-l border-line shadow-lg flex flex-col animate-slide-in outline-none', className)}>
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-line">
          <div className="min-w-0 flex-1">{header || <h2 className="ds-h2">{title}</h2>}</div>
          <IconButton data-close icon={X} label="Đóng" size="sm" onClick={onClose} className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4 flex items-center gap-2">{footer}</div>}
      </aside>
    </div>,
    document.body,
  )
}

/* ---------- Popover / menu thả xuống ---------- */
/**
 * <Popover trigger={(props) => <Button {...props}>Mở</Button>} align="start|end">
 *   {(close) => <Menu items=[…] onClose={close} />}
 * </Popover>
 */
export function Popover({ trigger, children, align = 'start', width, className, open: ctrlOpen, onOpenChange, offset = 6 }) {
  const [inner, setInner] = useState(false)
  const open = ctrlOpen ?? inner
  const setOpen = useCallback((v) => { onOpenChange ? onOpenChange(v) : setInner(v) }, [onOpenChange])
  const btn = useRef(null)
  const panel = useRef(null)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    const pw = panel.current?.offsetWidth || width || 240
    const ph = panel.current?.offsetHeight || 200
    let left = align === 'end' ? r.right - pw : r.left
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8))
    let top = r.bottom + offset
    if (top + ph > window.innerHeight - 8 && r.top - ph - offset > 8) top = r.top - ph - offset
    setPos({ top, left })
  }, [align, width, offset])

  useLayoutEffect(() => { if (open) place() }, [open, place])
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!panel.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, place, setOpen])

  const close = () => setOpen(false)
  return (
    <>
      {trigger({ ref: btn, onClick: () => setOpen(!open), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && createPortal(
        <div ref={panel} style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
          className={cn('fixed z-[90] rounded-xl border border-line bg-surface shadow-md p-1.5 animate-pop-in', className)}>
          {typeof children === 'function' ? children(close) : children}
        </div>,
        document.body,
      )}
    </>
  )
}

/** Danh sách mục trong menu: [{ label, icon, onClick, danger, desc, checked, divider, kbd }] */
export function Menu({ items, onClose }) {
  return (
    <div role="menu" className="flex flex-col">
      {items.filter(Boolean).map((it, i) => {
        if (it.divider) return <div key={i} className="my-1 h-px bg-line" />
        if (it.heading) return <div key={i} className="px-2.5 pt-2 pb-1 ds-label">{it.heading}</div>
        const Icon = it.icon
        return (
          <button
            key={i}
            role="menuitem"
            disabled={it.disabled}
            onClick={() => { it.onClick?.(); if (!it.keepOpen) onClose?.() }}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors disabled:opacity-40',
              it.danger ? 'text-neg hover:bg-neg-soft' : 'text-fg hover:bg-hover',
            )}
          >
            {Icon && <Icon size={16} className={cn('shrink-0', it.danger ? '' : 'text-muted')} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{it.label}</span>
              {it.desc && <span className="block ds-caption">{it.desc}</span>}
            </span>
            {it.checked && <Check size={15} className="text-brand-ink shrink-0" />}
            {it.kbd && <span className="text-[11px] text-faint font-mono">{it.kbd}</span>}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Khung luồng toàn màn hình (chuyển tiền, tạo hoá đơn, thiết lập doanh nghiệp…).
 * Bên trái: các bước; giữa: nội dung; bên phải (tuỳ chọn): bản xem trước.
 */
export function FlowShell({ open = true, onClose, steps, current = 0, title, children, aside, footer, onBack, asideClassName }) {
  const ref = useRef(null)
  useOverlay(open, onClose, ref)
  if (!open) return null
  return createPortal(
    <div data-overlay ref={ref} tabIndex={-1} className="fixed inset-0 z-[75] bg-canvas flex flex-col animate-fade-in outline-none">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-line bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          {onBack ? <IconButton icon={ArrowLeft} label="Quay lại" onClick={onBack} /> : null}
          <span className="font-[600] truncate">{title}</span>
        </div>
        <IconButton data-close icon={X} label="Đóng" onClick={onClose} />
      </div>
      <div className="flex-1 min-h-0 flex">
        {steps && (
          <nav className="hidden lg:flex w-60 shrink-0 flex-col gap-1 border-r border-line px-5 py-8">
            {steps.map((s, i) => (
              <div key={s} className={cn('flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px]', i === current ? 'bg-subtle text-fg font-[600]' : i < current ? 'text-dim' : 'text-faint')}>
                <span className={cn('size-6 shrink-0 rounded-full grid place-items-center text-[11.5px] font-[650] border',
                  i < current ? 'bg-brand-500 border-brand-500 text-white' : i === current ? 'border-fg text-fg' : 'border-line-strong')}>
                  {i < current ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </div>
            ))}
          </nav>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {steps && (
              <div className="lg:hidden px-5 pt-5">
                <div className="flex gap-1.5">{steps.map((s, i) => <span key={s} className={cn('h-1 flex-1 rounded-full', i <= current ? 'bg-brand-500' : 'bg-line')} />)}</div>
                <div className="ds-caption mt-2">Bước {current + 1}/{steps.length} · {steps[current]}</div>
              </div>
            )}
            <div className="mx-auto w-full max-w-[560px] px-5 sm:px-8 py-8 sm:py-10">{children}</div>
          </div>
          {footer && <div className="border-t border-line bg-surface px-5 sm:px-8 py-4"><div className="mx-auto max-w-[560px] flex items-center justify-between gap-3">{footer}</div></div>}
        </div>
        {aside && (
          <aside className={cn('hidden xl:block w-[44%] max-w-[640px] shrink-0 border-l border-line overflow-y-auto bg-gradient-to-br from-subtle to-canvas', asideClassName)}>
            {aside}
          </aside>
        )}
      </div>
    </div>,
    document.body,
  )
}
