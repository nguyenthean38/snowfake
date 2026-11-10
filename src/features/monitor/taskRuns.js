/* Sinh lượt chạy tác vụ mô phỏng (có hạt giống) từ cấu hình tác vụ */
import { seeded } from '@/lib/random'
import { TODAY } from '@/lib/format'

export const SCHEDULE_PRESETS = [
  { value: '*/15 * * * *', label: 'Mỗi 15 phút', perDay: 96 },
  { value: '0 * * * *', label: 'Mỗi giờ', perDay: 24 },
  { value: '0 6 * * *', label: 'Hằng ngày lúc 06:00', perDay: 1 },
  { value: '0 22 * * *', label: 'Hằng ngày lúc 22:00', perDay: 1 },
  { value: '0 8 * * 1', label: 'Thứ hai lúc 08:00', perDay: 1 / 7, weekly: 1 },
]

export function runsPerDay(task, dow) {
  const p = SCHEDULE_PRESETS.find((x) => x.value === task.cron)
  if (p?.weekly != null) return dow === p.weekly ? 1 : 0
  if (p) return p.perDay
  if (/^\*\/(\d+)/.test(task.cron)) return Math.round(1440 / +task.cron.match(/^\*\/(\d+)/)[1])
  return 1
}

const seedOf = (s) => s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Số lượt thành công / lỗi theo ngày, 7 ngày gần nhất */
export function dailyCounts(tasks, days = 7) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(TODAY); d.setDate(d.getDate() - i)
    let ok = 0, fail = 0
    for (const t of tasks) {
      if (t.state !== 'Đang chạy' && !t.ranBefore) continue
      const r = seeded(seedOf(t.name + iso(d)))
      const n = Math.round(runsPerDay(t, d.getDay()) * (i === 0 ? (TODAY.getHours() + TODAY.getMinutes() / 60) / 24 : 1))
      const f = Math.round(n * (1 - (t.successRate ?? 1)) + (r.chance(0.25) && t.successRate < 1 ? 1 : 0))
      ok += Math.max(0, n - f); fail += Math.min(n, f)
    }
    out.push({ x: iso(d), ok, fail })
  }
  return out
}

/** Danh sách lượt chạy gần nhất của một tác vụ */
export function recentRuns(task, count = 12) {
  if (!task) return []
  const r = seeded(seedOf(task.name))
  const per = Math.max(1 / 7, runsPerDay(task, 1))
  const gap = 86400e3 / per
  const base = TODAY.getTime() - (TODAY.getTime() % Math.min(gap, 3600e3))
  const out = []
  for (let i = 0; i < count; i++) {
    const at = base - i * gap
    const failed = r.next() > (task.successRate ?? 1)
    const ms = Math.round((task.avgMs || 2000) * (0.7 + r.next() * 0.6) * (failed ? 1.8 : 1))
    out.push({
      id: `${task.id}-${i}`, task: task.name, at, ms, status: failed ? 'Lỗi' : 'Thành công',
      ret: failed ? (task.warehouse === 'KHO_AI' ? 'Vượt thời gian chờ 60 giây' : 'Lỗi kết nối nguồn POS') : task.name.includes('DONG_BO') ? `${120 + Math.round(r.next() * 400)} dòng đã nạp` : 'OK',
      database: task.database, schema: task.schema, manual: false,
    })
  }
  return task.state === 'Đang chạy' ? out : out.slice(2).map((x) => ({ ...x, at: x.at - 5 * 86400e3 }))
}
