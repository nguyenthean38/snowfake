/* Cấu trúc điều hướng chính (dùng cho thanh bên và bảng lệnh Ctrl K) */
import {
  Home, FolderKanban, CloudUpload, Workflow, Sparkles, Activity, LayoutGrid, Store, Database, Share2,
  ShieldCheck, Zap, Wrench,
} from 'lucide-react'

export const NAV = [
  {
    group: 'Làm việc với dữ liệu',
    items: [
      { label: 'Dự án', icon: FolderKanban, to: '/khong-gian', children: [
        { label: 'Không gian làm việc', to: '/khong-gian' },
        { label: 'Mẫu dự án', to: '/mau-du-an' },
      ] },
      { label: 'Nạp dữ liệu', icon: CloudUpload, to: '/nap-du-lieu', children: [
        { label: 'Thêm dữ liệu', to: '/nap-du-lieu' },
        { label: 'Lịch sử nạp', to: '/nap-du-lieu/lich-su' },
      ] },
      { label: 'Biến đổi', icon: Workflow, to: '/bien-doi/tac-vu', children: [
        { label: 'Tác vụ định kỳ', to: '/bien-doi/tac-vu' },
      ] },
      { label: 'AI & ML', icon: Sparkles, to: '/ai', children: [
        { label: 'AI Studio', to: '/ai' },
        { label: 'Hỏi dữ liệu', to: '/ai/hoi-du-lieu' },
        { label: 'Tác tử AI', to: '/ai/tac-tu' },
        { label: 'Hàm AI', to: '/ai/ham' },
        { label: 'Mô hình', to: '/ai/mo-hinh' },
      ] },
      { label: 'Giám sát', icon: Activity, to: '/giam-sat/truy-van', children: [
        { label: 'Lịch sử truy vấn', to: '/giam-sat/truy-van' },
        { label: 'Hiệu năng', to: '/giam-sat/hieu-nang' },
        { label: 'Cảnh báo', to: '/giam-sat/canh-bao' },
      ] },
      { label: 'Ứng dụng', icon: LayoutGrid, to: '/ung-dung' },
      { label: 'Chợ dữ liệu', icon: Store, to: '/cho-du-lieu' },
    ],
  },
  {
    group: 'Danh mục',
    items: [
      { label: 'Dữ liệu', icon: Database, to: '/du-lieu' },
      { label: 'Chia sẻ dữ liệu', icon: Share2, to: '/chia-se' },
      { label: 'Quản trị & bảo mật', icon: ShieldCheck, to: '/quan-tri/nguoi-dung', children: [
        { label: 'Người dùng & vai trò', to: '/quan-tri/nguoi-dung' },
        { label: 'Trung tâm bảo mật', to: '/quan-tri/bao-mat' },
      ] },
    ],
  },
  {
    group: 'Quản lý',
    items: [
      { label: 'Tính toán', icon: Zap, to: '/tinh-toan/kho', children: [
        { label: 'Kho tính toán', to: '/tinh-toan/kho' },
        { label: 'Cụm tính toán', to: '/tinh-toan/cum' },
      ] },
      { label: 'Quản trị', icon: Wrench, to: '/quan-tri/chi-phi', children: [
        { label: 'Chi phí', to: '/quan-tri/chi-phi' },
        { label: 'Tài khoản & thanh toán', to: '/quan-tri/tai-khoan' },
      ] },
    ],
  },
]

export const HOME = { label: 'Trang chủ', icon: Home, to: '/trang-chu' }

/** Danh sách phẳng mọi trang (cho tìm kiếm) */
export const ALL_PAGES = [
  { label: 'Trang chủ', to: '/trang-chu', icon: Home },
  ...NAV.flatMap((g) => g.items.flatMap((it) => (it.children ? it.children.map((c) => ({ label: c.label, to: c.to, icon: it.icon, parent: it.label })) : [{ label: it.label, to: it.to, icon: it.icon }]))),
  { label: 'Cài đặt cá nhân', to: '/cai-dat', icon: Wrench },
  { label: 'Xác thực & bảo mật tài khoản', to: '/cai-dat/xac-thuc', icon: ShieldCheck },
]
