import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, CheckCircle2, Download, Send, Play, Copy, ShieldCheck, Clock, Globe, Mail, Loader2, AppWindow, Sparkles } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Badge, Card, CardHeader, Tabs, Modal, Input, Textarea, Checkbox, EmptyState, KeyValue, Table, THead, Th, Tr, Td, Progress } from '@/components/ui'
import { useApp, useAuth, toast } from '@/store'
import { LISTINGS } from '@/data/platform'
import { installListing } from '@/engine/db'
import { ListingIcon } from '@/features/data/ListingCard'
import { LISTING_SQL, useOpenSql } from '@/features/data/shared'

const DICT = {
  'ngay-le': { table: 'NGAY_LE_VN', cols: [['NGAY', 'DATE', 'Ngày diễn ra'], ['TEN_NGAY_LE', 'VARCHAR', 'Tên ngày lễ, kỷ niệm'], ['LOAI', 'VARCHAR', 'Dương lịch, Âm lịch hoặc Không chính thức'], ['NGHI_LE', 'BOOLEAN', 'Người lao động được nghỉ hưởng lương']] },
  'thoi-tiet': { table: 'THOI_TIET_THANG', cols: [['THANG', 'DATE', 'Ngày đầu tháng'], ['MA_TINH', 'VARCHAR', 'Mã tỉnh, khớp TINH_THANH.MA_TINH'], ['TEN_TINH', 'VARCHAR', 'Tên tỉnh, thành'], ['NHIET_DO_TB', 'NUMBER', 'Nhiệt độ trung bình tháng (°C)'], ['LUONG_MUA_MM', 'NUMBER', 'Tổng lượng mưa tháng (mm)']] },
  'hanh-chinh': { table: 'TINH_THANH', cols: [['MA_TINH', 'VARCHAR', 'Mã tỉnh 3 ký tự'], ['TEN_TINH', 'VARCHAR', 'Tên tỉnh, thành phố'], ['VUNG', 'VARCHAR', 'Miền Bắc, Miền Trung, Miền Nam'], ['LA_THANH_PHO', 'BOOLEAN', 'Thành phố trực thuộc trung ương']] },
  'ty-gia': { table: 'TY_GIA_NGAY', cols: [['NGAY', 'DATE', 'Ngày áp dụng'], ['MA_TIEN', 'VARCHAR', 'Mã tiền tệ ISO 4217'], ['MUA_TIEN_MAT', 'NUMBER', 'Giá mua tiền mặt'], ['BAN_RA', 'NUMBER', 'Giá bán ra']] },
  'luu-luong': { table: 'LUU_LUONG_GIO', cols: [['THOI_DIEM', 'TIMESTAMP', 'Đầu mỗi giờ'], ['MA_TUYEN_PHO', 'VARCHAR', 'Mã tuyến phố'], ['TINH_THANH', 'VARCHAR', 'Tỉnh, thành'], ['LUOT_QUA_LAI', 'NUMBER', 'Lượt người qua lại ước tính']] },
  'nong-san': { table: 'GIA_NGUYEN_LIEU', cols: [['TUAN', 'DATE', 'Ngày đầu tuần'], ['MAT_HANG', 'VARCHAR', 'Cà phê Robusta, sữa đặc, đường'], ['VUNG', 'VARCHAR', 'Vùng nguyên liệu'], ['GIA_THAM_KHAO', 'NUMBER', 'Giá tham khảo, đồng/kg']] },
  'dan-so': { table: 'DAN_CU_XA', cols: [['MA_XA', 'VARCHAR', 'Mã đơn vị hành chính cấp xã'], ['TEN_XA', 'VARCHAR', 'Tên phường, xã'], ['QUY_MO_DAN_CU', 'NUMBER', 'Số dân ước tính'], ['DO_TUOI_TB', 'NUMBER', 'Độ tuổi trung bình']] },
}
const PROVIDERS = {
  'Lạc Việt Dữ liệu mở': 'Nhóm dữ liệu mở của Lạc Việt Data, tuyển chọn và chuẩn hoá các bộ dữ liệu công cộng cho doanh nghiệp Việt.',
  'Mây Trời Analytics': 'Chuyên dữ liệu khí tượng và môi trường cho bán lẻ, nông nghiệp, logistics.',
  'Sao Kim Tài chính': 'Cung cấp dữ liệu tài chính, tỷ giá, lãi suất tham khảo.',
  'Phố Đông Insights': 'Đo lường lưu lượng và hành vi khách hàng tại khu thương mại.',
  'Đồng Xanh Data': 'Dữ liệu giá nông sản và nguyên liệu đầu vào theo vùng.',
  'Lụa Software': 'Đội ngũ phát triển ứng dụng dữ liệu chạy ngay trong tài khoản Lạc Việt Data.',
  'Bản Đồ Việt Analytics': 'Dữ liệu địa lý, nhân khẩu học mô hình hoá ở cấp phường, xã.',
}

export default function ListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const openSql = useOpenSql()
  const user = useAuth((s) => s.user)
  const { installed, requested, roles, update, upsert, apps } = useApp()
  const l = LISTINGS.find((x) => x.id === id)
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState(null) // 'get' | 'request' | 'app'
  const [grantRoles, setGrantRoles] = useState(['QUAN_TRI', 'PHAN_TICH'])
  const [busy, setBusy] = useState(false)
  const [appStep, setAppStep] = useState(0)
  const [reason, setReason] = useState('')

  if (!l) return <Page><EmptyState title="Không tìm thấy sản phẩm dữ liệu" action={<Button onClick={() => navigate('/cho-du-lieu')}>Về Chợ dữ liệu</Button>} /></Page>
  const isIn = installed.includes(l.id)
  const isReq = requested.includes(l.id)
  const dict = DICT[l.id] || { table: 'DU_LIEU', cols: [] }
  const sample = LISTING_SQL[l.id] || `-- Truy vấn mẫu cho ${l.title}\nSELECT *\nFROM ${l.id.toUpperCase().replace(/-/g, '_')}_DB.CONG_KHAI.${dict.table}\nLIMIT 100;\n`

  const doInstall = async () => {
    setBusy(true)
    if (l.installable) await installListing(l.id)
    await new Promise((r) => setTimeout(r, 500))
    update('installed', (x) => [...new Set([...x, l.id])])
    setBusy(false)
    setModal(null)
    toast({ title: `Đã nhận “${l.title}”`, desc: `Bảng DU_LIEU_MAU.CONG_KHAI.${dict.table} đã sẵn sàng truy vấn.`, action: { label: 'Mở truy vấn mẫu', onClick: () => openSql(`${l.id}_mau.sql`, sample) } })
  }
  const startApp = () => {
    setModal('app'); setAppStep(1)
    setTimeout(() => setAppStep(2), 900)
    setTimeout(() => setAppStep(3), 1900)
    setTimeout(() => {
      setAppStep(4)
      update('installed', (x) => [...new Set([...x, l.id])])
      if (!apps.find((a) => a.id === 'app-kh360')) upsert('apps', { id: 'app-kh360', name: 'Khách hàng 360', owner: 'QUAN_TRI', warehouse: 'KHO_UNG_DUNG', updated: new Date().toISOString(), status: 'Đang chạy', views: 0, desc: 'Ứng dụng từ Lụa Software: hồ sơ khách hàng hợp nhất và phân khúc RFM.', source: 'Chợ dữ liệu' })
    }, 2900)
  }

  const primary = isIn
    ? (l.app ? <Button variant="primary" icon={AppWindow} onClick={() => navigate('/ung-dung/app-kh360')}>Mở ứng dụng</Button>
      : <Button variant="primary" icon={Play} onClick={() => openSql(`${l.id}_mau.sql`, sample)}>Mở truy vấn mẫu</Button>)
    : l.app ? <Button variant="primary" icon={Download} onClick={startApp}>Cài ứng dụng</Button>
    : l.installable || l.installed ? <Button variant="primary" icon={Download} onClick={() => setModal('get')}>Nhận dữ liệu</Button>
    : isReq ? <Button disabled icon={Clock}>Đang chờ duyệt</Button>
    : <Button variant="primary" icon={Send} onClick={() => setModal('request')}>Yêu cầu dữ liệu</Button>

  return (
    <Page wide crumbs={[{ label: 'Chợ dữ liệu', to: '/cho-du-lieu' }, { label: l.title }]}>
      <div className="flex flex-col md:flex-row md:items-start gap-5 mb-6">
        <ListingIcon l={l} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="ds-h1">{l.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[13px] text-muted">
            <span className="font-[550] text-dim">{l.provider}</span>
            <span className="flex items-center gap-1 num"><Star size={13} className="fill-gold text-gold" />{l.rating.toLocaleString('vi-VN')}</span>
            <Badge size="sm" tone={l.price.startsWith('Miễn phí') ? 'pos' : 'neutral'}>{l.price}</Badge>
            {l.tags.map((t) => <Badge key={t} size="sm">{t}</Badge>)}
            {isIn && <Badge size="sm" tone="pos" icon={CheckCircle2}>Đã nhận</Badge>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">{primary}</div>
      </div>

      <Tabs value={tab} onChange={setTab} className="mb-5" options={[
        { value: 'overview', label: 'Tổng quan' },
        ...(l.app ? [] : [{ value: 'dict', label: 'Từ điển dữ liệu' }, { value: 'sql', label: 'Ví dụ truy vấn' }]),
        { value: 'provider', label: 'Nhà cung cấp' },
      ]} />

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <Card>
            <CardHeader title="Giới thiệu" />
            <p className="text-dim leading-relaxed">{l.desc}</p>
            <h4 className="ds-h3 mt-6 mb-2">Nhu cầu kinh doanh</h4>
            <ul className="flex flex-col gap-2 text-[13.5px] text-dim">
              {(l.app ? ['Hợp nhất hồ sơ khách hàng từ nhiều kênh', 'Phân khúc RFM tự động mỗi đêm', 'Danh sách khách cần chăm sóc gửi cho cửa hàng'] : ['Giải thích biến động doanh số theo mùa vụ, thời tiết, sự kiện', 'Làm giàu dữ liệu cho mô hình dự báo', 'Cung cấp ngữ cảnh cho tác tử AI khi trả lời câu hỏi']).map((x) => (
                <li key={x} className="flex gap-2"><CheckCircle2 size={16} className="text-pos shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-subtle border border-line p-4 flex gap-3">
              <Sparkles size={18} className="text-brand-ink shrink-0 mt-0.5" />
              <p className="text-[13px] text-dim">Dữ liệu được chia sẻ trực tiếp qua Lạc Việt Data: không sao chép tệp, không tốn chi phí lưu trữ, luôn là phiên bản mới nhất từ nhà cung cấp.</p>
            </div>
          </Card>
          <Card>
            <KeyValue items={[
              { label: 'Danh mục', value: l.category },
              { label: 'Giá', value: l.price },
              { label: 'Cập nhật', value: l.tags.find((t) => t.startsWith('Cập nhật') || t.startsWith('Theo')) || 'Định kỳ' },
              { label: 'Vùng khả dụng', value: 'TP. Hồ Chí Minh, Hà Nội' },
              { label: 'Bảng chính', value: l.app ? '—' : <span className="font-mono text-[12px]">{dict.table}</span> },
              { label: 'Điều khoản', value: 'Thoả thuận tiêu chuẩn' },
            ]} />
          </Card>
        </div>
      )}

      {tab === 'dict' && (
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 py-3 border-b border-line flex items-center gap-2"><span className="font-mono text-[13px] font-[600]">{dict.table}</span><span className="ds-caption">· {dict.cols.length} cột</span></div>
          <Table minWidth={560}>
            <THead><Th>Cột</Th><Th>Kiểu</Th><Th>Mô tả</Th></THead>
            <tbody>{dict.cols.map(([c, t, d]) => <Tr key={c}><Td className="font-mono text-[12.5px] font-[600]">{c}</Td><Td className="font-mono text-[12px] text-muted">{t}</Td><Td className="text-dim">{d}</Td></Tr>)}</tbody>
          </Table>
        </Card>
      )}

      {tab === 'sql' && (
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="ds-caption">{isIn || !l.installable ? 'Truy vấn mẫu' : 'Truy vấn mẫu — nhận dữ liệu trước để chạy được'}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(sample); toast('Đã sao chép SQL') }}>Sao chép</Button>
              <Button size="sm" variant="ghost" icon={Play} disabled={l.installable && !isIn} onClick={() => openSql(`${l.id}_mau.sql`, sample)}>Mở trong trình soạn</Button>
            </div>
          </div>
          <pre className="p-5 text-[12.5px] font-mono leading-relaxed overflow-x-auto">{sample}</pre>
        </Card>
      )}

      {tab === 'provider' && (
        <Card>
          <div className="flex items-center gap-3"><ListingIcon l={l} size={44} /><div><div className="ds-h3">{l.provider}</div><div className="ds-caption">Nhà cung cấp đã xác minh</div></div></div>
          <p className="text-dim mt-4">{PROVIDERS[l.provider]}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} />Đã kiểm tra bảo mật</span>
            <span className="flex items-center gap-1.5"><Globe size={14} />Hỗ trợ tiếng Việt</span>
            <span className="flex items-center gap-1.5"><Mail size={14} />Phản hồi trong 1 ngày làm việc</span>
          </div>
          <p className="ds-caption mt-4">Tên nhà cung cấp trong bản demo là hư cấu.</p>
        </Card>
      )}

      <Modal open={modal === 'get'} onClose={() => setModal(null)} title={`Nhận “${l.title}”`} desc={`Nhà cung cấp: ${l.provider}`}
        footer={<><Button onClick={() => setModal(null)}>Huỷ</Button><Button variant="primary" loading={busy} onClick={doInstall}>Nhận dữ liệu</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="Cơ sở dữ liệu đích" value="DU_LIEU_MAU" readOnly hint={`Bảng sẽ có tên DU_LIEU_MAU.CONG_KHAI.${dict.table}`} />
          <div>
            <div className="text-[13px] font-[550] text-dim mb-2">Vai trò được truy cập</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {roles.map((r) => <Checkbox key={r.name} label={r.name} desc={r.label} checked={grantRoles.includes(r.name)} onChange={(v) => setGrantRoles((g) => (v ? [...g, r.name] : g.filter((x) => x !== r.name)))} />)}
            </div>
          </div>
          <p className="ds-caption">Khi bấm “Nhận dữ liệu”, bạn đồng ý với điều khoản sử dụng của nhà cung cấp.</p>
        </div>
      </Modal>

      <Modal open={modal === 'request'} onClose={() => setModal(null)} title="Yêu cầu dữ liệu" desc={`${l.provider} sẽ liên hệ để báo giá và cấp quyền truy cập.`}
        footer={<><Button onClick={() => setModal(null)}>Huỷ</Button><Button variant="primary" icon={Send} onClick={() => { update('requested', (x) => [...new Set([...x, l.id])]); setModal(null); toast({ title: 'Đã gửi yêu cầu', desc: `${l.provider} sẽ phản hồi qua ${user.email}.` }) }}>Gửi yêu cầu</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="Email liên hệ" value={user.email} readOnly />
          <Textarea label="Bạn định dùng dữ liệu này vào việc gì?" optional rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Kết hợp với doanh số để chọn vị trí mở cửa hàng mới năm 2027" />
        </div>
      </Modal>

      <Modal open={modal === 'app'} onClose={() => appStep === 4 && setModal(null)} size="sm" hideClose={appStep < 4}
        footer={appStep === 4 && <><Button onClick={() => setModal(null)}>Đóng</Button><Button variant="primary" onClick={() => navigate('/ung-dung/app-kh360')}>Mở ứng dụng</Button></>}>
        <div className="flex flex-col items-center text-center py-4">
          {appStep < 4 ? <Loader2 size={38} className="animate-spin text-brand-ink" /> : <span className="size-14 rounded-full bg-pos-soft text-pos grid place-items-center animate-pop-in"><CheckCircle2 size={30} /></span>}
          <h3 className="ds-h2 mt-4">{appStep < 4 ? 'Đang cài ứng dụng…' : 'Cài đặt thành công'}</h3>
          <p className="ds-caption mt-1">{['', 'Tạo cơ sở dữ liệu cho ứng dụng', 'Cấp quyền đọc dữ liệu khách hàng', 'Khởi động trên KHO_UNG_DUNG', 'Ứng dụng chạy hoàn toàn trong tài khoản của bạn.'][appStep]}</p>
          <Progress value={appStep} max={4} auto={false} className="mt-5 max-w-[240px]" />
        </div>
      </Modal>
    </Page>
  )
}
