import { Check, Star } from 'lucide-react'
import './Tiers.css'

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
    <section className="tiers" id="tiers">
      <div className="tiers-inner">
        <div className="section-label">Hạng thành viên</div>
        <h2 className="section-title">Càng rửa nhiều<br />Ưu đãi càng lớn</h2>
        <p className="section-sub">Hệ thống tự động nâng/hạ hạng hàng tháng dựa trên lịch sử của bạn</p>

        <div className="tiers-grid">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`tier-card ${t.featured ? 'featured' : ''}`}
              style={{
                '--tier-color': t.color,
                '--tier-bg': t.colorBg,
                '--tier-border': t.colorBorder,
              }}
            >
              {t.featured && <div className="tier-badge">Phổ biến nhất</div>}

              <div className="tier-header">
                <div className="tier-icon">
                  <Star size={16} fill={t.color} color={t.color} />
                </div>
                <h3 className="tier-name" style={{ color: t.color }}>{t.name}</h3>
              </div>

              <div className="tier-stats">
                <div className="tier-stat">
                  <span className="ts-val">{t.window}</span>
                  <span className="ts-label">Đặt lịch trước</span>
                </div>
                <div className="tier-stat">
                  <span className="ts-val">{t.discount}</span>
                  <span className="ts-label">Giảm giá</span>
                </div>
              </div>

              <ul className="tier-perks">
                {t.perks.map((p) => (
                  <li key={p}>
                    <Check size={13} strokeWidth={2.5} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="tier-note">
          <span>⚠</span>
          Điểm tích lũy hết hạn sau <strong>12 tháng</strong>. Hệ thống review nâng/hạ hạng tự động mỗi tháng.
        </div>
      </div>
    </section>
  )
}
