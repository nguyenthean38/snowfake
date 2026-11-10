/* ==========================================================
   Kho trạng thái (Zustand)
   - useUI: giao diện (chủ đề, thanh bên, bảng lệnh, Tinh Ý)
   - useAuth: đăng nhập / đăng ký (mô phỏng)
   - useApp: dữ liệu nền tảng, lưu vào localStorage để thao tác
     của người xem (tạo kho, mời người dùng, sửa tệp SQL…) còn
     nguyên sau khi tải lại trang.
   Các trang có thể dùng hành động chung update / upsert / remove
   thay vì phải thêm hành động riêng.
   ========================================================== */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ME, WAREHOUSES, COMPUTE_POOLS, USERS, ROLES, TASKS, AGENTS, MODELS, ALERTS, BUDGETS, MONITORS,
  APPS, NOTIFICATIONS, STARTER_FILES, seedHistory, SHARES,
} from '@/data/platform'
import { onQuery } from '@/engine/db'

/* ---------------- Giao diện ---------------- */
function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0d0e1a' : '#f7f8fc')
}

export const useUI = create(
  persist(
    (set, get) => ({
      theme: 'light',
      collapsed: false, // thanh bên thu gọn thành dải biểu tượng
      mobileNav: false,
      command: false,
      assistant: false, // ngăn Tinh Ý toàn cục
      notif: false,
      hideBalances: false,
      setTheme: (theme) => { applyTheme(theme); set({ theme }) },
      setCollapsed: (v) => set({ collapsed: v }),
      toggleCollapsed: () => set({ collapsed: !get().collapsed }),
      setMobileNav: (v) => set({ mobileNav: v }),
      setCommand: (v) => set({ command: v }),
      setAssistant: (v) => set({ assistant: v }),
      setNotif: (v) => set({ notif: v }),
    }),
    { name: 'lacviet-ui', partialize: (s) => ({ theme: s.theme, collapsed: s.collapsed }) },
  ),
)
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useUI.getState().theme === 'system') applyTheme('system')
  })
}

/* ---------------- Thông báo nhanh (toast) ---------------- */
let toastId = 0
export const useToasts = create((set) => ({
  items: [],
  push: (t) => {
    const id = ++toastId
    set((s) => ({ items: [...s.items, { id, tone: 'default', ...t }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), t.duration || 3800)
    return id
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}))
/** toast('Đã lưu') · toast({ title, desc, tone: 'neg' | 'info', action: { label, onClick } }) */
export function toast(t) {
  return useToasts.getState().push(typeof t === 'string' ? { title: t } : t)
}

/* ---------------- Đăng nhập (mô phỏng) ---------------- */
export const useAuth = create(
  persist(
    (set) => ({
      signedIn: false,
      user: ME,
      signup: {}, // bản nháp đăng ký nhiều bước
      signIn: (patch = {}) => set((s) => ({ signedIn: true, user: { ...s.user, ...patch } })),
      signOut: () => set({ signedIn: false }),
      setSignup: (patch) => set((s) => ({ signup: { ...s.signup, ...patch } })),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
    }),
    { name: 'lacviet-auth' },
  ),
)

/* ---------------- Dữ liệu nền tảng ---------------- */
const uid = (p = 'id') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
export { uid }

const initial = () => ({
  files: STARTER_FILES.map((f) => ({ ...f, versions: [{ at: f.updated, content: f.content, by: 'MINHKHOA' }] })),
  folders: ['Không gian của tôi', 'Marketing'],
  tabs: ['f1'],
  activeTab: 'f1',
  history: seedHistory(),
  warehouses: WAREHOUSES,
  currentWarehouse: 'KHO_PHAN_TICH',
  currentRole: 'QUAN_TRI',
  pools: COMPUTE_POOLS,
  users: USERS,
  roles: ROLES,
  tasks: TASKS,
  agents: AGENTS,
  models: MODELS,
  alerts: ALERTS,
  budgets: BUDGETS,
  monitors: MONITORS,
  apps: APPS,
  installed: ['hanh-chinh'],
  requested: [],
  notifications: NOTIFICATIONS,
  shares: SHARES,
  chats: [], // hội thoại Hỏi dữ liệu: { id, title, at, messages: [] }
  tokens: [],
  mfa: [{ id: 'mfa1', kind: 'Ứng dụng xác thực', name: 'Điện thoại của Khoa', added: '2026-01-05' }],
  prefs: { language: 'vi', defaultRole: 'QUAN_TRI', defaultWarehouse: 'KHO_PHAN_TICH', notifyQueries: true, notifyCost: true, weeklyDigest: true, aiDescriptions: true },
  onboarding: null, // câu trả lời khảo sát lúc đăng ký
})

export const useApp = create(
  persist(
    (set, get) => ({
      ...initial(),

      /* ----- hành động chung ----- */
      /** update('warehouses', (list) => newList) hoặc update('prefs', { ... }) */
      update: (key, fnOrPatch) => set((s) => ({
        [key]: typeof fnOrPatch === 'function' ? fnOrPatch(s[key]) : Array.isArray(s[key]) ? fnOrPatch : { ...s[key], ...fnOrPatch },
      })),
      /** Thêm mới hoặc ghi đè phần tử có cùng id (thêm lên đầu danh sách) */
      upsert: (key, item) => set((s) => {
        const list = s[key] || []
        const i = list.findIndex((x) => x.id === item.id)
        if (i < 0) return { [key]: [item, ...list] }
        const next = [...list]; next[i] = { ...list[i], ...item }
        return { [key]: next }
      }),
      remove: (key, id) => set((s) => ({ [key]: (s[key] || []).filter((x) => x.id !== id) })),
      resetAll: () => set(initial()),

      /* ----- tệp SQL & thẻ ----- */
      openFile: (id) => set((s) => ({ tabs: s.tabs.includes(id) ? s.tabs : [...s.tabs, id], activeTab: id })),
      closeTab: (id) => set((s) => {
        const tabs = s.tabs.filter((t) => t !== id)
        return { tabs, activeTab: s.activeTab === id ? tabs[tabs.length - 1] || null : s.activeTab }
      }),
      newFile: ({ name, content = '', folder = 'Không gian của tôi' } = {}) => {
        const used = new Set(get().files.map((f) => f.name))
        let base = name || 'chua_dat_ten.sql', n = 1, nm = base
        while (used.has(nm)) nm = base.replace(/(\.\w+)?$/, `_${++n}$1`)
        const f = { id: uid('f'), name: nm, folder, content, updated: new Date().toISOString(), versions: [] }
        set((s) => ({ files: [...s.files, f], tabs: [...s.tabs, f.id], activeTab: f.id }))
        return f
      },
      saveFile: (id, content) => set((s) => ({
        files: s.files.map((f) => (f.id === id ? { ...f, content, updated: new Date().toISOString() } : f)),
      })),
      /** Lưu một phiên bản (gọi khi chạy truy vấn hoặc lưu thủ công) */
      snapshot: (id) => set((s) => ({
        files: s.files.map((f) => {
          if (f.id !== id) return f
          const last = f.versions[0]
          if (last && last.content === f.content) return f
          return { ...f, versions: [{ at: new Date().toISOString(), content: f.content, by: useAuth.getState().user.username }, ...f.versions].slice(0, 30) }
        }),
      })),
      renameFile: (id, name) => set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, name } : f)) })),
      deleteFile: (id) => set((s) => {
        const tabs = s.tabs.filter((t) => t !== id)
        return { files: s.files.filter((f) => f.id !== id), tabs, activeTab: s.activeTab === id ? tabs[tabs.length - 1] || null : s.activeTab }
      }),

      /* ----- lịch sử truy vấn ----- */
      addHistory: (rec) => set((s) => ({ history: [rec, ...s.history].slice(0, 400) })),

      /* ----- kho tính toán ----- */
      setWarehouseState: (name, state) => set((s) => ({ warehouses: s.warehouses.map((w) => (w.name === name ? { ...w, state } : w)) })),
      useWarehouse: (name) => set((s) => ({
        currentWarehouse: name,
        warehouses: s.warehouses.map((w) => (w.name === name && w.state !== 'Đang chạy' ? { ...w, state: 'Đang chạy' } : w)),
      })),

      /* ----- thông báo ----- */
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      notify: (n) => set((s) => ({ notifications: [{ id: uid('n'), time: new Date().toISOString(), read: false, tone: 'info', ...n }, ...s.notifications] })),
    }),
    {
      name: 'lacviet-app',
      version: 1,
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')),
    },
  ),
)

// Mọi truy vấn chạy qua động cơ đều được ghi vào Lịch sử truy vấn
onQuery((rec) => {
  const s = useApp.getState()
  s.addHistory({ ...rec, warehouse: s.currentWarehouse, role: s.currentRole })
  if (s.warehouses.find((w) => w.name === s.currentWarehouse)?.state !== 'Đang chạy') s.setWarehouseState(s.currentWarehouse, 'Đang chạy')
})

/** Hook tiện ích cho động cơ SQL (đồng bộ kho tính toán với giao diện) */
export const engineHooks = {
  onWarehouse: (name) => useApp.getState().useWarehouse(name),
  onCreateWarehouse: (name) => useApp.getState().upsert('warehouses', { id: uid('w'), name, size: 'X-Small', type: 'Tiêu chuẩn', state: 'Đang chạy', autoSuspend: 600, clusters: [1, 1], owner: useApp.getState().currentRole, running: 0, queued: 0, created: new Date().toISOString().slice(0, 10), comment: '' }),
  listWarehouses: () => useApp.getState().warehouses,
}
