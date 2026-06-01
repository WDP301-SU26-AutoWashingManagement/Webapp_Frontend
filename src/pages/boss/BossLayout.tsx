import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import logo2 from '../../assets/logo2.png'

const NAV_ITEMS = [
  {
    label: 'Tổng quan',
    icon: LayoutDashboard,
    to: '/boss/dashboard',
  },
  {
    label: 'Tài khoản nội bộ',
    icon: Users,
    to: '/boss/accounts',
  },
  {
    label: 'Cài đặt',
    icon: Settings,
    to: '/boss/settings',
  },
]

export default function BossLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const displayName = user?.full_name || user?.email || 'Boss'
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
          <Link to="/boss/dashboard" className="admin-sidebar__logo-link">
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

        {/* Boss Badge */}
        {sidebarOpen && (
          <div className="admin-sidebar__badge" style={{ background: '#5d3fd3' }}>
            <span className="admin-sidebar__badge-dot" style={{ background: '#fff' }} />
            Super Boss
          </div>
        )}

        {/* Nav */}
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
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
        </nav>

        {/* User footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{initials}</div>
            {sidebarOpen && (
              <div className="admin-sidebar__user-info">
                <p className="admin-sidebar__user-name">{displayName}</p>
                <p className="admin-sidebar__user-role">Boss</p>
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
