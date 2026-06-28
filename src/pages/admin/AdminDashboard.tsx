import React, { useEffect, useState } from 'react'
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wallet,
  Activity,
  Award,
  Clock,
  Calendar
} from 'lucide-react'
import apiClient from '../../services/apiClient'
import { showError } from '../../utils/toast'
import { useAuth } from '../../hooks/useAuth'
import { branchService, type Branch } from '../../services/branchService'

interface DashboardStats {
  totalCustomers: number
  totalBookings: number
  dailyProfit: { date: string; profit: number }[]
  topServices: { serviceName: string; count: number }[]
  topServicesRevenue: { serviceName: string; revenue: number }[]
  topIndividualServices: { serviceName: string; count: number }[]
  topIndividualServicesRevenue: { serviceName: string; revenue: number }[]
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
  color: 'blue' | 'emerald' | 'purple' | 'amber'
}) {
  const colorMap = {
    blue: 'from-blue-500 to-cyan-400 bg-blue-100 text-blue-600 border-blue-200',
    emerald: 'from-emerald-500 to-teal-400 bg-emerald-100 text-emerald-600 border-emerald-200',
    purple: 'from-purple-500 to-indigo-400 bg-purple-100 text-purple-600 border-purple-200',
    amber: 'from-amber-500 to-orange-400 bg-amber-100 text-amber-600 border-amber-200',
  }

  const gradientMap = {
    blue: 'from-blue-500/10 to-transparent',
    emerald: 'from-emerald-500/10 to-transparent',
    purple: 'from-purple-500/10 to-transparent',
    amber: 'from-amber-500/10 to-transparent',
  }

  const isPositive = (trend?.value ?? 0) >= 0

  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientMap[color]} rounded-bl-full -z-10 transition-transform group-hover:scale-110`}></div>

      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl border ${colorMap[color].split(' ').slice(2).join(' ')} shadow-sm`}>
          <Icon size={24} className="stroke-[2.5px]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
        {trend && <p className="text-xs text-slate-400 mt-2">{trend.label}</p>}
      </div>
    </div>
  )
}

function MiniBarChart({ data }: { data: { date: string; profit: number }[] }) {
  const itemsPerPage = 14;
  const [page, setPage] = useState(0);

  // Reset page when data changes
  useEffect(() => {
    setPage(0);
  }, [data]);

  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 w-full">
      <Activity size={48} className="opacity-20 mb-3" />
      <p>Chưa có dữ liệu doanh thu</p>
    </div>
  )

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const endIdx = data.length - (page * itemsPerPage);
  const startIdx = Math.max(0, endIdx - itemsPerPage);
  const visibleData = data.slice(startIdx, endIdx);

  const max = Math.max(...visibleData.map((d) => d.profit), 1)

  return (
    <div className="flex flex-col w-full">
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 px-4 mb-2 relative z-20">
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
          >
            &lt; Trước
          </button>
          <button
            disabled={page <= 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
          >
            Sau &gt;
          </button>
        </div>
      )}
      <div className="relative h-72 w-full flex items-end justify-between pt-10 pb-6 px-4">
        {/* Background grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-12 px-4 pointer-events-none">
          {[4, 3, 2, 1, 0].map((line) => (
            <div key={line} className="w-full border-t border-slate-100 flex items-center h-0 relative">
              <span className="absolute -left-2 -top-2.5 text-[10px] text-slate-400 font-medium bg-white px-1">
                {line === 0 ? '0' : `${((max / 4) * line / 1000).toFixed(0)}k`}
              </span>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative z-10 w-full h-full pb-4">
          <div className="flex justify-between items-end h-full w-full pl-8 pr-2">
            {visibleData.map((d, i) => {
              const pct = (d.profit / max) * 100
              const isToday = i === visibleData.length - 1 && page === 0;

              return (
                <div key={d.date} className="relative flex flex-col items-center justify-end group w-full h-full px-1">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-xl transform -translate-x-1/2 left-1/2">
                    <p className="font-bold">{d.profit.toLocaleString('vi-VN')} đ</p>
                    <p className="text-slate-300 text-[10px]">{d.date}</p>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[2.5rem] rounded-t-md transition-all duration-500 ease-out ${isToday ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-300 hover:bg-blue-400'}`}
                    style={{ height: `${Math.max(pct, 1)}%` }}
                  ></div>

                  {/* Label */}
                  <span className={`absolute -bottom-6 text-[10px] font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                    {d.date.slice(5).replace('-', '/')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const fmt = (d: Date) => {
  const t = new Date(d);
  t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  return t.toISOString().slice(0, 10);
}

const getDateDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const isBoss = user?.role === 'boss'

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('all')

  const [dateRange, setDateRange] = useState({
    startDate: fmt(getDateDaysAgo(7)),
    endDate: fmt(new Date())
  })
  const [preset, setPreset] = useState<'7' | '14' | '21' | '30' | 'custom'>('7')
  const [activeTabCount, setActiveTabCount] = useState<'combo' | 'individual'>('combo')
  const [activeTabRevenue, setActiveTabRevenue] = useState<'combo' | 'individual'>('combo')

  const handlePresetChange = (p: '7' | '14' | '21' | '30') => {
    setPreset(p);
    setDateRange({
      startDate: fmt(getDateDaysAgo(parseInt(p))),
      endDate: fmt(new Date())
    });
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const branchQuery = selectedBranch !== 'all' ? `?branch_id=${selectedBranch}` : ''
      const branchBody = selectedBranch !== 'all' ? { branch_id: selectedBranch } : {}

      if (isBoss && branches.length === 0) {
        try {
          const branchesData = await branchService.list()
          const bList = Array.isArray(branchesData) ? branchesData : ((branchesData as any).data || [])
          setBranches(bList)
        } catch (e) {
          console.warn('Could not fetch branches', e)
        }
      }

      const [customersRes, bookingsRes, profitRes, topRes, topRevRes, topIndRes, topIndRevRes] = await Promise.all([
        apiClient.get<{ data: { totalCustomers: number } }>(`/admin/customers/count${branchQuery}`),
        apiClient.post<{ data: { totalBookings: number } }>('/admin/bookings/count', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          ...branchBody
        }),
        apiClient.post<{ data: { date: string; profit: number }[] }>('/admin/profit', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          ...branchBody
        }),
        apiClient.get<{ data: { serviceName: string; count: number }[] }>(`/admin/top-services${branchQuery ? branchQuery + '&' : '?'}startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        apiClient.get<{ data: { serviceName: string; revenue: number }[] }>(`/admin/top-services-revenue${branchQuery ? branchQuery + '&' : '?'}startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        apiClient.get<{ data: { serviceName: string; count: number }[] }>(`/admin/top-individual-services${branchQuery ? branchQuery + '&' : '?'}startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        apiClient.get<{ data: { serviceName: string; revenue: number }[] }>(`/admin/top-individual-services-revenue${branchQuery ? branchQuery + '&' : '?'}startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ])

      const dailyProfit: { date: string; profit: number }[] = Array.isArray(profitRes.data)
        ? profitRes.data
        : (profitRes.data as { data: { date: string; profit: number }[] }).data ?? []

      const topServices: { serviceName: string; count: number }[] = Array.isArray(topRes.data)
        ? topRes.data
        : (topRes.data as { data: { serviceName: string; count: number }[] }).data ?? []

      const topServicesRevenue: { serviceName: string; revenue: number }[] = Array.isArray(topRevRes.data)
        ? topRevRes.data
        : (topRevRes.data as { data: { serviceName: string; revenue: number }[] }).data ?? []

      const topIndividualServices: { serviceName: string; count: number }[] = Array.isArray(topIndRes.data)
        ? topIndRes.data
        : (topIndRes.data as { data: { serviceName: string; count: number }[] }).data ?? []

      const topIndividualServicesRevenue: { serviceName: string; revenue: number }[] = Array.isArray(topIndRevRes.data)
        ? topIndRevRes.data
        : (topIndRevRes.data as { data: { serviceName: string; revenue: number }[] }).data ?? []

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
        topServicesRevenue,
        topIndividualServices,
        topIndividualServicesRevenue
      })
    } catch {
      showError('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [dateRange, selectedBranch])

  const totalRevenue = stats?.dailyProfit.reduce((s, d) => s + d.profit, 0) ?? 0
  const averageRevenue = stats?.dailyProfit.length ? Math.round(totalRevenue / stats?.dailyProfit.length) : 0;
  
  const displayTopServices = activeTabCount === 'combo' ? stats?.topServices : stats?.topIndividualServices;
  const maxServiceCount = displayTopServices?.length ? Math.max(...displayTopServices.map(s => s.count)) : 1;
  
  const displayTopServicesRevenue = activeTabRevenue === 'combo' ? stats?.topServicesRevenue : stats?.topIndividualServicesRevenue;
  const maxServiceRevenue = displayTopServicesRevenue?.length ? Math.max(...displayTopServicesRevenue.map(s => s.revenue)) : 1;

  const getDaysDiff = () => {
    const s = new Date(dateRange.startDate);
    const e = new Date(dateRange.endDate);
    return Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) || 1;
  }

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
      {/* Page header and Date Picker */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Tổng quan Kinh doanh</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Clock size={16} />
            Dữ liệu thống kê từ ngày {new Date(dateRange.startDate).toLocaleDateString('vi-VN')} đến {new Date(dateRange.endDate).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          {isBoss && branches.length > 0 && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1.5 text-sm bg-transparent border-none outline-none text-slate-700 font-semibold focus:ring-0 cursor-pointer"
              >
                <option value="all">Tất cả chi nhánh</option>
                {branches.map(b => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.branch_address?.street ? `${b.branch_address.street}, ${b.branch_address.district}` : (b._id || b.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            {(['7', '14', '21', '30'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${preset === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {p} ngày
              </button>
            ))}
            <button
              onClick={() => setPreset('custom')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${preset === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tùy chỉnh
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => { setPreset('custom'); setDateRange(r => ({ ...r, startDate: e.target.value })) }}
              className="px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => { setPreset('custom'); setDateRange(r => ({ ...r, endDate: e.target.value })) }}
              className="px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => void fetchStats()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium focus:ring-2 focus:ring-blue-200 outline-none ml-auto"
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Đang tổng hợp dữ liệu...</p>
        </div>
      ) : (
        <div className="space-y-8 w-full">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Tổng Doanh thu"
              value={`${totalRevenue.toLocaleString('vi-VN')} đ`}
              icon={Wallet}
              color="blue"
            />
            <StatCard
              label="Khách hàng tích luỹ"
              value={stats?.totalCustomers.toLocaleString('vi-VN') ?? 0}
              icon={Users}
              color="emerald"
            />
            <StatCard
              label={`Lượt Booking (${getDaysDiff()} ngày)`}
              value={stats?.totalBookings.toLocaleString('vi-VN') ?? 0}
              icon={CalendarCheck}
              color="purple"
            />
            <StatCard
              label="Dịch vụ Bán chạy nhất"
              value={stats?.topServices[0]?.serviceName ?? '—'}
              icon={Award}
              color="amber"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Revenue chart */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Biểu đồ Doanh thu</h2>
                  <p className="text-sm text-slate-500 mt-1">{getDaysDiff()} ngày hoạt động gần nhất</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Trung bình ngày</p>
                  <p className="text-lg font-bold text-blue-600">{averageRevenue.toLocaleString('vi-VN')} đ</p>
                </div>
              </div>
              <MiniBarChart data={stats?.dailyProfit ?? []} />
            </div>

            {/* Top services by count */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col w-full relative">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={20} />
                  Top Lượt Đặt
                </h2>
                <div className="flex items-center mt-3 bg-slate-100 rounded-lg p-1">
                  <button 
                    onClick={() => setActiveTabCount('combo')}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${activeTabCount === 'combo' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    COMBO
                  </button>
                  <button 
                    onClick={() => setActiveTabCount('individual')}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${activeTabCount === 'individual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    DỊCH VỤ LẺ
                  </button>
                </div>
              </div>

              <div className="flex-1 pr-2 mt-2">
                {displayTopServices?.length ? (
                  <ul className="space-y-6">
                    {displayTopServices.slice(0, 5).map((s, i) => (
                      <li key={s.serviceName} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                              {i + 1}
                            </span>
                            <span className="line-clamp-1 text-xs" title={s.serviceName}>{s.serviceName}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md shrink-0 ml-1">
                            {s.count}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}
                            style={{ width: `${(s.count / maxServiceCount) * 100}%` }}
                          ></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                    <Activity size={32} className="opacity-20 mb-2" />
                    <p className="text-sm">Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top services by revenue */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col w-full relative">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Top Doanh Thu
                </h2>
                <div className="flex items-center mt-3 bg-slate-100 rounded-lg p-1">
                  <button 
                    onClick={() => setActiveTabRevenue('combo')}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${activeTabRevenue === 'combo' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    COMBO
                  </button>
                  <button 
                    onClick={() => setActiveTabRevenue('individual')}
                    className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${activeTabRevenue === 'individual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    DỊCH VỤ LẺ
                  </button>
                </div>
              </div>

              <div className="flex-1 pr-2 mt-2">
                {displayTopServicesRevenue?.length ? (
                  <ul className="space-y-6">
                    {displayTopServicesRevenue.slice(0, 5).map((s, i) => (
                      <li key={s.serviceName} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-600' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                              {i + 1}
                            </span>
                            <span className="line-clamp-1 text-xs" title={s.serviceName}>{s.serviceName}</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md shrink-0 ml-1">
                            {s.revenue > 1000000 ? `${(s.revenue / 1000000).toFixed(1)}tr` : `${(s.revenue / 1000).toFixed(0)}k`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-emerald-300' : 'bg-blue-400'}`}
                            style={{ width: `${(s.revenue / maxServiceRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
                    <Activity size={32} className="opacity-20 mb-2" />
                    <p className="text-sm">Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
