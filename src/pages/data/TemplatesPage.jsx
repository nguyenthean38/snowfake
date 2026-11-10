import { useMemo, useState } from 'react'
import { ArrowRight, Clock, Database as DbIcon } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Badge, Button, DynIcon, SearchInput, EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import { stripAccents } from '@/lib/format'
import { PROJECT_TEMPLATES } from '@/data/platform'
import { TEMPLATE_SQL, useOpenSql } from '@/features/data/shared'

const EXTRA = [
  {
    id: 'x1', title: 'Giờ cao điểm theo từng cửa hàng', kind: 'Tệp SQL', topic: 'Cơ bản', icon: 'BarChart3', file: 'gio_cao_diem.sql', mins: 5,
    desc: 'Tìm khung giờ đông khách để xếp ca nhân viên hợp lý.',
    sql: `-- Mẫu: Giờ cao điểm theo từng cửa hàng
SELECT c.TEN_CUA_HANG,
       HOUR(d.NGAY_DAT) AS GIO,
       COUNT(*)         AS SO_DON
FROM DON_HANG d
JOIN CUA_HANG c ON c.MA_CH = d.MA_CH
WHERE d.TRANG_THAI = 'Hoàn tất'
GROUP BY 1, 2
ORDER BY 1, 2;
`,
  },
  {
    id: 'x2', title: 'Biên lãi gộp theo món', kind: 'Tệp SQL', topic: 'Kỹ thuật dữ liệu', icon: 'Coins', file: 'bien_lai_gop.sql', mins: 5,
    desc: 'Ghép thực đơn với chi tiết đơn để tính lãi gộp từng món.',
    sql: `-- Mẫu: Biên lãi gộp theo món
SELECT p.TEN_SAN_PHAM, p.NHOM,
       SUM(ct.SO_LUONG)                                   AS SO_LUONG,
       SUM(ct.THANH_TIEN)                                 AS DOANH_THU,
       SUM(ct.THANH_TIEN) - SUM(ct.SO_LUONG * p.GIA_VON)  AS LAI_GOP,
       ROUND(100.0 * (1 - SUM(ct.SO_LUONG * p.GIA_VON) * 1.0 / SUM(ct.THANH_TIEN)), 1) AS BIEN_LAI_PCT
FROM CHI_TIET_DON ct
JOIN SAN_PHAM p ON p.MA_SP = ct.MA_SP
GROUP BY 1, 2
ORDER BY LAI_GOP DESC;
`,
  },
  {
    id: 'x3', title: 'Tạo khung nhìn doanh thu ngày', kind: 'Tệp SQL', topic: 'Kỹ thuật dữ liệu', icon: 'Database', file: 'khung_nhin_doanh_thu.sql', mins: 3,
    desc: 'Đóng gói truy vấn hay dùng thành khung nhìn để cả nhóm tái sử dụng.',
    sql: `-- Mẫu: Tạo khung nhìn doanh thu ngày
CREATE OR REPLACE VIEW DOANH_THU_NGAY_V AS
SELECT DATE(NGAY_DAT) AS NGAY, MA_CH, COUNT(*) AS SO_DON, SUM(TONG_TIEN) AS DOANH_THU
FROM DON_HANG
WHERE TRANG_THAI = 'Hoàn tất'
GROUP BY 1, 2;

SELECT * FROM DOANH_THU_NGAY_V ORDER BY NGAY DESC LIMIT 50;
`,
  },
]

const DESCS = {
  t1: 'Doanh thu theo vùng, xếp hạng cửa hàng trong quý — khởi đầu tốt nhất cho người mới.',
  t2: 'Dùng AI_CAM_XUC và AI_PHAN_LOAI để đọc hàng trăm đánh giá tiếng Việt trong một câu SQL.',
  t3: 'Ước lượng doanh thu ngày theo thứ trong tuần dựa trên 4 tuần gần nhất.',
  t4: 'Tạo bảng tạm và chèn dữ liệu từ máy bán hàng.',
  t5: 'Chia khách hàng thành Trung thành, Đang hoạt động, Cần nhắc lại, Có nguy cơ rời bỏ.',
  t6: 'So sánh tiền giảm giá với ngân sách và doanh thu của từng chương trình.',
}
const MINS = { t1: 5, t2: 8, t3: 10, t4: 5, t5: 10, t6: 6 }

const ALL = [
  ...PROJECT_TEMPLATES.map((t) => ({ ...t, desc: DESCS[t.id], mins: MINS[t.id], sql: TEMPLATE_SQL[t.id] })),
  ...EXTRA,
]
const CATS = ['Tất cả', 'Cơ bản', 'Kỹ thuật dữ liệu', 'AI & ML', 'Marketing']
const FEATURED = ['t2', 't5', 't3', 't1']

export default function TemplatesPage() {
  const openSql = useOpenSql()
  const [cat, setCat] = useState('Tất cả')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const nq = stripAccents(q).toLowerCase()
    return ALL.filter((t) => (cat === 'Tất cả' || t.topic === cat) && (!nq || stripAccents(t.title + ' ' + t.desc).toLowerCase().includes(nq)))
  }, [cat, q])
  const open = (t) => openSql(t.file, t.sql)

  return (
    <Page title="Mẫu dự án" desc="Bắt đầu nhanh với SQL dựng sẵn trên bộ dữ liệu mẫu chuỗi cà phê Phố Núi. Mỗi mẫu mở thành một tệp SQL bạn chạy được ngay.">
      <div className="relative overflow-hidden rounded-2xl bg-[#16163a] text-white p-6 sm:p-8">
        <div className="absolute -right-10 -top-16 size-72 rounded-full bg-crystal opacity-40 blur-3xl" />
        <div className="relative max-w-xl">
          <Badge tone="brand" className="bg-white/10 border-white/20 text-white">Mới</Badge>
          <h2 className="text-[24px] sm:text-[28px] font-[750] tracking-tight mt-3 leading-tight">Có kết quả đầu tiên trong vài phút</h2>
          <p className="text-white/75 mt-2">Dữ liệu mẫu, câu SQL có chú thích tiếng Việt và hàm AI chạy thẳng trên trình duyệt — không cần cài đặt gì.</p>
          <Button variant="inverse" className="mt-5 bg-white text-[#16163a]" iconRight={ArrowRight} onClick={() => open(ALL[0])}>Mở mẫu đầu tiên</Button>
        </div>
      </div>

      <h2 className="ds-h2 mt-8 mb-3">Nổi bật</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {FEATURED.map((id) => ALL.find((t) => t.id === id)).map((t) => (
          <button key={t.id} onClick={() => open(t)} className="group text-left card p-4 hover:shadow-sm hover:border-brand-200 transition-all">
            <span className="size-9 grid place-items-center rounded-lg bg-brand-50 text-brand-ink"><DynIcon name={t.icon} size={18} /></span>
            <div className="ds-caption mt-3">{t.topic}</div>
            <div className="font-[600] leading-snug mt-0.5">{t.title}</div>
            <div className="mt-3 text-[12.5px] font-[600] text-brand-ink flex items-center gap-1">Mở tệp SQL <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" /></div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn('h-8 px-3 rounded-full text-[13px] font-[550] border transition-colors', cat === c ? 'bg-fg text-canvas border-fg' : 'bg-surface border-line text-dim hover:border-faint')}>{c}</button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm mẫu" className="md:w-72" />
      </div>
      <div className="mt-2 ds-caption">{list.length} mẫu</div>
      <div className="card mt-3 divide-y divide-line overflow-hidden">
        {!list.length && <EmptyState title="Không có mẫu phù hợp" desc="Thử từ khoá khác hoặc chọn danh mục Tất cả." compact />}
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-subtle">
            <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-subtle text-dim border border-line"><DynIcon name={t.icon} size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-[600]">{t.title}</div>
              <div className="ds-caption mt-0.5">{t.desc}</div>
              <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted">
                <span className="flex items-center gap-1"><DbIcon size={12} />{t.kind}</span>
                <span>{t.topic}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{t.mins} phút</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => open(t)}>Mở</Button>
          </div>
        ))}
      </div>
    </Page>
  )
}
