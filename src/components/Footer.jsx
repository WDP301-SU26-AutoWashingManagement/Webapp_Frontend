import logo from '../assets/logo.png'

export default function Footer() {
  return (
    <footer className="px-16 py-12 bg-slate-50 border-t border-green-500/15">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2.5 font-mono text-base font-bold text-slate-900">
          <img src={logo} alt="AutoWash" className="h-8 w-8 rounded-lg object-cover" />
          <span>Auto<em className="text-green-500 not-italic">Wash</em></span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Hệ thống rửa xe thông minh với chương trình loyalty tích hợp.<br />
          <span className="text-xs text-slate-500">Không bao gồm thanh toán online & hoàn tiền.</span>
        </p>
        <div className="text-xs text-slate-400">© 2025 AutoWash. Đồ án hệ thống thông tin.</div>
      </div>
    </footer>
  )
}
