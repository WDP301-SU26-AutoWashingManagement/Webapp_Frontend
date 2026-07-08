import { UserPlus, CalendarCheck, Sparkles, Car } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  {
    icon: UserPlus,
    num: '01',
    title: 'Đăng ký tài khoản',
    desc: 'Đăng nhập nhanh chóng bằng tài khoản Google để bắt đầu sử dụng dịch vụ.',
    link: '/login'
  },
  {
    icon: Car,
    num: '02',
    title: 'Đăng ký thông tin xe',
    desc: 'Nhập thông tin xe và biển số xe. Vui lòng nhập chính xác thông tin xe để checkin tại cửa hàng.',
    link: '/vehicles'
  },
  {
    icon: CalendarCheck,
    num: '03',
    title: 'Đặt lịch rửa xe',
    desc: 'Chọn ngày giờ phù hợp trong khung thời gian theo hạng ( 7-21 ngày ). Hệ thống xác nhận slot ngay.',
    link: '/bookings/new'
  },
  {
    icon: Sparkles,
    num: '04',
    title: 'Rửa xe & tích điểm',
    desc: 'Admin xác nhận hoàn thành dịch vụ. Điểm được cộng tự động vào tài khoản của bạn.',
    link: '/profile'
  },
]

export default function HowItWorks() {
  return (
    <section
      className="marketing-section page-section px-6 md:px-16 bg-white/35 backdrop-blur-md border-t border-b border-cyan-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      id="how"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-label mx-auto">Quy trình</div>
          <h2 className="section-title mb-4">Cách hoạt động</h2>
          <p className="section-sub mb-0 mx-auto max-w-2xl">Từ đăng nhập đến nhận dịch vụ — chỉ 4 bước đơn giản</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const content = (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-700">
                      Bước {s.num}
                    </div>
                    <h3 className="marketing-card-heading text-lg text-slate-900">{s.title}</h3>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/15 bg-cyan-500/10 text-cyan-600 transition-transform duration-200 group-hover:scale-105">
                    <s.icon size={22} strokeWidth={1.6} />
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-600">{s.desc}</p>

                <div className="mt-auto">
                  <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>AutoWash flow</span>
                    <span className="text-cyan-700">Nhanh gọn</span>
                  </div>
                </div>
              </>
            )

            const className = "group rounded-3xl border border-cyan-500/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/5 h-full flex flex-col"

            if (s.link) {
              return (
                <Link to={s.link} key={s.num} className={`${className} block cursor-pointer`}>
                  {content}
                </Link>
              )
            }
            return (
              <div key={s.num} className={className}>
                {content}
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-cyan-500/15 bg-gradient-to-r from-cyan-600/10 via-white/85 to-green-500/10 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Từ đăng ký đến ưu đãi, mọi thứ chạy trong một luồng duy nhất.</p>
              <p className="text-sm text-slate-600">Không rối mắt, không thừa chi tiết, tập trung vào hành động tiếp theo của khách hàng.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700">
              <CalendarCheck size={16} strokeWidth={1.8} />
              Đặt lịch trong vài phút
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
