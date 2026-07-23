import React, { useEffect, useState } from 'react'
import { BarChart3, Building2, DollarSign, ShieldAlert, XCircle, RefreshCw } from 'lucide-react'
import { bookingChecklistService, type CompensationSummary } from '../services/bookingChecklistService'
import { useAuth } from '../hooks/useAuth'

interface CompensationDashboardSectionProps {
  selectedBranch?: string
  onSelectBranch?: (branchId: string) => void
}

export default function CompensationDashboardSection({
  selectedBranch = 'all',
  onSelectBranch
}: CompensationDashboardSectionProps) {
  const { user } = useAuth()
  const [compensationSummary, setCompensationSummary] = useState<CompensationSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  const fetchCompensationSummary = async (branchId?: string) => {
    setLoadingSummary(true)
    try {
      const summary = await bookingChecklistService.getCompensationSummary({
        branchId: user?.role === 'boss' ? (branchId === 'all' ? undefined : branchId) : undefined
      })
      setCompensationSummary(summary)
    } catch (err) {
      console.error('Failed to load compensation summary', err)
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => {
    fetchCompensationSummary(selectedBranch)
  }, [selectedBranch, user?.role])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Dashboard Thống kê Đền bù</h2>
            <p className="text-xs text-slate-500">Tổng hợp ngân sách đền bù giải quyết khiếu nại khách hàng</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCompensationSummary(selectedBranch)}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
            title="Làm mới thống kê"
          >
            <RefreshCw size={16} className={loadingSummary ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1: Tổng tiền đền bù */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              <DollarSign size={16} /> Tổng số tiền đền bù
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-semibold border border-cyan-400/30">
              {user?.role === 'boss' ? (selectedBranch === 'all' ? 'Toàn hệ thống' : 'Chi nhánh đã chọn') : 'Chi nhánh của bạn'}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {(compensationSummary?.totalCompensationAmount || 0).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-cyan-300">VNĐ</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Tổng kinh phí bồi thường cho các sự cố đã chấp nhận</p>
          </div>
        </div>

        {/* Stat Card 2: Số ca khiếu nại đền bù */}
        <div className="bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl p-4 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-100 flex items-center gap-1.5">
              <ShieldAlert size={16} /> Số ca đền bù
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold border border-white/30">
              Đã hoàn tất
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {compensationSummary?.totalCases || 0} <span className="text-sm font-semibold text-indigo-100">ca giải quyết</span>
            </div>
            <p className="text-[11px] text-indigo-100 mt-1">Biên bản cam kết bồi thường đã tạo & bàn giao</p>
          </div>
        </div>

        {/* Stat Card 3: Số ca từ chối */}
        <div className="bg-gradient-to-br from-rose-500 to-amber-600 rounded-xl p-4 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-rose-100 flex items-center gap-1.5">
              <XCircle size={16} /> Số ca từ chối
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold border border-white/30">
              Đã từ chối
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {compensationSummary?.rejectedCases || 0} <span className="text-sm font-semibold text-rose-100">ca từ chối</span>
            </div>
            <p className="text-[11px] text-rose-100 mt-1">Các đơn khiếu nại không hợp lệ hoặc bị hủy bỏ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
