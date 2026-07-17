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
  Building,
  Tag,
  Wallet
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
        to: '/boss/dashboard',
      },
      {
        label: 'Lịch sử giao dịch',
        icon: Wallet,
        to: '/boss/transaction-history',
      },
    ]
  },
  {
    title: 'Tài khoản',
    items: [
      {
        label: 'Khách hàng',
        icon: Users,
        to: '/boss/customers',
      },
      {
        label: 'Tài khoản nội bộ',
        icon: Users,
        to: '/boss/accounts',
      },
      {
        label: 'Danh sách nhân viên',
        icon: Users,
        to: '/boss/staffs',
      },
    ]
  },
  {
    title: 'Cửa hàng',
    items: [
      {
        label: 'Quản lý Chi nhánh',
        icon: Building,
        to: '/boss/branches',
      },
      {
        label: 'Khuyến mãi',
        icon: Tag,
        to: '/boss/promotions',
      },
    ]
  },
  {
    title: 'Hồ sơ',
    items: [
      {
        label: 'Cài đặt',
        icon: Settings,
        to: '/boss/settings',
      },
    ]
  }
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

        {/* Boss Badge */}
        {sidebarOpen && (
          <div className="admin-sidebar__badge" style={{ background: '#5d3fd3' }}>
            <span className="admin-sidebar__badge-dot" style={{ background: '#fff' }} />
            Super Boss
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
