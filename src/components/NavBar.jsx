import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo2 from '../assets/logo2.png'
import { useAuth } from '../hooks/useAuth'

export default function NavBar() {
    const location = useLocation()
    const { user, isAuthenticated, logout } = useAuth()
    const isHome = location.pathname === '/'
    const [open, setOpen] = useState(false)

    const displayName = user?.full_name || user?.email || 'Tài khoản'

    useEffect(() => {
        if (!location.hash) return

        const id = location.hash.replace('#', '')
        const target = document.getElementById(id)

        if (!target) return

        const raf = window.requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })

        return () => window.cancelAnimationFrame(raf)
    }, [location.hash, location.pathname])

    useEffect(() => {
        setOpen(false)
    }, [location.pathname])

    const handleLogoClick = () => {
        setOpen(false)

        if (isHome) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleLogout = () => {
        setOpen(false)
        logout()
    }

    const linkClass = `no-underline text-sm font-medium tracking-wide transition-colors nav-link`

    const authActionsDesktop = isAuthenticated ? (
        <>
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 lg:inline-block" title={displayName}>
                Xin chào, {displayName}
            </span>
            <button
                type="button"
                onClick={handleLogout}
                className="hidden md:inline-block rounded-lg border border-cyan-500/25 bg-white px-5 py-2 font-sans text-sm font-semibold text-slate-700 transition-all hover:border-cyan-500/50 hover:text-[#0ea5b7]"
            >
                Đăng xuất
            </button>
        </>
    ) : (
        <>
            <Link
                to="/login"
                className="hidden md:inline-block rounded-lg border border-cyan-500/25 bg-white px-5 py-2 font-sans text-sm font-semibold text-slate-700 no-underline transition-all hover:border-cyan-500/50 hover:text-[#0ea5b7]"
            >
                Đăng nhập
            </Link>
            <Link
                className="hidden md:inline-block bg-[#0ea5b7] text-white px-5 py-2 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all hover:bg-[#0b8fa0] hover:-translate-y-0.5 no-underline nav-cta"
                to="/register"
            >
                Đăng ký ngay
            </Link>
        </>
    )

    const authActionsMobile = isAuthenticated ? (
        <>
            <p className="text-sm font-medium text-slate-700">Xin chào, {displayName}</p>
            <button
                type="button"
                onClick={handleLogout}
                className="mt-2 inline-block w-full rounded-lg border border-cyan-500/25 bg-white px-4 py-2 text-center font-semibold text-slate-700"
            >
                Đăng xuất
            </button>
        </>
    ) : (
        <>
            <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-slate-700 font-medium no-underline"
            >
                Đăng nhập
            </Link>
            <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="mt-2 inline-block bg-[#0ea5b7] text-white px-4 py-2 rounded-lg font-semibold text-center no-underline"
            >
                Đăng ký ngay
            </Link>
        </>
    )

    return (
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-2 md:py-3 text-slate-900 site-nav">
            <Link className="group flex items-center gap-3 leading-none no-underline text-slate-900" to="/" onClick={handleLogoClick}>
                <img src={logo2} alt="AutoWash" className="h-14 w-14 rounded-2xl object-cover shrink-0 ring-1 ring-cyan-200 shadow-[0_10px_25px_rgba(14,165,183,0.18)] transition-transform duration-200 group-hover:scale-105 md:h-16 md:w-16" />
                <span className="relative pb-1 font-sans text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                    <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-sky-500 bg-clip-text text-transparent">
                        AutoWash
                    </span>
                    <span className="absolute left-0 bottom-0 h-1 w-full rounded-sm bg-gradient-to-r from-cyan-400 via-teal-400 to-sky-400 shadow-[0_0_12px_rgba(14,165,183,0.35)]"></span>
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
                <Link to="/#how" className={`${linkClass} text-slate-700 hover:text-[#0ea5b7]`}>
                    Cách hoạt động
                </Link>

                <Link to="/#features" className={`${linkClass} text-slate-700 hover:text-[#0ea5b7]`}>
                    Tính năng
                </Link>
                <Link to="/#tiers" className={`${linkClass} text-slate-700 hover:text-[#0ea5b7]`}>
                    Hạng thành viên
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {authActionsDesktop}

                <button aria-label="Toggle menu" onClick={() => setOpen(v => !v)} className="md:hidden hamburger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {open && (
                <div className="fixed left-4 right-4 top-16 rounded-lg p-4 mobile-menu md:hidden">
                    <div className="flex flex-col gap-3">
                        <Link to="/#how" onClick={() => setOpen(false)} className="text-slate-700 font-medium no-underline">
                            Cách hoạt động
                        </Link>
                        <Link to="/#tiers" onClick={() => setOpen(false)} className="text-slate-700 font-medium no-underline">
                            Hạng thành viên
                        </Link>
                        <Link to="/#features" onClick={() => setOpen(false)} className="text-slate-700 font-medium no-underline">
                            Tính năng
                        </Link>
                        {authActionsMobile}
                    </div>
                </div>
            )}
        </nav>
    )
}
