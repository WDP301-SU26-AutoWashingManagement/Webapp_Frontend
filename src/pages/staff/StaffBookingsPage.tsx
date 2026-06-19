import { useEffect, useState, useRef } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import PaymentModal from '../../components/PaymentModal'

// --- Component Trang Quản Lý Booking ---
export default function StaffBookingsPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed' | 'all'>('pending')

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'confirm' | 'checkin' | 'start' | '', booking: WashBooking | null }>({
    isOpen: false, action: '', booking: null
  })
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingService.list({ limit: 50 })
      setData(res)
    } catch (error) {
      showError('Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

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
      fetchBookings()
      setConfirmModal({ isOpen: false, action: '', booking: null })
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold">pending</span>
      case 'confirmed': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">confirmed</span>
      case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">checked_in</span>
      case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">in_progress</span>
      case 'washed': return <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-semibold">washed</span>
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">completed</span>
      case 'cancelled': return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">cancelled</span>
      default: return status
    }
  }

  const filteredItems = data.items.filter((b: WashBooking) => {
    if (activeTab === 'all') return true
    if (activeTab === 'in_progress') return b.booking_status === 'in_progress' || b.booking_status === 'washed'
    return b.booking_status === activeTab
  })

  // Render các nút hành động dựa trên trạng thái
  const renderActions = (b: WashBooking) => {
    if (b.booking_status === 'pending') {
      return <button onClick={() => setConfirmModal({ isOpen: true, action: 'confirm', booking: b })} className="text-xs font-semibold bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition">Xác nhận</button>
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

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý booking</h1>
          <p className="admin-page__subtitle">Xử lý toàn bộ luồng từ lúc nhận đơn đến khi thu tiền khách hàng.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="flex gap-6 border-b border-slate-200 px-6 pt-4 overflow-x-auto">
          {[
            { id: 'pending', label: 'pending' },
            { id: 'cancelled', label: 'cancelled' },
            { id: 'all', label: 'all' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`font-medium text-sm pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Giờ hẹn</th>
                <th>Thông tin xe</th>
                <th>Dịch vụ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th className="text-right">Hành động</th>
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
                      onClick={() => setDetailModal(b)}
                      className="admin-table__row group hover:bg-slate-50 cursor-pointer"
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
                        <div className="flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          {renderActions(b)}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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
          fetchBookings()
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
