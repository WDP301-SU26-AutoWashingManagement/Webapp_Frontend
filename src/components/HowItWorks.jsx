import { UserPlus, CalendarCheck, Sparkles, Gift } from 'lucide-react'
import './HowItWorks.css'

const steps = [
  {
    icon: UserPlus,
    num: '01',
    title: 'Đăng ký tài khoản',
    desc: 'Nhập số điện thoại và biển số xe. Hệ thống tạo hồ sơ và cấp hạng Member ngay lập tức.',

  },
  {
    icon: CalendarCheck,
    num: '02',
    title: 'Đặt lịch rửa xe',
    desc: 'Chọn ngày giờ phù hợp trong khung thời gian theo hạng (7–14 ngày). Hệ thống xác nhận slot ngay.',

  },
  {
    icon: Sparkles,
    num: '03',
    title: 'Rửa xe & tích điểm',
    desc: 'Admin xác nhận hoàn thành dịch vụ. Điểm được cộng tự động vào tài khoản của bạn.',

  },
  {
    icon: Gift,
    num: '04',
    title: 'Đổi điểm nhận ưu đãi',
    desc: 'Dùng điểm đổi lấy giảm giá, rửa xe miễn phí hoặc add-on. Ưu đãi áp dụng tự động khi thanh toán.',

  },
]

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="how-inner">
        <div className="section-label">Quy trình</div>
        <h2 className="section-title">Cách hoạt động</h2>
        <p className="section-sub">Từ đăng ký đến nhận ưu đãi — chỉ 4 bước đơn giản</p>

        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.num}</div>
              <div className="step-icon-wrap">
                <s.icon size={22} strokeWidth={1.5} />
              </div>
              <div className="step-body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="step-flows">


                </div>
              </div>
              {i < steps.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
