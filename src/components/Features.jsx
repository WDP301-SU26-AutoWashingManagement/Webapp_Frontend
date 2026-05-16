import { Settings2, BarChart3, BellRing, ShieldCheck } from 'lucide-react'
import './Features.css'

const features = [
  {
    icon: Settings2,
    title: 'Quản lý toàn quyền kiểm soát',
    desc: 'Cấu hình tier rules, tích lũy điểm, tier pricing và chạy khuyến mãi mục tiêu (ví dụ: chỉ Silver trở lên). Manager giám sát và phê duyệt cấu hình lớn.',
    tags: ['Cấu hình hạng', 'Khuyến mãi mục tiêu', 'Phê duyệt quản lý'],
  },
  {
    icon: BarChart3,
    title: 'Báo cáo & hiệu suất',
    desc: 'Manager nhận báo cáo doanh thu, KPI và hiệu suất chương trình loyalty theo thời gian thực. Admin xem danh sách booking trong ngày.',
    tags: ['Báo cáo doanh thu', 'Bảng điều khiển KPI', 'Danh sách booking'],
  },
  {
    icon: BellRing,
    title: 'Tự động hóa thông minh',
    desc: 'Nâng/hạ hạng tự động hàng tháng, điểm hết hạn sau 12 tháng, auto-apply perks khi checkout — không cần nhân viên xử lý thủ công.',
    tags: ['Đánh giá hạng tự động', 'Điểm hết hạn', 'Áp quyền lợi tự động'],
  },
  {
    icon: ShieldCheck,
    title: 'Checkout minh bạch',
    desc: 'Tier discount áp tự động theo hạng, cộng với redemption discount nếu khách dùng điểm, và promotion discount nếu đang có chiến dịch.',
    tags: ['Giá theo hạng', 'Đổi điểm', 'Ghép khuyến mãi'],
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="features-inner">
        <div className="section-label">Tính năng</div>
        <h2 className="section-title">Đầy đủ cho cả<br />khách hàng & vận hành</h2>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="fc-icon">
                <f.icon size={20} strokeWidth={1.5} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="fc-tags">
                {f.tags.map(t => <span key={t} className="fc-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="cta-banner">
          <div className="cta-text">
            <h3>Sẵn sàng bắt đầu?</h3>
            <p>Đăng ký tài khoản ngay — miễn phí, không cần thẻ tín dụng</p>
          </div>
          <button className="btn-primary">
            <span>Đăng ký ngay</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
