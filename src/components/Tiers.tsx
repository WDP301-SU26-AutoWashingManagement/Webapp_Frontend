import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Member',
    subtitle: 'Hạng cơ bản',
    icon: '🏅',
    color: '#888780',
    colorDark: '#444441',
    colorLight: '#F1EFE8',
    window: '7 ngày',
    discount: '0%',
    perks: [
      'Tích điểm mỗi lần rửa',
      'Xem lịch sử booking',
      'Đổi điểm lấy ưu đãi',
    ],
  },
  {
    name: 'Silver',
    subtitle: 'Khách hàng thân thiết',
    icon: '🥈',
    color: '#888780',
    colorDark: '#444441',
    colorLight: '#F1EFE8',
    window: '10 ngày',
    discount: '5%',
    perks: [
      'Tất cả quyền Member',
      'Giảm 5% mỗi lần rửa',
      'Nhận promo ưu tiên',
      'Hàng đợi ưu tiên',
    ],
  },
  {
    name: 'Gold',
    subtitle: 'Khách VIP',
    icon: '👑',
    color: '#BA7517',
    colorDark: '#633806',
    colorLight: ' #faeedab0',
    window: '12 ngày',
    discount: '10%',
    perks: [
      'Tất cả quyền Silver',
      'Giảm 10% mỗi lần rửa',
      'Tích điểm x1.5',
      'Add-on miễn phí',
    ],
    featured: true,
  },
  {
    name: 'Platinum',
    subtitle: 'Hạng cao nhất',
    icon: '💎',
    color: '#1D9E75',
    colorDark: '#085041',
    colorLight: '#E1F5EE',
    window: '14 ngày',
    discount: '15%',
    perks: [
      'Tất cả quyền Gold',
      'Giảm 15% mỗi lần rửa',
      'Tích điểm x2',
      'Rửa xe miễn phí hàng tháng',
    ],
  },
]

export default function Tiers() {
  return (
    <section className="marketing-section page-section px-6 md:px-16 bg-white/35 backdrop-blur-md" id="tiers">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Hạng thành viên</div>
        <h2 className="section-title">
          <span className="block">Càng rửa nhiều</span>
          <span className="mt-2 block sm:mt-3">Ưu đãi càng lớn</span>
        </h2>
        <p className="section-sub">Hệ thống tự động nâng/hạ hạng hàng tháng dựa trên lịch sử của bạn</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-1 ${t.featured
                ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-100'
                : 'border border-gray-200/80 hover:border-gray-300'
                }`}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-amber-800 bg-amber-100 border border-amber-300">
                  Phổ biến nhất
                </div>
              )}

              {/* Icon + Name */}
              <div className="mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                  style={{ backgroundColor: t.colorLight }}
                >
                  {t.icon}
                </div>
                <h3 className="marketing-card-heading text-xl font-bold" style={{ color: t.colorDark }}>
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div
                  className="rounded-xl p-3 flex flex-col gap-0.5"
                  style={{ backgroundColor: t.colorLight }}
                >
                  <span className="text-base font-bold leading-tight" style={{ color: t.color }}>
                    {t.window}
                  </span>
                  <span className="text-[11px] text-slate-500">Đặt trước</span>
                </div>
                <div
                  className="rounded-xl p-3 flex flex-col gap-0.5"
                  style={{ backgroundColor: t.colorLight }}
                >
                  <span className="text-base font-bold leading-tight" style={{ color: t.color }}>
                    {t.discount}
                  </span>
                  <span className="text-[11px] text-slate-500">Giảm giá</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-4" />

              {/* Perks */}
              <ul className="flex flex-col gap-2 flex-1">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] text-slate-600 leading-snug">
                    <Check
                      size={13}
                      strokeWidth={2.5}
                      style={{ color: t.color, flexShrink: 0, marginTop: '2px' }}
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3.5">
          <span className="text-base flex-shrink-0">⚠️</span>
          <span>
            Điểm thưởng tích lũy hết hạn sau <strong className="text-slate-800">12 tháng</strong>.
            Hệ thống review nâng/hạ hạng tự động mỗi tháng dựa trên điểm thành viên.
          </span>
        </div>
      </div>
    </section>
  )
}