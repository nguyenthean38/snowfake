# Hệ thống thiết kế Lạc Việt Data

Tài liệu ngắn về màu sắc, chữ, thành phần dùng chung và quy ước dữ liệu của bản demo.

## Nhận diện

- **Tên:** Hệ thống Dữ liệu Lạc Việt (viết gọn: Lạc Việt Data) — dữ liệu & AI cho doanh nghiệp Việt. Tên hư cấu, không liên quan tới doanh nghiệp nào trùng tên.
- **Trợ lý AI:** Tinh Ý (hiểu câu hỏi tiếng Việt, viết và giải thích SQL).
- **Biểu tượng:** vành trống và ngôi sao 14 cánh ở tâm mặt trống đồng Đông Sơn, nét gradient tím chàm → lam ngọc (`src/components/brand/Logo.jsx`).
- **Dữ liệu mẫu:** chuỗi cà phê **Phố Núi** (hư cấu): 20 cửa hàng trên 14 tỉnh, thành; khoảng 14.000 đơn hàng năm 2026.

## Màu (biến CSS trong `src/styles/index.css`)

| Nhóm | Biến | Ghi chú |
|---|---|---|
| Nền | `--c-canvas`, `--c-side`, `--c-surface`, `--c-subtle` | Canvas hơi xanh tím, thẻ trắng |
| Chữ | `--c-fg`, `--c-dim`, `--c-muted`, `--c-faint` | 4 cấp độ đậm nhạt |
| Thương hiệu | `--c-brand-50…700` | Tím chàm `#5b46e5` |
| Điểm nhấn | `--c-ice` | Lam ngọc `#0fb5c9`, dùng trong gradient `bg-crystal`, `text-crystal` |
| Trạng thái | `--c-pos`, `--c-neg`, `--c-warn`, `--c-info` | Kèm bản `-soft` làm nền |
| Biểu đồ | `--c-chart-1…6` | Tím, lam ngọc, cam, hồng, xanh lá, xám |
| Mã nguồn | `--c-code-kw/str/num/cmt/fn` | Tô màu cú pháp SQL trong CodeMirror |

Chế độ tối định nghĩa lại cùng bộ biến dưới lớp `.dark`. Tailwind v4 đọc các biến qua `@theme inline`, nên viết `bg-surface`, `text-muted`, `border-line`, `bg-brand-500`… là tự đổi theo giao diện.

## Chữ

- **Be Vietnam Pro** (thiết kế cho tiếng Việt) cho giao diện; **JetBrains Mono** cho SQL và mã truy vấn.
- Tiện ích: `ds-display` (tiêu đề trang giới thiệu), `ds-h1`, `ds-h2`, `ds-h3`, `ds-label` (nhãn in hoa nhỏ), `ds-caption`, `num` (số thẳng cột).

## Thành phần dùng chung

| Thư mục | Thành phần |
|---|---|
| `components/ui` | Button, IconButton, Input, Select, Textarea, Checkbox, Toggle, RadioCards, FileDrop, OtpInput, Card, Badge, Avatar, Tabs, Segmented, Progress, KeyValue, EmptyState, Callout, Tooltip, Modal, Confirm, Drawer, Popover, Menu, FlowShell, Table, Toaster, QrCode |
| `components/charts` | LineChart, BarChart (chồng cột), HBarChart, Donut, Sparkline, BarList, **ResultChart** (vẽ thẳng từ kết quả SQL) |
| `components/data` | **DataGrid** (bảng kết quả có hàng thống kê từng cột), `downloadCSV`, `parseCSV`, `inferCsvTypes` |
| `components/layout` | AppLayout, Sidebar (đầy đủ / dải biểu tượng), CommandPalette (Ctrl K), Notifications, Assistant (Ctrl J), Page |

## Động cơ dữ liệu (`src/engine`)

- `db.js`: SQLite chạy bằng WebAssembly (sql.js). Hiểu thêm cú pháp quen thuộc của kho dữ liệu đám mây: `USE`, `CREATE OR REPLACE`, `SHOW TABLES`, `DESCRIBE`, tên đầy đủ `CSDL.LUOC_DO.BANG`, `::` ép kiểu, `ILIKE`, `DATEADD`, `DATEDIFF`, `DATE_TRUNC`. Thông báo lỗi được dịch sang tiếng Việt. Mọi câu lệnh thay đổi dữ liệu được lưu vào `localStorage` và chạy lại khi tải trang.
- `aiFunctions.js`: hàm AI tiếng Việt dùng ngay trong SQL (`AI_CAM_XUC`, `AI_PHAN_LOAI`, `AI_TOM_TAT`, `AI_TRICH_XUAT`, `AI_DICH`) — mô phỏng bằng từ điển và quy tắc, không gọi mô hình bên ngoài.
- `assistant.js`: Tinh Ý nhận diện ý định + bộ lọc (tỉnh, tháng, quý, số ngày, top N, kênh) trong câu hỏi tiếng Việt rồi sinh SQL; giải thích, định dạng và gợi ý sửa lỗi SQL.
- `seed.js`: sinh dữ liệu mẫu có hạt giống cố định (mỗi lần tải ra cùng số liệu).

## Quy ước

- Ngày mốc của bản demo: **10/11/2026** (`TODAY` trong `lib/format.js`, `DEMO_TODAY` trong `engine/db.js`).
- Tiền: `formatVND` → `1.284.000 ₫`, rút gọn `formatCompact` → `1,28 tỷ`, `48,2 tr`.
- Định danh trong SQL viết HOA, không dấu, nối bằng gạch dưới: `DON_HANG`, `TONG_TIEN`.
- Đường dẫn trang bằng tiếng Việt không dấu: `/khong-gian`, `/giam-sat/truy-van`…
