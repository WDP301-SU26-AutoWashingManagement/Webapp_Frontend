import logo from '../assets/logo2.png'
import { ArrowRight } from 'lucide-react'

export default function Footer() {
  const links = [
    {
      title: 'Sản phẩm',
      items: [
        { name: 'Tính năng', href: '/#features' },
        { name: 'Hạng thành viên', href: '/#tiers' },
        { name: 'Cách hoạt động', href: '/#how' },
      ],
    },
    {
      title: 'Công ty',
      items: [
        { name: 'Về chúng tôi', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Liên hệ', href: '#' },
      ],
    },
    {
      title: 'Pháp lý',
      items: [
        { name: 'Điều khoản', href: '#' },
        { name: 'Bảo mật', href: '#' },
        { name: 'Cookie', href: '#' },
      ],
    },
  ]

  return (
    // 1. Dùng `relative` + KHÔNG dùng `overflow-hidden` để video không bị clip
    <footer className="relative bg-black">

      {/* Video Background — dùng `absolute inset-0` mà không có z-index âm */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/70" />
      </div>

      {/* Nội dung — z-index cao hơn video */}
      <div className="relative z-10 px-6 md:px-16 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">

          {/* Newsletter Section */}
          {/* <div className="mb-12 md:mb-16">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-8 md:p-10 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Nhận cập nhật mới</h3>
                  <p className="text-white/80">Đừng bỏ lỡ khuyến mãi độc quyền và tin tức từ AutoWash</p>
                </div>
                <div className="flex w-full md:w-auto">
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-l-lg bg-white text-slate-900 placeholder-slate-400 outline-none"
                  />
                  <button className="px-6 py-2.5 rounded-r-lg bg-[#0ea5b7] text-white font-semibold hover:bg-[#0b8fa0] transition-colors flex items-center gap-2">
                    <span className="hidden sm:inline">Đăng ký</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div> */}

          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="AutoWash" className="h-10 w-10 rounded-lg object-cover" />
                <div className="font-black text-lg text-white">
                  Auto<span className="text-[#0ea5b7]">Wash</span>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-6">
                Hệ thống rửa xe thông minh với chương trình loyalty tích hợp.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20v-7.3H5.5v-3.07h2.79V7.7c0-2.764 1.69-4.27 4.153-4.27 1.185 0 2.203.088 2.499.128v2.894h-1.713c-1.346 0-1.605.64-1.605 1.577v2.07h3.21l-.418 3.07h-2.792V20" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 002.856-3.986 10.059 10.059 0 01-2.836.856 4.958 4.958 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.948 4.948 0 00-8.506 4.513A14.025 14.025 0 011.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              </div>
            </div>

            {/* Links Sections */}
            {links.map((section, i) => (
              <div key={i}>
                <h4 className="font-bold text-white mb-4 text-sm tracking-wide">{section.title}</h4>
                <ul className="space-y-3">
                  {section.items.map((item, j) => (
                    <li key={j}>
                      <a href={item.href} className="text-sm text-white/80 hover:text-[#0ea5b7] transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}

        </div>
      </div>
    </footer>
  )
}