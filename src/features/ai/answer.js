/* ==========================================================
   Hỏi dữ liệu: biến câu hỏi tiếng Việt thành câu trả lời có
   số liệu thật (chạy SQL trong trình duyệt) + nhận định tự động.
   ========================================================== */
import { ask } from '@/engine/assistant'
import { runSQL, getSchemaHints, isReady } from '@/engine/db'
import { engineHooks } from '@/store'
import { formatCompact, formatNumber, formatPercent } from '@/lib/format'

const MONEY = /(DOANH_THU|TIEN|CHI_TIEU|GIA_TRI|GIA_VON|GIAM_GIA|LAI_GOP|NGAN_SACH|THANG_TRUOC)/
const PCT = /(PCT|TY_LE|TY_TRONG|TANG_TRUONG)/
const isNum = (v) => typeof v === 'number' && isFinite(v)

/** Định dạng một giá trị theo tên cột (tiền, %, số) */
export function fmtByColumn(col = '', v) {
  if (!isNum(v)) return v == null ? '—' : String(v)
  if (PCT.test(col)) return formatPercent(v)
  if (MONEY.test(col)) return Math.abs(v) >= 1e6 ? `${formatCompact(v)} ₫` : `${formatNumber(v)} ₫`
  return Number.isInteger(v) ? formatNumber(v) : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(v)
}
/** Nhãn đẹp cho giá trị trục hoành: 2026-03-01 → "tháng 3", giờ 8 → "8h" */
export function fmtX(col = '', v) {
  const s = String(v ?? '')
  if (/^\d{4}-\d{2}-01$/.test(s)) return `tháng ${+s.slice(5, 7)}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return `${+s.slice(8, 10)}/${+s.slice(5, 7)}`
  if (col === 'GIO' && isNum(v)) return `${v}h`
  return s
}
const colLabel = (c = '') => c.replace(/_PCT$/, '').replace(/_/g, ' ').toLowerCase()

/** Nhận định ngắn gọn từ kết quả truy vấn */
export function buildInsight({ chart, columns = [], rows = [], intent }) {
  if (!rows.length) return 'Truy vấn không trả về dòng nào với điều kiện này. Bạn thử mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc nhé.'
  if (chart?.type === 'kpi' || (rows.length === 1 && columns.every((c, i) => isNum(rows[0][i])))) {
    const parts = columns.map((c, i) => `${colLabel(c)} **${fmtByColumn(c, rows[0][i])}**`)
    return `Kết quả: ${parts.join(', ')}.`
  }
  const xCol = chart?.x || columns.find((c, i) => !isNum(rows[0][i])) || columns[0]
  const yCol = chart?.y || columns.find((c, i) => c !== xCol && isNum(rows[0][i]))
  const xi = columns.indexOf(xCol), yi = columns.indexOf(yCol)

  // Bảng văn bản (ví dụ: đánh giá) — đếm theo chủ đề nếu có
  if (yi < 0) {
    const ti = columns.indexOf('CHU_DE')
    if (ti >= 0) {
      const cnt = {}
      rows.forEach((r) => { cnt[r[ti]] = (cnt[r[ti]] || 0) + 1 })
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3)
      return `Có **${rows.length}** đánh giá phù hợp. Chủ đề được nhắc nhiều nhất: ${top.map(([k, v]) => `**${k}** (${v})`).join(', ')}.`
    }
    return `Có **${formatNumber(rows.length)}** dòng kết quả.`
  }

  const vals = rows.map((r) => +r[yi] || 0)
  const total = vals.reduce((a, b) => a + b, 0)
  const isTime = /^\d{4}-\d{2}-\d{2}/.test(String(rows[0][xi] ?? ''))
  const maxI = vals.indexOf(Math.max(...vals)), minI = vals.indexOf(Math.min(...vals))
  const yl = colLabel(yCol)

  if (PCT.test(yCol)) {
    const valid = rows.map((r, i) => [r, vals[i]]).filter(([r]) => r[yi] != null)
    if (!valid.length) return 'Chưa đủ dữ liệu để tính tỷ lệ.'
    const best = valid.reduce((a, b) => (b[1] > a[1] ? b : a)), worst = valid.reduce((a, b) => (b[1] < a[1] ? b : a))
    return `${colLabel(yCol)} cao nhất ở **${fmtX(xCol, best[0][xi])}** (${formatPercent(best[1])}), thấp nhất ở **${fmtX(xCol, worst[0][xi])}** (${formatPercent(worst[1])}).`
  }

  if (isTime && rows.length >= 2) {
    const first = vals[0], lastIdx = vals.length - 1
    const partial = String(rows[lastIdx][xi]).startsWith('2026-11')
    const cmpIdx = partial && lastIdx >= 2 ? lastIdx - 1 : lastIdx
    const last = vals[cmpIdx]
    const chg = first ? ((last - first) / first) * 100 : 0
    let s = `${yl.charAt(0).toUpperCase() + yl.slice(1)} ${chg >= 0 ? 'tăng' : 'giảm'} **${formatPercent(Math.abs(chg))}** từ ${fmtX(xCol, rows[0][xi])} (${fmtByColumn(yCol, first)}) đến ${fmtX(xCol, rows[cmpIdx][xi])} (${fmtByColumn(yCol, last)}).`
    s += ` Cao nhất vào **${fmtX(xCol, rows[maxI][xi])}** với ${fmtByColumn(yCol, vals[maxI])}.`
    if (partial) s += ' Tháng 11 mới có số liệu 10 ngày nên chưa so sánh.'
    return s
  }

  const share = total ? (vals[maxI] / total) * 100 : 0
  let s = `**${fmtX(xCol, rows[maxI][xi])}** dẫn đầu với ${fmtByColumn(yCol, vals[maxI])}`
  if (rows.length > 1 && !/TB$|_TB_|TRUNG_BINH|SAO_TB/.test(yCol)) s += `, chiếm ${formatPercent(share)} tổng ${yl} của ${rows.length} nhóm`
  s += '.'
  if (rows.length > 2) s += ` Thấp nhất là **${fmtX(xCol, rows[minI][xi])}** (${fmtByColumn(yCol, vals[minI])}).`
  if (intent === 'peak-hour') s = `Khung giờ đông khách nhất là **${fmtX(xCol, rows[maxI][xi])}** với ${fmtByColumn(yCol, vals[maxI])} đơn; vắng nhất là ${fmtX(xCol, rows[minI][xi])}.`
  return s
}

const FOLLOWUPS = {
  'revenue-month': ['Tăng trưởng doanh thu so với tháng trước', 'Món nào bán chạy nhất tháng 10?', 'Tỷ trọng doanh thu theo kênh bán'],
  'store-ranking': ['Cửa hàng doanh thu thấp nhất quý 3', 'Giá trị đơn trung bình theo vùng', 'Doanh thu theo tháng ở TP HCM'],
  'product-top': ['Lãi gộp theo nhóm sản phẩm', 'Cà phê muối bán thế nào?', 'Khung giờ nào đông khách nhất?'],
  'margin-group': ['Món nào bán chạy nhất?', 'Hiệu quả các chương trình khuyến mãi', 'Doanh thu theo tháng'],
  channel: ['Phương thức thanh toán phổ biến', 'Đơn giao hàng theo tháng', 'Giá trị đơn trung bình theo vùng'],
  payment: ['Tỷ trọng doanh thu theo kênh bán', 'Tổng quan kinh doanh tháng này'],
  'peak-hour': ['Doanh thu theo thứ trong tuần', 'Khung giờ đông khách ở Hà Nội'],
  weekday: ['Khung giờ nào đông khách nhất?', 'Doanh thu theo tháng'],
  'customer-province': ['Chi tiêu theo hạng thành viên', 'Top 10 khách hàng chi tiêu nhiều nhất'],
  churn: ['Chi tiêu theo hạng thành viên', 'Hiệu quả các chương trình khuyến mãi'],
  tier: ['Khách hạng Vàng lâu chưa quay lại', 'Top 10 khách hàng chi tiêu nhiều nhất'],
  'top-customers': ['Khách hạng Vàng lâu chưa quay lại', 'Khách hàng ở tỉnh nào nhiều nhất?'],
  'reviews-negative': ['Tỷ lệ cảm xúc đánh giá theo cửa hàng', 'Những đánh giá tích cực nổi bật', 'Đánh giá tiêu cực ở Hà Nội'],
  'aov-region': ['Xếp hạng cửa hàng theo doanh thu', 'Phương thức thanh toán ở TP HCM'],
  promo: ['Doanh thu theo tháng', 'Tăng trưởng doanh thu so với tháng trước'],
  'compare-month': ['Doanh thu theo tháng của các cửa hàng ở Hà Nội', 'Top 5 cửa hàng doanh thu cao nhất quý 3'],
  overview: ['Doanh thu theo tháng', 'Top 5 cửa hàng doanh thu cao nhất tháng 10', 'Những đánh giá tiêu cực gần đây'],
}
export const followupsFor = (intent) => FOLLOWUPS[intent] || ['Doanh thu theo tháng', 'Món nào bán chạy nhất?', 'Những đánh giá tiêu cực gần đây']

/**
 * Trả lời một câu hỏi: hiểu ý → sinh SQL → chạy thật → nhận định.
 * Trả về tin nhắn của trợ lý để hiển thị / lưu lại.
 */
export async function answerQuestion(question, { source = 'Hỏi dữ liệu', sql: ctxSql, lastError } = {}) {
  const schema = isReady() ? getSchemaHints() : {}
  const a = ask(question, { sql: ctxSql, lastError, schema })
  const base = { role: 'assistant', id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, question, at: new Date().toISOString() }
  if (a.type !== 'sql' || !a.sql) {
    return { ...base, type: a.type, text: a.text, sql: a.sql || null, suggestions: a.suggestions || [] }
  }
  const { results, totalMs } = await runSQL(a.sql, { hooks: engineHooks, source })
  const res = results[results.length - 1]
  if (res.error) {
    return { ...base, type: 'error', title: a.title, text: `Mình đã viết được SQL nhưng khi chạy gặp lỗi: ${res.error}`, sql: a.sql }
  }
  const columns = res.columns, rows = res.rows.slice(0, 200)
  return {
    ...base, type: 'sql', intent: a.intent, title: a.title, explain: a.text, filters: a.filters || [],
    sql: a.sql, chart: a.chart, columns, rows, rowCount: res.rowCount, ms: totalMs,
    insight: buildInsight({ chart: a.chart, columns, rows, intent: a.intent }),
    followups: followupsFor(a.intent),
  }
}

/** Tên tệp SQL gọn từ tiêu đề: "Doanh thu theo tháng" → doanh_thu_theo_thang.sql */
export function fileNameFrom(title = 'truy_van') {
  return title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48) + '.sql'
}
