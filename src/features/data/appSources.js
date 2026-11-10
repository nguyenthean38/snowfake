/* Mã nguồn hiển thị trong chế độ "Chỉnh sửa" của ứng dụng dữ liệu (minh hoạ, cú pháp kiểu Python) */
export const APP_SOURCES = {
  revenue: `# Bảng doanh thu cửa hàng — chạy trên KHO_UNG_DUNG
import lacviet.ung_dung as ud

phien = ud.phien_lam_viec()
ud.tieu_de("Bảng doanh thu cửa hàng")

# Bộ lọc
so_ngay = ud.thanh_truot("Số ngày gần nhất", tu=7, den=120, mac_dinh=30)
vung = ud.chon("Vùng", ["Tất cả", "Miền Bắc", "Miền Trung", "Miền Nam"])
cua_hang = ud.chon("Cửa hàng", phien.sql("SELECT TEN_CUA_HANG FROM CUA_HANG"))

dieu_kien = f"""
  d.TRANG_THAI = 'Hoàn tất'
  AND d.NGAY_DAT >= DATEADD(day, -{so_ngay}, CURRENT_DATE())
  {"AND c.VUNG = '" + vung + "'" if vung != "Tất cả" else ""}
"""

# Chỉ số chính, so với kỳ trước cùng độ dài
chi_so = phien.sql(f"""
  SELECT SUM(TONG_TIEN) DOANH_THU, COUNT(*) SO_DON,
         AVG(TONG_TIEN) GIA_TRI_DON_TB, COUNT(DISTINCT MA_KH) KHACH
  FROM DON_HANG d JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
  WHERE {dieu_kien}
""")
ud.chi_so(chi_so, so_sanh="ky_truoc")

# Doanh thu theo ngày
theo_ngay = phien.sql(f"""
  SELECT DATE(d.NGAY_DAT) NGAY, SUM(d.TONG_TIEN) DOANH_THU
  FROM DON_HANG d JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
  WHERE {dieu_kien} GROUP BY 1 ORDER BY 1
""")
ud.bieu_do_duong(theo_ngay, x="NGAY", y="DOANH_THU")

# Món bán chạy và bảng theo cửa hàng
ud.cot_ngang(phien.sql(TOP_MON.format(dieu_kien)), nhan="TEN_SAN_PHAM", gia_tri="DOANH_THU")
ud.bang(phien.sql(THEO_CUA_HANG.format(dieu_kien)))
`,
  reviews: `# Theo dõi đánh giá khách hàng — hàm AI chạy ngay trong SQL
import lacviet.ung_dung as ud

phien = ud.phien_lam_viec()
ud.tieu_de("Theo dõi đánh giá khách hàng")

danh_gia = phien.sql("""
  SELECT g.MA_DG, g.NGAY, c.TEN_CUA_HANG, g.SO_SAO, g.NOI_DUNG,
         AI_CAM_XUC(g.NOI_DUNG)                     AS CAM_XUC,
         AI_PHAN_LOAI(g.NOI_DUNG, 'Đồ uống, Phục vụ, Không gian,
                      Giao hàng, Giá cả, Thời gian chờ') AS CHU_DE,
         AI_TRICH_XUAT(g.NOI_DUNG, 'van_de')         AS VAN_DE
  FROM DANH_GIA g JOIN CUA_HANG c ON c.MA_CH = g.MA_CH
  ORDER BY g.NGAY DESC
""")

cam_xuc = ud.phan_doan("Cảm xúc", ["Tất cả", "Tiêu cực", "Trung tính", "Tích cực"])
chu_de = ud.chon("Chủ đề", danh_gia["CHU_DE"].unique())
loc = danh_gia.loc(cam_xuc=cam_xuc, chu_de=chu_de)

ud.vanh_khuyen(danh_gia.dem("CAM_XUC"))
for dg in loc:
    with ud.the(dg.NOI_DUNG, nhan=[dg.CAM_XUC, dg.CHU_DE]):
        if ud.nut("Giao cho cửa hàng"):
            phien.sql("INSERT INTO VIEC_CAN_XU_LY VALUES (?, ?)", [dg.MA_DG, dg.TEN_CUA_HANG])
`,
  kh360: `# Khách hàng 360 — ứng dụng gốc từ Lụa Software (Chợ dữ liệu)
import lacviet.ung_dung as ud

phien = ud.phien_lam_viec()
ud.tieu_de("Khách hàng 360")

rfm = phien.sql("""
  WITH R AS (
    SELECT MA_KH,
           DATEDIFF(day, MAX(NGAY_DAT), CURRENT_DATE()) GAN_DAY,
           COUNT(*) TAN_SUAT, SUM(TONG_TIEN) GIA_TRI
    FROM DON_HANG WHERE MA_KH IS NOT NULL GROUP BY 1
  )
  SELECT *, CASE WHEN GAN_DAY <= 14 AND TAN_SUAT >= 20 THEN 'Trung thành'
                 WHEN GAN_DAY <= 30 THEN 'Đang hoạt động'
                 WHEN GAN_DAY <= 90 THEN 'Cần nhắc lại'
                 ELSE 'Có nguy cơ rời bỏ' END PHAN_KHUC
  FROM R
""")
ud.vanh_khuyen(rfm.dem("PHAN_KHUC"))
ud.bang(rfm.loc(PHAN_KHUC="Cần nhắc lại").sap_xep("GIA_TRI", giam=True))
`,
  blank: `# Ứng dụng trống — sửa câu SQL rồi bấm Chạy
import lacviet.ung_dung as ud

phien = ud.phien_lam_viec()
ud.tieu_de("Ứng dụng mới")

cau_lenh = ud.o_nhap_sql("SELECT * FROM CUA_HANG")
ket_qua = phien.sql(cau_lenh)
ud.bieu_do(ket_qua)
ud.bang(ket_qua)
`,
}
