import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Wrench,
  Tag,
  BarChart3,
  Award,
  Layers,
  Package,
  History,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logo2 from '../../assets/logo2.png'

const NAV_GROUPS = [
  {
    title: 'Lịch hẹn & Doanh thu',
    items: [
      {
        label: 'Tổng quan',
        icon: LayoutDashboard,
        to: '/admin/dashboard',
      },
      {
        label: 'Lịch hẹn',
        icon: CalendarCheck,
        to: '/admin/bookings',
      },
      {
        label: 'Lịch sử lịch hẹn',
        icon: History,
        to: '/admin/booking-history',
      },
      {
        label: 'Lịch sử giao dịch',
        icon: Wallet,
        to: '/admin/reports',
      },
    ]
  },
  {
    title: 'Nội bộ',
    items: [
      {
        label: 'Khách hàng',
        icon: Users,
        to: '/admin/customers',
      },
      {
        label: 'Nhân viên',
        icon: Users,
        to: '/admin/staffs',
      },
      {
        label: 'Nhóm dịch vụ',
        icon: Layers,
        to: '/admin/service-groups',
      },
      {
        label: 'Dịch vụ lẻ',
        icon: Wrench,
        to: '/admin/services',
      },
      {
        label: 'Gói dịch vụ (Combo)',
        icon: Package,
        to: '/admin/service-packages',
      },
      {
        label: 'Cấp bậc',
        icon: Award,
        to: '/admin/tiers',
      },
      {
        label: 'Cài đặt',
        icon: Settings,
        to: '/admin/settings',
      },
    ]
  }
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const displayName = user?.full_name || user?.email || 'Admin'
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : 'admin-sidebar--collapsed'}`}>
        {/* Brand */}
        <div className="admin-sidebar__brand">
          <Link to="/admin/dashboard" className="admin-sidebar__logo-link">
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

        {/* Admin Badge */}
        {sidebarOpen && (
          <div className="admin-sidebar__badge">
            <span className="admin-sidebar__badge-dot" />
            Quản trị viên
          </div>
        )}

        {/* Nav */}
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

        {/* User footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{initials}</div>
            {sidebarOpen && (
              <div className="admin-sidebar__user-info">
                <p className="admin-sidebar__user-name">{displayName}</p>
                <p className="admin-sidebar__user-role">Administrator</p>
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

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
