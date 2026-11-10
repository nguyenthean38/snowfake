import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToasts } from '@/store'
import { cn } from '@/lib/cn'

/** Thông báo nhanh ở góc dưới. Gọi bằng toast() trong '@/store'. */
export function Toaster() {
  const { items, dismiss } = useToasts()
  return (
    <div aria-live="polite" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-32px)] max-w-[440px] pointer-events-none">
      {items.map((t) => {
        const Icon = t.tone === 'neg' ? AlertCircle : t.tone === 'info' ? Info : CheckCircle2
        return (
          <div key={t.id} className="pointer-events-auto w-full flex items-start gap-3 rounded-xl bg-[#16163a] text-white px-4 py-3 shadow-lg animate-slide-up dark:bg-[#ecebff] dark:text-[#14152b]">
            <Icon size={18} className={cn('mt-0.5 shrink-0', t.tone === 'neg' ? 'text-[#ff8a9b] dark:text-neg' : 'text-[#8fe8f2] dark:text-brand-600')} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-[550]">{t.title}</div>
              {t.desc && <div className="text-[12.5px] opacity-75 mt-0.5">{t.desc}</div>}
            </div>
            {t.action && (
              <button onClick={() => { t.action.onClick(); dismiss(t.id) }} className="text-[13px] font-[650] underline underline-offset-4 shrink-0">{t.action.label}</button>
            )}
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0" aria-label="Đóng"><X size={15} /></button>
          </div>
        )
      })}
    </div>
  )
}
