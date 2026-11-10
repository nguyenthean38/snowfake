/* ==========================================================
   Tiện ích dùng chung cho các trang dữ liệu
   - useCatalog: cây danh mục (CSDL › lược đồ › bảng), tự cập nhật
   - useOpenSql: tạo tệp SQL mới rồi mở trình soạn
   - TEMPLATE_SQL: nội dung SQL thật cho từng mẫu dự án
   ========================================================== */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDB, getCatalog, onCatalogChange } from '@/engine/db'
import { useApp } from '@/store'

/** Cây danh mục; { tree, loading, refresh } */
export function useCatalog({ withCounts = true } = {}) {
  const [tree, setTree] = useState(null)
  const refresh = useCallback(() => {
    getDB().then(() => setTree(getCatalog({ withCounts }))).catch(() => setTree([]))
  }, [withCounts])
  useEffect(() => {
    refresh()
    return onCatalogChange(refresh)
  }, [refresh])
  return { tree: tree || [], loading: tree == null, refresh }
}

/** Danh sách phẳng mọi bảng trong cây */
export const flatTables = (tree) => tree.flatMap((d) => d.schemas.flatMap((s) => s.tables))

/** Mở một tệp SQL mới trong không gian làm việc */
export function useOpenSql() {
  const navigate = useNavigate()
  const newFile = useApp((s) => s.newFile)
  return useCallback((name, content) => {
    newFile({ name, content })
    navigate('/khong-gian')
  }, [navigate, newFile])
}

/** Chuẩn hoá tên bảng: "Nhân viên cửa hàng.csv" → NHAN_VIEN_CUA_HANG */
export function toTableName(s = '') {
  return String(s)
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .toUpperCase()
    .replace(/^(\d)/, 'T_$1') || 'BANG_MOI'
}

/** SQL thật cho các mẫu dự án (khớp id trong PROJECT_TEMPLATES) */
export const TEMPLATE_SQL = {
  t1: `-- Mẫu: Phân tích doanh thu chuỗi cửa hàng bằng SQL
USE DATABASE PHO_NUI_DB;
USE SCHEMA BAN_HANG;

-- 1. Doanh thu, số đơn và giá trị đơn trung bình theo vùng
SELECT c.VUNG,
       COUNT(*)                 AS SO_DON,
       SUM(d.TONG_TIEN)         AS DOANH_THU,
       ROUND(AVG(d.TONG_TIEN))  AS GIA_TRI_DON_TB
FROM DON_HANG d
JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
WHERE d.TRANG_THAI = 'Hoàn tất'
GROUP BY 1
ORDER BY DOANH_THU DESC;

-- 2. Xếp hạng cửa hàng trong quý 3
SELECT c.TEN_CUA_HANG, c.TINH_THANH, SUM(d.TONG_TIEN) AS DOANH_THU
FROM DON_HANG d
JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
WHERE QUARTER(d.NGAY_DAT) = 3 AND d.TRANG_THAI = 'Hoàn tất'
GROUP BY 1, 2
ORDER BY DOANH_THU DESC
LIMIT 10;
`,
  t2: `-- Mẫu: Đọc cảm xúc đánh giá khách hàng bằng hàm AI
-- AI_CAM_XUC, AI_PHAN_LOAI, AI_TRICH_XUAT chạy ngay trong câu SQL.
SELECT c.TEN_CUA_HANG,
       COUNT(*)                                                     AS SO_DANH_GIA,
       ROUND(AVG(g.SO_SAO), 2)                                      AS SAO_TB,
       SUM(IFF(AI_CAM_XUC(g.NOI_DUNG) = 'Tích cực', 1, 0))          AS TICH_CUC,
       SUM(IFF(AI_CAM_XUC(g.NOI_DUNG) = 'Tiêu cực', 1, 0))          AS TIEU_CUC
FROM PHO_NUI_DB.MARKETING.DANH_GIA g
JOIN PHO_NUI_DB.BAN_HANG.CUA_HANG c ON c.MA_CH = g.MA_CH
GROUP BY 1
ORDER BY TIEU_CUC DESC;

-- Chủ đề bị phàn nàn nhiều nhất
SELECT AI_PHAN_LOAI(NOI_DUNG, 'Đồ uống, Phục vụ, Không gian, Giao hàng, Giá cả, Thời gian chờ') AS CHU_DE,
       COUNT(*) AS SO_LAN
FROM PHO_NUI_DB.MARKETING.DANH_GIA
WHERE AI_CAM_XUC(NOI_DUNG) = 'Tiêu cực'
GROUP BY 1
ORDER BY SO_LAN DESC;
`,
  t3: `-- Mẫu: Dự báo doanh thu 30 ngày tới (trung bình trượt 4 tuần theo thứ)
WITH NGAY AS (
  SELECT DATE(NGAY_DAT) AS NGAY, THU_TRONG_TUAN(NGAY_DAT) AS THU, SUM(TONG_TIEN) AS DOANH_THU
  FROM DON_HANG
  WHERE TRANG_THAI = 'Hoàn tất' AND NGAY_DAT >= DATEADD(day, -28, CURRENT_DATE())
  GROUP BY 1, 2
)
SELECT THU,
       ROUND(AVG(DOANH_THU)) AS DU_BAO_DOANH_THU_NGAY,
       MIN(DOANH_THU)        AS THAP_NHAT,
       MAX(DOANH_THU)        AS CAO_NHAT
FROM NGAY
GROUP BY 1
ORDER BY DU_BAO_DOANH_THU_NGAY DESC;
`,
  t4: `-- Mẫu: Nạp tệp CSV từ máy POS
-- Cách nhanh nhất: vào "Nạp dữ liệu" → "Tải tệp lên bảng" và chọn tệp CSV.
-- Hoặc tạo bảng đích trước rồi chèn dữ liệu bằng SQL:
CREATE OR REPLACE TABLE POS_TAM (
  MA_DON     STRING,
  NGAY_DAT   TIMESTAMP,
  MA_CH      STRING,
  TONG_TIEN  NUMBER(12, 0)
);

INSERT INTO POS_TAM VALUES
  ('POS000001', '2026-11-10 07:12:00', 'CH01', 74000),
  ('POS000002', '2026-11-10 07:15:30', 'CH04', 39000),
  ('POS000003', '2026-11-10 07:21:10', 'CH05', 128000);

SELECT * FROM POS_TAM;
`,
  t5: `-- Mẫu: Phân khúc khách hàng RFM (Gần đây – Tần suất – Giá trị)
WITH RFM AS (
  SELECT MA_KH,
         DATEDIFF(day, MAX(NGAY_DAT), CURRENT_DATE()) AS SO_NGAY_TU_LAN_CUOI,
         COUNT(*)        AS SO_LAN_MUA,
         SUM(TONG_TIEN)  AS TONG_CHI_TIEU
  FROM DON_HANG
  WHERE MA_KH IS NOT NULL AND TRANG_THAI = 'Hoàn tất'
  GROUP BY MA_KH
)
SELECT CASE
         WHEN SO_NGAY_TU_LAN_CUOI <= 14 AND SO_LAN_MUA >= 20 THEN '1. Trung thành'
         WHEN SO_NGAY_TU_LAN_CUOI <= 30 THEN '2. Đang hoạt động'
         WHEN SO_NGAY_TU_LAN_CUOI <= 90 THEN '3. Cần nhắc lại'
         ELSE '4. Có nguy cơ rời bỏ'
       END AS PHAN_KHUC,
       COUNT(*) AS SO_KHACH,
       ROUND(AVG(TONG_CHI_TIEU)) AS CHI_TIEU_TB
FROM RFM
GROUP BY 1
ORDER BY 1;
`,
  t6: `-- Mẫu: Hiệu quả chương trình khuyến mãi
SELECT km.TEN_CHUONG_TRINH,
       km.TU_NGAY, km.DEN_NGAY,
       COUNT(d.MA_DON)  AS SO_DON_AP_DUNG,
       SUM(d.GIAM_GIA)  AS TONG_GIAM_GIA,
       SUM(d.TONG_TIEN) AS DOANH_THU,
       km.NGAN_SACH,
       ROUND(100.0 * SUM(d.GIAM_GIA) / km.NGAN_SACH, 1) AS DA_DUNG_NGAN_SACH_PCT
FROM PHO_NUI_DB.MARKETING.KHUYEN_MAI km
LEFT JOIN DON_HANG d ON d.MA_KM = km.MA_KM AND d.TRANG_THAI = 'Hoàn tất'
GROUP BY 1, 2, 3, km.NGAN_SACH
ORDER BY km.TU_NGAY;
`,
}

/** Truy vấn mẫu sau khi cài dữ liệu từ Chợ dữ liệu */
export const LISTING_SQL = {
  'ngay-le': `-- Doanh thu trong các ngày lễ so với ngày thường (bảng NGAY_LE_VN vừa cài từ Chợ dữ liệu)
WITH THEO_NGAY AS (
  SELECT DATE(NGAY_DAT) AS NGAY, SUM(TONG_TIEN) AS DOANH_THU, COUNT(*) AS SO_DON
  FROM DON_HANG
  WHERE TRANG_THAI = 'Hoàn tất'
  GROUP BY 1
)
SELECT l.NGAY, l.TEN_NGAY_LE, l.LOAI,
       t.SO_DON, t.DOANH_THU,
       ROUND(100.0 * t.DOANH_THU / (SELECT AVG(DOANH_THU) FROM THEO_NGAY) - 100, 1) AS CHENH_LECH_SO_VOI_TB_PCT
FROM DU_LIEU_MAU.CONG_KHAI.NGAY_LE_VN l
LEFT JOIN THEO_NGAY t ON t.NGAY = l.NGAY
ORDER BY l.NGAY;
`,
  'thoi-tiet': `-- Doanh số đồ uống đá xay so với nhiệt độ trung bình tháng (bảng THOI_TIET_THANG từ Chợ dữ liệu)
WITH DA_XAY AS (
  SELECT DATE_TRUNC('month', d.NGAY_DAT) AS THANG, c.MA_TINH, SUM(ct.SO_LUONG) AS SO_LY_DA_XAY
  FROM CHI_TIET_DON ct
  JOIN DON_HANG d ON d.MA_DON = ct.MA_DON
  JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
  JOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP
  WHERE p.NHOM = 'Đá xay' AND d.TRANG_THAI = 'Hoàn tất'
  GROUP BY 1, 2
)
SELECT w.THANG, w.TEN_TINH, w.NHIET_DO_TB, w.LUONG_MUA_MM, x.SO_LY_DA_XAY
FROM DU_LIEU_MAU.CONG_KHAI.THOI_TIET_THANG w
LEFT JOIN DA_XAY x ON x.THANG = w.THANG AND x.MA_TINH = w.MA_TINH
ORDER BY w.TEN_TINH, w.THANG;
`,
  'hanh-chinh': `-- Số cửa hàng và doanh thu theo 34 tỉnh, thành
SELECT t.TEN_TINH, t.VUNG,
       COUNT(DISTINCT c.MA_CH) AS SO_CUA_HANG,
       COALESCE(SUM(d.TONG_TIEN), 0) AS DOANH_THU
FROM DU_LIEU_MAU.CONG_KHAI.TINH_THANH t
LEFT JOIN CUA_HANG c ON c.MA_TINH = t.MA_TINH
LEFT JOIN DON_HANG d ON d.MA_CH = c.MA_CH AND d.TRANG_THAI = 'Hoàn tất'
GROUP BY 1, 2
ORDER BY DOANH_THU DESC;
`,
}

/** Dòng dõi dữ liệu mô phỏng cho từng bảng: { up: [...nguồn], down: [...đích] } */
export const LINEAGE = {
  DON_HANG: { up: [{ name: 'Máy POS cửa hàng', kind: 'Nguồn ngoài' }, { name: 'POS_STAGE', kind: 'Vùng tạm' }], down: [{ name: 'DOANH_THU_NGAY', kind: 'Bảng' }, { name: 'Bảng doanh thu cửa hàng', kind: 'Ứng dụng' }, { name: 'TRO_LY_VAN_HANH', kind: 'Tác tử AI' }] },
  CHI_TIET_DON: { up: [{ name: 'Máy POS cửa hàng', kind: 'Nguồn ngoài' }, { name: 'POS_STAGE', kind: 'Vùng tạm' }], down: [{ name: 'DOANH_THU_THEO_MON', kind: 'Khung nhìn' }, { name: 'Bảng doanh thu cửa hàng', kind: 'Ứng dụng' }] },
  KHACH_HANG: { up: [{ name: 'Ứng dụng thành viên', kind: 'Nguồn ngoài' }], down: [{ name: 'PHAN_KHUC_RFM', kind: 'Khung nhìn' }, { name: 'TRO_LY_MARKETING', kind: 'Tác tử AI' }] },
  DANH_GIA: { up: [{ name: 'Ứng dụng thành viên', kind: 'Nguồn ngoài' }, { name: 'Biểu mẫu góp ý', kind: 'Nguồn ngoài' }], down: [{ name: 'DANH_GIA_DA_CHAM', kind: 'Bảng' }, { name: 'Theo dõi đánh giá khách hàng', kind: 'Ứng dụng' }] },
  CUA_HANG: { up: [{ name: 'Hệ thống vận hành', kind: 'Nguồn ngoài' }], down: [{ name: 'DOANH_THU_NGAY', kind: 'Bảng' }, { name: 'Bảng doanh thu cửa hàng', kind: 'Ứng dụng' }] },
  SAN_PHAM: { up: [{ name: 'Hệ thống vận hành', kind: 'Nguồn ngoài' }], down: [{ name: 'DOANH_THU_THEO_MON', kind: 'Khung nhìn' }] },
  KHUYEN_MAI: { up: [{ name: 'Lịch marketing', kind: 'Nguồn ngoài' }], down: [{ name: 'TRO_LY_MARKETING', kind: 'Tác tử AI' }] },
  TINH_THANH: { up: [{ name: 'Chợ dữ liệu', kind: 'Chia sẻ' }], down: [{ name: 'CUA_HANG', kind: 'Bảng' }] },
  NGAY_LE_VN: { up: [{ name: 'Chợ dữ liệu', kind: 'Chia sẻ' }], down: [] },
  THOI_TIET_THANG: { up: [{ name: 'Chợ dữ liệu', kind: 'Chia sẻ' }], down: [] },
}

/** Mô tả cột "do AI tạo" — đoán theo tên cột tiếng Việt không dấu */
const COL_HINTS = [
  [/^MA_DON$/, 'Mã định danh duy nhất của đơn hàng'],
  [/^MA_CH$/, 'Mã cửa hàng, nối với bảng CUA_HANG'],
  [/^MA_KH$/, 'Mã khách hàng thành viên; rỗng nếu là khách vãng lai'],
  [/^MA_SP$/, 'Mã sản phẩm, nối với bảng SAN_PHAM'],
  [/^MA_KM$/, 'Mã chương trình khuyến mãi được áp dụng'],
  [/^MA_TINH$/, 'Mã tỉnh, thành phố'],
  [/^MA_/, 'Mã định danh'],
  [/NGAY_DAT/, 'Thời điểm khách đặt đơn (giờ Việt Nam)'],
  [/^NGAY/, 'Ngày ghi nhận'],
  [/TONG_TIEN/, 'Số tiền khách trả sau giảm giá, đơn vị đồng'],
  [/TAM_TINH/, 'Tổng tiền trước giảm giá'],
  [/GIAM_GIA/, 'Số tiền được giảm'],
  [/THANH_TIEN/, 'Số lượng × đơn giá'],
  [/DON_GIA|GIA_BAN/, 'Giá bán một đơn vị, đơn vị đồng'],
  [/GIA_VON/, 'Giá vốn một đơn vị, dùng tính lãi gộp'],
  [/SO_LUONG/, 'Số lượng món trong đơn'],
  [/KENH/, 'Kênh bán: Tại quầy, Ứng dụng hoặc Giao hàng'],
  [/THANH_TOAN/, 'Hình thức thanh toán'],
  [/TRANG_THAI/, 'Trạng thái xử lý'],
  [/HO_TEN|TEN_/, 'Tên hiển thị'],
  [/EMAIL/, 'Địa chỉ email (dữ liệu cá nhân)'],
  [/SO_DIEN_THOAI/, 'Số điện thoại đã che một phần (dữ liệu cá nhân)'],
  [/TINH_THANH/, 'Tỉnh, thành phố'],
  [/VUNG/, 'Vùng miền: Bắc, Trung, Nam'],
  [/HANG_THANH_VIEN/, 'Hạng thành viên theo mức chi tiêu: Đồng, Bạc, Vàng, Kim cương'],
  [/SO_SAO/, 'Số sao khách chấm, từ 1 đến 5'],
  [/NOI_DUNG/, 'Nội dung tự do — thích hợp cho hàm AI_CAM_XUC'],
  [/NHOM/, 'Nhóm sản phẩm'],
  [/GIOI_TINH/, 'Giới tính khách hàng tự khai'],
  [/NAM_SINH/, 'Năm sinh'],
  [/DIEN_TICH/, 'Diện tích mặt bằng (m²)'],
  [/SO_CHO_NGOI/, 'Số chỗ ngồi'],
  [/NGAN_SACH/, 'Ngân sách dự kiến, đơn vị đồng'],
  [/NHIET_DO/, 'Nhiệt độ trung bình (°C)'],
  [/LUONG_MUA/, 'Tổng lượng mưa (mm)'],
]
export function describeColumn(name, type) {
  const hit = COL_HINTS.find(([re]) => re.test(name))
  if (hit) return hit[1]
  return type === 'NUMBER' ? 'Giá trị số' : type === 'DATE' || type === 'TIMESTAMP' ? 'Mốc thời gian' : 'Giá trị văn bản'
}
/** Mô tả bảng "do AI tạo" */
export function describeTable(t) {
  const keys = t.columns.filter((c) => /^MA_/.test(c.name)).map((c) => c.name)
  const money = t.columns.filter((c) => /TIEN|GIA/.test(c.name)).map((c) => c.name)
  const time = t.columns.find((c) => c.type === 'DATE' || c.type === 'TIMESTAMP')
  const parts = [`Bảng ${t.name} gồm ${t.columns.length} cột${t.rows != null ? ` và ${t.rows.toLocaleString('vi-VN')} dòng` : ''}.`]
  if (keys.length) parts.push(`Khoá nhận diện: ${keys.join(', ')}.`)
  if (money.length) parts.push(`Các cột tiền (${money.join(', ')}) tính bằng đồng.`)
  if (time) parts.push(`Cột ${time.name} cho phép phân tích theo thời gian.`)
  if (t.columns.some((c) => /EMAIL|SO_DIEN_THOAI/.test(c.name))) parts.push('Có chứa dữ liệu cá nhân, nên áp chính sách che dữ liệu khi chia sẻ.')
  return parts.join(' ')
}
