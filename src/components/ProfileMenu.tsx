import { Link, useLocation } from 'react-router-dom'
import { useEffect, useId, useRef, useState } from 'react'
import type { AuthUser } from '../types/auth'

const MENU_ITEMS = [
    { to: '/profile', label: 'Thông tin cá nhân' },
    { to: '/vehicles', label: 'Phương tiện' },
    { to: '/bookings/new', label: 'Đặt lịch' },
    { to: '/bookings', label: 'Lịch sử đặt lịch' },
] as const

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function ProfileAvatar({ user, displayName }: { user: AuthUser; displayName: string }) {
    if (user.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-500/20"
            />
        )
    }

    return (
        <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-sm font-semibold text-white ring-2 ring-cyan-500/20"
        >
            {getInitials(displayName)}
        </span>
    )
}

interface ProfileMenuProps {
    user: AuthUser
    onNavigate?: () => void
}

export default function ProfileMenu({ user, onNavigate }: ProfileMenuProps) {
    const location = useLocation()
    const menuId = useId()
    const containerRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)

    const displayName = user.full_name || user.email || 'Tài khoản'

    useEffect(() => {
        setOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!open) return

        const handlePointerDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    const close = () => {
        setOpen(false)
        onNavigate?.()
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls={menuId}
                title={displayName}
                onClick={() => setOpen((v) => !v)}
                className="flex items-center rounded-full p-0.5 transition ring-offset-2 hover:ring-2 hover:ring-cyan-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            >
                <ProfileAvatar user={user} displayName={displayName} />
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="Menu tài khoản"
                    className="absolute right-0 top-full z-[60] mt-2 min-w-[220px] overflow-hidden rounded-xl border border-cyan-500/15 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                >
                    <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                        {user.email && user.email !== displayName && (
                            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                        )}
                    </div>

                    <nav className="py-1">
                        {MENU_ITEMS.map((item) => {
                            const isActive = location.pathname === item.to
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    role="menuitem"
                                    onClick={close}
                                    className={`block px-4 py-2.5 text-sm font-medium no-underline transition-colors ${isActive
                                            ? 'bg-cyan-50 text-[#0ea5b7]'
                                            : 'text-slate-700 hover:bg-slate-50 hover:text-[#0ea5b7]'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </div>
    )
}
