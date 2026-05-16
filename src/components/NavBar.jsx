import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function NavBar() {
    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-12 py-6 border-b border-green-500/15 bg-slate-50/80 backdrop-blur-sm">
            <Link className="flex items-center gap-3 leading-none no-underline text-slate-900" to="/">
                <img src={logo} alt="AutoWash" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                <span className="font-sans font-black text-xl tracking-tight relative pb-1.5">
                    AutoWash
                    <span className="absolute left-0 bottom-0 w-full h-1 bg-green-500 rounded-sm"></span>
                </span>
            </Link>

            <div className="hidden md:flex gap-9">
                <Link to="/how" className="text-slate-700 no-underline text-sm font-medium tracking-wide transition-colors hover:text-green-500">
                    Cách hoạt động
                </Link>
                <Link to="/tiers" className="text-slate-700 no-underline text-sm font-medium tracking-wide transition-colors hover:text-green-500">
                    Hạng thành viên
                </Link>
                <Link to="/features" className="text-slate-700 no-underline text-sm font-medium tracking-wide transition-colors hover:text-green-500">
                    Tính năng
                </Link>
            </div>

            <Link className="bg-green-500 text-white px-6 py-2.5 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-green-600 hover:-translate-y-0.5 no-underline" to="/">
                Đăng ký ngay
            </Link>
        </nav>
    )
}
