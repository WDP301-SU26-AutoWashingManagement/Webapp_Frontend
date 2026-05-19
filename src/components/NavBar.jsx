import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

export default function NavBar() {
    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-12 py-6 border-b border-green-500/15 bg-slate-50/80 backdrop-blur-sm">
            <BrandLogo />

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

            <Link className="bg-green-500 text-white px-6 py-2.5 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-green-600 hover:-translate-y-0.5 no-underline" to="/login">
                Đăng nhập
            </Link>
        </nav>
    )
}
