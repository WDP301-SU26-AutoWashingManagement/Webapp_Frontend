import { Settings2, BarChart3, BellRing, ShieldCheck } from 'lucide-react'

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
    <section className="page-section px-16 bg-slate-100 border-t border-b border-green-500/15" id="features">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Tính năng</div>
        <h2 className="section-title mb-16">Đầy đủ cho cả<br />khách hàng & vận hành</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {features.map((f, i) => (
            <div className="bg-white border border-green-500/15 rounded-2xl p-8 transition-all hover:border-green-500/30 hover:-translate-y-1" key={i}>
              <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-5">
                <f.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2.5 leading-tight">{f.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-5">{f.desc}</p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map(t => (
                  <span key={t} className="font-mono text-xs text-green-500 bg-green-500/8 border border-green-500/15 px-2.5 py-1 rounded tracking-wide">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="bg-gradient-to-r from-green-600/30 to-green-500/10 border border-green-500/25 rounded-3xl p-12 flex items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-4xl text-slate-900 mb-1.5">Sẵn sàng bắt đầu?</h3>
            <p className="text-base text-slate-700">Đăng ký tài khoản ngay — miễn phí, không cần thẻ tín dụng</p>
          </div>
          <button className="btn-primary flex-shrink-0">
            <span>Đăng ký ngay</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
