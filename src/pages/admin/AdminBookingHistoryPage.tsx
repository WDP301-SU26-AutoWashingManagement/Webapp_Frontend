import { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Eye, Search, History } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import { branchService } from '../../services/branchService'
import { useAuth } from '../../hooks/useAuth'

export default function AdminBookingHistoryPage() {
  const { user } = useAuth()
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'washed' | 'completed' | 'cancelled'>('all')
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [showTimePicker, setShowTimePicker] = useState(false)

  const limit = 8

  const fetchBookings = async (currentPage: number, tab: string, fromStr: string, toStr: string, timeStr: string) => {
    setLoading(true)
    try {
      let statusParam = tab === 'all' ? '' : tab;
      if (tab === 'in_progress') {
        statusParam = 'in_progress,washed';
      }

      const params: any = { page: currentPage, limit };
      if (statusParam) params.booking_status = statusParam;

      if (fromStr) {
        const start = new Date(fromStr);
        start.setHours(0, 0, 0, 0);
        params.from_date = start.toISOString();
      }
      if (toStr) {
        const end = new Date(toStr);
        end.setHours(23, 59, 59, 999);
        params.to_date = end.toISOString();
      }

      if (timeStr) {
        params.time_slot = timeStr;
      }

      const res = await bookingService.list(params)
      setData(res)
    } catch (error) {
      showError('Không thể tải lịch sử booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings(page, activeTab, fromDate, toDate, selectedTime)
  }, [page, activeTab, fromDate, toDate, selectedTime])

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold">Chờ xác nhận</span>
      case 'confirmed': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Đã xác nhận</span>
      case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
      case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang rửa</span>
      case 'washed': return <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-semibold">Rửa xong</span>
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Hoàn thành</span>
      case 'cancelled': return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">Đã hủy</span>
      default: return <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded text-xs font-semibold">{status}</span>
    }
  }

  const filteredItems = data.items.filter((b: WashBooking) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const plate = b.vehicle?.plate_number?.toLowerCase() || ''
      const id = (b._id ?? b.id!)?.toLowerCase() || ''
      const shortId = id.slice(-6)
      if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false
    }

    return true
  });

  const totalPages = Math.ceil((data.total || 0) / limit);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    const loadTimeSlots = async () => {
      try {
        const branchesData = await branchService.list();
        const branches = Array.isArray(branchesData) ? branchesData : ((branchesData as any).data || []);
        let minTime = "06:00";
        let maxTime = "22:00";
        
        if (branches && Array.isArray(branches)) {
           let targetBranches = branches;
           if (user?.role !== 'boss' && user?.branch_id) {
             targetBranches = branches.filter((b: any) => b._id === user.branch_id);
           }
           
           let minMin = 24 * 60, maxMin = 0;
           for (const b of targetBranches) {
             if (b.operating_time) {
                const openStr = b.operating_time.default_open || "06:00";
                const closeStr = b.operating_time.default_close || "22:00";
                const [oH, oM] = openStr.split(':').map(Number);
                const [cH, cM] = closeStr.split(':').map(Number);
                const oMins = oH * 60 + oM;
                const cMins = cH * 60 + cM;
                if (oMins < minMin) minMin = oMins;
                if (cMins > maxMin) maxMin = cMins;
             }
           }
           if (minMin !== 24 * 60) minTime = `${Math.floor(minMin/60).toString().padStart(2, '0')}:${(minMin%60).toString().padStart(2, '0')}`;
           if (maxMin !== 0) maxTime = `${Math.floor(maxMin/60).toString().padStart(2, '0')}:${(maxMin%60).toString().padStart(2, '0')}`;
        }
        
        const slots: string[] = [];
        let curMins = parseInt(minTime.split(':')[0]) * 60 + parseInt(minTime.split(':')[1]);
        const endMins = parseInt(maxTime.split(':')[0]) * 60 + parseInt(maxTime.split(':')[1]);
        
        while (curMins < endMins) {
          const h = Math.floor(curMins / 60).toString().padStart(2, '0');
          const m = (curMins % 60).toString().padStart(2, '0');
          slots.push(`${h}:${m}`);
          curMins += 30;
        }
        setTimeSlots(slots);
      } catch (err) {
        // Fallback
        const slots: string[] = [];
        for (let h = 6; h <= 22; h++) {
          slots.push(`${h.toString().padStart(2, '0')}:00`);
          slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        setTimeSlots(slots);
      }
    };
    loadTimeSlots();
  }, [user]);

  return (
    <div className="admin-page animate-in fade-in duration-300">
      <div className="admin-page__header flex flex-col gap-4">
        <div>
          <h1 className="admin-page__title">Lịch sử Lịch hẹn</h1>
          <p className="admin-page__subtitle">Xem lại lịch sử và tra cứu các đơn đặt lịch của chi nhánh.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã đơn, biển số xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white min-w-[220px] transition-colors"
            />
          </div>

          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="checked_in">Đã nhận xe</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="washed">Rửa xong</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <div className="relative">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white flex items-center gap-2 min-w-[140px] justify-between"
            >
              <span className="font-medium">{selectedTime || 'Tất cả khung giờ'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {showTimePicker && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowTimePicker(false)}
                ></div>
                <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-[340px] max-h-[300px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-3 sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Chọn khung giờ</span>
                    {selectedTime && (
                      <button 
                        onClick={() => { setSelectedTime(''); setPage(1); setShowTimePicker(false); }}
                        className="text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded bg-rose-50"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setPage(1);
                          setShowTimePicker(false);
                        }}
                        className={`py-2 px-1 rounded-lg text-[13px] font-semibold border transition-all ${
                          selectedTime === time 
                            ? 'bg-[#0F8A9E] border-[#0F8A9E] text-white shadow-md' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white px-2 py-1 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500 font-medium">Từ</span>
            <input
              type="date"
              max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="text-sm text-slate-700 outline-none bg-transparent"
            />
            <span className="text-xs text-slate-500 font-medium ml-1">Đến</span>
            <input
              type="date"
              max={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
              min={fromDate}
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>

          <button
            onClick={() => fetchBookings(page, activeTab, fromDate, toDate, selectedTime)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium ml-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="admin-card flex flex-col min-h-[500px]">
        <div className="admin-table-wrap flex-1">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Giờ hẹn</th>
                <th>Thông tin xe</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-indigo-500 mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="admin-empty-text py-10">Không tìm thấy lịch hẹn phù hợp</td></tr>
              ) : (
                filteredItems.map((b: WashBooking) => {
                  const id = (b._id ?? b.id!).slice(-6).toUpperCase()
                  return (
                    <tr
                      key={b._id || b.id}
                      className="admin-table__row group hover:bg-slate-50 transition-colors"
                    >
                      <td><div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">#{id}</div></td>
                      <td>
                        <div className="text-sm font-medium text-slate-900">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td>
                        <div className="text-sm font-bold text-slate-700">{b.vehicle?.plate_number || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{b.vehicle?.brand} {b.vehicle?.vehicle_model}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-slate-800">{b.customer?.full_name || 'Khách vãng lai'}</div>
                        <div className="text-xs text-slate-500">{b.customer?.phone_number || ''}</div>
                      </td>
                      <td>
                        <div className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{b.service_package?.name || b.service_package?.service_name || 'Dịch vụ lẻ'}</div>
                      </td>
                      <td><div className="text-sm font-semibold text-rose-500">
                        {(() => {
                          const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
                          const cachedTotal = paidInvoices[b._id || b.id!];
                          const displayedTotal = cachedTotal !== undefined ? cachedTotal : ((b.discount_amount !== undefined) ? (b.final_price ?? 0) : Math.max(0, (b.final_price ?? b.base_price ?? 0) - Math.round((b.final_price ?? b.base_price ?? 0) * ((b.customer?.tier_id?.discount_percentage || 0) / 100))));
                          return displayedTotal.toLocaleString('vi-VN');
                        })()} đ
                      </div></td>
                      <td>{getStatusText(b.booking_status)}</td>
                      <td>
                        <div className="flex justify-end items-center">
                          <button
                            onClick={() => setDetailModal(b)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                          >
                            <Eye size={14} /> Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 mt-auto">
            <div className="text-sm text-slate-500">
              Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng số {data.total} đơn)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof p === 'number' && setPage(p)}
                  disabled={p === '...'}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${p === page
                    ? 'bg-indigo-600 text-white border border-indigo-600'
                    : p === '...'
                      ? 'text-slate-400 cursor-default'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BookingDetailModal
        booking={detailModal}
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
      />
    </div>
  )
}
