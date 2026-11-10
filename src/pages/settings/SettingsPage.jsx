import { NavLink, Navigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Profile, Preferences, Notifications, Authentication, AIConnections } from './UserSections'
import { General, AdminContacts, NativeApps } from './AccountSections'

export const SECTIONS = [
  { group: 'Người dùng', items: [
    { id: 'ho-so', label: 'Hồ sơ', C: Profile },
    { id: 'tuy-chon', label: 'Tuỳ chọn', C: Preferences },
    { id: 'thong-bao', label: 'Thông báo', C: Notifications },
    { id: 'xac-thuc', label: 'Xác thực', C: Authentication },
    { id: 'ket-noi', label: 'Kết nối công cụ AI', C: AIConnections },
  ] },
  { group: 'Tài khoản', items: [
    { id: 'chung', label: 'Chung', C: General },
    { id: 'lien-he', label: 'Liên hệ quản trị', C: AdminContacts },
  ] },
  { group: 'Tổ chức', items: [
    { id: 'ung-dung-goc', label: 'Ứng dụng gốc', C: NativeApps },
  ] },
]

export default function SettingsPage() {
  const { section = 'ho-so' } = useParams()
  const all = SECTIONS.flatMap((g) => g.items)
  const cur = all.find((s) => s.id === section)
  if (!cur) return <Navigate to="/cai-dat" replace />
  const C = cur.C
  return (
    <div className="flex flex-col md:flex-row min-h-full">
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-line bg-side/50 px-4 py-5 md:py-8">
        <h1 className="ds-h2 px-2 mb-4">Cài đặt</h1>
        <nav className="flex md:flex-col gap-4 overflow-x-auto no-scrollbar">
          {SECTIONS.map((g) => (
            <div key={g.group} className="shrink-0">
              <div className="px-2 mb-1 text-[12px] font-[600] text-muted">{g.group}</div>
              <ul className="flex md:flex-col gap-0.5">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <NavLink to={`/cai-dat/${s.id}`} className={() => cn('block whitespace-nowrap rounded-lg px-2.5 h-8 leading-8 text-[13.5px]', s.id === section ? 'bg-brand-50 text-brand-ink font-[600]' : 'text-dim hover:bg-hover hover:text-fg')}>
                      {s.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 lg:py-8">
        <div className="max-w-[760px]">
          <C />
        </div>
      </div>
    </div>
  )
}
