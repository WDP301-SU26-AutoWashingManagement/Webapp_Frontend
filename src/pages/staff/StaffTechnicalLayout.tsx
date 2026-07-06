import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    ClipboardList,
    FileText,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    CalendarOff,
    CalendarDays,
    Wallet,
    CheckSquare,
    PlayCircle,
    CreditCard,
    CircleEllipsis
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logo2 from '../../assets/logo2.png'

const NAV_GROUPS = [
    {
        title: 'Lịch hẹn & Xử lý',
        items: [
            {
                label: 'Tổng quan',
                icon: LayoutDashboard,
                to: '/staff/technical/dashboard',
            },
            {
                label: 'Quản lý lịch hẹn',
                icon: ClipboardList,
                to: '/staff/technical/bookings',
            },
            {
                label: 'Checkin xe',
                icon: CheckSquare,
                to: '/staff/technical/checkin',
            },
            {
                label: 'Đang xử lý',
                icon: PlayCircle,
                to: '/staff/technical/in-progress',
            },
            {
                label: 'Lịch hẹn hoàn thành',
                icon: CreditCard,
                to: '/staff/technical/payments',
            },
            {
                label: 'Tình trạng rửa xe',
                icon: CircleEllipsis,
                to: '/staff/technical/washing-status',
            },


        ]
    },
    {
        title: 'Nội bộ',
        items: [
            {
                label: 'Lịch làm việc',
                icon: CalendarDays,
                to: '/staff/technical/schedules',
            },
            {
                label: 'Nghỉ phép',
                icon: CalendarOff,
                to: '/staff/technical/leave-requests',
            },
            {
                label: 'Cài đặt',
                icon: Settings,
                to: '/staff/technical/settings',
            },
        ]
    }
]

export default function StaffTechnicalLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    const displayName = user?.full_name || user?.email || 'Staff'
    const initials = displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--collapsed'}`}>
                <div className="admin-sidebar__brand">
                    <Link to="/staff/technical/dashboard" className="admin-sidebar__logo-link">
                        <img src={logo2} alt="AutoWash" className="admin-sidebar__logo-img" />
                        {sidebarOpen && (
                            <span className="admin-sidebar__logo-text">
                                Auto<span className="admin-sidebar__logo-accent">Wash</span>
                            </span>
                        )}
                    </Link>
                    <button
                        type="button"
                        className="admin-sidebar__toggle"
                        onClick={() => setSidebarOpen((v) => !v)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {sidebarOpen && (
                    <div className="admin-sidebar__badge" style={{ background: '#8b5cf6' }}>
                        <span className="admin-sidebar__badge-dot" style={{ background: '#fff' }} />
                        Technical
                    </div>
                )}

                <nav className="admin-sidebar__nav" style={{ padding: '0.5rem', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    {NAV_GROUPS.map((group, idx) => (
                        <div key={idx} style={{ marginBottom: idx !== NAV_GROUPS.length - 1 ? '1rem' : '0' }}>
                            {sidebarOpen && (
                                <div style={{
                                    padding: '0 0.75rem',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    color: '#94a3b8'
                                }}>
                                    {group.title}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {group.items.map(({ label, icon: Icon, to }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className={({ isActive }) =>
                                            `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
                                        }
                                        title={!sidebarOpen ? label : undefined}
                                    >
                                        <Icon size={18} className="admin-nav-item__icon" />
                                        {sidebarOpen && <span className="admin-nav-item__label">{label}</span>}
                                        {sidebarOpen && <ChevronRight size={14} className="admin-nav-item__chevron" />}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <div className="admin-sidebar__user">
                        <div className="admin-sidebar__avatar">{initials}</div>
                        {sidebarOpen && (
                            <div className="admin-sidebar__user-info">
                                <p className="admin-sidebar__user-name">{displayName}</p>
                                <p className="admin-sidebar__user-role">Technical</p>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="admin-sidebar__logout"
                        title="Đăng xuất"
                    >
                        <LogOut size={16} />
                        {sidebarOpen && <span>Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    )
}
