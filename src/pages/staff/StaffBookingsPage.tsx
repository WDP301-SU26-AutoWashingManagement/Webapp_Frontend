import { useEffect, useState } from 'react'
import { Check, RefreshCw, Eye, Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import PaymentModal from '../../components/PaymentModal'

// --- Component Trang Quản Lý Booking ---
export default function StaffBookingsPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed' | 'cancelled' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [page, setPage] = useState(1)
  const limit = 10

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'confirm' | 'checkin' | 'start' | '', booking: WashBooking | null }>({
    isOpen: false, action: '', booking: null
  })
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const fetchBookings = async (currentPage: number, currentTab: string, currentFilter: string, range: { startDate: string, endDate: string }) => {
    setLoading(true)
    try {
      let statusParam = '';
      if (currentTab !== 'all') {
        statusParam = currentTab === 'in_progress' ? 'in_progress,washed' : currentTab;
      } else if (currentFilter !== 'all') {
        statusParam = currentFilter;
      }

      const params: any = { page: currentPage, limit };
      if (statusParam) params.booking_status = statusParam;

      if (range.startDate) {
        const start = new Date(range.startDate);
        start.setHours(0, 0, 0, 0);
        params.from_date = start.toISOString();
      }

      if (range.endDate) {
        const end = new Date(range.endDate);
        end.setHours(23, 59, 59, 999);
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

  useEffect(() => { fetchBookings(page, activeTab, statusFilter, dateRange) }, [page, activeTab, statusFilter, dateRange])

  // Xử lý khi xác nhận modal đổi trạng thái
  const handleProceedAction = async () => {
    if (!confirmModal.booking) return
    const id = confirmModal.booking._id || confirmModal.booking.id!
    try {
      if (confirmModal.action === 'confirm') await bookingService.confirm(id)
      if (confirmModal.action === 'checkin') await bookingService.checkin(id)
      if (confirmModal.action === 'start') await bookingService.start(id)
      // Note: complete sẽ được tự động gọi khi thanh toán (PaymentModal)

      showSuccess('Cập nhật trạng thái thành công')
      fetchBookings(page, activeTab, statusFilter, dateRange)
      setConfirmModal({ isOpen: false, action: '', booking: null })
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold">Chờ xác nhận</span>
      case 'confirmed': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Đã xác nhận</span>
      case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
      case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang rửa</span>
      case 'washed': return <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-semibold">Rửa xong</span>
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Hoàn thành</span>
      case 'cancelled': return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">Đã hủy</span>
      default: return status
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

    if (statusFilter !== 'all' && b.booking_status !== statusFilter) {
      return false
    }

    if (activeTab === 'all') return true
    if (activeTab === 'in_progress') return b.booking_status === 'in_progress' || b.booking_status === 'washed'
    if (activeTab === 'cancelled') return b.booking_status === 'cancelled'
    return b.booking_status === activeTab
  })

  const totalPages = Math.ceil((data.total || 0) / limit);

  // Render các nút hành động dựa trên trạng thái
  const renderActions = (b: WashBooking) => {
    if (b.booking_status === 'pending') {
      return <button onClick={() => setConfirmModal({ isOpen: true, action: 'confirm', booking: b })} className="text-xs font-semibold bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition shadow-sm flex items-center gap-1.5"><Check size={14} /> Xác nhận</button>
    }
    return null
  }

  // Tên hành động tiếng Việt cho Modal
  const actionName = {
    'confirm': 'Xác nhận đơn',
    'checkin': 'Đã nhận xe khách',
    'start': 'Bắt đầu làm dịch vụ',
    '': ''
  }[confirmModal.action] || ''

  // Generate page numbers logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header flex justify-between items-end">
        <div>
          <h1 className="admin-page__title">Quản lý booking</h1>
          <p className="admin-page__subtitle">Xác nhận lịch hẹn đã được đặt.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã đơn, biển số xe..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white min-w-[220px]"
            />
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Filter size={16} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="pl-9 pr-8 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="checked_in">Đã nhận xe</option>
              <option value="in_progress">Đang rửa</option>
              <option value="washed">Rửa xong</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white cursor-pointer"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchBookings(page, activeTab, statusFilter, dateRange)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-500' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="admin-card flex flex-col min-h-[500px]">
        <div className="flex gap-3 px-6 pt-4 pb-2 overflow-x-auto">
          {[
            { id: 'pending', label: 'Lịch hẹn Chờ' },
            { id: 'cancelled', label: 'Lịch đã hủy' },
            { id: 'all', label: 'Tất cả' }
          ].map(tab => (
            <button key={tab.id} onClick={() => {
              setActiveTab(tab.id as any)
              setPage(1)
            }} className={`font-medium text-sm px-4 py-1.5 rounded-full transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-table-wrap flex-1">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Giờ hẹn</th>
                <th>Thông tin xe</th>
                <th>Dịch vụ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-cyan-500 mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty-text py-10">Không có đơn nào trong mục này</td></tr>
              ) : (
                filteredItems.map((b: WashBooking) => {
                  const id = (b._id ?? b.id!).slice(-6).toUpperCase()
                  return (
                    <tr
                      key={b._id || b.id}
                      className="admin-table__row group hover:bg-slate-50"
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
                        <div className="flex justify-end gap-2 items-center">
                          {renderActions(b)}
                          <button
                            onClick={() => setDetailModal(b)}
                            className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 mr-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === 'number' && setPage(p)}
                  disabled={p === '...'}
                  className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : p === '...'
                      ? 'text-slate-400 cursor-default'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 ml-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN CHUYỂN TRẠNG THÁI --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Chuyển trạng thái</h2>
            <p className="text-slate-600 mb-6 text-sm">Bạn có chắc chắn muốn chuyển đơn <span className="font-bold">#{confirmModal.booking?._id?.slice(-6).toUpperCase()}</span> sang trạng thái: <strong className="text-blue-600">{actionName}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, action: '', booking: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
              <button onClick={handleProceedAction} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1">
                <Check size={16} /> Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL THANH TOÁN --- */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, booking: null })}
        booking={paymentModal.booking!}
        onSuccess={() => {
          setPaymentModal({ isOpen: false, booking: null })
          fetchBookings(page, activeTab, statusFilter, dateRange)
        }}
      />

      <BookingDetailModal
        booking={detailModal}
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        onPay={(b) => setPaymentModal({ isOpen: true, booking: b })}
      />

    </div>
  )
}
