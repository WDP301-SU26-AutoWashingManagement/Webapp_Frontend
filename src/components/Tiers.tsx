import { Check } from 'lucide-react'

const visualMap: Record<string, any> = {
  member: {
    icon: '🏅',
    color: '#888780',
    colorDark: '#444441',
    colorLight: '#F1EFE8',
    subtitle: 'Hạng cơ bản',
  },
  silver: {
    icon: '🥈',
    color: '#888780',
    colorDark: '#444441',
    colorLight: '#F1EFE8',
    subtitle: 'Khách hàng thân thiết',
  },
  gold: {
    icon: '👑',
    color: '#BA7517',
    colorDark: '#633806',
    colorLight: ' #faeedab0',
    subtitle: 'Khách VIP',
    featured: true,
  },
  platinum: {
    icon: '💎',
    color: '#1D9E75',
    colorDark: '#085041',
    colorLight: '#E1F5EE',
    subtitle: 'Hạng cao nhất',
  },
}

import { useEffect, useState } from 'react'
import { adminTierService } from '../services/adminTierService'
import type { Tier } from '../types/tier'

export default function Tiers() {
  const [tiersList, setTiersList] = useState<Tier[]>([])

  useEffect(() => {
    adminTierService.list({ limit: 100 })
      .then(res => {
        const sorted = res.items.sort((a, b) => (a.min_membership_points || 0) - (b.min_membership_points || 0));
        setTiersList(sorted)
      })
      .catch(err => console.error("Lỗi lấy tier:", err))
  }, [])

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
          {tiersList.map((t) => {
            const tName = t.tier_name?.toLowerCase() || 'member'
            const v = visualMap[tName] || visualMap['member']
            return (
              <div
                key={t._id || t.id}
                className={`relative flex flex-col rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-1 ${v.featured
                  ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-100'
                  : 'border border-gray-200/80 hover:border-gray-300'
                  }`}
              >
                {v.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-amber-800 bg-amber-100 border border-amber-300">
                    Phổ biến nhất
                  </div>
                )}

                {/* Icon + Name */}
                <div className="mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3"
                    style={{ backgroundColor: v.colorLight }}
                  >
                    {v.icon}
                  </div>
                  <h3 className="marketing-card-heading text-xl font-bold uppercase" style={{ color: v.colorDark }}>
                    {t.tier_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{v.subtitle}</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: v.colorLight, color: v.colorDark }}>
                    ⭐ {(t.min_membership_points || 0).toLocaleString('vi-VN')} điểm
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div
                    className="rounded-xl p-3 flex flex-col gap-0.5"
                    style={{ backgroundColor: v.colorLight }}
                  >
                    <span className="text-base font-bold leading-tight" style={{ color: v.color }}>
                      {t.booking_window_days} ngày
                    </span>
                    <span className="text-[11px] text-slate-500">Đặt trước</span>
                  </div>
                  <div
                    className="rounded-xl p-3 flex flex-col gap-0.5"
                    style={{ backgroundColor: v.colorLight }}
                  >
                    <span className="text-base font-bold leading-tight" style={{ color: v.color }}>
                      {t.discount_percentage}%
                    </span>
                    <span className="text-[11px] text-slate-500">Giảm giá</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-4" />

                {/* Perks */}
                <ul className="flex flex-col gap-2 flex-1">
                  {(t.free_features || []).map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-600 leading-snug">
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        style={{ color: v.color, flexShrink: 0, marginTop: '2px' }}
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Notice */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3.5">
            <span className="text-base flex-shrink-0">ℹ️</span>
            <span>
              Tỷ lệ quy đổi: <strong className="text-amber-600 font-bold">1.000 VNĐ = 1 Điểm</strong>. Áp dụng cho mọi hóa đơn thanh toán dịch vụ.
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-3.5">
            <span className="text-base flex-shrink-0">⚠️</span>
            <span>
              Điểm xét hạng tích lũy có giá trị trong <strong className="text-slate-800">12 tháng</strong>.
              Hệ thống tự động nâng/hạ hạng vào ngày 1 hàng tháng dựa trên điểm thành viên.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}