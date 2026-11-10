/* ==========================================================
   Tiện ích cho trình soạn SQL
   - statementsWithOffsets / statementAt: tìm câu lệnh dưới con trỏ
   - lineDiff: so sánh hai phiên bản theo dòng (LCS)
   - tokenizeSQL: tô màu SQL dạng tĩnh (khung trả lời của Tinh Ý)
   ========================================================== */

/** Tách câu lệnh, giữ vị trí bắt đầu / kết thúc trong văn bản gốc */
export function statementsWithOffsets(text) {
  const out = []
  let start = 0, i = 0, q = null
  const push = (end) => {
    const raw = text.slice(start, end)
    const stripped = raw.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
    if (stripped) {
      const lead = raw.length - raw.trimStart().length
      out.push({ from: start + lead, to: end, text: raw.trim() })
    }
  }
  while (i < text.length) {
    const c = text[i], n = text[i + 1]
    if (q) {
      if (c === q) { if (n === q) { i += 2; continue } q = null }
      i++; continue
    }
    if (c === '-' && n === '-') { const e = text.indexOf('\n', i); i = e < 0 ? text.length : e; continue }
    if (c === '/' && n === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? text.length : e + 2; continue }
    if (c === "'" || c === '"') { q = c; i++; continue }
    if (c === ';') { push(i); start = i + 1; i++; continue }
    i++
  }
  push(text.length)
  return out
}

/** Câu lệnh chứa vị trí con trỏ (hoặc câu gần nhất phía trước) */
export function statementAt(text, pos) {
  const list = statementsWithOffsets(text)
  if (!list.length) return null
  // con trỏ nằm trong câu (tính cả dấu ; ngay sau câu)
  const inside = list.find((s) => pos >= s.from && pos <= s.to + 1)
  if (inside) return inside
  // con trỏ ở khoảng trắng/chú thích: lấy câu ngay phía trước, nếu không có thì câu đầu tiên phía sau
  const before = [...list].reverse().find((s) => s.to < pos)
  return before || list[0]
}

/** So sánh theo dòng. Trả về [{ type: 'same'|'add'|'del', text }] — add: có ở b, del: chỉ có ở a */
export function lineDiff(a = '', b = '') {
  const A = a.split('\n'), B = b.split('\n')
  const n = A.length, m = B.length
  if (n * m > 4_000_000) return [...A.map((t) => ({ type: 'del', text: t })), ...B.map((t) => ({ type: 'add', text: t }))]
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: 'same', text: A[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i] }); i++ }
    else { out.push({ type: 'add', text: B[j] }); j++ }
  }
  while (i < n) out.push({ type: 'del', text: A[i++] })
  while (j < m) out.push({ type: 'add', text: B[j++] })
  return out
}

const KW = new Set(('select from where group by order having limit join left right inner outer full cross on and or not as with union all insert into values update set delete create replace table view database schema use distinct case when then else end in is null like between over partition desc asc show describe drop alter if exists primary key default true false lag lead window rows range').split(' '))
const FN = /^(COUNT|SUM|AVG|MIN|MAX|ROUND|DATE|DATE_TRUNC|DATEADD|DATEDIFF|YEAR|MONTH|DAY|HOUR|QUARTER|IFF|DIV0|COALESCE|CAST|LAG|LEAD|ROW_NUMBER|RANK|STRFTIME|DAYOFWEEK|THU_TRONG_TUAN|KHONG_DAU|DINH_DANG_VND|CURRENT_DATE|AI_[A-Z_]+)$/i

/** Tách SQL thành mảng token { t: 'kw'|'str'|'num'|'cmt'|'fn'|'txt', v } để hiển thị tĩnh */
export function tokenizeSQL(sql = '') {
  const out = []
  const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w$]*)|(\s+|[^\w\s'])/g
  let m
  while ((m = re.exec(sql))) {
    if (m[1]) out.push({ t: 'cmt', v: m[1] })
    else if (m[2]) out.push({ t: 'str', v: m[2] })
    else if (m[3]) out.push({ t: 'num', v: m[3] })
    else if (m[4]) {
      const w = m[4]
      const next = sql.slice(re.lastIndex).match(/^\s*\(/)
      if (KW.has(w.toLowerCase())) out.push({ t: 'kw', v: w })
      else if (next && FN.test(w)) out.push({ t: 'fn', v: w })
      else out.push({ t: 'txt', v: w })
    } else out.push({ t: 'txt', v: m[5] })
  }
  return out
}

/** Tên tệp an toàn từ tiêu đề: "Doanh thu theo tháng" → "doanh_thu_theo_thang.sql" */
export function slugFile(title = 'truy_van') {
  const s = String(title).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
  return (s || 'truy_van') + '.sql'
}
