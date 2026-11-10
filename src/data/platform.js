/* ==========================================================
   Dữ liệu mô phỏng của nền tảng Lạc Việt Data (tài khoản Phố Núi)
   Mọi tên công ty, nhà cung cấp, đám mây đều là hư cấu.
   ========================================================== */
import { seeded } from '@/lib/random'
import { TODAY } from '@/lib/format'

export const ORG = {
  name: 'Công ty CP Phố Núi',
  short: 'Phố Núi',
  account: 'PHONUI-VN01',
  locator: 'PN64368',
  edition: 'Doanh nghiệp',
  cloud: 'Trường Sơn Cloud',
  region: 'TP. Hồ Chí Minh',
  regionId: 'truongson-hcm-1',
  url: 'phonui-vn01.lacviet.demo',
  created: '2026-01-05',
}

export const ME = {
  username: 'MINHKHOA',
  name: 'Trần Minh Khoa',
  first: 'Khoa',
  email: 'khoa.tran@phonui.demo',
  role: 'QUAN_TRI',
  title: 'Trưởng nhóm dữ liệu',
  color: '#5b46e5',
}

/** Tín dụng dùng thử (đồng) */
export const TRIAL = { total: 10_000_000, used: 1_258_000, daysLeft: 23 }

export const CLOUDS = [
  { id: 'truongson', name: 'Trường Sơn Cloud', desc: 'Trung tâm dữ liệu Bắc – Nam', color: '#5b46e5' },
  { id: 'auco', name: 'Âu Cơ Cloud', desc: 'Hạ tầng xanh, điện tái tạo', color: '#0fb5c9' },
  { id: 'hongbang', name: 'Hồng Bàng Cloud', desc: 'Kết nối quốc tế qua Singapore', color: '#f29d38' },
]
export const REGIONS = [
  { id: 'hcm-1', name: 'TP. Hồ Chí Minh', code: 'hcm-1' },
  { id: 'hn-1', name: 'Hà Nội', code: 'hn-1' },
  { id: 'dn-1', name: 'Đà Nẵng', code: 'dn-1' },
  { id: 'sg-1', name: 'Singapore', code: 'sg-1' },
]
export const EDITIONS = [
  { id: 'std', name: 'Tiêu chuẩn', price: 52000, desc: 'Đủ cho nhóm nhỏ bắt đầu phân tích dữ liệu', features: ['Kho dữ liệu, SQL, Notebook', 'Hàm AI cơ bản', 'Hỗ trợ trong giờ hành chính'] },
  { id: 'ent', name: 'Doanh nghiệp', price: 78000, popular: true, desc: 'Phổ biến nhất: thêm AI, chia sẻ và quản trị nâng cao', features: ['Mọi tính năng Tiêu chuẩn', 'Tác tử AI, Hỏi dữ liệu bằng tiếng Việt', 'Kho tính toán nhiều cụm', 'Khôi phục dữ liệu 90 ngày'] },
  { id: 'crit', name: 'Trọng yếu', price: 104000, desc: 'Cho dữ liệu nhạy cảm: tài chính, y tế', features: ['Mọi tính năng Doanh nghiệp', 'Khoá mã hoá do khách hàng quản lý', 'Kết nối riêng, chống mất dữ liệu liên vùng'] },
]
export const CREDIT_PRICE = 78000 // đồng / tín dụng (gói Doanh nghiệp)

export const SIZES = [
  { id: 'X-Small', credits: 1 }, { id: 'Small', credits: 2 }, { id: 'Medium', credits: 4 },
  { id: 'Large', credits: 8 }, { id: 'X-Large', credits: 16 }, { id: '2X-Large', credits: 32 },
]

export const WAREHOUSES = [
  { id: 'w1', name: 'KHO_PHAN_TICH', size: 'X-Small', type: 'Tiêu chuẩn', state: 'Đang chạy', autoSuspend: 60, clusters: [1, 1], owner: 'QUAN_TRI', running: 1, queued: 0, created: '2026-01-05', comment: 'Kho mặc định cho trình soạn SQL' },
  { id: 'w2', name: 'KHO_NAP_DU_LIEU', size: 'Small', type: 'Tiêu chuẩn', state: 'Tạm dừng', autoSuspend: 60, clusters: [1, 1], owner: 'HE_THONG', running: 0, queued: 0, created: '2026-01-06', comment: 'Đồng bộ dữ liệu bán hàng từ máy POS' },
  { id: 'w3', name: 'KHO_AI', size: 'Medium', type: 'Tối ưu bộ nhớ', state: 'Tạm dừng', autoSuspend: 300, clusters: [1, 2], owner: 'PHAN_TICH', running: 0, queued: 0, created: '2026-03-14', comment: 'Hàm AI, tác tử và huấn luyện mô hình' },
  { id: 'w4', name: 'KHO_UNG_DUNG', size: 'X-Small', type: 'Tiêu chuẩn', state: 'Tạm dừng', autoSuspend: 60, clusters: [1, 3], owner: 'HE_THONG', running: 0, queued: 0, created: '2026-05-02', comment: 'Phục vụ ứng dụng dữ liệu nội bộ' },
]

export const COMPUTE_POOLS = [
  { id: 'cp1', name: 'CUM_CPU_HE_THONG', family: 'CPU_X64_S', state: 'Đang chạy', nodes: [1, 3], active: 1, services: 2 },
  { id: 'cp2', name: 'CUM_GPU_HE_THONG', family: 'GPU_NV_S', state: 'Tạm dừng', nodes: [1, 1], active: 0, services: 0 },
]

export const ROLES = [
  { name: 'QUAN_TRI', label: 'Quản trị tài khoản', desc: 'Toàn quyền trên tài khoản, gồm thanh toán', users: 2, system: true },
  { name: 'BAO_MAT', label: 'Quản trị bảo mật', desc: 'Quản lý người dùng, vai trò, chính sách mạng', users: 1, system: true },
  { name: 'HE_THONG', label: 'Quản trị hệ thống', desc: 'Tạo kho tính toán, cơ sở dữ liệu', users: 2, system: true },
  { name: 'PHAN_TICH', label: 'Nhà phân tích', desc: 'Đọc dữ liệu bán hàng, tạo bảng tạm, dùng hàm AI', users: 4 },
  { name: 'MARKETING', label: 'Marketing', desc: 'Đọc dữ liệu khách hàng đã che thông tin cá nhân', users: 2 },
  { name: 'CONG_KHAI', label: 'Công khai', desc: 'Vai trò mặc định của mọi người dùng', users: 9, system: true },
]

export const USERS = [
  { id: 'u1', username: 'MINHKHOA', name: 'Trần Minh Khoa', email: 'khoa.tran@phonui.demo', role: 'QUAN_TRI', status: 'Đang hoạt động', mfa: true, lastLogin: '2026-11-10T09:58:00', type: 'Người dùng', created: '2026-01-05' },
  { id: 'u2', username: 'THUHA', name: 'Lê Thu Hà', email: 'ha.le@phonui.demo', role: 'QUAN_TRI', status: 'Đang hoạt động', mfa: true, lastLogin: '2026-11-09T17:20:00', type: 'Người dùng', created: '2026-01-05' },
  { id: 'u3', username: 'QUOCBAO', name: 'Phạm Quốc Bảo', email: 'bao.pham@phonui.demo', role: 'HE_THONG', status: 'Đang hoạt động', mfa: true, lastLogin: '2026-11-10T08:12:00', type: 'Người dùng', created: '2026-01-08' },
  { id: 'u4', username: 'NGOCANH', name: 'Nguyễn Ngọc Anh', email: 'anh.nguyen@phonui.demo', role: 'PHAN_TICH', status: 'Đang hoạt động', mfa: false, lastLogin: '2026-11-07T14:45:00', type: 'Người dùng', created: '2026-02-11' },
  { id: 'u5', username: 'DUCHUY', name: 'Võ Đức Huy', email: 'huy.vo@phonui.demo', role: 'PHAN_TICH', status: 'Đang hoạt động', mfa: true, lastLogin: '2026-11-10T07:30:00', type: 'Người dùng', created: '2026-03-02' },
  { id: 'u6', username: 'MAILINH', name: 'Đặng Mai Linh', email: 'linh.dang@phonui.demo', role: 'MARKETING', status: 'Đang hoạt động', mfa: false, lastLogin: '2026-11-05T10:05:00', type: 'Người dùng', created: '2026-04-19' },
  { id: 'u7', username: 'HOANGNAM', name: 'Bùi Hoàng Nam', email: 'nam.bui@phonui.demo', role: 'BAO_MAT', status: 'Bị khoá', mfa: true, lastLogin: '2026-09-28T16:00:00', type: 'Người dùng', created: '2026-02-20' },
  { id: 'u8', username: 'DONG_BO_POS', name: 'Dịch vụ đồng bộ POS', email: '', role: 'HE_THONG', status: 'Đang hoạt động', mfa: false, lastLogin: '2026-11-10T10:00:00', type: 'Dịch vụ', created: '2026-01-06' },
]

export const PROJECT_TEMPLATES = [
  { id: 't1', title: 'Phân tích doanh thu chuỗi cửa hàng bằng SQL', kind: 'Tệp SQL', topic: 'Cơ bản', icon: 'FileCode2', file: 'phan_tich_doanh_thu.sql' },
  { id: 't2', title: 'Đọc cảm xúc đánh giá khách hàng bằng hàm AI', kind: 'Tệp SQL', topic: 'AI & ML', icon: 'Sparkles', file: 'cam_xuc_danh_gia.sql' },
  { id: 't3', title: 'Dự báo doanh thu 30 ngày tới', kind: 'Sổ tay', topic: 'AI & ML', icon: 'LineChart', file: 'du_bao_doanh_thu.sql' },
  { id: 't4', title: 'Nạp tệp CSV từ máy POS', kind: 'Tệp SQL', topic: 'Kỹ thuật dữ liệu', icon: 'Upload', file: 'nap_csv.sql' },
  { id: 't5', title: 'Phân khúc khách hàng RFM', kind: 'Tệp SQL', topic: 'Marketing', icon: 'Users', file: 'phan_khuc_rfm.sql' },
  { id: 't6', title: 'Hiệu quả chương trình khuyến mãi', kind: 'Tệp SQL', topic: 'Marketing', icon: 'Megaphone', file: 'hieu_qua_khuyen_mai.sql' },
]

/* ---------------- Lịch sử truy vấn mẫu ---------------- */
const SAMPLE_SQL = [
  ['SELECT * FROM DON_HANG ORDER BY NGAY_DAT DESC LIMIT 100', 'MINHKHOA', 'QUAN_TRI', 'KHO_PHAN_TICH', 100],
  ["SELECT MA_CH, SUM(TONG_TIEN) FROM DON_HANG WHERE NGAY_DAT >= '2026-11-01' GROUP BY 1", 'NGOCANH', 'PHAN_TICH', 'KHO_PHAN_TICH', 20],
  ['COPY INTO DON_HANG FROM @POS_STAGE/2026-11-10/ FILE_FORMAT = (TYPE = CSV)', 'DONG_BO_POS', 'HE_THONG', 'KHO_NAP_DU_LIEU', 412],
  ["SELECT AI_CAM_XUC(NOI_DUNG), COUNT(*) FROM DANH_GIA GROUP BY 1", 'DUCHUY', 'PHAN_TICH', 'KHO_AI', 3],
  ['CREATE OR REPLACE TABLE DOANH_THU_NGAY AS SELECT DATE(NGAY_DAT) NGAY, MA_CH, SUM(TONG_TIEN) DOANH_THU FROM DON_HANG GROUP BY 1, 2', 'DONG_BO_POS', 'HE_THONG', 'KHO_NAP_DU_LIEU', 1],
  ["SELECT HO_TEN, EMAIL FROM KHACH_HANG WHERE HANG_THANH_VIEN = 'Kim cương'", 'MAILINH', 'MARKETING', 'KHO_PHAN_TICH', 45],
  ['SELECT * FROM DOANH_THU_THANG_NAY', 'THUHA', 'QUAN_TRI', 'KHO_PHAN_TICH', 0],
  ['SHOW TABLES', 'QUOCBAO', 'HE_THONG', 'KHO_PHAN_TICH', 9],
  ["SELECT p.NHOM, SUM(ct.THANH_TIEN) FROM CHI_TIET_DON ct JOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP GROUP BY 1", 'NGOCANH', 'PHAN_TICH', 'KHO_PHAN_TICH', 7],
  ['CALL CAP_NHAT_DOANH_THU_NGAY()', 'DONG_BO_POS', 'HE_THONG', 'KHO_NAP_DU_LIEU', 1],
]
export function seedHistory() {
  const r = seeded(42)
  const out = []
  for (let i = 0; i < 46; i++) {
    const [sql, user, role, wh, rows] = SAMPLE_SQL[i % SAMPLE_SQL.length]
    const failed = sql.includes('DOANH_THU_THANG_NAY') || r.chance(0.06)
    const ms = Math.round(sql.startsWith('COPY') ? 3000 + r.next() * 9000 : sql.includes('AI_') ? 1800 + r.next() * 2500 : 40 + r.next() * 900)
    out.push({
      id: `01c6${(9000 + i).toString(16)}-000a-63d6-0005-${String(5281003729 + i * 37).padStart(12, '0')}`,
      sql, user, role, warehouse: wh, size: wh === 'KHO_AI' ? 'Medium' : wh === 'KHO_NAP_DU_LIEU' ? 'Small' : 'X-Small',
      status: failed ? 'Lỗi' : 'Thành công', error: failed ? "Không tìm thấy bảng 'DOANH_THU_THANG_NAY' hoặc bạn không có quyền truy cập." : null,
      ms, rows: failed ? 0 : rows, bytes: Math.round((rows + 1) * 1800 * (1 + r.next())),
      startedAt: TODAY.getTime() - (i * 47 + r.int(0, 40)) * 60000, source: user === 'DONG_BO_POS' ? 'Tác vụ' : r.chance(0.3) ? 'Sổ tay' : 'Không gian làm việc',
      kind: sql.startsWith('SELECT') || sql.startsWith('SHOW') ? 'select' : sql.startsWith('CREATE') ? 'ddl' : 'dml',
    })
  }
  return out
}

/* ---------------- Tác vụ định kỳ ---------------- */
export const TASKS = [
  { id: 'k1', name: 'DONG_BO_POS_15_PHUT', schedule: 'Mỗi 15 phút', cron: '*/15 * * * *', warehouse: 'KHO_NAP_DU_LIEU', owner: 'HE_THONG', state: 'Đang chạy', database: 'PHO_NUI_DB', schema: 'BAN_HANG', sql: "COPY INTO DON_HANG FROM @POS_STAGE FILE_FORMAT = (TYPE = CSV) ON_ERROR = 'CONTINUE';", successRate: 0.99, avgMs: 8200 },
  { id: 'k2', name: 'CAP_NHAT_DOANH_THU_NGAY', schedule: 'Hằng ngày lúc 06:00', cron: '0 6 * * *', warehouse: 'KHO_NAP_DU_LIEU', owner: 'HE_THONG', state: 'Đang chạy', database: 'PHO_NUI_DB', schema: 'BAN_HANG', sql: 'CREATE OR REPLACE TABLE DOANH_THU_NGAY AS\nSELECT DATE(NGAY_DAT) AS NGAY, MA_CH, SUM(TONG_TIEN) AS DOANH_THU\nFROM DON_HANG GROUP BY 1, 2;', successRate: 1, avgMs: 4100, after: 'DONG_BO_POS_15_PHUT' },
  { id: 'k3', name: 'CHAM_DIEM_CAM_XUC_DANH_GIA', schedule: 'Mỗi giờ', cron: '0 * * * *', warehouse: 'KHO_AI', owner: 'PHAN_TICH', state: 'Đang chạy', database: 'PHO_NUI_DB', schema: 'MARKETING', sql: "MERGE INTO DANH_GIA_DA_CHAM t USING (SELECT MA_DG, AI_CAM_XUC(NOI_DUNG) CAM_XUC FROM DANH_GIA) s ON t.MA_DG = s.MA_DG\nWHEN NOT MATCHED THEN INSERT VALUES (s.MA_DG, s.CAM_XUC);", successRate: 0.94, avgMs: 26000 },
  { id: 'k4', name: 'GUI_BAO_CAO_TUAN', schedule: 'Thứ hai lúc 08:00', cron: '0 8 * * 1', warehouse: 'KHO_PHAN_TICH', owner: 'QUAN_TRI', state: 'Tạm dừng', database: 'PHO_NUI_DB', schema: 'BAN_HANG', sql: "CALL GUI_EMAIL_BAO_CAO('ban-giam-doc@phonui.demo');", successRate: 1, avgMs: 2600 },
]

/* ---------------- Tác tử AI ---------------- */
export const AGENTS = [
  {
    id: 'a1', name: 'TRO_LY_VAN_HANH', display: 'Trợ lý vận hành cửa hàng', color: '#5b46e5', icon: 'Store',
    desc: 'Trả lời câu hỏi của quản lý cửa hàng về doanh thu, món bán chạy và đánh giá khách hàng.',
    status: 'Đã xuất bản', version: 3, model: 'VAN-LANG-70B', database: 'PHO_NUI_DB', schema: 'BAN_HANG',
    instructions: 'Bạn là trợ lý của chuỗi cà phê Phố Núi. Luôn trả lời bằng tiếng Việt, ngắn gọn, có số liệu cụ thể và nêu rõ khoảng thời gian. Nếu câu hỏi ngoài phạm vi dữ liệu bán hàng, hãy từ chối lịch sự.',
    tools: ['Hỏi dữ liệu bán hàng', 'Tìm trong đánh giá khách hàng'], questions: ['Hôm qua cửa hàng nào bán tốt nhất?', 'Món nào đang giảm doanh số?', 'Khách phàn nàn gì nhiều nhất tuần này?'],
    access: ['QUAN_TRI', 'PHAN_TICH'], updated: '2026-11-08T15:20:00', sessions: 312, readiness: 82,
  },
  {
    id: 'a2', name: 'TRO_LY_MARKETING', display: 'Trợ lý chiến dịch', color: '#e0559b', icon: 'Megaphone',
    desc: 'Gợi ý tệp khách hàng và đánh giá hiệu quả khuyến mãi.',
    status: 'Bản nháp', version: 1, model: 'VAN-LANG-8B', database: 'PHO_NUI_DB', schema: 'MARKETING',
    instructions: 'Bạn hỗ trợ đội marketing. Không bao giờ hiển thị email hay số điện thoại của khách hàng.',
    tools: ['Hỏi dữ liệu bán hàng'], questions: ['Chương trình khuyến mãi nào hiệu quả nhất?'],
    access: ['QUAN_TRI', 'MARKETING'], updated: '2026-11-02T09:00:00', sessions: 0, readiness: 35,
  },
]

export const MODELS = [
  { id: 'm1', name: 'VAN-LANG-70B', kind: 'Sinh văn bản', source: 'Lạc Việt Data', versions: 2, created: '2026-08-01', desc: 'Mô hình ngôn ngữ lớn tối ưu cho tiếng Việt, ngữ cảnh 128K' },
  { id: 'm2', name: 'VAN-LANG-8B', kind: 'Sinh văn bản', source: 'Lạc Việt Data', versions: 3, created: '2026-06-12', desc: 'Bản gọn, phản hồi nhanh, chi phí thấp' },
  { id: 'm3', name: 'SEN-EMBED-VI', kind: 'Nhúng văn bản', source: 'Lạc Việt Data', versions: 1, created: '2026-05-20', desc: 'Vector 1024 chiều cho tìm kiếm ngữ nghĩa tiếng Việt' },
  { id: 'm4', name: 'HOA-SEN-OCR', kind: 'Đọc tài liệu', source: 'Lạc Việt Data', versions: 1, created: '2026-07-03', desc: 'Đọc hoá đơn, chứng từ scan tiếng Việt' },
  { id: 'm5', name: 'PHAN_LOAI_CAM_XUC_VI', kind: 'Phân loại', source: 'Phố Núi', versions: 4, created: '2026-09-15', desc: 'Tinh chỉnh từ VAN-LANG-8B trên 12.000 đánh giá đã gán nhãn' },
  { id: 'm6', name: 'DU_BAO_DOANH_THU_CH', kind: 'Dự báo chuỗi thời gian', source: 'Phố Núi', versions: 2, created: '2026-10-21', desc: 'Dự báo doanh thu ngày theo từng cửa hàng' },
]

export const ALERTS = [
  { id: 'al1', name: 'CANH_BAO_DON_HUY_TANG', state: 'Đang bật', schedule: 'Mỗi 1 giờ', condition: 'Tỷ lệ đơn huỷ trong 1 giờ > 5%', action: 'Email tới khoa.tran@phonui.demo', lastRun: '2026-11-10T10:00:00', lastResult: 'Không kích hoạt', category: 'Chất lượng dữ liệu' },
  { id: 'al2', name: 'CANH_BAO_TIN_DUNG_NGAY', state: 'Đang bật', schedule: 'Hằng ngày 07:00', condition: 'Tín dụng dùng trong ngày > 12', action: 'Email tới quản trị', lastRun: '2026-11-10T07:00:00', lastResult: 'Đã kích hoạt', category: 'Chi phí' },
]

/** Tiêu thụ tín dụng 30 ngày gần nhất theo kho */
export function seedConsumption() {
  const r = seeded(9)
  const out = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(TODAY); d.setDate(d.getDate() - i)
    const wd = d.getDay()
    const busy = wd === 0 || wd === 6 ? 0.55 : 1
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      KHO_PHAN_TICH: +(busy * (1.6 + r.next() * 1.8)).toFixed(2),
      KHO_NAP_DU_LIEU: +(2.4 + r.next() * 0.8).toFixed(2),
      KHO_AI: +(busy * (i < 9 ? 2.5 + r.next() * 3 : 0.6 + r.next() * 1.2)).toFixed(2),
      DICH_VU_DAM_MAY: +(0.3 + r.next() * 0.3).toFixed(2),
      LUU_TRU: 0.42,
    })
  }
  return out
}

export const BUDGETS = [
  { id: 'b1', name: 'Ngân sách tài khoản', scope: 'Toàn tài khoản', limit: 180, period: 'Tháng', notify: ['khoa.tran@phonui.demo'] },
  { id: 'b2', name: 'Ngân sách AI', scope: 'KHO_AI', limit: 60, period: 'Tháng', notify: ['huy.vo@phonui.demo'] },
]
export const MONITORS = [
  { id: 'rm1', name: 'GIOI_HAN_KHO_PHAN_TICH', quota: 80, used: 41.6, level: 'Kho tính toán', warehouses: ['KHO_PHAN_TICH'], frequency: 'Hằng tháng', actions: [{ at: 90, do: 'Thông báo' }, { at: 100, do: 'Tạm dừng sau khi chạy xong' }] },
]

/* ---------------- Chợ dữ liệu ---------------- */
export const LISTINGS = [
  { id: 'ngay-le', title: 'Ngày lễ & sự kiện Việt Nam 2026', provider: 'Lạc Việt Dữ liệu mở', category: 'Tham chiếu', price: 'Miễn phí', installable: true, table: 'NGAY_LE_VN', color: '#e0559b', icon: 'CalendarDays', rating: 4.8, desc: 'Ngày lễ chính thức và ngày kỷ niệm thường ảnh hưởng tới tiêu dùng: Tết, 30/4, 2/9, 20/10, 20/11… Ghép với dữ liệu bán hàng để đo hiệu ứng mùa vụ.', tags: ['Sẵn sàng cho AI', 'Cập nhật hằng năm'] },
  { id: 'thoi-tiet', title: 'Thời tiết theo tháng — 5 tỉnh, thành', provider: 'Mây Trời Analytics', category: 'Môi trường', price: 'Miễn phí dùng thử', installable: true, table: 'THOI_TIET_THANG', color: '#0fb5c9', icon: 'CloudSun', rating: 4.5, desc: 'Nhiệt độ trung bình và lượng mưa theo tháng tại Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Lâm Đồng, Đắk Lắk. Dùng để giải thích biến động doanh số đồ uống đá xay, nóng.', tags: ['Dữ liệu mô phỏng', 'Theo tháng'] },
  { id: 'hanh-chinh', title: 'Danh mục hành chính 34 tỉnh, thành', provider: 'Lạc Việt Dữ liệu mở', category: 'Tham chiếu', price: 'Miễn phí', installed: true, table: 'TINH_THANH', color: '#5b46e5', icon: 'Map', rating: 4.9, desc: 'Danh sách tỉnh, thành phố sau sắp xếp đơn vị hành chính năm 2025, kèm mã và vùng miền.', tags: ['Đã cài', 'Tham chiếu'] },
  { id: 'ty-gia', title: 'Tỷ giá tham khảo hằng ngày', provider: 'Sao Kim Tài chính', category: 'Tài chính', price: 'Theo yêu cầu', color: '#f29d38', icon: 'Coins', rating: 4.6, desc: 'Tỷ giá tham khảo của 24 đồng tiền so với VND, cập nhật lúc 8:30 mỗi ngày làm việc.', tags: ['Cập nhật hằng ngày'] },
  { id: 'luu-luong', title: 'Lưu lượng người qua lại khu thương mại', provider: 'Phố Đông Insights', category: 'Bán lẻ', price: 'Trả phí', color: '#2fb57c', icon: 'Footprints', rating: 4.3, desc: 'Ước tính lượt người qua lại theo giờ tại 1.200 tuyến phố thương mại ở 6 thành phố lớn, ẩn danh hoàn toàn.', tags: ['Sẵn sàng cho AI'] },
  { id: 'nong-san', title: 'Giá nguyên liệu cà phê, sữa, đường', provider: 'Đồng Xanh Data', category: 'Hàng hoá', price: 'Trả phí', color: '#8a6d3b', icon: 'Wheat', rating: 4.4, desc: 'Giá tham khảo cà phê Robusta nhân xô, sữa đặc, đường kính theo tuần tại các vùng nguyên liệu.', tags: ['Theo tuần'] },
  { id: 'kh360', title: 'Ứng dụng Khách hàng 360', provider: 'Lụa Software', category: 'Ứng dụng', price: 'Dùng thử 30 ngày', color: '#4a35cf', icon: 'AppWindow', rating: 4.7, app: true, desc: 'Ứng dụng chạy ngay trong tài khoản Lạc Việt Data: hợp nhất hồ sơ khách hàng, tính RFM, gợi ý tệp chăm sóc. Dữ liệu không rời khỏi tài khoản của bạn.', tags: ['Ứng dụng gốc'] },
  { id: 'dan-so', title: 'Thống kê dân cư theo phường, xã', provider: 'Bản Đồ Việt Analytics', category: 'Nhân khẩu học', price: 'Theo yêu cầu', color: '#0b8f8f', icon: 'Users', rating: 4.2, desc: 'Ước tính quy mô dân cư, độ tuổi, mức chi tiêu bình quân theo đơn vị hành chính cấp xã (mô hình hoá từ nhiều nguồn công khai).', tags: ['Sẵn sàng cho AI'] },
]

export const APPS = [
  { id: 'app1', name: 'Bảng doanh thu cửa hàng', owner: 'QUAN_TRI', warehouse: 'KHO_UNG_DUNG', updated: '2026-11-09T16:10:00', status: 'Đang chạy', views: 128, desc: 'Ứng dụng nội bộ cho quản lý vùng xem doanh thu theo ngày, có thanh trượt chọn số ngày.' },
  { id: 'app2', name: 'Theo dõi đánh giá khách hàng', owner: 'PHAN_TICH', warehouse: 'KHO_UNG_DUNG', updated: '2026-11-03T11:00:00', status: 'Đang chạy', views: 54, desc: 'Lọc đánh giá theo cảm xúc và chủ đề, giao việc cho cửa hàng xử lý.' },
]

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Tác vụ CHAM_DIEM_CAM_XUC_DANH_GIA lỗi 1 lần', desc: 'Lần chạy 09:00 vượt thời gian chờ, lần 10:00 đã thành công.', time: '2026-11-10T09:05:00', tone: 'warn', read: false, to: '/bien-doi/tac-vu' },
  { id: 'n2', title: 'Cảnh báo chi phí: KHO_AI dùng 4,8 tín dụng hôm qua', desc: 'Cao hơn 2,3 lần trung bình 7 ngày.', time: '2026-11-10T07:00:00', tone: 'neg', read: false, to: '/quan-tri/chi-phi' },
  { id: 'n3', title: 'Lê Thu Hà đã chia sẻ tệp “bao_cao_thang_10.sql” với bạn', desc: '', time: '2026-11-09T17:22:00', tone: 'info', read: true, to: '/khong-gian' },
  { id: 'n4', title: 'Ra mắt hàm AI_TRICH_XUAT', desc: 'Trích món ăn, vấn đề, email… từ văn bản tiếng Việt ngay trong SQL.', time: '2026-11-06T09:00:00', tone: 'brand', read: true, to: '/ai/ham' },
]

export const SECURITY = {
  mfaReadyHumans: 2, mfaTotalHumans: 7, serviceNoKey: 0,
  enforceDate: '01/03/2027',
  findings: [
    { id: 's1', severity: 'Cao', title: '2 người dùng chưa bật xác thực đa yếu tố', fix: 'Yêu cầu bật MFA', scanner: 'Kiểm tra CIS' },
    { id: 's2', severity: 'Trung bình', title: 'Chưa có chính sách mạng cho tài khoản', fix: 'Tạo chính sách mạng chỉ cho phép IP văn phòng', scanner: 'Kiểm tra CIS' },
    { id: 's3', severity: 'Thấp', title: 'Vai trò QUAN_TRI được gán cho 2 người dùng', fix: 'Giảm xuống tối thiểu cần thiết', scanner: 'Phân quyền' },
  ],
}

export const SHARES = {
  inbound: [
    { id: 'sh1', name: 'DU_LIEU_MAU', from: 'Lạc Việt Dữ liệu mở', objects: 3, created: '2026-01-05' },
    { id: 'sh2', name: 'TAI_KHOAN_SU_DUNG', from: 'Lạc Việt Data', objects: 12, created: '2026-01-05' },
  ],
  outbound: [
    { id: 'sh3', name: 'DOANH_THU_CHO_DOI_TAC_NHUONG_QUYEN', to: ['DOI_TAC_DA_LAT'], objects: 1, created: '2026-08-14', desc: 'Chia sẻ doanh thu ngày của cửa hàng Hồ Xuân Hương cho đối tác nhượng quyền' },
  ],
}

/** Tệp SQL khởi đầu trong không gian làm việc */
export const STARTER_FILES = [
  {
    id: 'f1', name: 'bat_dau_o_day.sql', folder: 'Không gian của tôi', updated: '2026-11-10T09:40:00',
    content: `-- Chào mừng tới Lạc Việt Data! Bấm ▶ Chạy (Ctrl + Enter) để thực thi.
-- Dữ liệu mẫu: chuỗi cà phê Phố Núi (hư cấu), 20 cửa hàng, ~14.000 đơn hàng năm 2026.

USE DATABASE PHO_NUI_DB;
USE SCHEMA BAN_HANG;

-- Doanh thu từng tháng
SELECT DATE_TRUNC('month', NGAY_DAT) AS THANG,
       COUNT(*)                     AS SO_DON,
       SUM(TONG_TIEN)               AS DOANH_THU
FROM DON_HANG
WHERE TRANG_THAI = 'Hoàn tất'
GROUP BY 1
ORDER BY 1;
`,
  },
  {
    id: 'f2', name: 'cam_xuc_danh_gia.sql', folder: 'Không gian của tôi', updated: '2026-11-08T15:10:00',
    content: `-- Hàm AI chạy ngay trong SQL: đọc cảm xúc và chủ đề của đánh giá tiếng Việt
SELECT g.NGAY,
       c.TEN_CUA_HANG,
       g.SO_SAO,
       g.NOI_DUNG,
       AI_CAM_XUC(g.NOI_DUNG)  AS CAM_XUC,
       AI_PHAN_LOAI(g.NOI_DUNG, 'Đồ uống, Phục vụ, Không gian, Giao hàng, Giá cả') AS CHU_DE,
       AI_TRICH_XUAT(g.NOI_DUNG, 'van_de') AS VAN_DE
FROM PHO_NUI_DB.MARKETING.DANH_GIA g
JOIN PHO_NUI_DB.BAN_HANG.CUA_HANG c ON c.MA_CH = g.MA_CH
ORDER BY g.NGAY DESC
LIMIT 50;
`,
  },
  {
    id: 'f3', name: 'phan_khuc_rfm.sql', folder: 'Marketing', updated: '2026-11-03T10:00:00',
    content: `-- Phân khúc khách hàng theo RFM (Gần đây – Tần suất – Giá trị)
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
  },
]
