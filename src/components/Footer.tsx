import logo from '../assets/logo2.png'
import { Link } from 'react-router-dom'

export default function Footer() {
  const links = [
    {
      title: 'Khám phá',
      items: [
        { name: 'Trang chủ', href: '/' },
        { name: 'Tính năng', href: '/#features' },
        { name: 'Hạng thành viên', href: '/#tiers' },
        { name: 'Cách hoạt động', href: '/#how' },
      ],
    },
    {
      title: 'Ứng dụng',
      items: [
        { name: 'Đặt lịch rửa xe', href: '/new-booking' },
        { name: 'Quản lý phương tiện', href: '/vehicles' },
        { name: 'Lịch sử đặt lịch', href: '/bookings' },
      ],
    },
    {
      title: 'Hỗ trợ & Liên hệ',
      items: [
        { name: 'Chi nhánh hệ thống', href: '/#locations' },
        { name: 'Hotline: 0933 003 ', href: 'tel:' },
      ],
    },
  ]

  return (
    <footer className="relative bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
        />
        {/* Gradient Overlay for high text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-16 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src={logo} alt="HybridWash" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-black/30" />
                  <div className="font-black text-xl text-white tracking-wide">
                    Hybrid<span className="text-[#0ea5b7]">Wash</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-6 max-w-sm">
                  Hệ thống rửa xe tự động thông minh hàng đầu. Đặt lịch nhanh chóng, tích điểm thành viên và chăm sóc phương tiện chuẩn 5 sao.
                </p>
              </div>

              {/* Premium Social Icons */}
              <div className="flex gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#0ea5b7] border border-white/10 hover:border-[#0ea5b7] flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[#0ea5b7]/20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#0ea5b7] border border-white/10 hover:border-[#0ea5b7] flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[#0ea5b7]/20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="TikTok"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#0ea5b7] border border-white/10 hover:border-[#0ea5b7] flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[#0ea5b7]/20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.17-.14-.24-.22v6.56c0 1.94-.48 3.93-1.63 5.49-1.16 1.56-2.99 2.58-4.93 2.78-1.92.2-3.97-.24-5.46-1.51-1.49-1.26-2.36-3.26-2.22-5.21.14-1.96 1.34-3.79 3.09-4.7 1.65-.86 3.65-.96 5.37-.24v4.09c-1.12-.55-2.52-.45-3.5 0.35-.98.79-1.37 2.22-1.02 3.42.35 1.19 1.52 2.04 2.77 2.05 1.25.01 2.45-.78 2.83-1.96.11-.35.15-.72.15-1.09V0l.02.02z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Sections Column */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {links.map((section, i) => (
                <div key={i}>
                  <h4 className="font-bold text-white mb-5 text-sm tracking-wider uppercase">{section.title}</h4>
                  <ul className="space-y-3.5">
                    {section.items.map((item, j) => {
                      const isInternal = item.href.startsWith('/') && !item.href.includes('#');
                      return (
                        <li key={j}>
                          {isInternal ? (
                            <Link
                              to={item.href}
                              className="text-sm text-white/70 hover:text-[#0ea5b7] transition-colors duration-200"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <a
                              href={item.href}
                              className="text-sm text-white/70 hover:text-[#0ea5b7] transition-colors duration-200"
                            >
                              {item.name}
                            </a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} HybridWash. Tất cả các quyền được bảo lưu.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors duration-200">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}