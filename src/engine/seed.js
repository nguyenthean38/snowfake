/* ==========================================================
   Sinh bộ dữ liệu mẫu "Chuỗi cà phê Phố Núi" (hư cấu)
   - Có hạt giống cố định: mọi lần tải đều ra cùng số liệu.
   - Đây là bản lấy mẫu rút gọn (khoảng 1% đơn hàng thật của
     một chuỗi cỡ này) để chạy mượt ngay trên trình duyệt.
   ========================================================== */
import { seeded } from '@/lib/random'
import {
  PROVINCES, STORES, PRODUCTS, FAMILY, MIDDLE_F, MIDDLE_M, GIVEN_F, GIVEN_M,
  CHANNELS, PAYMENTS, TIERS, REVIEW_TEXTS, CAMPAIGNS,
} from '@/data/reference'
import { stripAccents } from '@/lib/format'

const pad = (n, w = 2) => String(n).padStart(w, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const isoTime = (d) => `${iso(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

function weighted(r, list) {
  let x = r.next()
  for (const [v, w] of list) { if ((x -= w) <= 0) return v }
  return list[list.length - 1][0]
}

/** Lược đồ bảng (cú pháp SQLite, kiểu đặt theo phong cách kho dữ liệu) */
export const SCHEMA_SQL = `
CREATE TABLE TINH_THANH (MA_TINH TEXT PRIMARY KEY, TEN_TINH TEXT, VUNG TEXT, LA_THANH_PHO BOOLEAN);
CREATE TABLE CUA_HANG (MA_CH TEXT PRIMARY KEY, TEN_CUA_HANG TEXT, MA_TINH TEXT, TINH_THANH TEXT, VUNG TEXT, NGAY_KHAI_TRUONG DATE, DIEN_TICH_M2 INTEGER, SO_CHO_NGOI INTEGER);
CREATE TABLE SAN_PHAM (MA_SP TEXT PRIMARY KEY, TEN_SAN_PHAM TEXT, NHOM TEXT, GIA_BAN INTEGER, GIA_VON INTEGER);
CREATE TABLE KHACH_HANG (MA_KH TEXT PRIMARY KEY, HO_TEN TEXT, GIOI_TINH TEXT, NAM_SINH INTEGER, TINH_THANH TEXT, HANG_THANH_VIEN TEXT, NGAY_DANG_KY DATE, EMAIL TEXT, SO_DIEN_THOAI TEXT);
CREATE TABLE DON_HANG (MA_DON TEXT PRIMARY KEY, NGAY_DAT TIMESTAMP, MA_CH TEXT, MA_KH TEXT, KENH TEXT, THANH_TOAN TEXT, TAM_TINH INTEGER, GIAM_GIA INTEGER, TONG_TIEN INTEGER, MA_KM TEXT, TRANG_THAI TEXT);
CREATE TABLE CHI_TIET_DON (MA_DON TEXT, MA_SP TEXT, SO_LUONG INTEGER, DON_GIA INTEGER, THANH_TIEN INTEGER);
CREATE TABLE DANH_GIA (MA_DG TEXT PRIMARY KEY, NGAY DATE, MA_CH TEXT, MA_KH TEXT, SO_SAO INTEGER, NOI_DUNG TEXT);
CREATE TABLE KHUYEN_MAI (MA_KM TEXT PRIMARY KEY, TEN_CHUONG_TRINH TEXT, TU_NGAY DATE, DEN_NGAY DATE, MO_TA TEXT, NGAN_SACH INTEGER);
CREATE INDEX IX_DON_NGAY ON DON_HANG(NGAY_DAT);
CREATE INDEX IX_CT_DON ON CHI_TIET_DON(MA_DON);
`

/** Sinh toàn bộ dòng dữ liệu. Trả về { TEN_BANG: [[...giá trị], ...] } */
export function generateRows() {
  const r = seeded(20261110)
  const prov = Object.fromEntries(PROVINCES.map((p) => [p.code, p]))
  const out = {}

  out.TINH_THANH = PROVINCES.map((p) => [p.code, p.name, p.region, p.city ? 1 : 0])
  out.CUA_HANG = STORES.map(([id, name, code, open, area, seats]) => [id, name, code, prov[code].name, prov[code].region, open, area, seats])
  out.SAN_PHAM = PRODUCTS.map(([id, name, group, price, cost]) => [id, name, group, price, cost])
  out.KHUYEN_MAI = CAMPAIGNS.map((c) => [...c])

  // ---- Khách hàng thành viên ----
  const storeProv = STORES.map((s) => s[2])
  const customers = []
  for (let i = 1; i <= 900; i++) {
    const female = r.chance(0.56)
    const fam = r.pick(FAMILY)
    const mid = r.pick(female ? MIDDLE_F : MIDDLE_M)
    const giv = r.pick(female ? GIVEN_F : GIVEN_M)
    const name = `${fam} ${mid} ${giv}`
    const code = r.chance(0.85) ? r.pick(storeProv) : r.pick(PROVINCES).code
    const join = new Date(2023, 0, 1 + r.int(0, 1400))
    const mail = stripAccents(`${giv}.${fam}${r.int(1, 99)}`).toLowerCase() + '@' + r.pick(['mail.vn', 'thu.vn', 'hopthu.vn'])
    customers.push({
      id: `KH${pad(i, 4)}`, name, female, year: r.int(1970, 2006), prov: prov[code].name,
      tier: weighted(r, TIERS), join: iso(join), mail, phone: `09${r.int(0, 9)}****${pad(r.int(0, 999), 3)}`,
      loyalty: r.next(),
    })
  }
  out.KHACH_HANG = customers.map((c) => [c.id, c.name, c.female ? 'Nữ' : 'Nam', c.year, c.prov, c.tier, c.join, c.mail, c.phone])

  // ---- Đơn hàng & chi tiết ----
  const prodWeights = PRODUCTS.map((p) => [p, p[5]])
  const totalW = prodWeights.reduce((s, [, w]) => s + w, 0)
  const normProd = prodWeights.map(([p, w]) => [p, w / totalW])
  const storeW = STORES.map((s) => s[6])
  const start = new Date(2026, 0, 1)
  const end = new Date(2026, 10, 10, 10, 0)
  const hourW = [[6, 0.03], [7, 0.1], [8, 0.13], [9, 0.1], [10, 0.07], [11, 0.06], [12, 0.06], [13, 0.07], [14, 0.09], [15, 0.09], [16, 0.07], [17, 0.05], [18, 0.04], [19, 0.04], [20, 0.03], [21, 0.02]]
  const orders = [], lines = []
  let seq = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const m = d.getMonth(), dow = d.getDay(), day = d.getDate()
    // mùa vụ: Tết (giữa tháng 2) giảm mạnh, hè cao, cuối tuần cao, tăng trưởng đều qua các tháng
    let f = 1 + m * 0.035
    if (m === 1 && day >= 14 && day <= 22) f *= 0.45
    if (m === 1 && day >= 23) f *= 1.25
    if (m >= 4 && m <= 6) f *= 1.18
    if (dow === 0 || dow === 6) f *= 1.22
    if (m === 9) f *= 1.08
    STORES.forEach((s, si) => {
      if (iso(d) < s[3]) return
      const lambda = 1.85 * f * storeW[si]
      let n = Math.floor(lambda) + (r.chance(lambda % 1) ? 1 : 0)
      for (let k = 0; k < n; k++) {
        const t = new Date(d)
        t.setHours(weighted(r, hourW), r.int(0, 59), r.int(0, 59))
        if (t > end) continue
        seq++
        const id = `DH${pad(seq, 6)}`
        const member = r.chance(0.68)
        const cust = member ? customers[Math.floor(Math.pow(r.next(), 1.6) * customers.length)] : null
        const ch = weighted(r, CHANNELS)
        const pay = ch === 'Tại quầy' ? weighted(r, PAYMENTS) : weighted(r, [['Ví điện tử', 0.45], ['VietQR', 0.35], ['Thẻ', 0.2]])
        const items = 1 + (r.chance(0.45) ? 1 : 0) + (r.chance(0.18) ? 1 : 0) + (r.chance(0.06) ? 1 : 0)
        let sub = 0
        const used = new Set()
        for (let j = 0; j < items; j++) {
          let p = weighted(r, normProd)
          if (used.has(p[0])) continue
          used.add(p[0])
          const qty = r.chance(0.82) ? 1 : r.int(2, 3)
          const amt = qty * p[3]
          sub += amt
          lines.push([id, p[0], qty, p[3], amt])
        }
        const ds = iso(t)
        const promo = CAMPAIGNS.find((c) => ds >= c[2] && ds <= c[3])
        let disc = 0
        let promoId = null
        if (promo && r.chance(0.35)) { disc = Math.round(sub * (promo[0] === 'KM03' ? 0.2 : 0.12) / 1000) * 1000; promoId = promo[0] }
        else if (cust && (cust.tier === 'Vàng' || cust.tier === 'Kim cương') && r.chance(0.3)) disc = Math.round(sub * 0.08 / 1000) * 1000
        const status = r.chance(0.015) ? 'Đã huỷ' : ch === 'Giao hàng' && r.chance(0.02) ? 'Hoàn tiền' : 'Hoàn tất'
        orders.push([id, isoTime(t), s[0], cust?.id ?? null, ch, pay, sub, disc, sub - disc, promoId, status])
      }
    })
  }
  out.DON_HANG = orders
  // Hạng thành viên theo mức chi tiêu thực tế trong năm
  const spend = {}
  for (const o of orders) if (o[3] && o[10] === 'Hoàn tất') spend[o[3]] = (spend[o[3]] || 0) + o[8]
  const ranked = [...customers].sort((a, b) => (spend[b.id] || 0) - (spend[a.id] || 0))
  ranked.forEach((c, i) => { const p = i / ranked.length; c.tier = p < 0.05 ? 'Kim cương' : p < 0.17 ? 'Vàng' : p < 0.45 ? 'Bạc' : 'Đồng' })
  out.KHACH_HANG = customers.map((c) => [c.id, c.name, c.female ? 'Nữ' : 'Nam', c.year, c.prov, c.tier, c.join, c.mail, c.phone])
  out.CHI_TIET_DON = lines

  // ---- Đánh giá của khách ----
  const reviews = []
  for (let i = 1; i <= 240; i++) {
    const [stars, text] = REVIEW_TEXTS[Math.floor(r.next() * REVIEW_TEXTS.length)]
    const s = STORES[Math.floor(r.next() * STORES.length)]
    const c = customers[r.int(0, customers.length - 1)]
    const date = new Date(2026, 0, 1 + r.int(0, 312))
    reviews.push([`DG${pad(i, 4)}`, iso(date), s[0], c.id, stars, text])
  }
  reviews.sort((a, b) => (a[1] < b[1] ? -1 : 1))
  out.DANH_GIA = reviews
  return out
}

/** Bảng ngày lễ (cài thêm từ Chợ dữ liệu) */
export const HOLIDAY_SQL = `
CREATE TABLE NGAY_LE_VN (NGAY DATE, TEN_NGAY_LE TEXT, LOAI TEXT, NGHI_LE BOOLEAN);
INSERT INTO NGAY_LE_VN VALUES
('2026-01-01','Tết Dương lịch','Dương lịch',1),
('2026-02-14','Lễ Tình nhân','Không chính thức',0),
('2026-02-17','Mùng 1 Tết Nguyên đán Bính Ngọ','Âm lịch',1),
('2026-03-08','Quốc tế Phụ nữ','Không chính thức',0),
('2026-04-30','Ngày Giải phóng miền Nam','Dương lịch',1),
('2026-05-01','Quốc tế Lao động','Dương lịch',1),
('2026-06-01','Quốc tế Thiếu nhi','Không chính thức',0),
('2026-09-02','Quốc khánh','Dương lịch',1),
('2026-10-20','Ngày Phụ nữ Việt Nam','Không chính thức',0),
('2026-11-20','Ngày Nhà giáo Việt Nam','Không chính thức',0),
('2026-12-24','Lễ Giáng sinh','Không chính thức',0);
`

/** Bảng thời tiết mô phỏng theo tỉnh (cài thêm từ Chợ dữ liệu) */
export function weatherRows() {
  const r = seeded(77)
  const rows = []
  const cities = [['HNI', 'Hà Nội', 24], ['HCM', 'TP. Hồ Chí Minh', 29], ['DNG', 'Đà Nẵng', 27], ['LDG', 'Lâm Đồng', 19], ['DLK', 'Đắk Lắk', 24]]
  for (let m = 0; m < 11; m++) {
    for (const [code, name, base] of cities) {
      const seasonal = code === 'HNI' ? [-7, -6, -3, 1, 5, 7, 7, 6, 4, 1, -3][m] : [0, 1, 2, 3, 2, 1, 0, 0, -1, -1, -2][m]
      const rain = [10, 15, 30, 80, 180, 220, 260, 280, 240, 160, 90][m] * (code === 'HCM' ? 1.1 : code === 'HNI' ? 0.9 : 1)
      rows.push([`2026-${pad(m + 1)}-01`, code, name, Math.round((base + seasonal + r.next() * 1.5) * 10) / 10, Math.round(rain * (0.8 + r.next() * 0.4))])
    }
  }
  return rows
}
