import { Check, Star } from 'lucide-react'

const tiers = [
  {
    name: 'Member',
    color: '#94a3b8',
    colorBg: 'rgba(148,163,184,0.08)',
    colorBorder: 'rgba(148,163,184,0.2)',
    window: '7 ngày',
    discount: '0%',
    perks: ['Tích điểm mỗi lần rửa', 'Xem lịch sử booking', 'Đổi điểm lấy ưu đãi'],
  },
  {
    name: 'Silver',
    color: '#cbd5e1',
    colorBg: 'rgba(203,213,225,0.08)',
    colorBorder: 'rgba(203,213,225,0.2)',
    window: '10 ngày',
    discount: '5%',
    perks: ['Tất cả quyền Member', 'Giảm 5% mỗi lần rửa', 'Nhận promo ưu tiên', 'Hàng đợi ưu tiên'],
  },
  {
    name: 'Gold',
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.25)',
    window: '12 ngày',
    discount: '10%',
    perks: ['Tất cả quyền Silver', 'Giảm 10% mỗi lần rửa', 'Tích điểm x1.5', 'Add-on miễn phí'],
    featured: true,
  },
  {
    name: 'Platinum',
    color: '#22c55e',
    colorBg: 'rgba(34,197,94,0.08)',
    colorBorder: 'rgba(34,197,94,0.25)',
    window: '14 ngày',
    discount: '15%',
    perks: ['Tất cả quyền Gold', 'Giảm 15% mỗi lần rửa', 'Tích điểm x2', 'Rửa xe miễn phí hàng tháng'],
  },
]

export default function Tiers() {
  return (
    <section className="page-section px-16 bg-slate-50" id="tiers">
      <div className="max-w-5xl mx-auto">
        <div className="section-label">Hạng thành viên</div>
        <h2 className="section-title">Càng rửa nhiều<br />Ưu đãi càng lớn</h2>
        <p className="section-sub">Hệ thống tự động nâng/hạ hạng hàng tháng dựa trên lịch sử của bạn</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative border rounded-2xl p-7 transition-all hover:-translate-y-1.5 ${t.featured ? 'border-2 shadow-xl shadow-amber-500/10' : 'hover:border-opacity-30'}`}
              style={{
                borderColor: t.colorBorder,
                backgroundColor: t.colorBg,
              }}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full text-background-light tracking-wide" style={{ backgroundColor: t.color }}>
                  Phổ biến nhất
                </div>
              )}

              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.color}20` }}>
                  <Star size={16} fill={t.color} color={t.color} />
                </div>
                <h3 className="font-display text-2xl tracking-wider leading-tight" style={{ color: t.color }}>{t.name}</h3>
              </div>

              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200/50">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-lg font-bold leading-tight" style={{ color: t.color }}>{t.window}</span>
                  <span className="text-xs text-slate-700 tracking-wide">Đặt lịch trước</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-lg font-bold leading-tight" style={{ color: t.color }}>{t.discount}</span>
                  <span className="text-xs text-slate-700 tracking-wide">Giảm giá</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                    <Check size={13} strokeWidth={2.5} style={{ color: t.color, flexShrink: 0, marginTop: '1px' }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-700 bg-white/50 border border-green-500/15 rounded-xl px-4 py-3.5">
          <span className="text-lg">⚠</span>
          <span>Điểm tích lũy hết hạn sau <strong>12 tháng</strong>. Hệ thống review nâng/hạ hạng tự động mỗi tháng.</span>
        </div>
      </div>
    </section>
  )
}
