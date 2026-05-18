import { UserPlus, CalendarCheck, Sparkles, Gift } from 'lucide-react'

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
    <section
      className="page-section px-6 md:px-16 bg-white/35 backdrop-blur-md border-t border-b border-cyan-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      id="how"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] items-end mb-10">
          <div>
            <div className="section-label">Quy trình</div>
            <h2 className="section-title mb-4">Cách hoạt động</h2>
            <p className="section-sub mb-0 max-w-2xl">Từ đăng ký đến nhận ưu đãi — chỉ 4 bước đơn giản</p>
          </div>

          <div className="rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-white/85 to-white/95 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600">
                <Sparkles size={20} strokeWidth={1.7} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">4 bước</p>
                <p className="text-sm text-slate-500">Luồng thao tác nhanh, rõ và tự động</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              Giao diện quy trình được làm đồng bộ với homepage: sáng, thoáng, có điểm nhấn cyan và các thẻ thông tin rõ ràng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="group rounded-3xl border border-cyan-500/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-700">
                    Bước {s.num}
                  </div>
                  <h3 className="text-lg font-semibold leading-tight text-slate-900">{s.title}</h3>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/15 bg-cyan-500/10 text-cyan-600 transition-transform duration-200 group-hover:scale-105">
                  <s.icon size={22} strokeWidth={1.6} />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">{s.desc}</p>

              <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>AutoWash flow</span>
                <span className="text-cyan-700">Nhanh gọn</span>
              </div>
            </div>
          ))}
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
