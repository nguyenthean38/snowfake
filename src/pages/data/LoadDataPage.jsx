import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, HardDrive, Cloud, Store, MonitorSmartphone, Sheet, Link2, Radio, History, ArrowUpRight, Code2, Copy } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Modal, Callout } from '@/components/ui'
import { toast } from '@/store'
import { CLOUDS } from '@/data/platform'
import { UploadFlow } from '@/features/data/UploadFlow'
import { useOpenSql } from '@/features/data/shared'

const SOURCES = [
  { id: 'upload', title: 'Tải tệp lên bảng', desc: 'CSV, TSV từ máy tính — nạp ngay trong trình duyệt', icon: Upload, live: true },
  { id: 'stage', title: 'Tải tệp vào vùng tạm', desc: 'Lưu tệp thô trước, xử lý sau bằng SQL', icon: HardDrive },
  ...CLOUDS.map((c) => ({ id: 'cloud-' + c.id, title: `Kho đối tượng ${c.name}`, desc: c.desc, icon: Cloud, color: c.color })),
  { id: 'pos', title: 'Kết nối máy bán hàng (POS)', desc: 'Đồng bộ đơn hàng mỗi 15 phút', icon: MonitorSmartphone },
  { id: 'sheet', title: 'Bảng tính trực tuyến', desc: 'Nhập trang tính thành bảng, tự làm mới', icon: Sheet },
  { id: 'url', title: 'Lấy dữ liệu từ đường dẫn', desc: 'Tệp CSV, JSON công khai qua HTTPS', icon: Link2 },
  { id: 'stream', title: 'Nạp liên tục', desc: 'Luồng sự kiện gần thời gian thực', icon: Radio },
  { id: 'market', title: 'Chợ dữ liệu', desc: 'Nhận dữ liệu sẵn sàng cho AI từ nhà cung cấp', icon: Store, to: '/cho-du-lieu' },
]

const INFO = {
  stage: { title: 'Tải tệp vào vùng tạm', body: 'Vùng tạm (stage) là nơi giữ tệp thô. Sau đó bạn dùng COPY INTO để nạp vào bảng theo lịch hoặc thủ công.', sql: `-- Tạo vùng tạm và nạp tệp vào bảng\nCREATE STAGE POS_STAGE\n  FILE_FORMAT = (TYPE = CSV SKIP_HEADER = 1);\n\n-- Sau khi tải tệp lên vùng tạm:\nCOPY INTO PHO_NUI_DB.BAN_HANG.DON_HANG\nFROM @POS_STAGE/2026-11-10/\nON_ERROR = 'CONTINUE';` },
  pos: { title: 'Kết nối máy bán hàng (POS)', body: 'Phố Núi đang đồng bộ dữ liệu từ máy POS bằng tác vụ DONG_BO_POS_15_PHUT. Kết nối mới sẽ dùng tài khoản dịch vụ riêng với khoá truy cập.', sql: `-- Tác vụ đồng bộ mỗi 15 phút\nCREATE TASK DONG_BO_POS_15_PHUT\n  WAREHOUSE = KHO_NAP_DU_LIEU\n  SCHEDULE = '15 MINUTE'\nAS\n  COPY INTO DON_HANG FROM @POS_STAGE\n  FILE_FORMAT = (TYPE = CSV) ON_ERROR = 'CONTINUE';` },
  sheet: { title: 'Bảng tính trực tuyến', body: 'Kết nối bảng tính của nhóm vận hành (lịch ca, mục tiêu doanh số) và tự làm mới mỗi giờ.', sql: `-- Ví dụ: bảng mục tiêu doanh số theo tháng sau khi nhập\nSELECT t.THANG, t.MA_CH, t.MUC_TIEU,\n       SUM(d.TONG_TIEN) AS THUC_TE\nFROM MUC_TIEU_DOANH_SO t\nLEFT JOIN DON_HANG d ON d.MA_CH = t.MA_CH\n  AND DATE_TRUNC('month', d.NGAY_DAT) = t.THANG\nGROUP BY 1, 2, 3;` },
  url: { title: 'Lấy dữ liệu từ đường dẫn', body: 'Tải một tệp công khai qua HTTPS vào vùng tạm rồi nạp vào bảng. Phù hợp với dữ liệu mở của cơ quan nhà nước.', sql: `-- Tải tệp từ đường dẫn vào vùng tạm\nPUT 'https://du-lieu-mo.example/gia-ca-phe-2026.csv' @VUNG_TAM_NGOAI;\n\nCOPY INTO GIA_CA_PHE\nFROM @VUNG_TAM_NGOAI/gia-ca-phe-2026.csv\nFILE_FORMAT = (TYPE = CSV SKIP_HEADER = 1);` },
  stream: { title: 'Nạp liên tục', body: 'Đẩy sự kiện từ ứng dụng thành viên theo thời gian gần thực, độ trễ vài giây, tính phí theo giây sử dụng.', sql: `-- Bảng nhận sự kiện từ ứng dụng thành viên\nCREATE TABLE SU_KIEN_UNG_DUNG (\n  THOI_DIEM TIMESTAMP,\n  MA_KH     STRING,\n  LOAI      STRING,\n  DU_LIEU   VARIANT\n);` },
}
for (const c of CLOUDS) {
  INFO['cloud-' + c.id] = {
    title: `Kho đối tượng ${c.name}`,
    body: `Nạp tệp từ bucket trên ${c.name}. Bạn cần tạo tích hợp lưu trữ và cấp quyền đọc cho tài khoản Lạc Việt Data.`,
    sql: `-- Tích hợp lưu trữ ${c.name}\nCREATE STORAGE INTEGRATION TICH_HOP_${c.id.toUpperCase()}\n  TYPE = EXTERNAL_STAGE\n  STORAGE_PROVIDER = '${c.id.toUpperCase()}'\n  STORAGE_ALLOWED_LOCATIONS = ('${c.id}://phonui-du-lieu/pos/');\n\nCREATE STAGE VUNG_${c.id.toUpperCase()}\n  URL = '${c.id}://phonui-du-lieu/pos/'\n  STORAGE_INTEGRATION = TICH_HOP_${c.id.toUpperCase()};`,
  }
}

export default function LoadDataPage() {
  const navigate = useNavigate()
  const openSql = useOpenSql()
  const [sp, setSp] = useSearchParams()
  const [upload, setUpload] = useState(false)
  const [preset, setPreset] = useState({})
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (sp.get('tai-len') === '1' || sp.get('bang')) {
      setPreset({ db: sp.get('db') || undefined, schema: sp.get('schema') || undefined, table: sp.get('bang') || undefined })
      setUpload(true)
      setSp({}, { replace: true })
    }
  }, [sp, setSp])

  const choose = (s) => {
    if (s.live) { setPreset({}); setUpload(true) } else if (s.to) { navigate(s.to) } else { setInfo(INFO[s.id]) }
  }

  return (
    <Page title="Thêm dữ liệu" desc="Đưa dữ liệu vào Lạc Việt Data từ tệp, kho lưu trữ đám mây, máy bán hàng hoặc Chợ dữ liệu."
      actions={<Button variant="outline" icon={History} onClick={() => navigate('/nap-du-lieu/lich-su')}>Lịch sử nạp</Button>}>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {SOURCES.map((s) => (
          <button key={s.id} onClick={() => choose(s)}
            className={`group text-left rounded-xl border p-4 flex items-start gap-3 transition-all hover:shadow-sm hover:-translate-y-0.5 ${s.live ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-surface' : 'border-line bg-surface'}`}>
            <span className={`size-10 shrink-0 grid place-items-center rounded-xl ${s.live ? 'bg-crystal text-white' : 'bg-subtle text-dim border border-line'}`} style={s.color ? { color: s.color } : undefined}><s.icon size={19} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-[600]">{s.title}{s.live && <Badge tone="brand" size="sm">Dùng thử ngay</Badge>}{s.to && <ArrowUpRight size={14} className="text-faint" />}</span>
              <span className="block ds-caption mt-0.5">{s.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <Callout tone="brand" icon={Upload} className="mt-6" title="Mẹo: thử nạp tệp mẫu">
        Chọn “Tải tệp lên bảng” rồi bấm “Dùng tệp mẫu nhân viên cửa hàng”. Bảng mới sẽ xuất hiện trong Trình duyệt dữ liệu và truy vấn được ngay, kể cả nối với bảng CUA_HANG.
      </Callout>

      <UploadFlow open={upload} onClose={() => setUpload(false)} preset={preset} />

      <Modal open={!!info} onClose={() => setInfo(null)} size="lg" title={info?.title} desc="Nguồn này cần cấu hình hạ tầng thật — trong bản demo, bạn có thể xem SQL mẫu."
        footer={<>
          <Button icon={Copy} onClick={() => { navigator.clipboard?.writeText(info.sql); toast('Đã sao chép SQL') }}>Sao chép</Button>
          <Button variant="primary" icon={Code2} onClick={() => { const s = info; setInfo(null); openSql('nap_du_lieu.sql', s.sql + '\n') }}>Mở trong trình soạn</Button>
        </>}>
        {info && (
          <>
            <p className="text-dim">{info.body}</p>
            <pre className="mt-4 rounded-xl bg-subtle border border-line p-4 text-[12.5px] font-mono leading-relaxed overflow-x-auto">{info.sql}</pre>
          </>
        )}
      </Modal>
    </Page>
  )
}
