import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function BrandLogo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-3 leading-none no-underline text-slate-900 ${className}`}
    >
      <img src={logo} alt="AutoWash" className="h-12 w-12 rounded-xl object-cover shrink-0" />
      <span className="font-sans font-black text-xl tracking-tight relative pb-1.5">
        AutoWash
        <span className="absolute left-0 bottom-0 w-full h-1 bg-green-500 rounded-sm" />
      </span>
    </Link>
  )
}
