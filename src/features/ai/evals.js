/* Bộ câu hỏi đánh giá mẫu cho tác tử + chấm điểm mô phỏng */
import { ask } from '@/engine/assistant'
import { seeded } from '@/lib/random'

export const EVAL_SET = [
  { q: 'Doanh thu theo tháng năm nay', expect: 'revenue-month', answer: 'Biểu đồ doanh thu 11 tháng, cao nhất mùa hè' },
  { q: 'Top 5 cửa hàng doanh thu cao nhất quý 3', expect: 'store-ranking', answer: 'Bến Thành, Hồ Gươm, Thảo Điền dẫn đầu' },
  { q: 'Món nào bán chạy nhất tháng 10?', expect: 'product-top', answer: 'Cà phê sữa đá' },
  { q: 'Khung giờ nào đông khách nhất?', expect: 'peak-hour', answer: 'Khoảng 8 giờ sáng' },
  { q: 'Những đánh giá tiêu cực gần đây', expect: 'reviews-negative', answer: 'Danh sách đánh giá tiêu cực kèm chủ đề' },
  { q: 'Tỷ trọng doanh thu theo kênh bán', expect: 'channel', answer: 'Tại quầy chiếm khoảng 55%' },
  { q: 'Khách hạng Vàng lâu chưa quay lại', expect: 'churn', answer: 'Danh sách khách vắng mặt từ 45 ngày' },
  { q: 'Lãi gộp theo nhóm sản phẩm', expect: 'margin-group', answer: 'Cà phê có lãi gộp lớn nhất' },
]

export const METRICS = [
  { key: 'correct', label: 'Độ chính xác câu trả lời', desc: 'So câu trả lời với đáp án mong đợi' },
  { key: 'tool', label: 'Chọn đúng công cụ', desc: 'Tác tử có gọi đúng công cụ hỏi dữ liệu / tìm kiếm' },
  { key: 'consistent', label: 'Tính nhất quán', desc: 'Lập luận và câu trả lời không mâu thuẫn' },
]

/** Chấm một câu hỏi (mô phỏng: dựa trên việc Tinh Ý nhận đúng ý định) */
export function scoreQuestion(item, i, seed = 1) {
  const r = seeded(seed * 97 + i * 13)
  const a = ask(item.q)
  const hit = a.intent === item.expect
  const correct = hit ? 0.82 + r.next() * 0.18 : 0.25 + r.next() * 0.3
  const tool = a.type === 'sql' ? (hit ? 1 : 0.6) : 0.2
  const consistent = 0.8 + r.next() * 0.2
  return { q: item.q, expect: item.answer, got: a.title || a.text?.slice(0, 80), correct, tool, consistent, ms: Math.round(900 + r.next() * 2600) }
}
