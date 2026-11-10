/* ==========================================================
   Tinh Ý — trợ lý AI hiểu câu hỏi tiếng Việt về dữ liệu Phố Núi
   Cách làm: nhận diện ý định + bộ lọc (tỉnh, tháng, quý, số ngày,
   top N, kênh…) bằng quy tắc, rồi sinh câu SQL chạy thật trên
   động cơ trong trình duyệt. Không gọi mô hình ngôn ngữ bên ngoài.
   ========================================================== */
import { stripAccents } from '@/lib/format'
import { PROVINCES, STORES, PRODUCTS } from '@/data/reference'

const n = (s) => ' ' + stripAccents(String(s || '')).toLowerCase().replace(/[^a-z0-9%\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
const any = (q, list) => list.some((w) => q.includes(w))

/* ---------------- Bộ lọc trích từ câu hỏi ---------------- */
function parseFilters(q) {
  const f = { where: [], label: [] }
  // tỉnh / thành phố
  const provAlias = [['ha noi', 'Hà Nội'], ['hn ', 'Hà Nội'], ['sai gon', 'TP. Hồ Chí Minh'], ['tp hcm', 'TP. Hồ Chí Minh'], ['hcm', 'TP. Hồ Chí Minh'], ['ho chi minh', 'TP. Hồ Chí Minh'], ['da nang', 'Đà Nẵng'], ['da lat', 'Lâm Đồng'], ['buon ma thuot', 'Đắk Lắk'], ['nha trang', 'Khánh Hòa'], ['pleiku', 'Gia Lai'], ['ha long', 'Quảng Ninh'], ['bien hoa', 'Đồng Nai'], ['vinh ', 'Nghệ An']]
  for (const p of PROVINCES) provAlias.push([stripAccents(p.name).toLowerCase().replace('tp. ', ''), p.name])
  const found = provAlias.find(([a]) => q.includes(' ' + a.trim() + ' ') || q.includes(' ' + a.trim()))
  if (found) { f.province = found[1]; f.label.push(found[1]) }
  // vùng miền
  if (!f.province) {
    if (any(q, [' mien bac', ' phia bac'])) { f.region = 'Miền Bắc'; f.label.push('Miền Bắc') }
    else if (any(q, [' mien trung'])) { f.region = 'Miền Trung'; f.label.push('Miền Trung') }
    else if (any(q, [' mien nam', ' phia nam'])) { f.region = 'Miền Nam'; f.label.push('Miền Nam') }
  }
  // thời gian
  let m
  if ((m = q.match(/ thang (\d{1,2})( nam 2026)? /)) && +m[1] >= 1 && +m[1] <= 12) {
    f.month = +m[1]; f.label.push(`tháng ${f.month}/2026`)
  } else if ((m = q.match(/ quy (\d|i{1,3}|iv) /))) {
    const map = { i: 1, ii: 2, iii: 3, iv: 4 }
    f.quarter = +m[1] || map[m[1]]; f.label.push(`quý ${f.quarter}/2026`)
  } else if ((m = q.match(/ (\d{1,3}) ngay (qua|gan|vua|cuoi)/))) {
    f.days = +m[1]; f.label.push(`${f.days} ngày qua`)
  } else if (any(q, [' tuan nay', ' tuan qua', ' 7 ngay'])) { f.days = 7; f.label.push('7 ngày qua') }
  else if (any(q, [' thang nay'])) { f.month = 11; f.label.push('tháng 11/2026') }
  else if (any(q, [' thang truoc', ' thang vua roi'])) { f.month = 10; f.label.push('tháng 10/2026') }
  else if (any(q, [' hom qua'])) { f.day = '2026-11-09'; f.label.push('hôm qua') }
  else if (any(q, [' hom nay'])) { f.day = '2026-11-10'; f.label.push('hôm nay') }
  // top N
  if ((m = q.match(/ (top|nhat|dau) (\d{1,2}) /)) || (m = q.match(/ (\d{1,2}) (cua hang|san pham|mon|khach)/))) f.top = Math.min(50, +m[2] || +m[1])
  // kênh
  if (any(q, [' giao hang', ' ship'])) f.channel = 'Giao hàng'
  else if (any(q, [' ung dung', ' app '])) f.channel = 'Ứng dụng'
  else if (any(q, [' tai quay', ' tai cho'])) f.channel = 'Tại quầy'
  return f
}

/** Điều kiện WHERE cho bảng DON_HANG (bí danh d) + CUA_HANG (bí danh c) */
function orderWhere(f, { needStore } = {}) {
  const w = ["d.TRANG_THAI = 'Hoàn tất'"]
  if (f.month) w.push(`MONTH(d.NGAY_DAT) = ${f.month}`)
  if (f.quarter) w.push(`QUARTER(d.NGAY_DAT) = ${f.quarter}`)
  if (f.days) w.push(`d.NGAY_DAT >= DATEADD(day, -${f.days}, CURRENT_DATE())`)
  if (f.day) w.push(`DATE(d.NGAY_DAT) = '${f.day}'`)
  if (f.channel) w.push(`d.KENH = '${f.channel}'`)
  if (f.province) w.push(`c.TINH_THANH = '${f.province}'`)
  if (f.region) w.push(`c.VUNG = '${f.region}'`)
  return { sql: w.join('\n  AND '), needStore: needStore || !!(f.province || f.region) }
}
const storeJoin = (need) => (need ? '\nJOIN CUA_HANG c ON c.MA_CH = d.MA_CH' : '')
const scope = (f) => (f.label.length ? ` (${f.label.join(', ')})` : '')

/* ---------------- Danh sách ý định ---------------- */
const INTENTS = [
  {
    id: 'revenue-month',
    test: (q) => any(q, ['doanh thu', 'doanh so', 'ban duoc', 'so don', 'don hang', 'don giao', 'don ']) && any(q, ['theo thang', 'tung thang', 'moi thang', 'xu huong', 'qua cac thang', 'bieu do doanh thu']),
    build: (f) => {
      const w = orderWhere({ ...f, month: null })
      return {
        title: `Doanh thu theo tháng${scope({ ...f, label: f.label.filter((x) => !x.startsWith('tháng')) })}`,
        sql: `SELECT DATE_TRUNC('month', d.NGAY_DAT) AS THANG,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       COUNT(*) AS SO_DON\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY 1;`,
        chart: { type: 'line', x: 'THANG', y: 'DOANH_THU' },
        explain: 'Mình gom đơn hàng hoàn tất theo tháng (DATE_TRUNC) rồi cộng tổng tiền sau giảm giá.',
      }
    },
  },
  {
    id: 'store-ranking',
    test: (q) => any(q, ['cua hang', 'chi nhanh']) && any(q, ['doanh thu', 'ban chay', 'tot nhat', 'cao nhat', 'top', 'xep hang', 'nhieu nhat', 'kem nhat', 'thap nhat', 'so sanh']),
    build: (f, q) => {
      const asc = any(q, ['kem nhat', 'thap nhat', 'it nhat'])
      const w = orderWhere(f, { needStore: true })
      return {
        title: `${asc ? 'Cửa hàng doanh thu thấp nhất' : 'Xếp hạng cửa hàng theo doanh thu'}${scope(f)}`,
        sql: `SELECT c.TEN_CUA_HANG, c.TINH_THANH,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       COUNT(*) AS SO_DON,\n       ROUND(AVG(d.TONG_TIEN)) AS GIA_TRI_DON_TB\nFROM DON_HANG d\nJOIN CUA_HANG c ON c.MA_CH = d.MA_CH\nWHERE ${w.sql}\nGROUP BY 1, 2\nORDER BY DOANH_THU ${asc ? 'ASC' : 'DESC'}\nLIMIT ${f.top || 10};`,
        chart: { type: 'bar', x: 'TEN_CUA_HANG', y: 'DOANH_THU', horizontal: true },
        explain: 'Mình nối DON_HANG với CUA_HANG để lấy tên và tỉnh, rồi xếp hạng theo tổng doanh thu.',
      }
    },
  },
  {
    id: 'product-top',
    test: (q) => any(q, ['san pham', 'mon ', 'do uong', 'thuc don', 'mon nao', 'ban chay']) && !any(q, ['nhom', 'loi nhuan', 'bien']),
    build: (f, q) => {
      const byQty = any(q, ['so luong', 'so ly', 'nhieu ly', 'ban chay'])
      const w = orderWhere(f)
      return {
        title: `Món bán chạy nhất${scope(f)}`,
        sql: `SELECT p.TEN_SAN_PHAM, p.NHOM,\n       SUM(ct.SO_LUONG) AS SO_LUONG,\n       SUM(ct.THANH_TIEN) AS DOANH_THU\nFROM CHI_TIET_DON ct\nJOIN DON_HANG d ON d.MA_DON = ct.MA_DON${storeJoin(w.needStore)}\nJOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP\nWHERE ${w.sql}\nGROUP BY 1, 2\nORDER BY ${byQty ? 'SO_LUONG' : 'DOANH_THU'} DESC\nLIMIT ${f.top || 10};`,
        chart: { type: 'bar', x: 'TEN_SAN_PHAM', y: byQty ? 'SO_LUONG' : 'DOANH_THU', horizontal: true },
        explain: `Mình cộng số lượng và thành tiền của từng món trong CHI_TIET_DON, chỉ tính đơn đã hoàn tất, rồi sắp xếp theo ${byQty ? 'số lượng bán' : 'doanh thu'}.`,
      }
    },
  },
  {
    id: 'margin-group',
    test: (q) => any(q, ['loi nhuan', 'bien loi', 'lai gop', 'gia von', 'margin']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Lãi gộp theo nhóm sản phẩm${scope(f)}`,
        sql: `SELECT p.NHOM,\n       SUM(ct.THANH_TIEN) AS DOANH_THU,\n       SUM(ct.SO_LUONG * p.GIA_VON) AS GIA_VON,\n       SUM(ct.THANH_TIEN) - SUM(ct.SO_LUONG * p.GIA_VON) AS LAI_GOP,\n       ROUND(100.0 * (SUM(ct.THANH_TIEN) - SUM(ct.SO_LUONG * p.GIA_VON)) / SUM(ct.THANH_TIEN), 1) AS BIEN_LAI_GOP_PCT\nFROM CHI_TIET_DON ct\nJOIN DON_HANG d ON d.MA_DON = ct.MA_DON${storeJoin(w.needStore)}\nJOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY LAI_GOP DESC;`,
        chart: { type: 'bar', x: 'NHOM', y: 'LAI_GOP' },
        explain: 'Lãi gộp = doanh thu − (số lượng × giá vốn). Biên lãi gộp tính theo phần trăm doanh thu, chưa trừ giảm giá trên đơn.',
      }
    },
  },
  {
    id: 'channel',
    test: (q) => any(q, ['kenh', 'giao hang', 'ung dung', 'tai quay']) && any(q, ['ty le', 'ti le', 'theo kenh', 'so sanh', 'phan bo', 'chiem', 'doanh thu', 'kenh nao']),
    build: (f) => {
      const w = orderWhere({ ...f, channel: null })
      return {
        title: `Doanh thu theo kênh bán${scope(f)}`,
        sql: `SELECT d.KENH,\n       COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       ROUND(100.0 * SUM(d.TONG_TIEN) / SUM(SUM(d.TONG_TIEN)) OVER (), 1) AS TY_TRONG_PCT\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY DOANH_THU DESC;`,
        chart: { type: 'donut', x: 'KENH', y: 'DOANH_THU' },
        explain: 'Mình dùng hàm cửa sổ SUM(...) OVER () để tính tỷ trọng của từng kênh trên tổng doanh thu.',
      }
    },
  },
  {
    id: 'payment',
    test: (q) => any(q, ['thanh toan', 'tien mat', 'vietqr', 'vi dien tu', 'quet the', 'bang the']) && !any(q, ['khach hang than']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Phương thức thanh toán${scope(f)}`,
        sql: `SELECT d.THANH_TOAN,\n       COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS TY_LE_DON_PCT\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY SO_DON DESC;`,
        chart: { type: 'donut', x: 'THANH_TOAN', y: 'SO_DON' },
        explain: 'Đếm số đơn theo hình thức thanh toán và tính tỷ lệ trên tổng số đơn.',
      }
    },
  },
  {
    id: 'peak-hour',
    test: (q) => any(q, ['gio cao diem', 'khung gio', 'theo gio', 'gio nao', 'dong khach', 'luc nao']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Lượng đơn theo khung giờ${scope(f)}`,
        sql: `SELECT HOUR(d.NGAY_DAT) AS GIO,\n       COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY 1;`,
        chart: { type: 'bar', x: 'GIO', y: 'SO_DON' },
        explain: 'Mình lấy giờ của thời điểm đặt đơn (HOUR) để thấy khung giờ đông khách.',
      }
    },
  },
  {
    id: 'weekday',
    test: (q) => any(q, ['thu trong tuan', 'ngay trong tuan', 'cuoi tuan', 'thu may', 'thu nao']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Doanh thu theo thứ trong tuần${scope(f)}`,
        sql: `SELECT DAYOFWEEK(d.NGAY_DAT) AS STT,\n       THU_TRONG_TUAN(d.NGAY_DAT) AS THU,\n       COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1, 2\nORDER BY CASE WHEN STT = 0 THEN 7 ELSE STT END;`,
        chart: { type: 'bar', x: 'THU', y: 'DOANH_THU' },
        explain: 'Hàm THU_TRONG_TUAN trả về tên thứ bằng tiếng Việt; mình xếp Chủ nhật xuống cuối tuần.',
      }
    },
  },
  {
    id: 'customer-province',
    test: (q) => any(q, ['khach hang', 'thanh vien']) && any(q, ['tinh', 'thanh pho', 'dia phuong', 'khu vuc', 'o dau', 'phan bo']),
    build: (f) => ({
      title: 'Khách hàng thành viên theo tỉnh, thành',
      sql: `SELECT TINH_THANH,\n       COUNT(*) AS SO_KHACH,\n       SUM(IFF(HANG_THANH_VIEN IN ('Vàng', 'Kim cương'), 1, 0)) AS KHACH_HANG_CAO\nFROM KHACH_HANG\nGROUP BY 1\nORDER BY SO_KHACH DESC\nLIMIT ${f.top || 12};`,
      chart: { type: 'bar', x: 'TINH_THANH', y: 'SO_KHACH', horizontal: true },
      explain: 'Đếm khách hàng thành viên theo tỉnh, kèm số khách hạng Vàng và Kim cương.',
    }),
  },
  {
    id: 'churn',
    test: (q) => any(q, ['lau chua quay lai', 'roi bo', 'khong quay lai', 'mat khach', 'churn', 'lau khong mua']),
    build: () => ({
      title: 'Khách hàng hạng cao lâu chưa quay lại',
      sql: `SELECT k.HO_TEN, k.HANG_THANH_VIEN, k.TINH_THANH,\n       MAX(DATE(d.NGAY_DAT)) AS LAN_MUA_GAN_NHAT,\n       DATEDIFF(day, MAX(DATE(d.NGAY_DAT)), CURRENT_DATE()) AS SO_NGAY_VANG_MAT,\n       COUNT(*) AS SO_DON_CA_NAM\nFROM KHACH_HANG k\nJOIN DON_HANG d ON d.MA_KH = k.MA_KH\nWHERE k.HANG_THANH_VIEN IN ('Vàng', 'Kim cương')\nGROUP BY 1, 2, 3\nHAVING SO_NGAY_VANG_MAT >= 45\nORDER BY SO_DON_CA_NAM DESC\nLIMIT 15;`,
      chart: null,
      explain: 'Khách hạng Vàng, Kim cương không mua gì từ 45 ngày trở lên — nên gửi ưu đãi giữ chân.',
    }),
  },
  {
    id: 'tier',
    test: (q) => any(q, ['hang thanh vien', 'hang khach', 'kim cuong', 'hang vang', 'hang bac']) && !any(q, ['quay lai', 'lau chua', 'lau khong']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Chi tiêu theo hạng thành viên${scope(f)}`,
        sql: `SELECT k.HANG_THANH_VIEN,\n       COUNT(DISTINCT k.MA_KH) AS SO_KHACH,\n       COUNT(d.MA_DON) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       ROUND(SUM(d.TONG_TIEN) * 1.0 / COUNT(DISTINCT k.MA_KH)) AS CHI_TIEU_MOI_KHACH\nFROM DON_HANG d\nJOIN KHACH_HANG k ON k.MA_KH = d.MA_KH${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY CHI_TIEU_MOI_KHACH DESC;`,
        chart: { type: 'bar', x: 'HANG_THANH_VIEN', y: 'CHI_TIEU_MOI_KHACH' },
        explain: 'So sánh mức chi tiêu bình quân mỗi khách giữa các hạng thành viên.',
      }
    },
  },
  {
    id: 'top-customers',
    test: (q) => any(q, ['khach hang', 'khach quen', 'khach vip', 'than thiet']) && any(q, ['nhieu nhat', 'chi tieu', 'top', 'vip', 'than thiet', 'mua nhieu']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Khách hàng chi tiêu nhiều nhất${scope(f)}`,
        sql: `SELECT k.HO_TEN, k.HANG_THANH_VIEN, k.TINH_THANH,\n       COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS TONG_CHI_TIEU,\n       MAX(DATE(d.NGAY_DAT)) AS LAN_MUA_GAN_NHAT\nFROM DON_HANG d\nJOIN KHACH_HANG k ON k.MA_KH = d.MA_KH${storeJoin(w.needStore)}\nWHERE ${w.sql}\nGROUP BY 1, 2, 3\nORDER BY TONG_CHI_TIEU DESC\nLIMIT ${f.top || 10};`,
        chart: { type: 'bar', x: 'HO_TEN', y: 'TONG_CHI_TIEU', horizontal: true },
        explain: 'Chỉ tính đơn có gắn mã thành viên (khách vãng lai không có MA_KH).',
      }
    },
  },
  {
    id: 'reviews-negative',
    test: (q) => any(q, ['danh gia', 'phan hoi', 'review', 'cam xuc', 'gop y', 'than phien', 'phan nan', 'khieu nai']),
    build: (f, q) => {
      const neg = any(q, ['tieu cuc', 'xau', 'te', 'than phien', 'phan nan', 'khieu nai', 'khong hai long', 'van de'])
      const pos = any(q, ['tich cuc', 'khen', 'hai long'])
      const summary = any(q, ['ty le', 'tong quan', 'theo cua hang', 'bao nhieu', 'phan bo', 'tong hop'])
      if (summary || (!neg && !pos)) {
        return {
          title: 'Cảm xúc khách hàng theo cửa hàng (AI_CAM_XUC)',
          sql: `SELECT c.TEN_CUA_HANG,\n       COUNT(*) AS SO_DANH_GIA,\n       ROUND(AVG(g.SO_SAO), 2) AS SAO_TB,\n       SUM(IFF(AI_CAM_XUC(g.NOI_DUNG) = 'Tích cực', 1, 0)) AS TICH_CUC,\n       SUM(IFF(AI_CAM_XUC(g.NOI_DUNG) = 'Tiêu cực', 1, 0)) AS TIEU_CUC\nFROM DANH_GIA g\nJOIN CUA_HANG c ON c.MA_CH = g.MA_CH\nGROUP BY 1\nORDER BY TIEU_CUC DESC;`,
          chart: { type: 'bar', x: 'TEN_CUA_HANG', y: 'TIEU_CUC', horizontal: true },
          explain: 'Hàm AI_CAM_XUC đọc nội dung tiếng Việt và gán nhãn Tích cực / Tiêu cực / Trung tính ngay trong câu SQL.',
        }
      }
      return {
        title: neg ? 'Đánh giá tiêu cực cần xử lý' : 'Đánh giá tích cực nổi bật',
        sql: `SELECT g.NGAY, c.TEN_CUA_HANG, g.SO_SAO,\n       g.NOI_DUNG,\n       AI_CAM_XUC(g.NOI_DUNG) AS CAM_XUC,\n       AI_PHAN_LOAI(g.NOI_DUNG, 'Đồ uống, Phục vụ, Không gian, Giao hàng, Giá cả, Thời gian chờ') AS CHU_DE\nFROM DANH_GIA g\nJOIN CUA_HANG c ON c.MA_CH = g.MA_CH\nWHERE AI_CAM_XUC(g.NOI_DUNG) = '${neg ? 'Tiêu cực' : 'Tích cực'}'${f.province ? `\n  AND c.TINH_THANH = '${f.province}'` : ''}\nORDER BY g.NGAY DESC\nLIMIT ${f.top || 20};`,
        chart: null,
        explain: 'AI_CAM_XUC lọc theo cảm xúc, AI_PHAN_LOAI gán chủ đề để bạn biết vấn đề nằm ở khâu nào.',
      }
    },
  },
  {
    id: 'aov-region',
    test: (q) => any(q, ['gia tri don', 'trung binh moi don', 'binh quan', 'aov', 'gia tri trung binh']),
    build: (f) => {
      const w = orderWhere(f, { needStore: true })
      return {
        title: `Giá trị đơn trung bình theo vùng${scope(f)}`,
        sql: `SELECT c.VUNG,\n       COUNT(*) AS SO_DON,\n       ROUND(AVG(d.TONG_TIEN)) AS GIA_TRI_DON_TB,\n       ROUND(AVG(d.GIAM_GIA)) AS GIAM_GIA_TB\nFROM DON_HANG d\nJOIN CUA_HANG c ON c.MA_CH = d.MA_CH\nWHERE ${w.sql}\nGROUP BY 1\nORDER BY GIA_TRI_DON_TB DESC;`,
        chart: { type: 'bar', x: 'VUNG', y: 'GIA_TRI_DON_TB' },
        explain: 'Giá trị đơn trung bình (AOV) = trung bình tổng tiền mỗi đơn sau giảm giá.',
      }
    },
  },
  {
    id: 'promo',
    test: (q) => any(q, ['khuyen mai', 'chuong trinh', 'uu dai', 'giam gia']),
    build: () => ({
      title: 'Hiệu quả các chương trình khuyến mãi',
      sql: `SELECT km.TEN_CHUONG_TRINH, km.TU_NGAY, km.DEN_NGAY,\n       COUNT(d.MA_DON) AS SO_DON_AP_DUNG,\n       SUM(d.GIAM_GIA) AS TONG_GIAM_GIA,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       km.NGAN_SACH,\n       ROUND(100.0 * SUM(d.GIAM_GIA) / km.NGAN_SACH, 1) AS DA_DUNG_NGAN_SACH_PCT\nFROM KHUYEN_MAI km\nLEFT JOIN DON_HANG d ON d.MA_KM = km.MA_KM AND d.TRANG_THAI = 'Hoàn tất'\nGROUP BY 1, 2, 3, km.NGAN_SACH\nORDER BY km.TU_NGAY;`,
      chart: { type: 'bar', x: 'TEN_CHUONG_TRINH', y: 'DOANH_THU' },
      explain: 'Ghép các đơn có mã khuyến mãi với bảng KHUYEN_MAI để so sánh tiền giảm với ngân sách.',
    }),
  },
  {
    id: 'compare-month',
    test: (q) => any(q, ['so voi thang truoc', 'tang truong', 'tang hay giam', 'thay doi', 'cung ky', 'so sanh thang']),
    build: (f) => {
      const w = orderWhere({ ...f, month: null, days: null })
      return {
        title: `Tăng trưởng doanh thu từng tháng${scope({ ...f, label: f.label.filter((x) => !x.startsWith('tháng')) })}`,
        sql: `WITH THEO_THANG AS (\n  SELECT DATE_TRUNC('month', d.NGAY_DAT) AS THANG, SUM(d.TONG_TIEN) AS DOANH_THU\n  FROM DON_HANG d${storeJoin(w.needStore)}\n  WHERE ${w.sql}\n  GROUP BY 1\n)\nSELECT THANG, DOANH_THU,\n       LAG(DOANH_THU) OVER (ORDER BY THANG) AS THANG_TRUOC,\n       ROUND(100.0 * (DOANH_THU - LAG(DOANH_THU) OVER (ORDER BY THANG)) / LAG(DOANH_THU) OVER (ORDER BY THANG), 1) AS TANG_TRUONG_PCT\nFROM THEO_THANG\nORDER BY THANG;`,
        chart: { type: 'bar', x: 'THANG', y: 'TANG_TRUONG_PCT' },
        explain: 'Hàm LAG lấy doanh thu tháng liền trước để tính phần trăm tăng trưởng. Tháng 11 mới chạy được 10 ngày nên thấp hơn.',
      }
    },
  },
  {
    id: 'overview',
    test: (q) => any(q, ['tong quan', 'tom tat', 'bao cao nhanh', 'tinh hinh', 'tong doanh thu', 'bao nhieu don', 'tong so don', 'doanh thu']),
    build: (f) => {
      const w = orderWhere(f)
      return {
        title: `Tổng quan kinh doanh${scope(f) || ' (từ đầu năm 2026)'}`,
        sql: `SELECT COUNT(*) AS SO_DON,\n       SUM(d.TONG_TIEN) AS DOANH_THU,\n       ROUND(AVG(d.TONG_TIEN)) AS GIA_TRI_DON_TB,\n       COUNT(DISTINCT d.MA_KH) AS KHACH_THANH_VIEN,\n       SUM(d.GIAM_GIA) AS TONG_GIAM_GIA\nFROM DON_HANG d${storeJoin(w.needStore)}\nWHERE ${w.sql};`,
        chart: { type: 'kpi' },
        explain: 'Các chỉ số chính tính trên đơn đã hoàn tất.',
      }
    },
  },
]

const SUGGESTIONS = [
  'Doanh thu theo tháng của các cửa hàng ở Hà Nội',
  'Top 5 cửa hàng doanh thu cao nhất quý 3',
  'Món nào bán chạy nhất tháng 10?',
  'Những đánh giá tiêu cực gần đây',
  'Khung giờ nào đông khách nhất?',
  'Tỷ trọng doanh thu theo kênh bán',
  'Lãi gộp theo nhóm sản phẩm',
  'Khách hạng Vàng lâu chưa quay lại',
]
export { SUGGESTIONS }

/**
 * Trả lời một câu hỏi.
 * ctx: { sql (câu SQL hiện tại trong trình soạn), lastError, schema }
 * Kết quả: { type: 'sql'|'explain'|'format'|'fix'|'help'|'unknown', text, sql?, chart?, title? }
 */
export function ask(question, ctx = {}) {
  const q = n(question)
  // ---- Ý định với câu SQL đang mở ----
  if (ctx.sql && any(q, ['giai thich', 'cau nay lam gi', 'doan nay', 'y nghia'])) {
    return { type: 'explain', text: explainSQL(ctx.sql) }
  }
  if (ctx.sql && any(q, ['dinh dang', 'format', 'can le', 'lam dep', 'sap xep lai code'])) {
    return { type: 'format', text: 'Mình đã định dạng lại: từ khoá viết hoa, mỗi mệnh đề một dòng, thụt lề nhất quán.', sql: formatSQL(ctx.sql) }
  }
  if (any(q, ['sua loi', 'sua giup', 'bi loi', 'loi gi', 'tai sao loi', 'fix'])) {
    if (ctx.lastError) return fixSQL(ctx.sql || '', ctx.lastError, ctx.schema || {})
    return { type: 'help', text: 'Câu lệnh gần nhất chạy không có lỗi. Bạn muốn mình kiểm tra đoạn nào?' }
  }
  if (any(q, ['xin chao', 'chao ban', 'hello', ' hi ', 'ban la ai', 'lam duoc gi', 'giup gi'])) {
    return {
      type: 'help',
      text: 'Chào bạn, mình là **Tinh Ý**. Mình đọc được bộ dữ liệu bán hàng của chuỗi Phố Núi và có thể:\n\n• Viết SQL từ câu hỏi tiếng Việt rồi chạy luôn\n• Giải thích, định dạng hoặc sửa lỗi câu SQL đang mở\n• Phân tích cảm xúc đánh giá của khách bằng hàm AI\n\nThử hỏi: “Top 5 cửa hàng doanh thu cao nhất tháng 10”.',
    }
  }
  if (any(q, ['bang nao', 'co nhung bang', 'du lieu gom', 'cau truc du lieu', 'luoc do'])) {
    return {
      type: 'sql', title: 'Các bảng có thể truy vấn',
      text: 'Đây là các bảng mình đang đọc được. Bảng chính là DON_HANG (đơn hàng) và CHI_TIET_DON (món trong đơn).',
      sql: 'SHOW TABLES;', chart: null,
    }
  }
  // ---- Hỏi dữ liệu ----
  const f = parseFilters(q)
  for (const it of INTENTS.filter((x) => x.id !== 'overview')) {
    if (it.test(q)) {
      const r = it.build(f, q)
      return { type: 'sql', intent: it.id, filters: f.label, ...r, text: r.explain }
    }
  }
  // Nhắc tên một cửa hàng / món cụ thể
  const store = STORES.find((s) => q.includes(n(s[1]).trim()) || q.includes(n(s[1].replace('Phố Núi ', '')).trim()))
  if (store) {
    return {
      type: 'sql', title: `Doanh thu theo tháng của ${store[1]}`,
      text: `Mình lọc riêng cửa hàng ${store[1]} (${store[0]}).`,
      sql: `SELECT DATE_TRUNC('month', NGAY_DAT) AS THANG,\n       COUNT(*) AS SO_DON,\n       SUM(TONG_TIEN) AS DOANH_THU\nFROM DON_HANG\nWHERE MA_CH = '${store[0]}' AND TRANG_THAI = 'Hoàn tất'\nGROUP BY 1\nORDER BY 1;`,
      chart: { type: 'line', x: 'THANG', y: 'DOANH_THU' },
    }
  }
  const prod = PRODUCTS.find((p) => q.includes(n(p[1]).trim()))
  if (prod) {
    return {
      type: 'sql', title: `Doanh số món ${prod[1]} theo tháng`,
      text: `Mình theo dõi riêng món ${prod[1]} qua từng tháng.`,
      sql: `SELECT DATE_TRUNC('month', d.NGAY_DAT) AS THANG,\n       SUM(ct.SO_LUONG) AS SO_LUONG,\n       SUM(ct.THANH_TIEN) AS DOANH_THU\nFROM CHI_TIET_DON ct\nJOIN DON_HANG d ON d.MA_DON = ct.MA_DON\nWHERE ct.MA_SP = '${prod[0]}' AND d.TRANG_THAI = 'Hoàn tất'\nGROUP BY 1\nORDER BY 1;`,
      chart: { type: 'line', x: 'THANG', y: 'SO_LUONG' },
    }
  }
  const ov = INTENTS.find((x) => x.id === 'overview')
  if (ov.test(q)) { const r = ov.build(f, q); return { type: 'sql', intent: 'overview', filters: f.label, ...r, text: r.explain } }
  return {
    type: 'unknown',
    text: 'Mình chưa chắc hiểu đúng câu hỏi. Bạn thử diễn đạt theo kiểu “doanh thu / món / cửa hàng / khách hàng / đánh giá” kèm thời gian hoặc tỉnh thành nhé. Vài gợi ý:',
    suggestions: SUGGESTIONS.slice(0, 4),
  }
}

/* ---------------- Định dạng SQL ---------------- */
const KW = ['select', 'from', 'where', 'group by', 'order by', 'having', 'limit', 'join', 'left join', 'right join', 'inner join', 'on', 'and', 'or', 'as', 'with', 'union all', 'union', 'insert into', 'values', 'update', 'set', 'delete from', 'create', 'table', 'or replace', 'database', 'schema', 'use', 'distinct', 'case', 'when', 'then', 'else', 'end', 'in', 'not', 'null', 'is', 'like', 'between', 'over', 'partition by', 'desc', 'asc', 'count', 'sum', 'avg', 'min', 'max', 'round', 'integer', 'string', 'date', 'boolean', 'number', 'true', 'false', 'primary key', 'varchar', 'timestamp']
export function formatSQL(sql) {
  return splitKeepStrings(sql, (chunk) => {
    let s = chunk
    for (const k of KW.sort((a, b) => b.length - a.length)) {
      s = s.replace(new RegExp(`\\b${k.replace(' ', '\\s+')}\\b`, 'gi'), k.toUpperCase())
    }
    s = s.replace(/\s*\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN|UNION ALL)\b/g, '\n$1')
    s = s.replace(/(?<!LEFT |RIGHT |INNER )\s*\bJOIN\b/g, '\nJOIN')
    s = s.replace(/\s+\bAND\b/g, '\n  AND')
    s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    return s
  })
}
function splitKeepStrings(sql, fn) {
  const parts = sql.split(/('(?:[^']|'')*'|--[^\n]*)/g)
  return parts.map((p, i) => (i % 2 ? p : fn(p))).join('').trim()
}

/* ---------------- Giải thích SQL ---------------- */
export function explainSQL(sql) {
  const s = sql.replace(/--[^\n]*/g, ' ')
  const stmts = s.split(';').map((x) => x.trim()).filter(Boolean)
  const out = []
  stmts.slice(0, 6).forEach((st, i) => {
    const u = st.toUpperCase()
    const tables = [...new Set([...st.matchAll(/\b(?:FROM|JOIN|INTO|TABLE|UPDATE)\s+([\w.]+)/gi)].map((m) => m[1].toUpperCase()))]
    let line = ''
    if (/^USE\s/i.test(st)) line = `Chuyển ngữ cảnh sang ${st.split(/\s+/).slice(1).join(' ')}.`
    else if (/^CREATE\s+(OR\s+REPLACE\s+)?DATABASE/i.test(st)) line = `Tạo cơ sở dữ liệu ${tables[0] || st.split(/\s+/).pop()}.`
    else if (/^CREATE\s+(OR\s+REPLACE\s+)?SCHEMA/i.test(st)) line = `Tạo lược đồ ${st.split(/\s+/).pop()}.`
    else if (/^CREATE/i.test(st)) {
      const cols = (st.match(/\(([\s\S]*)\)/)?.[1] || '').split(',').length
      line = /\bAS\s+SELECT/i.test(st) ? `Tạo bảng ${tables[0]} từ kết quả một truy vấn.` : `Tạo bảng ${tables[0]} gồm ${cols} cột.`
    } else if (/^INSERT/i.test(st)) {
      const rows = (st.match(/\)\s*,\s*\(/g) || []).length + 1
      line = `Chèn ${rows} dòng dữ liệu vào ${tables[0]}.`
    } else if (/^(SELECT|WITH)/i.test(st)) {
      const bits = []
      bits.push(`Đọc dữ liệu từ ${tables.join(', ') || 'các bảng'}`)
      if (/\bJOIN\b/i.test(u)) bits.push('nối các bảng theo khoá chung')
      const where = st.match(/\bWHERE\b([\s\S]*?)(\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i)?.[1]
      if (where) bits.push(`lọc theo điều kiện ${where.trim().replace(/\s+/g, ' ').slice(0, 90)}`)
      if (/\bGROUP BY\b/i.test(u)) bits.push('gom nhóm và tính tổng hợp (' + [...new Set([...u.matchAll(/\b(SUM|COUNT|AVG|MIN|MAX)\s*\(/g)].map((m) => m[1]))].join(', ') + ')')
      if (/\bOVER\s*\(/i.test(u)) bits.push('dùng hàm cửa sổ để so sánh giữa các dòng')
      if (/\bAI_[A-Z_]+/.test(u)) bits.push('gọi hàm AI để xử lý văn bản tiếng Việt')
      const ord = st.match(/\bORDER BY\b\s+([\w.,\s]+?)(\bLIMIT\b|$)/i)?.[1]
      if (ord) bits.push(`sắp xếp theo ${ord.trim()}`)
      const lim = st.match(/\bLIMIT\s+(\d+)/i)?.[1]
      if (lim) bits.push(`chỉ lấy ${lim} dòng đầu`)
      line = bits.join(', ') + '.'
    } else if (/^(UPDATE|DELETE)/i.test(st)) line = `${/^UPDATE/i.test(st) ? 'Cập nhật' : 'Xoá'} dữ liệu trong ${tables[0]}.`
    else line = 'Câu lệnh quản trị.'
    out.push(`${i + 1}. ${line.charAt(0).toUpperCase() + line.slice(1)}`)
  })
  if (stmts.length > 6) out.push(`… và ${stmts.length - 6} câu lệnh khác.`)
  return `Đoạn SQL này có ${stmts.length} câu lệnh:\n\n${out.join('\n')}`
}

/* ---------------- Sửa lỗi ---------------- */
function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}
function closest(word, list) {
  let best = null, d = 1e9
  for (const x of list) { const v = lev(word.toUpperCase(), x.toUpperCase()); if (v < d) { d = v; best = x } }
  return d <= Math.max(3, Math.floor(word.length / 2)) ? best : null
}
export function fixSQL(sql, error, schema) {
  let m
  if ((m = error.match(/bảng '([\w.]+)'/i))) {
    const name = m[1].split('.').pop()
    const c = closest(name, Object.keys(schema))
    if (c) return { type: 'fix', text: `Không có bảng **${name}**. Có lẽ bạn muốn dùng **${c}**? Mình đã sửa lại câu lệnh.`, sql: sql.replace(new RegExp(`\\b${name}\\b`, 'gi'), c) }
  }
  if ((m = error.match(/Cột không hợp lệ '([\w.]+)'/i))) {
    const name = m[1].split('.').pop()
    const all = [...new Set(Object.values(schema).flat())]
    const c = closest(name, all)
    if (c) return { type: 'fix', text: `Không có cột **${name}**. Cột gần giống nhất là **${c}**. Mình đã thay thế giúp bạn.`, sql: sql.replace(new RegExp(`\\b${name}\\b`, 'gi'), c) }
  }
  if (/GROUP BY/i.test(error) || /tổng hợp/i.test(error)) {
    return { type: 'fix', text: 'Câu lệnh dùng hàm tổng hợp nhưng thiếu GROUP BY cho các cột còn lại. Hãy thêm `GROUP BY` với các cột không nằm trong SUM/COUNT/AVG.' }
  }
  if (/cú pháp/i.test(error)) {
    return { type: 'fix', text: `Lỗi cú pháp: ${error} Kiểm tra lại dấu phẩy giữa các cột, dấu nháy đơn quanh chuỗi và dấu chấm phẩy cuối câu.` }
  }
  return { type: 'fix', text: `Mình thấy lỗi: “${error}”. Bạn có thể dán thêm ngữ cảnh để mình kiểm tra kỹ hơn.` }
}
