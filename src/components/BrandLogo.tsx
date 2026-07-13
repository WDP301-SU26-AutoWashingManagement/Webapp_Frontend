import { Link } from 'react-router-dom'
import logo2 from '../assets/logo2.png'

export default function BrandLogo({ className = '', variant = 'light' }) {
  const isDark = variant === 'dark'

  return (
    <Link
      to="/"
      className={`group flex items-center gap-3 leading-none no-underline ${isDark ? 'text-white' : 'text-slate-900'} ${className}`}
    >
      <img
        src={logo2}
        alt="HybridWash"
        className={`h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 transition-transform duration-200 group-hover:scale-105 md:h-14 md:w-14 ${
          isDark
            ? 'ring-cyan-400/30 shadow-[0_10px_25px_rgba(14,165,183,0.25)]'
            : 'ring-cyan-200 shadow-[0_10px_25px_rgba(14,165,183,0.18)]'
        }`}
      />
      <span className="relative pb-1 font-sans text-xl font-black tracking-tight md:text-2xl">
        <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-sky-500 bg-clip-text text-transparent">
          HybridWash
        </span>
        <span className="absolute left-0 bottom-0 h-1 w-full rounded-sm bg-gradient-to-r from-cyan-400 via-teal-400 to-sky-400 shadow-[0_0_12px_rgba(14,165,183,0.35)]" />
      </span>
    </Link>
  )
}
