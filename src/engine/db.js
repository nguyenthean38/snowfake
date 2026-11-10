/* ==========================================================
   Động cơ SQL chạy trong trình duyệt (SQLite qua sql.js / WASM)
   - Nạp bộ dữ liệu mẫu Phố Núi, đăng ký các hàm AI tiếng Việt.
   - Hiểu thêm một số cú pháp quen thuộc của kho dữ liệu đám mây:
     USE, CREATE OR REPLACE, SHOW, DESCRIBE, tên đầy đủ DB.SCHEMA.BANG,
     ép kiểu ::, ILIKE, DATEADD, DATE_TRUNC(month, …)…
   - Mọi câu lệnh thay đổi dữ liệu được ghi lại vào localStorage và
     chạy lại khi tải trang, nên bảng người dùng tạo vẫn còn.
   ========================================================== */
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { SCHEMA_SQL, generateRows, HOLIDAY_SQL, weatherRows } from './seed'
import { registerAIFunctions } from './aiFunctions'

const LOG_KEY = 'lacviet-sql-log'
const META_KEY = 'lacviet-catalog'
const MAX_LOG_BYTES = 1_500_000

export const DEMO_TODAY = '2026-11-10'

/** Ngữ cảnh phiên làm việc (vai trò, kho tính toán, CSDL, lược đồ) */
export const ctx = { role: 'QUAN_TRI', warehouse: 'KHO_PHAN_TICH', user: 'MINHKHOA', database: 'PHO_NUI_DB', schema: 'BAN_HANG' }

/** Mô tả bảng mẫu (hiển thị trong Danh mục dữ liệu) */
export const TABLE_INFO = {
  DON_HANG: { comment: 'Mỗi dòng là một đơn hàng của chuỗi Phố Núi (bản lấy mẫu). Tổng tiền đã trừ giảm giá, đơn vị đồng.', owner: 'HE_THONG', tags: ['Bán hàng', 'Nhạy cảm: thấp'] },
  CHI_TIET_DON: { comment: 'Các món trong từng đơn hàng: số lượng, đơn giá tại thời điểm bán.', owner: 'HE_THONG', tags: ['Bán hàng'] },
  KHACH_HANG: { comment: 'Khách hàng thành viên. Số điện thoại đã được che một phần.', owner: 'HE_THONG', tags: ['Khách hàng', 'Dữ liệu cá nhân'] },
  CUA_HANG: { comment: 'Danh sách 20 cửa hàng của chuỗi trên 14 tỉnh, thành.', owner: 'HE_THONG', tags: ['Vận hành'] },
  SAN_PHAM: { comment: 'Thực đơn: giá bán, giá vốn theo từng món.', owner: 'HE_THONG', tags: ['Sản phẩm'] },
  DANH_GIA: { comment: 'Đánh giá của khách hàng (1–5 sao) kèm nội dung tự do — thích hợp để thử hàm AI_CAM_XUC.', owner: 'PHAN_TICH', tags: ['Khách hàng', 'Văn bản'] },
  KHUYEN_MAI: { comment: 'Các chương trình khuyến mãi trong năm.', owner: 'MARKETING', tags: ['Marketing'] },
  TINH_THANH: { comment: '34 tỉnh, thành phố sau sắp xếp đơn vị hành chính 2025.', owner: 'HE_THONG', tags: ['Tham chiếu'] },
  NGAY_LE_VN: { comment: 'Ngày lễ, ngày kỷ niệm năm 2026 (cài từ Chợ dữ liệu).', owner: 'QUAN_TRI', tags: ['Tham chiếu', 'Chợ dữ liệu'] },
  THOI_TIET_THANG: { comment: 'Nhiệt độ và lượng mưa trung bình theo tháng của 5 tỉnh, thành (dữ liệu mô phỏng, cài từ Chợ dữ liệu).', owner: 'QUAN_TRI', tags: ['Tham chiếu', 'Chợ dữ liệu'] },
}

const BASE_META = {
  databases: [
    { name: 'PHO_NUI_DB', comment: 'Dữ liệu vận hành của chuỗi cà phê Phố Núi', owner: 'HE_THONG', created: '2026-01-05', schemas: ['BAN_HANG', 'MARKETING', 'PUBLIC'] },
    { name: 'DU_LIEU_MAU', comment: 'Dữ liệu tham chiếu dùng chung', owner: 'HE_THONG', created: '2026-01-05', schemas: ['CONG_KHAI'] },
    { name: 'LAC_VIET', comment: 'Cơ sở dữ liệu hệ thống (chỉ đọc)', owner: 'LAC_VIET', created: '2025-12-01', schemas: ['THONG_TIN_TAI_KHOAN'], system: true },
  ],
  tables: {
    DON_HANG: ['PHO_NUI_DB', 'BAN_HANG'], CHI_TIET_DON: ['PHO_NUI_DB', 'BAN_HANG'], KHACH_HANG: ['PHO_NUI_DB', 'BAN_HANG'],
    CUA_HANG: ['PHO_NUI_DB', 'BAN_HANG'], SAN_PHAM: ['PHO_NUI_DB', 'BAN_HANG'], DANH_GIA: ['PHO_NUI_DB', 'MARKETING'],
    KHUYEN_MAI: ['PHO_NUI_DB', 'MARKETING'], TINH_THANH: ['DU_LIEU_MAU', 'CONG_KHAI'],
  },
}

/* ---------------- Lưu trữ cục bộ ---------------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* đầy bộ nhớ */ } }

let meta = structuredClone(BASE_META)
let log = []
let db = null
let ready = null
const listeners = new Set()
const metaListeners = new Set()

/** Đăng ký nhận bản ghi mỗi khi một câu truy vấn chạy xong (dùng cho Lịch sử truy vấn) */
export function onQuery(fn) { listeners.add(fn); return () => listeners.delete(fn) }
/** Đăng ký nhận thông báo khi danh mục (bảng/CSDL) thay đổi */
export function onCatalogChange(fn) { metaListeners.add(fn); return () => metaListeners.delete(fn) }
const emitMeta = () => metaListeners.forEach((f) => f())

function insertRows(table, rows) {
  if (!rows.length) return
  const ph = '(' + rows[0].map(() => '?').join(',') + ')'
  const st = db.prepare(`INSERT INTO ${table} VALUES ${ph}`)
  for (const r of rows) st.run(r)
  st.free()
}

/** Khởi động (một lần): tải WASM, tạo bảng, nạp dữ liệu, chạy lại thao tác cũ */
export function getDB() {
  if (ready) return ready
  ready = (async () => {
    const t0 = performance.now()
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    db = new SQL.Database()
    registerAIFunctions(db, ctx)
    db.run('BEGIN')
    db.run(SCHEMA_SQL)
    const rows = generateRows()
    for (const [t, r] of Object.entries(rows)) insertRows(t, r)
    db.run('COMMIT')
    const savedMeta = load(META_KEY, null)
    if (savedMeta?.databases) meta = savedMeta
    log = load(LOG_KEY, [])
    for (const s of log) { try { db.run(s) } catch { /* bỏ qua câu lỗi */ } }
    return { ms: Math.round(performance.now() - t0) }
  })()
  return ready
}

export const isReady = () => !!db

/** Xoá mọi thay đổi của người dùng, quay về dữ liệu mẫu ban đầu */
export async function resetDatabase() {
  localStorage.removeItem(LOG_KEY)
  localStorage.removeItem(META_KEY)
  meta = structuredClone(BASE_META)
  log = []
  db?.close()
  db = null
  ready = null
  await getDB()
  emitMeta()
}

/* ---------------- Tách câu lệnh ---------------- */
export function splitStatements(text) {
  const out = []
  let cur = '', i = 0, q = null
  while (i < text.length) {
    const c = text[i], n = text[i + 1]
    if (q) {
      cur += c
      if (c === q) { if (n === q) { cur += n; i += 2; continue } q = null }
      i++; continue
    }
    if (c === '-' && n === '-') { const e = text.indexOf('\n', i); const end = e < 0 ? text.length : e; cur += text.slice(i, end); i = end; continue }
    if (c === '/' && n === '*') { const e = text.indexOf('*/', i + 2); const end = e < 0 ? text.length : e + 2; cur += text.slice(i, end); i = end; continue }
    if (c === "'" || c === '"') { q = c; cur += c; i++; continue }
    if (c === ';') { if (stripComments(cur).trim()) out.push(cur.trim()); cur = ''; i++; continue }
    cur += c; i++
  }
  if (stripComments(cur).trim()) out.push(cur.trim())
  return out
}
export function stripComments(s) {
  return s.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

/* ---------------- Danh mục ---------------- */
const up = (s) => String(s || '').replace(/"/g, '').toUpperCase()
const dbNames = () => meta.databases.map((d) => d.name)
const schemaNames = () => meta.databases.flatMap((d) => d.schemas)

function sqliteObjects() {
  if (!db) return []
  const r = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name")
  return r[0]?.values.map(([name, type]) => ({ name, type })) ?? []
}

/** Toàn bộ cây danh mục: CSDL › lược đồ › bảng (kèm cột và số dòng) */
export function getCatalog({ withCounts = true } = {}) {
  const objs = sqliteObjects()
  const tree = meta.databases.map((d) => ({ ...d, schemas: d.schemas.map((s) => ({ name: s, tables: [] })) }))
  for (const o of objs) {
    const loc = meta.tables[o.name] || [ctx.database, 'PUBLIC']
    let dbn = tree.find((d) => d.name === loc[0]) || tree[0]
    let sch = dbn.schemas.find((s) => s.name === loc[1]) || dbn.schemas[0]
    const cols = db.exec(`PRAGMA table_info("${o.name}")`)[0]?.values.map((c) => ({ name: c[1], type: niceType(c[2]), pk: !!c[5], nullable: !c[3] })) ?? []
    let rows = null
    if (withCounts) { try { rows = db.exec(`SELECT COUNT(*) FROM "${o.name}"`)[0].values[0][0] } catch { rows = null } }
    sch.tables.push({
      name: o.name, kind: o.type === 'view' ? 'Khung nhìn' : 'Bảng', columns: cols, rows,
      bytes: rows != null ? Math.round(rows * cols.length * 11.5 + 2048) : null,
      database: dbn.name, schema: sch.name, fqn: `${dbn.name}.${sch.name}.${o.name}`,
      ...(TABLE_INFO[o.name] || { comment: '', owner: ctx.role, tags: [] }),
    })
  }
  return tree
}
export function niceType(t = '') {
  const x = t.toUpperCase()
  if (!x) return 'VARIANT'
  if (x.includes('INT')) return 'NUMBER'
  if (x.includes('BOOL')) return 'BOOLEAN'
  if (x.includes('TIMESTAMP')) return 'TIMESTAMP'
  if (x === 'DATE') return 'DATE'
  if (x.includes('REAL') || x.includes('FLOA') || x.includes('DOUB') || x.includes('NUM') || x.includes('DEC')) return 'NUMBER'
  return 'VARCHAR'
}
/** Danh sách tên bảng + cột (cho gợi ý tự hoàn thành) */
export function getSchemaHints() {
  const out = {}
  for (const o of sqliteObjects()) {
    out[o.name] = db.exec(`PRAGMA table_info("${o.name}")`)[0]?.values.map((c) => c[1]) ?? []
  }
  return out
}

/* ---------------- Tiền xử lý cú pháp ---------------- */
function preprocess(sql) {
  let s = sql
  s = s.replace(/::\s*[A-Za-z_]+(\s*\(\s*\d+(\s*,\s*\d+)?\s*\))?/g, '')
  s = s.replace(/\bILIKE\b/gi, 'LIKE')
  s = s.replace(/\bCURRENT_DATE\s*\(\s*\)|\bCURRENT_DATE\b/gi, `DATE('${DEMO_TODAY}')`)
  s = s.replace(/\bCURRENT_TIMESTAMP\s*\(\s*\)/gi, `DATETIME('${DEMO_TODAY} 10:15:00')`)
  s = s.replace(/\b(DATE_TRUNC|DATEADD|DATEDIFF|DATE_PART)\s*\(\s*([A-Za-z]+)\s*,/gi, (m, f, p) => `${f.toUpperCase()}('${p.toLowerCase()}',`)
  s = s.replace(/\bTO_CHAR\s*\(\s*([^,]+),\s*'YYYY-MM'\s*\)/gi, "STRFTIME('%Y-%m', $1)")
  // Tên đầy đủ DB.SCHEMA.BANG → BANG ; SCHEMA.BANG → BANG
  const dbs = new Set(dbNames()), schs = new Set(schemaNames())
  s = s.replace(/\b("?[A-Za-z_][\w$]*"?)\.("?[A-Za-z_][\w$]*"?)\.("?[A-Za-z_][\w$]*"?)/g, (m, a, b, c) => (dbs.has(up(a)) ? c : m))
  s = s.replace(/\b("?[A-Za-z_][\w$]*"?)\.("?[A-Za-z_][\w$]*"?)/g, (m, a, b) => (schs.has(up(a)) && !/^\d/.test(b) ? b : m))
  s = s.replace(/\b(NUMBER|DECIMAL|NUMERIC)\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'NUMERIC')
  s = s.replace(/\bSTRING\b/gi, 'TEXT')
  return s
}

const KINDS = {
  SELECT: 'select', WITH: 'select', VALUES: 'select', PRAGMA: 'select',
  INSERT: 'dml', UPDATE: 'dml', DELETE: 'dml', MERGE: 'dml',
  CREATE: 'ddl', DROP: 'ddl', ALTER: 'ddl', TRUNCATE: 'ddl',
}

function metaResult(message, extra = {}) {
  return { kind: 'meta', columns: ['TRẠNG THÁI'], rows: [[message]], rowCount: 1, message, ...extra }
}

function addDatabase(name) {
  const n = up(name)
  if (!meta.databases.find((d) => d.name === n)) meta.databases.push({ name: n, comment: '', owner: ctx.role, created: DEMO_TODAY, schemas: ['PUBLIC'] })
}
function addSchema(name) {
  const parts = up(name).split('.')
  const [dbn, sn] = parts.length > 1 ? parts : [ctx.database, parts[0]]
  addDatabase(dbn)
  const d = meta.databases.find((x) => x.name === dbn)
  if (!d.schemas.includes(sn)) d.schemas.push(sn)
}

/** Xử lý các câu lệnh "hành chính" không cần SQLite. Trả về null nếu không khớp. */
function handleMeta(raw, hooks) {
  const s = stripComments(raw).trim().replace(/;$/, '')
  let m
  if ((m = s.match(/^USE\s+(ROLE|WAREHOUSE|DATABASE|SCHEMA)\s+("?[\w.]+"?)$/i))) {
    const what = m[1].toUpperCase(), val = up(m[2])
    if (what === 'ROLE') ctx.role = val
    if (what === 'WAREHOUSE') { ctx.warehouse = val; hooks?.onWarehouse?.(val) }
    if (what === 'DATABASE') { addDatabase(val); ctx.database = val; ctx.schema = 'PUBLIC' }
    if (what === 'SCHEMA') { const p = val.split('.'); if (p.length > 1) { ctx.database = p[0]; ctx.schema = p[1] } else ctx.schema = val; addSchema(`${ctx.database}.${ctx.schema}`) }
    save(META_KEY, meta); emitMeta()
    return metaResult(`Câu lệnh thực thi thành công. Đang dùng ${what === 'ROLE' ? 'vai trò' : what === 'WAREHOUSE' ? 'kho tính toán' : what === 'DATABASE' ? 'cơ sở dữ liệu' : 'lược đồ'} ${val}.`)
  }
  if ((m = s.match(/^USE\s+("?[\w.]+"?)$/i))) return handleMeta(`USE DATABASE ${m[1]}`, hooks)
  if ((m = s.match(/^CREATE\s+(OR\s+REPLACE\s+)?DATABASE\s+(IF\s+NOT\s+EXISTS\s+)?("?[\w]+"?)/i))) {
    addDatabase(m[3]); ctx.database = up(m[3]); ctx.schema = 'PUBLIC'; save(META_KEY, meta); emitMeta()
    return metaResult(`Cơ sở dữ liệu ${up(m[3])} đã được tạo.`)
  }
  if ((m = s.match(/^CREATE\s+(OR\s+REPLACE\s+)?SCHEMA\s+(IF\s+NOT\s+EXISTS\s+)?("?[\w.]+"?)/i))) {
    addSchema(m[3]); const p = up(m[3]).split('.'); ctx.schema = p[p.length - 1]; save(META_KEY, meta); emitMeta()
    return metaResult(`Lược đồ ${up(m[3])} đã được tạo.`)
  }
  if ((m = s.match(/^CREATE\s+(OR\s+REPLACE\s+)?WAREHOUSE\s+(IF\s+NOT\s+EXISTS\s+)?("?[\w]+"?)/i))) {
    hooks?.onCreateWarehouse?.(up(m[3]))
    return metaResult(`Kho tính toán ${up(m[3])} đã được tạo.`)
  }
  if (/^SHOW\s+(TERSE\s+)?TABLES/i.test(s)) {
    const rows = getCatalog().flatMap((d) => d.schemas.flatMap((sc) => sc.tables.filter((t) => t.kind === 'Bảng').map((t) => [t.name, d.name, sc.name, t.rows, t.owner, t.comment])))
    return { kind: 'select', columns: ['TÊN', 'CƠ_SỞ_DỮ_LIỆU', 'LƯỢC_ĐỒ', 'SỐ_DÒNG', 'CHỦ_SỞ_HỮU', 'GHI_CHÚ'], rows, rowCount: rows.length }
  }
  if (/^SHOW\s+VIEWS/i.test(s)) {
    const rows = getCatalog().flatMap((d) => d.schemas.flatMap((sc) => sc.tables.filter((t) => t.kind !== 'Bảng').map((t) => [t.name, d.name, sc.name])))
    return { kind: 'select', columns: ['TÊN', 'CƠ_SỞ_DỮ_LIỆU', 'LƯỢC_ĐỒ'], rows, rowCount: rows.length }
  }
  if (/^SHOW\s+DATABASES/i.test(s)) {
    const rows = meta.databases.map((d) => [d.name, d.owner, d.created, d.comment])
    return { kind: 'select', columns: ['TÊN', 'CHỦ_SỞ_HỮU', 'NGÀY_TẠO', 'GHI_CHÚ'], rows, rowCount: rows.length }
  }
  if (/^SHOW\s+SCHEMAS/i.test(s)) {
    const rows = meta.databases.flatMap((d) => d.schemas.map((sc) => [sc, d.name]))
    return { kind: 'select', columns: ['TÊN', 'CƠ_SỞ_DỮ_LIỆU'], rows, rowCount: rows.length }
  }
  if (/^SHOW\s+WAREHOUSES/i.test(s)) {
    const rows = (hooks?.listWarehouses?.() || []).map((w) => [w.name, w.state, w.size, w.type, w.autoSuspend])
    return { kind: 'select', columns: ['TÊN', 'TRẠNG_THÁI', 'CỠ', 'LOẠI', 'TỰ_TẠM_DỪNG_GIÂY'], rows, rowCount: rows.length }
  }
  if (/^SHOW\s+(USER\s+)?FUNCTIONS/i.test(s)) {
    const rows = [
      ['AI_CAM_XUC', '(văn_bản)', 'Phân loại cảm xúc: Tích cực / Tiêu cực / Trung tính'],
      ['AI_DIEM_CAM_XUC', '(văn_bản)', 'Điểm cảm xúc từ −1 đến 1'],
      ['AI_PHAN_LOAI', '(văn_bản, \'nhãn1, nhãn2\')', 'Gán văn bản vào nhãn phù hợp nhất'],
      ['AI_TOM_TAT', '(văn_bản)', 'Tóm tắt ý chính'],
      ['AI_TRICH_XUAT', '(văn_bản, \'mon|van_de|email|so_dien_thoai\')', 'Trích thông tin từ văn bản'],
      ['AI_DICH', '(văn_bản)', 'Dịch sang tiếng Anh (bản minh hoạ)'],
      ['KHONG_DAU', '(văn_bản)', 'Bỏ dấu tiếng Việt'],
      ['DINH_DANG_VND', '(số)', 'Định dạng tiền đồng: 1.250.000 ₫'],
      ['THU_TRONG_TUAN', '(ngày)', 'Thứ trong tuần bằng tiếng Việt'],
      ['DATE_TRUNC', '(đơn_vị, ngày)', 'Làm tròn ngày theo năm / quý / tháng / tuần / ngày / giờ'],
      ['DATEADD, DATEDIFF', '(đơn_vị, n, ngày)', 'Cộng / tính khoảng cách thời gian'],
      ['IFF, DIV0, ZEROIFNULL', '…', 'Hàm tiện ích quen thuộc'],
    ]
    return { kind: 'select', columns: ['TÊN_HÀM', 'THAM_SỐ', 'MÔ_TẢ'], rows, rowCount: rows.length }
  }
  if ((m = s.match(/^(DESCRIBE|DESC)\s+(TABLE\s+|VIEW\s+)?("?[\w.]+"?)$/i))) {
    const name = up(m[3]).split('.').pop()
    const r = db.exec(`PRAGMA table_info("${name}")`)[0]
    if (!r) throw new Error(`Không tìm thấy bảng '${name}' hoặc bạn không có quyền truy cập.`)
    const rows = r.values.map((c) => [c[1], niceType(c[2]), c[3] ? 'N' : 'Y', c[5] ? 'Y' : 'N', c[4]])
    return { kind: 'select', columns: ['TÊN_CỘT', 'KIỂU', 'CHO_PHÉP_RỖNG', 'KHOÁ_CHÍNH', 'MẶC_ĐỊNH'], rows, rowCount: rows.length }
  }
  if (/^(ALTER\s+WAREHOUSE|GRANT|REVOKE|COMMENT\s+ON)\b/i.test(s)) return metaResult('Câu lệnh thực thi thành công.')
  return null
}

/** Dịch thông báo lỗi SQLite sang tiếng Việt dễ hiểu */
export function translateError(msg = '') {
  let m
  if ((m = msg.match(/no such table: (\S+)/i))) return `Không tìm thấy bảng '${m[1].toUpperCase()}' hoặc bạn không có quyền truy cập.`
  if ((m = msg.match(/no such column: (\S+)/i))) return `Cột không hợp lệ '${m[1].toUpperCase()}'.`
  if ((m = msg.match(/no such function: (\S+)/i))) return `Hàm không xác định '${m[1].toUpperCase()}'.`
  if ((m = msg.match(/near "(.+?)": syntax error/i))) return `Lỗi cú pháp gần '${m[1]}'.`
  if (/incomplete input/i.test(msg)) return 'Câu lệnh chưa hoàn chỉnh (thiếu dấu đóng ngoặc hoặc từ khoá?).'
  if ((m = msg.match(/table (\S+) already exists/i))) return `Bảng '${m[1].toUpperCase()}' đã tồn tại. Dùng CREATE OR REPLACE TABLE để ghi đè.`
  if (/ambiguous column name: (\S+)/i.test(msg)) return `Tên cột '${msg.split(':').pop().trim().toUpperCase()}' bị trùng giữa nhiều bảng, hãy ghi rõ tên bảng.`
  if (/UNIQUE constraint failed/i.test(msg)) return 'Vi phạm ràng buộc duy nhất: giá trị khoá đã tồn tại.'
  if (/misuse of aggregate/i.test(msg)) return 'Dùng hàm tổng hợp sai chỗ (có thể thiếu GROUP BY).'
  if (/must appear in the GROUP BY|not an aggregate/i.test(msg)) return 'Cột phải nằm trong GROUP BY hoặc được tổng hợp.'
  return msg
}

let qid = 0
function newQueryId() {
  qid++
  const h = (Date.now() + qid).toString(16).padStart(12, '0')
  return `01c7${h.slice(-4)}-000a-${h.slice(-8, -4)}-0005-${String(5282000 + qid).padStart(12, '0')}`
}

/**
 * Chạy một hoặc nhiều câu lệnh.
 * Trả về { results: [{ sql, kind, columns, rows, rowCount, ms, message?, error? }], totalMs }
 * hooks: { onWarehouse, onCreateWarehouse, listWarehouses } để đồng bộ với kho trạng thái giao diện.
 */
export async function runSQL(text, { maxRows = 10000, hooks, source = 'Không gian làm việc', silent = false } = {}) {
  await getDB()
  const stmts = splitStatements(text)
  const results = []
  const T0 = performance.now()
  for (const raw of stmts) {
    const t0 = performance.now()
    let res
    try {
      res = handleMeta(raw, hooks)
      if (!res) {
        let sql = preprocess(stripComments(raw).trim())
        const first = (sql.match(/^\s*(\w+)/)?.[1] || '').toUpperCase()
        const kind = KINDS[first] || 'other'
        // CREATE OR REPLACE TABLE/VIEW → xoá rồi tạo lại
        let m = sql.match(/^CREATE\s+OR\s+REPLACE\s+(TRANSIENT\s+|TEMPORARY\s+)?(TABLE|VIEW)\s+("?[\w]+"?)/i)
        let target = null
        if (m) {
          target = up(m[3])
          sql = sql.replace(/^CREATE\s+OR\s+REPLACE\s+(TRANSIENT\s+|TEMPORARY\s+)?/i, 'CREATE ')
          const drop = `DROP ${m[2].toUpperCase()} IF EXISTS "${target}"`
          db.run(drop)
          persist(drop)
        }
        m = sql.match(/^CREATE\s+(TABLE|VIEW)\s+(IF\s+NOT\s+EXISTS\s+)?("?[\w]+"?)/i)
        if (m) target = up(m[3])
        if (kind === 'select') {
          const r = db.exec(sql)
          const last = r[r.length - 1]
          const rows = last?.values ?? []
          res = { kind, columns: last?.columns ?? [], rows: rows.slice(0, maxRows), rowCount: rows.length, truncated: rows.length > maxRows }
        } else {
          db.run(sql)
          const changes = db.getRowsModified()
          if (kind === 'dml' || kind === 'ddl') persist(sql)
          if (target && /^CREATE/i.test(sql)) {
            meta.tables[target] = [ctx.database, ctx.schema]
            addSchema(`${ctx.database}.${ctx.schema}`)
            save(META_KEY, meta); emitMeta()
          }
          if (/^DROP/i.test(sql)) emitMeta()
          const msg = kind === 'dml'
            ? `${changes.toLocaleString('vi-VN')} dòng bị ảnh hưởng.`
            : target ? `${/VIEW/i.test(sql) ? 'Khung nhìn' : 'Bảng'} ${target} đã được tạo thành công.` : 'Câu lệnh thực thi thành công.'
          res = { kind, columns: kind === 'dml' ? ['SỐ_DÒNG_ẢNH_HƯỞNG'] : ['TRẠNG_THÁI'], rows: [[kind === 'dml' ? changes : msg]], rowCount: 1, message: msg }
        }
      }
    } catch (e) {
      res = { kind: 'error', error: translateError(e.message), rawError: e.message, columns: [], rows: [], rowCount: 0 }
    }
    res.sql = raw
    res.ms = Math.max(1, Math.round(performance.now() - t0))
    res.id = newQueryId()
    results.push(res)
    if (!silent) {
      const rec = {
        id: res.id, sql: raw, status: res.error ? 'Lỗi' : 'Thành công', error: res.error, ms: res.ms, rows: res.rowCount,
        user: ctx.user, role: ctx.role, warehouse: ctx.warehouse, size: 'X-Small', startedAt: Date.now(), source,
        bytes: res.kind === 'select' ? Math.round(res.rowCount * (res.columns.length || 1) * 9.6) : 0, kind: res.kind,
      }
      listeners.forEach((f) => f(rec))
    }
    if (res.error) break
  }
  return { results, totalMs: Math.max(1, Math.round(performance.now() - T0)) }
}

function persist(sql) {
  log.push(sql)
  const size = log.reduce((s, x) => s + x.length, 0)
  if (size < MAX_LOG_BYTES) save(LOG_KEY, log)
}

/** Truy vấn nhanh nội bộ (không ghi lịch sử). Trả về mảng object. */
export async function query(sql) {
  await getDB()
  const r = db.exec(preprocess(sql))
  const last = r[r.length - 1]
  if (!last) return []
  return last.values.map((v) => Object.fromEntries(last.columns.map((c, i) => [c, v[i]])))
}

/** Tạo bảng từ dữ liệu CSV đã phân tích (Nạp dữ liệu) */
export async function createTableFromRows({ name, columns, rows, database = ctx.database, schema = ctx.schema, replace = true }) {
  await getDB()
  const t = up(name).replace(/[^\w]/g, '_')
  const colDefs = columns.map((c) => `"${c.name}" ${c.type === 'NUMBER' ? 'NUMERIC' : c.type === 'BOOLEAN' ? 'BOOLEAN' : c.type === 'DATE' ? 'DATE' : 'TEXT'}`).join(', ')
  const stmts = []
  if (replace) stmts.push(`DROP TABLE IF EXISTS "${t}"`)
  stmts.push(`CREATE TABLE "${t}" (${colDefs})`)
  const esc = (v, type) => (v === '' || v == null ? 'NULL' : type === 'NUMBER' && !isNaN(+v) ? String(+v) : `'${String(v).replace(/'/g, "''")}'`)
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200).map((r) => '(' + columns.map((c, j) => esc(r[j], c.type)).join(',') + ')').join(',')
    stmts.push(`INSERT INTO "${t}" VALUES ${chunk}`)
  }
  db.run('BEGIN')
  for (const s of stmts) { db.run(s); persist(s) }
  db.run('COMMIT')
  meta.tables[t] = [up(database), up(schema)]
  addSchema(`${up(database)}.${up(schema)}`)
  save(META_KEY, meta); emitMeta()
  return { table: t, fqn: `${up(database)}.${up(schema)}.${t}`, rows: rows.length }
}

/** Cài bộ dữ liệu từ Chợ dữ liệu vào CSDL DU_LIEU_MAU */
export async function installListing(id) {
  await getDB()
  const run = (s) => { db.run(s); persist(s) }
  if (id === 'ngay-le') {
    run('DROP TABLE IF EXISTS NGAY_LE_VN')
    for (const s of splitStatements(HOLIDAY_SQL)) run(s)
    meta.tables.NGAY_LE_VN = ['DU_LIEU_MAU', 'CONG_KHAI']
  }
  if (id === 'thoi-tiet') {
    run('DROP TABLE IF EXISTS THOI_TIET_THANG')
    run('CREATE TABLE THOI_TIET_THANG (THANG DATE, MA_TINH TEXT, TEN_TINH TEXT, NHIET_DO_TB NUMERIC, LUONG_MUA_MM INTEGER)')
    const vals = weatherRows().map((r) => `('${r[0]}','${r[1]}','${r[2]}',${r[3]},${r[4]})`).join(',')
    run(`INSERT INTO THOI_TIET_THANG VALUES ${vals}`)
    meta.tables.THOI_TIET_THANG = ['DU_LIEU_MAU', 'CONG_KHAI']
  }
  save(META_KEY, meta); emitMeta()
}

/** Xoá bảng (từ trình duyệt dữ liệu) */
export async function dropObject(name, kind = 'TABLE') {
  await getDB()
  const s = `DROP ${kind} IF EXISTS "${up(name)}"`
  db.run(s); persist(s)
  delete meta.tables[up(name)]
  save(META_KEY, meta); emitMeta()
}

export function getContext() { return { ...ctx } }
export function setContext(patch) { Object.assign(ctx, patch) }
