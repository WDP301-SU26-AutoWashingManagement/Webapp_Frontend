import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import './Hero.css'

export default function Hero() {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="hero" ref={heroRef}>
      {/* Animated background grid */}
      <div className="hero-grid" style={{ transform: `translateY(${scrollY * 0.3}px)` }} />
      <div className="hero-noise" />

      {/* Floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Hero content */}
      <div className="hero-content">
        <div className="hero-badge">
          <Sparkles size={12} />
          <span>Hệ thống rửa xe thông minh · Loyalty rewards</span>
        </div>

        <h1 className="hero-title">
          <span className="line-1">RỬA XE</span>
          <span className="line-2">TÍCH ĐIỂM</span>
          <span className="line-3">NHẬN <em className="accent">ƯU ĐÃI</em></span>
        </h1>

        <p className="hero-sub">
          Đặt lịch, theo dõi điểm thưởng và nhận ưu đãi độc quyền<br />
          theo hạng thành viên — tất cả trong một ứng dụng.
        </p>

        <div className="hero-actions">
          <button className="btn-primary">
            <span>Đăng ký miễn phí</span>
            <span className="btn-arrow">→</span>
          </button>
          <button className="btn-ghost">Xem demo</button>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">4</span>
            <span className="stat-label">Hạng thành viên</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">12×</span>
            <span className="stat-label">Tích điểm mỗi lần rửa</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">14</span>
            <span className="stat-label">Ngày đặt lịch trước</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-hint">
        <ChevronDown size={20} />
      </div>
    </section>
  )
}
