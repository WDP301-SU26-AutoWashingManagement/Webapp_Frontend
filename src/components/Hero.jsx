import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Sparkles } from 'lucide-react'
export default function Hero() {
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-slate-50" ref={heroRef}>
      {/* Animated background grid */}
      <div
        className="absolute inset-0 -inset-1/5 bg-grid pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-float1" style={{
        background: 'radial-gradient(circle, rgba(26, 122, 74, 0.35), transparent 70%)',
      }} />
      <div className="absolute bottom-24 -left-12 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-float2" style={{
        background: 'radial-gradient(circle, rgba(163, 230, 53, 0.15), transparent 70%)',
      }} />
      <div className="absolute top-1/2 left-2/5 w-48 h-48 rounded-full blur-3xl pointer-events-none animate-float3" style={{
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2), transparent 70%)',
      }} />

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-16 pt-12 pb-8 max-w-3xl" style={{ animation: 'fadeUp 0.8s ease both' }}>
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-3.5 py-1.5 text-xs font-medium text-green-500 tracking-wide mb-8 w-fit" style={{ animation: 'fadeUp 0.8s 0.1s ease both' }}>
          <Sparkles size={12} />
          <span>Hệ thống rửa xe thông minh · Loyalty rewards</span>
        </div>

        <h1 className="font-display text-7xl lg:text-8xl leading-tight text-slate-900 flex flex-col mb-7" style={{ animation: 'fadeUp 0.8s 0.2s ease both' }}>
          <span>RỬA XE</span>
          <span>TÍCH ĐIỂM</span>
          <span>NHẬN <em className="text-green-500 not-italic drop-shadow-[0_0_40px_rgba(34,197,94,0.4)]">ƯU ĐÃI</em></span>
        </h1>

        <p className="text-lg leading-relaxed text-slate-700 max-w-xl mb-10" style={{ animation: 'fadeUp 0.8s 0.3s ease both' }}>
          Đặt lịch, theo dõi điểm thưởng và nhận ưu đãi độc quyền<br />
          theo hạng thành viên — tất cả trong một ứng dụng.
        </p>

        <div className="flex gap-4 mb-16" style={{ animation: 'fadeUp 0.8s 0.4s ease both' }}>
          <Link to="/login" className="btn-primary no-underline">
            <span>Đăng ký miễn phí</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <button className="btn-ghost">Xem demo</button>
        </div>

        <div className="flex items-center gap-8" style={{ animation: 'fadeUp 0.8s 0.5s ease both' }}>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-bold text-green-500 leading-tight">4</span>
            <span className="text-xs text-slate-700 tracking-wide">Hạng thành viên</span>
          </div>
          <div className="w-px h-8 bg-green-500/15" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-bold text-green-500 leading-tight">12×</span>
            <span className="text-xs text-slate-700 tracking-wide">Tích điểm mỗi lần rửa</span>
          </div>
          <div className="w-px h-8 bg-green-500/15" />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-bold text-green-500 leading-tight">14</span>
            <span className="text-xs text-slate-700 tracking-wide">Ngày đặt lịch trước</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-700 animate-bounce z-10">
        <ChevronDown size={20} />
      </div>
    </section>
  )
}
