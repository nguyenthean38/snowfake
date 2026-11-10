/* ==========================================================
   "Hàm AI" tiếng Việt chạy ngay trong trình duyệt.
   Đây là mô phỏng nhẹ bằng từ điển và quy tắc (không gọi mô
   hình ngôn ngữ thật), đủ để minh hoạ AI_CAM_XUC, AI_PHAN_LOAI,
   AI_TOM_TAT, AI_TRICH_XUAT… trong câu SQL.
   ========================================================== */
import { stripAccents } from '@/lib/format'

const norm = (s) => ` ${stripAccents(String(s || '')).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')} `

const POS = ['ngon', 'tuyet', 'tuyet voi', 'than thien', 'nhiet tinh', 'hai long', 'thich', 'dep', 'yen tinh', 'nhanh', 'chu dao', 'sach se', 'sang khoai', 'xuat sac', 'hop ly', 'tien', 'thom', 'gion', 'de thuong', 'cam on', 'quay lai', 'gioi thieu', 'xung dang', 'hoi', 'on dinh', 'dung gu', 'het y', 'xinh', 'thoai mai', 'can than', 'beo min', 'dam da']
const NEG = ['that vong', 'te', 'qua te', 'cham', 'cho lau', 'cho hon', 'khong tot', 'ban', 'chua sach', 'sai', 'tre', 'nhat', 'khong mat', 'nong', 'bi do', 'tan het', 'qua ngot', 'khong tuoi', 'chap chon', 'chat', 'kho tim', 'khong quay lai', 'het mon', 'khong hoan', 'co toc', 'xin loi', 'goi mai', 'it', 'hoi cao', 'dong', 'lau']
const NEGATORS = ['khong', 'chua', 'chang', 'cha']

/** Điểm cảm xúc trong khoảng [-1, 1] */
export function sentimentScore(text) {
  const t = norm(text)
  let score = 0, hits = 0
  for (const w of POS) {
    const re = new RegExp(`(\\S+ )?${w} `, 'g')
    let m
    while ((m = re.exec(t))) {
      const prev = (m[1] || '').trim()
      if (w === 'quay lai' && t.includes('khong quay lai')) continue
      score += NEGATORS.includes(prev) ? -1 : 1
      hits++
    }
  }
  for (const w of NEG) {
    if (t.includes(` ${w} `)) { score -= 1.2; hits++ }
  }
  if (!hits) return 0
  return Math.max(-1, Math.min(1, Math.round((score / (hits + 1)) * 100) / 100))
}

export function sentimentLabel(text) {
  const s = sentimentScore(text)
  if (s >= 0.2) return 'Tích cực'
  if (s <= -0.2) return 'Tiêu cực'
  return 'Trung tính'
}

const TOPIC_HINTS = {
  'Đồ uống': ['ca phe', 'tra', 'matcha', 'bac xiu', 'cold brew', 'do uong', 'nuoc', 'vi ', 'ngot', 'dam'],
  'Đồ ăn': ['banh', 'croissant', 'tiramisu', 'pate', 'mon an'],
  'Phục vụ': ['nhan vien', 'phuc vu', 'thai do', 'tu van', 'goi mai', 'xin loi'],
  'Không gian': ['khong gian', 'view', 'ban ghe', 've sinh', 'nhac', 'may lanh', 'cho ngoi', 'goc doc sach', 'wifi', 'sang sua'],
  'Giao hàng': ['giao', 'dong goi', 'ung dung', 'dat qua', 'dat truoc'],
  'Giá cả': ['gia', 'tinh sai tien', 'uu dai', 'khuyen mai', 'hoi cao'],
  'Thời gian chờ': ['cho ', 'lau', 'xep hang', 'dong', 'tre'],
}

/** Phân loại văn bản vào một trong các nhãn (chuỗi "a, b, c" hoặc mảng). Mặc định dùng chủ đề quán cà phê. */
export function classify(text, labels) {
  const t = norm(text)
  const list = (Array.isArray(labels) ? labels : String(labels || '').split(',')).map((x) => x.trim()).filter(Boolean)
  const cands = list.length ? list : Object.keys(TOPIC_HINTS)
  let best = cands[0], bestScore = -1
  for (const lab of cands) {
    const key = Object.keys(TOPIC_HINTS).find((k) => stripAccents(k).toLowerCase() === stripAccents(lab).toLowerCase())
    const hints = key ? TOPIC_HINTS[key] : [stripAccents(lab).toLowerCase()]
    const sc = hints.reduce((s, h) => s + (t.includes(h) ? 1 : 0), 0)
    if (sc > bestScore) { best = lab; bestScore = sc }
  }
  return best
}

/** Tóm tắt: lấy ý chính đầu tiên, cắt gọn */
export function summarize(text, maxWords = 14) {
  const s = String(text || '').split(/(?<=[.!?])\s+/)[0] || ''
  const words = s.split(/\s+/)
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '…' : s
}

/** Trích xuất thông tin đơn giản: 'mon' (món được nhắc), 'van_de' (vấn đề), 'email', 'so_dien_thoai' */
const DISHES = ['cà phê muối', 'cà phê trứng', 'cà phê cốt dừa', 'cà phê sữa đá', 'cà phê đen', 'bạc xỉu', 'trà sen vàng', 'trà đào', 'matcha đá xay', 'cold brew cam sả', 'croissant', 'tiramisu', 'bánh mì que']
export function extract(text, what = 'mon') {
  const raw = String(text || '')
  const t = raw.toLowerCase()
  const w = stripAccents(String(what)).toLowerCase()
  if (w.startsWith('mon')) return DISHES.filter((d) => t.includes(d)).join(', ') || null
  if (w.startsWith('van')) {
    const issues = [['chờ', 'Thời gian chờ'], ['giao', 'Giao hàng'], ['thái độ', 'Thái độ phục vụ'], ['bẩn', 'Vệ sinh'], ['sai tiền', 'Tính tiền'], ['ngọt', 'Vị đồ uống'], ['nóng', 'Nhiệt độ phòng'], ['wifi', 'Wifi'], ['xe', 'Chỗ để xe'], ['tóc', 'Vệ sinh an toàn thực phẩm']]
    return issues.filter(([k]) => t.includes(k)).map(([, v]) => v).join(', ') || null
  }
  if (w.startsWith('email')) return raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null
  if (w.startsWith('so')) return raw.match(/(0\d[\d\s.]{8,11})/)?.[0]?.replace(/\D/g, '') ?? null
  return null
}

/** "Dịch" sang tiếng Anh bằng bảng cụm từ ngắn — đủ cho bản minh hoạ */
const PHRASES = [
  ['rất thất vọng', 'very disappointed'], ['sẽ quay lại', 'will come back'], ['không quay lại', 'will not come back'], ['ngon tuyệt', 'absolutely delicious'],
  ['nhân viên', 'staff'], ['thân thiện', 'friendly'], ['không gian', 'the space'], ['yên tĩnh', 'quiet'], ['giá hợp lý', 'reasonable price'],
  ['giao hàng', 'delivery'], ['đồ uống', 'drinks'], ['cà phê', 'coffee'], ['trà', 'tea'], ['bánh', 'pastry'], ['ngon', 'tasty'], ['tuyệt vời', 'wonderful'],
  ['chờ', 'waited'], ['phút', 'minutes'], ['nhanh', 'fast'], ['chậm', 'slow'], ['đẹp', 'beautiful'], ['sạch sẽ', 'clean'], ['hơi cao', 'a bit high'],
  ['quá ngọt', 'too sweet'], ['và', 'and'], ['rất', 'very'], ['không', 'not'], ['nhưng', 'but'], ['quán', 'the café'],
]
export function translate(text) {
  let s = String(text || '').toLowerCase()
  for (const [vi, en] of PHRASES) s = s.split(vi).join(en)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Đăng ký các hàm vào cơ sở dữ liệu sql.js */
export function registerAIFunctions(db, ctx) {
  const fn = (name, f) => db.create_function(name, f)
  fn('AI_CAM_XUC', (t) => sentimentLabel(t))
  fn('AI_DIEM_CAM_XUC', (t) => sentimentScore(t))
  fn('AI_PHAN_LOAI', (t, labels) => classify(t, labels))
  fn('AI_TOM_TAT', (t) => summarize(t))
  fn('AI_TRICH_XUAT', (t, what) => extract(t, what))
  fn('AI_DICH', (t) => translate(t))
  fn('KHONG_DAU', (t) => stripAccents(t ?? ''))
  fn('DINH_DANG_VND', (n) => (n == null ? null : new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' ₫'))
  // Hàm quen thuộc của kho dữ liệu, bổ sung cho SQLite
  fn('DATE_TRUNC', (part, d) => {
    if (d == null) return null
    const s = String(d)
    const p = String(part).toLowerCase()
    if (p === 'year') return s.slice(0, 4) + '-01-01'
    if (p === 'quarter') { const m = +s.slice(5, 7); return `${s.slice(0, 4)}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, '0')}-01` }
    if (p === 'month') return s.slice(0, 7) + '-01'
    if (p === 'week') {
      const [y, m, dd] = s.slice(0, 10).split('-').map(Number)
      const x = new Date(y, m - 1, dd)
      x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    }
    if (p === 'day') return s.slice(0, 10)
    if (p === 'hour') return s.slice(0, 13) + ':00:00'
    return s
  })
  fn('YEAR', (d) => (d == null ? null : +String(d).slice(0, 4)))
  fn('MONTH', (d) => (d == null ? null : +String(d).slice(5, 7)))
  fn('DAY', (d) => (d == null ? null : +String(d).slice(8, 10)))
  fn('HOUR', (d) => (d == null ? null : +String(d).slice(11, 13)))
  fn('QUARTER', (d) => (d == null ? null : Math.floor((+String(d).slice(5, 7) - 1) / 3) + 1))
  fn('DAYOFWEEK', (d) => (d == null ? null : new Date(String(d).slice(0, 10) + 'T00:00:00Z').getUTCDay()))
  fn('THU_TRONG_TUAN', (d) => (d == null ? null : ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][new Date(String(d).slice(0, 10) + 'T00:00:00Z').getUTCDay()]))
  const parseD = (d) => { const t = String(d); return new Date(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), +t.slice(11, 13) || 0, +t.slice(14, 16) || 0, +t.slice(17, 19) || 0) }
  const p2 = (x) => String(x).padStart(2, '0')
  const fmtD = (x, withTime) => `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}` + (withTime ? ` ${p2(x.getHours())}:${p2(x.getMinutes())}:${p2(x.getSeconds())}` : '')
  fn('DATEADD', (part, k, d) => {
    if (d == null) return null
    const x = parseD(d), p = String(part).toLowerCase(), v = Number(k) || 0
    if (p.startsWith('year')) x.setFullYear(x.getFullYear() + v)
    else if (p.startsWith('quarter')) x.setMonth(x.getMonth() + 3 * v)
    else if (p.startsWith('month')) x.setMonth(x.getMonth() + v)
    else if (p.startsWith('week')) x.setDate(x.getDate() + 7 * v)
    else if (p.startsWith('hour')) x.setHours(x.getHours() + v)
    else if (p.startsWith('minute')) x.setMinutes(x.getMinutes() + v)
    else x.setDate(x.getDate() + v)
    return fmtD(x, String(d).length > 10 || p.startsWith('hour') || p.startsWith('minute'))
  })
  fn('DATEDIFF', (part, a, b) => {
    if (a == null || b == null) return null
    const x = parseD(a), y = parseD(b), p = String(part).toLowerCase()
    if (p.startsWith('year')) return y.getFullYear() - x.getFullYear()
    if (p.startsWith('month')) return (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth()
    if (p.startsWith('week')) return Math.floor((y - x) / 604800000)
    if (p.startsWith('hour')) return Math.floor((y - x) / 3600000)
    if (p.startsWith('minute')) return Math.floor((y - x) / 60000)
    const dx = new Date(x.getFullYear(), x.getMonth(), x.getDate()), dy = new Date(y.getFullYear(), y.getMonth(), y.getDate())
    return Math.round((dy - dx) / 86400000)
  })
  fn('IFF', (c, a, b) => (c ? a : b))
  fn('DIV0', (a, b) => (!b ? 0 : a / b))
  fn('ZEROIFNULL', (a) => a ?? 0)
  fn('CURRENT_ROLE', () => ctx.role)
  fn('CURRENT_WAREHOUSE', () => ctx.warehouse)
  fn('CURRENT_USER', () => ctx.user)
  fn('CURRENT_DATABASE', () => ctx.database)
  fn('CURRENT_SCHEMA', () => ctx.schema)
  fn('CURRENT_ACCOUNT', () => 'PHONUI-VN01')
  fn('CURRENT_REGION', () => 'TRUONGSON_HCM_1')
  fn('CURRENT_VERSION', () => '9.32.1')
}
