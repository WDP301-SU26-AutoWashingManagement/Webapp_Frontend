import { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'

export default function AdminBookingsPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'washed' | 'completed' | 'cancelled'>('all')
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const [page, setPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const limit = 10

  const fetchBookings = async (currentPage: number, tab: string, dateStr: string) => {
    setLoading(true)
    try {
      let statusParam = tab === 'all' ? '' : tab;
      if (tab === 'in_progress') {
        // Fetch both in_progress and washed for this tab
        statusParam = 'in_progress,washed';
      }

      const params: any = { page: currentPage, limit };
      if (statusParam) params.booking_status = statusParam;
      if (dateStr) {
        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);
        params.from_date = start.toISOString();
        params.to_date = end.toISOString();
      }

      const res = await bookingService.list(params)
      setData(res)
    } catch (error) {
      showError('Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings(page, activeTab, selectedDate)
  }, [page, activeTab, selectedDate])

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

  // Generate page numbers
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

  return (
    <div className="admin-page animate-in fade-in duration-300">
      <div className="admin-page__header flex justify-between items-end">
        <div>
          <h1 className="admin-page__title">Lịch hẹn khách hàng</h1>
          <p className="admin-page__subtitle">Theo dõi toàn bộ danh sách đặt lịch trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã đơn, biển số xe..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 bg-white min-w-[220px] transition-colors"
            />
          </div>
          
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 bg-white min-w-[150px]"
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

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
          />
          <button
            onClick={() => fetchBookings(page, activeTab, selectedDate)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} />
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
                <tr><td colSpan={8} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-blue-500 mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="admin-empty-text py-10">Không có đơn nào trong mục này</td></tr>
              ) : (
                filteredItems.map((b: WashBooking) => {
                  const id = (b._id ?? b.id!).slice(-6).toUpperCase()
                  return (
                    <tr
                      key={b._id || b.id}
                      className="admin-table__row group hover:bg-slate-50 transition-colors"
                    >
                      <td><div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div></td>
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
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${
                    p === page
                      ? 'bg-blue-600 text-white border border-blue-600'
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
