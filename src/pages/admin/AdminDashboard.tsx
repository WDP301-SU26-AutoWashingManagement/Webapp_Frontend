import { useEffect, useState } from 'react'
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import apiClient from '../../services/apiClient'
import { showError } from '../../utils/toast'

interface DashboardStats {
  totalCustomers: number
  totalBookings: number
  dailyProfit: { date: string; profit: number }[]
  topServices: { serviceName: string; count: number }[]
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; label: string }
  color: 'cyan' | 'emerald' | 'violet' | 'amber'
}) {
  const colorMap = {
    cyan: { bg: '#e0f9fc', icon: '#0ea5b7', badge: '#cff7fc' },
    emerald: { bg: '#d1fae5', icon: '#059669', badge: '#a7f3d0' },
    violet: { bg: '#ede9fe', icon: '#7c3aed', badge: '#ddd6fe' },
    amber: { bg: '#fef3c7', icon: '#d97706', badge: '#fde68a' },
  }
  const c = colorMap[color]
  const isPositive = (trend?.value ?? 0) >= 0

  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__header">
        <div className="admin-stat-card__icon-wrap" style={{ background: c.bg }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
        {trend && (
          <span
            className="admin-stat-card__trend"
            style={{ background: isPositive ? '#d1fae5' : '#fee2e2', color: isPositive ? '#059669' : '#dc2626' }}
          >
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="admin-stat-card__value">{value}</p>
      <p className="admin-stat-card__label">{label}</p>
      {trend && <p className="admin-stat-card__trend-label">{trend.label}</p>}
    </div>
  )
}

function MiniBarChart({ data }: { data: { date: string; profit: number }[] }) {
  if (!data.length) return <div className="admin-chart__empty">Chưa có dữ liệu</div>

  const max = Math.max(...data.map((d) => d.profit), 1)
  const last7 = data.slice(-14)

  return (
    <div className="admin-chart">
      <div className="admin-chart__bars">
        {last7.map((d) => {
          const pct = (d.profit / max) * 100
          return (
            <div key={d.date} className="admin-chart__bar-wrap" title={`${d.date}: ${d.profit.toLocaleString('vi-VN')}đ`}>
              <div
                className="admin-chart__bar"
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
              <span className="admin-chart__bar-label">
                {d.date.slice(8)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const fmt = (d: Date) => d.toISOString().slice(0, 10)

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [customersRes, bookingsRes, profitRes, topRes] = await Promise.all([
        apiClient.get<{ data: { totalCustomers: number } }>('/admin/customers/count'),
        apiClient.post<{ data: { totalBookings: number } }>('/admin/bookings/count', {
          startDate: fmt(thirtyDaysAgo),
          endDate: fmt(today),
        }),
        apiClient.post<{ data: { date: string; profit: number }[] }>('/admin/profit', {
          startDate: fmt(thirtyDaysAgo),
          endDate: fmt(today),
        }),
        apiClient.get<{ data: { serviceName: string; count: number }[] }>('/admin/top-services'),
      ])

      const dailyProfit: { date: string; profit: number }[] = Array.isArray(profitRes.data)
        ? profitRes.data
        : (profitRes.data as { data: { date: string; profit: number }[] }).data ?? []

      const topServices: { serviceName: string; count: number }[] = Array.isArray(topRes.data)
        ? topRes.data
        : (topRes.data as { data: { serviceName: string; count: number }[] }).data ?? []

      setStats({
        totalCustomers:
          (customersRes.data as { data?: { totalCustomers?: number }; totalCustomers?: number })
            ?.data?.totalCustomers ??
          (customersRes.data as { totalCustomers?: number })?.totalCustomers ??
          0,
        totalBookings:
          (bookingsRes.data as { data?: { totalBookings?: number }; totalBookings?: number })
            ?.data?.totalBookings ??
          (bookingsRes.data as { totalBookings?: number })?.totalBookings ??
          0,
        dailyProfit,
        topServices,
      })
    } catch {
      showError('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [])

  const totalRevenue = stats?.dailyProfit.reduce((s, d) => s + d.profit, 0) ?? 0

  return (
    <div className="admin-page">
      {/* Page header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Tổng quan</h1>
          <p className="admin-page__subtitle">
            Dữ liệu 30 ngày gần nhất · {fmt(thirtyDaysAgo)} → {fmt(today)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchStats()}
          className="admin-btn admin-btn--ghost"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <RefreshCw size={28} className="animate-spin text-cyan-500" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="admin-stat-grid">
            <StatCard
              label="Tổng khách hàng"
              value={stats?.totalCustomers.toLocaleString('vi-VN') ?? 0}
              icon={Users}
              color="cyan"
            />
            <StatCard
              label="Đặt lịch (30 ngày)"
              value={stats?.totalBookings.toLocaleString('vi-VN') ?? 0}
              icon={CalendarCheck}
              color="emerald"
            />
            <StatCard
              label="Doanh thu (30 ngày)"
              value={`${totalRevenue.toLocaleString('vi-VN')}đ`}
              icon={TrendingUp}
              color="violet"
            />
            <StatCard
              label="Dịch vụ nổi bật"
              value={stats?.topServices[0]?.serviceName ?? '—'}
              icon={Star}
              color="amber"
            />
          </div>

          {/* Charts row */}
          <div className="admin-content-grid">
            {/* Revenue chart */}
            <div className="admin-card admin-card--lg">
              <div className="admin-card__header">
                <h2 className="admin-card__title">Doanh thu theo ngày</h2>
                <span className="admin-card__badge">14 ngày gần nhất</span>
              </div>
              <MiniBarChart data={stats?.dailyProfit ?? []} />
            </div>

            {/* Top services */}
            <div className="admin-card">
              <div className="admin-card__header">
                <h2 className="admin-card__title">Top dịch vụ</h2>
                <span className="admin-card__badge">30 ngày</span>
              </div>
              {stats?.topServices.length ? (
                <ul className="admin-top-services">
                  {stats.topServices.map((s, i) => (
                    <li key={s.serviceName} className="admin-top-services__item">
                      <span className="admin-top-services__rank">{i + 1}</span>
                      <span className="admin-top-services__name">{s.serviceName}</span>
                      <span className="admin-top-services__count">{s.count} đơn</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-empty-text">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
