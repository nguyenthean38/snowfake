/* ==========================================================
   Dữ liệu tham chiếu dùng để sinh bộ dữ liệu mẫu
   "Chuỗi cà phê Phố Núi" (doanh nghiệp hư cấu).
   ========================================================== */

/** 34 tỉnh, thành phố sau sắp xếp đơn vị hành chính năm 2025 */
export const PROVINCES = [
  // 6 thành phố trực thuộc trung ương
  { code: 'HNI', name: 'Hà Nội', region: 'Miền Bắc', city: true },
  { code: 'HCM', name: 'TP. Hồ Chí Minh', region: 'Miền Nam', city: true },
  { code: 'HPG', name: 'Hải Phòng', region: 'Miền Bắc', city: true },
  { code: 'DNG', name: 'Đà Nẵng', region: 'Miền Trung', city: true },
  { code: 'CTO', name: 'Cần Thơ', region: 'Miền Nam', city: true },
  { code: 'HUE', name: 'Huế', region: 'Miền Trung', city: true },
  // 28 tỉnh
  { code: 'LCU', name: 'Lai Châu', region: 'Miền Bắc' },
  { code: 'DBN', name: 'Điện Biên', region: 'Miền Bắc' },
  { code: 'SLA', name: 'Sơn La', region: 'Miền Bắc' },
  { code: 'LSN', name: 'Lạng Sơn', region: 'Miền Bắc' },
  { code: 'QNH', name: 'Quảng Ninh', region: 'Miền Bắc' },
  { code: 'THA', name: 'Thanh Hóa', region: 'Miền Trung' },
  { code: 'NAN', name: 'Nghệ An', region: 'Miền Trung' },
  { code: 'HTH', name: 'Hà Tĩnh', region: 'Miền Trung' },
  { code: 'CBG', name: 'Cao Bằng', region: 'Miền Bắc' },
  { code: 'TQG', name: 'Tuyên Quang', region: 'Miền Bắc' },
  { code: 'LCI', name: 'Lào Cai', region: 'Miền Bắc' },
  { code: 'TNN', name: 'Thái Nguyên', region: 'Miền Bắc' },
  { code: 'PTO', name: 'Phú Thọ', region: 'Miền Bắc' },
  { code: 'BNH', name: 'Bắc Ninh', region: 'Miền Bắc' },
  { code: 'HYN', name: 'Hưng Yên', region: 'Miền Bắc' },
  { code: 'NBH', name: 'Ninh Bình', region: 'Miền Bắc' },
  { code: 'QTI', name: 'Quảng Trị', region: 'Miền Trung' },
  { code: 'QNI', name: 'Quảng Ngãi', region: 'Miền Trung' },
  { code: 'GLI', name: 'Gia Lai', region: 'Miền Trung' },
  { code: 'KHA', name: 'Khánh Hòa', region: 'Miền Trung' },
  { code: 'LDG', name: 'Lâm Đồng', region: 'Miền Trung' },
  { code: 'DLK', name: 'Đắk Lắk', region: 'Miền Trung' },
  { code: 'DNI', name: 'Đồng Nai', region: 'Miền Nam' },
  { code: 'TNH', name: 'Tây Ninh', region: 'Miền Nam' },
  { code: 'VLG', name: 'Vĩnh Long', region: 'Miền Nam' },
  { code: 'DTP', name: 'Đồng Tháp', region: 'Miền Nam' },
  { code: 'CMU', name: 'Cà Mau', region: 'Miền Nam' },
  { code: 'AGG', name: 'An Giang', region: 'Miền Nam' },
]

/** Cửa hàng của chuỗi: [mã, tên, mã tỉnh, ngày khai trương, diện tích, số chỗ, trọng số doanh thu] */
export const STORES = [
  ['CH01', 'Phố Núi Hồ Gươm', 'HNI', '2021-03-12', 180, 72, 1.35],
  ['CH02', 'Phố Núi Tây Hồ', 'HNI', '2022-06-01', 220, 90, 1.15],
  ['CH03', 'Phố Núi Cầu Giấy', 'HNI', '2023-01-15', 140, 56, 1.0],
  ['CH04', 'Phố Núi Bến Thành', 'HCM', '2020-11-20', 200, 84, 1.45],
  ['CH05', 'Phố Núi Thảo Điền', 'HCM', '2021-09-09', 260, 110, 1.3],
  ['CH06', 'Phố Núi Phú Mỹ Hưng', 'HCM', '2022-04-18', 190, 76, 1.1],
  ['CH07', 'Phố Núi Gò Vấp', 'HCM', '2024-02-02', 120, 48, 0.85],
  ['CH08', 'Phố Núi Sông Hàn', 'DNG', '2021-07-07', 210, 88, 1.05],
  ['CH09', 'Phố Núi Mỹ Khê', 'DNG', '2023-05-20', 160, 64, 0.9],
  ['CH10', 'Phố Núi Kinh Thành', 'HUE', '2022-10-10', 150, 60, 0.8],
  ['CH11', 'Phố Núi Lạch Tray', 'HPG', '2023-08-08', 140, 54, 0.75],
  ['CH12', 'Phố Núi Bến Ninh Kiều', 'CTO', '2022-12-12', 170, 70, 0.8],
  ['CH13', 'Phố Núi Hồ Xuân Hương', 'LDG', '2021-12-24', 230, 96, 1.0],
  ['CH14', 'Phố Núi Buôn Ma Thuột', 'DLK', '2020-08-15', 250, 100, 0.95],
  ['CH15', 'Phố Núi Pleiku', 'GLI', '2024-06-06', 130, 50, 0.6],
  ['CH16', 'Phố Núi Nha Trang', 'KHA', '2022-03-03', 180, 72, 0.9],
  ['CH17', 'Phố Núi Hạ Long', 'QNH', '2023-04-30', 160, 62, 0.7],
  ['CH18', 'Phố Núi Biên Hòa', 'DNI', '2024-09-01', 140, 56, 0.65],
  ['CH19', 'Phố Núi Vinh', 'NAN', '2025-01-18', 130, 52, 0.55],
  ['CH20', 'Phố Núi Bắc Ninh', 'BNH', '2025-05-15', 120, 48, 0.5],
]

/** Thực đơn: [mã, tên, nhóm, giá bán, giá vốn, độ phổ biến] */
export const PRODUCTS = [
  ['SP01', 'Cà phê sữa đá', 'Cà phê', 35000, 9000, 10],
  ['SP02', 'Cà phê đen đá', 'Cà phê', 30000, 7000, 6],
  ['SP03', 'Bạc xỉu', 'Cà phê', 39000, 10500, 8],
  ['SP04', 'Cà phê muối', 'Cà phê', 45000, 12000, 9],
  ['SP05', 'Cà phê trứng', 'Cà phê', 49000, 14000, 5],
  ['SP06', 'Cà phê cốt dừa', 'Cà phê', 49000, 15000, 6],
  ['SP07', 'Espresso Robusta Cầu Đất', 'Cà phê', 42000, 11000, 3],
  ['SP08', 'Cold brew cam sả', 'Cà phê', 55000, 16000, 4],
  ['SP09', 'Trà đào cam sả', 'Trà', 45000, 11000, 8],
  ['SP10', 'Trà vải hoa hồng', 'Trà', 49000, 12500, 5],
  ['SP11', 'Trà sen vàng', 'Trà', 52000, 14000, 4],
  ['SP12', 'Trà ô long sữa', 'Trà', 49000, 13000, 6],
  ['SP13', 'Trà xanh Thái Nguyên nóng', 'Trà', 35000, 7500, 3],
  ['SP14', 'Matcha đá xay', 'Đá xay', 59000, 18000, 4],
  ['SP15', 'Cookie đá xay', 'Đá xay', 59000, 17500, 3],
  ['SP16', 'Sinh tố bơ', 'Đá xay', 55000, 19000, 3],
  ['SP17', 'Nước ép cam', 'Nước ép', 45000, 15000, 3],
  ['SP18', 'Nước dừa tươi', 'Nước ép', 39000, 14000, 3],
  ['SP19', 'Bánh mì que pate', 'Bánh', 25000, 8000, 5],
  ['SP20', 'Bánh croissant bơ', 'Bánh', 39000, 13000, 4],
  ['SP21', 'Bánh bông lan trứng muối', 'Bánh', 35000, 11000, 4],
  ['SP22', 'Tiramisu cà phê', 'Bánh', 49000, 16000, 3],
  ['SP23', 'Hạt điều rang muối (gói)', 'Đồ ăn vặt', 65000, 32000, 2],
  ['SP24', 'Cà phê hạt Robusta 250g', 'Cà phê đóng gói', 145000, 62000, 1],
  ['SP25', 'Cà phê phin giấy (hộp 10)', 'Cà phê đóng gói', 119000, 48000, 1],
]

export const FAMILY = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Mai', 'Lương']
export const MIDDLE_F = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Minh', 'Phương', 'Khánh', 'Bảo', 'Hải', 'Mỹ']
export const MIDDLE_M = ['Văn', 'Minh', 'Đức', 'Quốc', 'Hữu', 'Thành', 'Gia', 'Hoàng', 'Anh', 'Công']
export const GIVEN_F = ['Anh', 'Trang', 'Linh', 'Hương', 'Ngọc', 'Thảo', 'Hà', 'Vy', 'Nhi', 'Mai', 'Lan', 'Yến', 'Hạnh', 'Quỳnh', 'Uyên', 'Châu', 'My', 'Thư', 'Hiền', 'Trâm']
export const GIVEN_M = ['Huy', 'Khoa', 'Nam', 'Dũng', 'Long', 'Phúc', 'Tuấn', 'Hùng', 'Bảo', 'Khang', 'Minh', 'Quân', 'Sơn', 'Thắng', 'Tài', 'Đạt', 'Hiếu', 'Vinh', 'Lộc', 'Trí']

export const CHANNELS = [['Tại quầy', 0.55], ['Ứng dụng', 0.25], ['Giao hàng', 0.2]]
export const PAYMENTS = [['Tiền mặt', 0.28], ['VietQR', 0.32], ['Ví điện tử', 0.24], ['Thẻ', 0.16]]
export const TIERS = [['Đồng', 0.5], ['Bạc', 0.3], ['Vàng', 0.15], ['Kim cương', 0.05]]

/** Mẫu đánh giá: [số sao, nội dung] — dùng để thử hàm AI cảm xúc */
export const REVIEW_TEXTS = [
  [5, 'Cà phê muối ở đây ngon tuyệt, vị mặn nhẹ hòa với béo rất vừa. Nhân viên thân thiện, sẽ quay lại.'],
  [5, 'Không gian yên tĩnh, view đẹp, wifi mạnh. Rất hợp để làm việc cả buổi chiều.'],
  [4, 'Bạc xỉu ngon, giá hợp lý. Chỉ tiếc là giờ trưa hơi đông nên phải chờ khá lâu.'],
  [2, 'Đồ uống giao tới bị đổ một nửa, đá tan hết. Rất thất vọng với khâu đóng gói.'],
  [1, 'Chờ hơn 30 phút mới có nước, nhân viên thái độ không tốt khi mình hỏi lại. Sẽ không quay lại.'],
  [5, 'Trà sen vàng thơm, thanh, không quá ngọt. Bánh croissant giòn rụm. Tuyệt vời!'],
  [3, 'Đồ uống ổn nhưng không có gì đặc biệt. Giá hơi cao so với mặt bằng chung.'],
  [4, 'Ứng dụng đặt trước tiện, tới là lấy luôn. Mong có thêm nhiều ưu đãi cho thành viên.'],
  [2, 'Bàn ghế hơi bẩn, nhà vệ sinh chưa sạch sẽ. Cà phê thì được.'],
  [5, 'Cà phê trứng chuẩn vị Hà Nội, béo mịn. Phục vụ nhanh và chu đáo.'],
  [1, 'Bị tính sai tiền hai lần, phải nhắc mới sửa. Quá tệ.'],
  [4, 'Matcha đá xay đậm vị, topping nhiều. Nhạc hơi to một chút.'],
  [5, 'Nhân viên nhiệt tình tư vấn món, nhớ cả tên khách quen. Rất thích!'],
  [3, 'Không gian đẹp nhưng chỗ để xe chật, khó tìm chỗ.'],
  [2, 'Trà đào hôm nay quá ngọt, đào không tươi. Lần trước ngon hơn nhiều.'],
  [5, 'Cold brew cam sả rất lạ miệng, sảng khoái. Sẽ giới thiệu cho bạn bè.'],
  [4, 'Giao hàng nhanh, đóng gói cẩn thận, còn tặng kèm bánh. Cảm ơn quán.'],
  [1, 'Đặt qua ứng dụng nhưng tới nơi quán báo hết món, không hoàn tiền ngay. Thất vọng.'],
  [3, 'Đồ uống bình thường, chỗ ngồi thoải mái. Wifi hay bị chập chờn.'],
  [5, 'Quán có góc đọc sách rất xinh, cà phê cốt dừa ngon xuất sắc.'],
  [4, 'Giá hơi cao nhưng chất lượng xứng đáng. Bánh tiramisu ngon.'],
  [2, 'Máy lạnh không mát, ngồi rất nóng. Nhân viên ít, gọi mãi không thấy.'],
  [5, 'Lần nào ghé cũng hài lòng. Cà phê sữa đá đậm đà, đúng gu.'],
  [3, 'Ổn, không có gì để chê nhưng cũng chưa ấn tượng.'],
  [1, 'Ly nước có tóc. Báo nhân viên thì chỉ đổi ly khác, không một lời xin lỗi.'],
  [4, 'Ưu đãi thành viên hạng Vàng khá hời. Không gian sáng sủa, sạch sẽ.'],
  [5, 'Bánh mì que giòn, pate thơm, ăn kèm cà phê đen là hết ý.'],
  [2, 'Giao hàng trễ 40 phút so với dự kiến, đồ uống bị nhạt.'],
  [4, 'Nhân viên dễ thương, đồ uống ổn định. Mong mở thêm chi nhánh gần nhà.'],
  [3, 'Giá ổn, vị ổn, nhưng xếp hàng thanh toán hơi lâu vì chỉ có một quầy.'],
]

export const CAMPAIGNS = [
  ['KM01', 'Chào xuân Bính Ngọ', '2026-01-26', '2026-02-22', 'Giảm 15% đồ uống Tết', 85000000],
  ['KM02', 'Mùa hè cam sả', '2026-05-15', '2026-07-15', 'Mua 2 tặng 1 cold brew', 60000000],
  ['KM03', 'Tựu trường', '2026-08-25', '2026-09-20', 'Giảm 20% cho học sinh, sinh viên', 45000000],
  ['KM04', 'Thu Hà Nội', '2026-10-01', '2026-10-31', 'Cà phê trứng đồng giá 39.000 ₫', 40000000],
]
