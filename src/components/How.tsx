import { useEffect, useState } from 'react'
import { UserPlus, CalendarCheck, Sparkles, Car, ShieldCheck, Info, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { servicePackageService } from '../services/servicePackageService'

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
    title: 'Nhận xe, thanh toán & tích điểm',
    desc: 'Khi xe được rửa xong, bạn có thể tới nhận xe và thanh toán. Điểm thưởng sẽ được cộng tự động vào tài khoản.',
    link: '/profile'
  },
]

export default function HowItWorks() {
  const [washPrice, setWashPrice] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    servicePackageService.listActive()
      .then(items => {
        if (!isMounted) return
        const washService = items.find(s =>
          s.service_name?.toLowerCase().includes('dịch vụ rửa xe') ||
          s.service_name?.toLowerCase().includes('rửa xe')
        )
        if (washService && typeof washService.service_price === 'number') {
          setWashPrice(washService.service_price)
        }
      })
      .catch(console.error)
    return () => { isMounted = false }
  }, [])

  const displayPrice = washPrice !== null ? `${washPrice.toLocaleString('vi-VN')}đ` : '50.000đ'

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
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-700">
                      Bước {s.num}
                    </div>
                    <h3 className="marketing-card-heading text-lg font-bold text-slate-900 min-h-[3.5rem] flex items-center">
                      {s.title}
                    </h3>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/15 bg-cyan-500/10 text-cyan-600 transition-transform duration-200 group-hover:scale-105">
                    <s.icon size={22} strokeWidth={1.6} />
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-600 flex-1">{s.desc}</p>

                <div className="mt-auto">
                  <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>HybridWash flow</span>
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

        {/* Note về Dịch vụ rửa xe mặc định và Giá từ hệ thống */}
        <div className="mt-8 max-w-4xl mx-auto rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-50/90 via-cyan-50/80 to-emerald-50/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mt-0.5">
              <Info size={22} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">Lưu ý quan trọng khi Đặt lịch</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  <CheckCircle2 size={13} /> Dịch vụ mặc định
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                Mọi lịch hẹn <strong className="text-slate-900 font-bold">mặc định bao gồm Dịch vụ rửa xe</strong> ({' '}
                <span className="inline-block font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs sm:text-sm">
                  {displayPrice}
                </span>
                ). Quý khách có thể chọn thêm dịch vụ lẻ hoặc gói Combo tùy nhu cầu.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 max-w-4xl mx-auto rounded-3xl border border-cyan-500/15 bg-gradient-to-r from-cyan-600/10 via-white/85 to-green-500/10 px-6 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-cyan-600 shrink-0" />
                Cam kết chất lượng dịch vụ & Hỗ trợ khách hàng
              </p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Khi xe được rửa xong bạn có thể tới nhận xe và thanh toán. Nếu có vấn đề xảy ra bạn có thể tạo đơn khiếu nại và cửa hàng sẽ giải quyết trong thời gian sớm nhất.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700 shrink-0">
              <CalendarCheck size={16} strokeWidth={1.8} />
              Đặt lịch trong vài phút
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
