import { Settings2, BarChart3, BellRing, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Settings2,
    accent: '#0EA5B7',
    accentSoft: '#E6F8FB',
    accentBorder: 'rgba(14,165,183,0.18)',
    badge: 'Quản trị',
    title: 'Quản lý toàn quyền kiểm soát',
    desc: 'Cấu hình tier rules, tích lũy điểm, tier pricing và chạy khuyến mãi mục tiêu (ví dụ: chỉ Silver trở lên). Manager giám sát và phê duyệt cấu hình lớn.',
    tags: ['Cấu hình hạng', 'Khuyến mãi mục tiêu', 'Phê duyệt quản lý'],
  },
  {
    icon: BarChart3,
    accent: '#2563EB',
    accentSoft: '#EAF2FF',
    accentBorder: 'rgba(37,99,235,0.18)',
    badge: 'Báo cáo',
    title: 'Báo cáo & hiệu suất',
    desc: 'Manager nhận báo cáo doanh thu, KPI và hiệu suất chương trình loyalty theo thời gian thực. Admin xem danh sách booking trong ngày.',
    tags: ['Báo cáo doanh thu', 'Bảng điều khiển KPI', 'Danh sách booking'],
  },
  {
    icon: BellRing,
    accent: '#7C3AED',
    accentSoft: '#F2EAFF',
    accentBorder: 'rgba(124,58,237,0.18)',
    badge: 'Tự động',
    title: 'Tự động hóa thông minh',
    desc: 'Nâng/hạ hạng tự động hàng tháng, điểm hết hạn sau 12 tháng, auto-apply perks khi checkout — không cần nhân viên xử lý thủ công.',
    tags: ['Đánh giá hạng tự động', 'Điểm hết hạn', 'Áp quyền lợi tự động'],
  },
  {
    icon: ShieldCheck,
    accent: '#059669',
    accentSoft: '#EAF9F4',
    accentBorder: 'rgba(5,150,105,0.18)',
    badge: 'Thanh toán',
    title: 'Checkout minh bạch',
    desc: 'Tier discount áp tự động theo hạng, cộng với redemption discount nếu khách dùng điểm, và promotion discount nếu đang có chiến dịch.',
    tags: ['Giá theo hạng', 'Đổi điểm', 'Ghép khuyến mãi'],
  },
]

export default function Features() {
  return (
    <section
      className="page-section px-6 md:px-16 bg-white/35 backdrop-blur-md border-t border-b border-cyan-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      id="features"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] items-end mb-10">
          <div>
            <div className="section-label">Tính năng</div>
            <h2 className="section-title mb-4">Đầy đủ cho cả<br />khách hàng & vận hành</h2>
            <p className="section-sub mb-0 max-w-2xl">Bộ tính năng được trình bày gọn, sáng và đồng bộ với homepage, tập trung vào giá trị thực thay vì nhồi thông tin.</p>
          </div>

          <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-white/85 to-white/95 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600">
                <Settings2 size={20} strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Linh hoạt</p>
                <p className="text-sm text-slate-500">Tối ưu cho cả frontend lẫn vận hành</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              Các module quản trị, báo cáo và tự động hóa được gom thành từng khối dễ đọc, dễ scan và dễ chuyển đổi hành động.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-8">
          {features.map((f, index) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border bg-white/78 p-7 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: f.accentBorder }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${f.accent}, rgba(255,255,255,0))` }}
              />
              <div
                className="absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-60"
                style={{ backgroundColor: f.accentSoft }}
                aria-hidden="true"
              />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: f.accentSoft, borderColor: f.accentBorder, color: f.accent }}
                >
                  <f.icon size={20} strokeWidth={1.6} />
                </div>

                <div
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: f.accentSoft, color: f.accent }}
                >
                  {String(index + 1).padStart(2, '0')} · {f.badge}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2.5 leading-tight">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{f.desc}</p>

              <div className="flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border px-3 py-1 text-xs font-medium tracking-wide"
                    style={{ borderColor: f.accentBorder, backgroundColor: f.accentSoft, color: f.accent }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-r from-cyan-600/10 via-white/85 to-blue-500/10 p-6 md:p-8 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Sẵn sàng bắt đầu?</h3>
              <p className="text-sm md:text-base text-slate-600">Đăng ký tài khoản ngay, trải nghiệm hệ thống không cần thẻ tín dụng và không mất phí khởi tạo.</p>
            </div>
            <button className="btn-primary flex-shrink-0 self-start md:self-auto">
              <span>Đăng ký ngay</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
