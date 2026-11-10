import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Skeleton } from '@/components/ui'

const L = (f) => {
  const C = lazy(f)
  return <Suspense fallback={<PageFallback />}><C /></Suspense>
}
function PageFallback() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid md:grid-cols-3 gap-4 mt-4"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
    </div>
  )
}

export const router = createBrowserRouter([
  // ---- Trang công khai ----
  { path: '/', element: L(() => import('@/pages/public/LandingPage')) },
  { path: '/dang-nhap', element: L(() => import('@/pages/public/LoginPage')) },
  { path: '/dang-ky', element: L(() => import('@/pages/public/SignupPage')) },
  { path: '/kich-hoat', element: L(() => import('@/pages/public/ActivatePage')) },
  { path: '/khoi-dong', element: L(() => import('@/pages/public/OnboardingPage')) },
  { path: '/quen-mat-khau', element: L(() => import('@/pages/public/ForgotPage')) },
  { path: '/dat-lai-mat-khau', element: L(() => import('@/pages/public/ResetPage')) },

  // ---- Ứng dụng (cần đăng nhập) ----
  {
    element: <AppLayout />,
    children: [
      { path: '/trang-chu', element: L(() => import('@/pages/HomePage')) },
      { path: '/khong-gian', element: L(() => import('@/pages/workspace/WorkspacePage')) },
      { path: '/mau-du-an', element: L(() => import('@/pages/data/TemplatesPage')) },
      { path: '/du-lieu', element: L(() => import('@/pages/data/ExplorerPage')) },
      { path: '/du-lieu/:db', element: L(() => import('@/pages/data/ExplorerPage')) },
      { path: '/du-lieu/:db/:schema', element: L(() => import('@/pages/data/ExplorerPage')) },
      { path: '/du-lieu/:db/:schema/:table', element: L(() => import('@/pages/data/ExplorerPage')) },
      { path: '/nap-du-lieu', element: L(() => import('@/pages/data/LoadDataPage')) },
      { path: '/nap-du-lieu/lich-su', element: L(() => import('@/pages/data/LoadHistoryPage')) },
      { path: '/cho-du-lieu', element: L(() => import('@/pages/data/MarketplacePage')) },
      { path: '/cho-du-lieu/:id', element: L(() => import('@/pages/data/ListingPage')) },
      { path: '/chia-se', element: L(() => import('@/pages/data/SharingPage')) },
      { path: '/ung-dung', element: L(() => import('@/pages/data/AppsPage')) },
      { path: '/ung-dung/:id', element: L(() => import('@/pages/data/AppViewPage')) },

      { path: '/ai', element: L(() => import('@/pages/ai/AIStudioPage')) },
      { path: '/ai/hoi-du-lieu', element: L(() => import('@/pages/ai/AskDataPage')) },
      { path: '/ai/tac-tu', element: L(() => import('@/pages/ai/AgentsPage')) },
      { path: '/ai/tac-tu/:id', element: L(() => import('@/pages/ai/AgentDetailPage')) },
      { path: '/ai/ham', element: L(() => import('@/pages/ai/AIFunctionsPage')) },
      { path: '/ai/mo-hinh', element: L(() => import('@/pages/ai/ModelsPage')) },

      { path: '/giam-sat/truy-van', element: L(() => import('@/pages/monitor/QueryHistoryPage')) },
      { path: '/giam-sat/truy-van/:id', element: L(() => import('@/pages/monitor/QueryDetailPage')) },
      { path: '/giam-sat/hieu-nang', element: L(() => import('@/pages/monitor/PerformancePage')) },
      { path: '/giam-sat/canh-bao', element: L(() => import('@/pages/monitor/AlertsPage')) },
      { path: '/bien-doi/tac-vu', element: L(() => import('@/pages/monitor/TasksPage')) },
      { path: '/tinh-toan/kho', element: L(() => import('@/pages/monitor/WarehousesPage')) },
      { path: '/tinh-toan/cum', element: L(() => import('@/pages/monitor/ComputePoolsPage')) },

      { path: '/quan-tri/nguoi-dung', element: L(() => import('@/pages/admin/UsersPage')) },
      { path: '/quan-tri/bao-mat', element: L(() => import('@/pages/admin/SecurityPage')) },
      { path: '/quan-tri/chi-phi', element: L(() => import('@/pages/admin/CostPage')) },
      { path: '/quan-tri/tai-khoan', element: L(() => import('@/pages/admin/AccountPage')) },
      { path: '/cai-dat', element: L(() => import('@/pages/settings/SettingsPage')) },
      { path: '/cai-dat/:section', element: L(() => import('@/pages/settings/SettingsPage')) },
      { path: '/app', element: <Navigate to="/trang-chu" replace /> },
    ],
  },
  { path: '*', element: L(() => import('@/pages/public/NotFoundPage')) },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })
