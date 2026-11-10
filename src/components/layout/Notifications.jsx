import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, AlertCircle, Info, Sparkles, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { timeAgo } from '@/lib/format'
import { useApp, useUI } from '@/store'
import { Drawer, Button, Tabs, EmptyState } from '@/components/ui'
import { useState } from 'react'

const TONE = {
  warn: [AlertTriangle, 'text-warn bg-warn-soft'],
  neg: [AlertCircle, 'text-neg bg-neg-soft'],
  info: [Info, 'text-info bg-info-soft'],
  brand: [Sparkles, 'text-brand-ink bg-brand-50'],
}

export function NotificationsPanel() {
  const open = useUI((s) => s.notif)
  const setOpen = useUI((s) => s.setNotif)
  const { notifications, markAllRead, update } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('unread')
  const list = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications
  return (
    <Drawer open={open} onClose={() => setOpen(false)} width={420}
      header={<div className="flex items-center justify-between gap-3"><h2 className="ds-h2">Thông báo</h2><Button size="sm" variant="ghost" icon={CheckCheck} onClick={markAllRead}>Đánh dấu đã đọc</Button></div>}>
      <Tabs value={tab} onChange={setTab} options={[{ value: 'unread', label: 'Chưa đọc', count: notifications.filter((n) => !n.read).length }, { value: 'all', label: 'Tất cả' }]} className="-mt-2 mb-4" />
      {!list.length ? (
        <EmptyState icon={Bell} title="Không có thông báo mới" desc="Bạn đã xem hết mọi thông báo." compact />
      ) : (
        <ul className="flex flex-col gap-1 -mx-2">
          {list.map((n) => {
            const [Icon, cls] = TONE[n.tone] || TONE.info
            return (
              <li key={n.id}>
                <button onClick={() => { update('notifications', (l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x))); setOpen(false); n.to && navigate(n.to) }}
                  className="w-full flex gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-subtle">
                  <span className={cn('size-8 shrink-0 rounded-lg grid place-items-center', cls)}><Icon size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[13.5px]', !n.read && 'font-[600]')}>{n.title}</span>
                    {n.desc && <span className="block ds-caption mt-0.5">{n.desc}</span>}
                    <span className="block text-[11.5px] text-faint mt-1">{timeAgo(n.time)}</span>
                  </span>
                  {!n.read && <span className="size-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Drawer>
  )
}
