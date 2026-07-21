import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    CalendarCheck,
    CheckSquare,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    CalendarOff,
    CalendarDays,
    Users,
    PlayCircle,
    UserCog,
    CircleEllipsis,
    MessageSquare
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logo2 from '../../assets/logo2.png'

const NAV_GROUPS = [
    {
        title: 'Lịch hẹn & Doanh thu',
        items: [
            {
                label: 'Tổng quan Doanh thu',
                icon: LayoutDashboard,
                to: '/staff/revenue',
            },
            {
                label: 'Hệ thống Auto-Cron',
                icon: LayoutDashboard,
                to: '/staff/dashboard',
            },
            {
                label: 'Lịch hẹn',
                icon: CalendarCheck,
                to: '/staff/bookings',
            },
            {
                label: 'Quản lý thanh toán',
                icon: CreditCard,
                to: '/staff/payments',
            },
            {
                label: 'Lịch sử giao dịch',
                icon: CreditCard,
                to: '/staff/transaction-history',
            },
            {
                label: 'Tình trạng rửa xe',
                icon: CircleEllipsis,
                to: '/staff/washing-status',
            },
            {
                label: 'Khiếu nại / Báo cáo',
                icon: MessageSquare,
                to: '/staff/reports',
            },
        ]
    },
    {
        title: 'Nội bộ',
        items: [
            {
                label: 'Khách hàng',
                icon: Users,
                to: '/staff/customers',
            },
            {
                label: 'Lịch làm việc',
                icon: CalendarDays,
                to: '/staff/schedules',
            },
            {
                label: 'Nghỉ phép',
                icon: CalendarOff,
                to: '/staff/leave-requests',
            },
            {
                label: 'Nhân viên kỹ thuật',
                icon: UserCog,
                to: '/staff/list',
            },
            {
                label: 'Cài đặt',
                icon: Settings,
                to: '/staff/settings',
            },
        ]
    }
]

export default function StaffLayout() {
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

    const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager'
    const isAdminOrBoss = user?.role === 'admin' || user?.role === 'boss'

    // Lọc menu tuỳ theo role
    const visibleNavGroups = NAV_GROUPS.map(group => {
        return {
            ...group,
            items: group.items.filter(item => {
                // Giấu Hệ thống Auto-Cron, Doanh thu đối với Manager và Technical
                if (!isAdminOrBoss && (item.to === '/staff/dashboard' || item.to === '/staff/revenue')) return false
                // Giấu Lịch sử giao dịch và Khiếu nại đối với Technical (Chỉ Manager được xem)
                if (!isManager && (item.to === '/staff/transaction-history' || item.to === '/staff/reports')) return false
                return true
            })
        }
    }).filter(group => group.items.length > 0)

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--collapsed'}`}>
                <div className="admin-sidebar__brand">
                    <Link to={isAdminOrBoss ? "/staff/dashboard" : "/staff/bookings"} className="admin-sidebar__logo-link">
                        <img src={logo2} alt="HybridWash" className="admin-sidebar__logo-img" />
                        {sidebarOpen && (
                            <span className="admin-sidebar__logo-text">
                                Hybrid<span className="admin-sidebar__logo-accent">Wash</span>
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
                    <div className="admin-sidebar__badge" style={{ background: '#14b8a6' }}>
                        <span className="admin-sidebar__badge-dot" style={{ background: '#fff' }} />
                        Nhân viên
                    </div>
                )}

                <nav className="admin-sidebar__nav" style={{ padding: '0.5rem', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    {visibleNavGroups.map((group, idx) => (
                        <div key={idx} style={{ marginBottom: idx !== visibleNavGroups.length - 1 ? '1rem' : '0' }}>
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
                        <div className="admin-sidebar__avatar overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        {sidebarOpen && (
                            <div className="admin-sidebar__user-info">
                                <p className="admin-sidebar__user-name">{displayName}</p>
                                <p className="admin-sidebar__user-role">
                                    {user?.staff_type === 'manager' ? ' Manager' : user?.staff_type === 'technical' ? 'Technical' : 'Staff'}
                                </p>
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
