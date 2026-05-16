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
    <section className="page-section px-16 bg-slate-100 border-t border-b border-green-500/15" id="how">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Quy trình</div>
        <h2 className="section-title">Cách hoạt động</h2>
        <p className="section-sub">Từ đăng ký đến nhận ưu đãi — chỉ 4 bước đơn giản</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {steps.map((s, i) => (
            <div className={`relative p-8 border-r border-green-500/15 ${i === steps.length - 1 ? 'border-r-0' : ''} ${i !== 0 ? 'border-l border-green-500/15' : ''}`} key={i}>
              <div className="font-mono text-xs text-slate-700 tracking-widest mb-4">{s.num}</div>
              <div className="w-11 h-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-5 transition-all hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/20">
                <s.icon size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2.5 leading-tight">{s.title}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
