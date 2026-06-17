import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'

export default function AdminBookingsPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingService.list({ limit: 100 })
      setData(res)
    } catch (error) {
      showError('Không thể tải danh sách booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold">Chờ xác nhận</span>
      case 'confirmed': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Đã xác nhận</span>
      case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
      case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang thực hiện</span>
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Hoàn thành</span>
      case 'cancelled': return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">Đã hủy</span>
      default: return <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded text-xs font-semibold">{status}</span>
    }
  }

  const filteredItems = data.items.filter((b: WashBooking) => {
    if (activeTab === 'all') return true
    return b.booking_status === activeTab
  })

  return (
    <div className="admin-page animate-in fade-in duration-300">
      <div className="admin-page__header flex justify-between items-end">
        <div>
          <h1 className="admin-page__title">Lịch hẹn khách hàng</h1>
          <p className="admin-page__subtitle">Theo dõi toàn bộ danh sách đặt lịch trên hệ thống.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} />
          Làm mới
        </button>
      </div>

      <div className="admin-card">
        <div className="flex gap-6 border-b border-slate-200 px-6 pt-4 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ xác nhận' },
            { id: 'confirmed', label: 'Đã xác nhận' },
            { id: 'checked_in', label: 'Đã nhận xe' },
            { id: 'in_progress', label: 'Đang thực hiện' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`font-medium text-sm pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-blue-500 mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty-text py-10">Không có đơn nào trong mục này</td></tr>
              ) : (
                filteredItems.map((b: WashBooking) => {
                  const id = (b._id ?? b.id!).slice(-6).toUpperCase()
                  return (
                    <tr 
                      key={b._id || b.id} 
                      onClick={() => setDetailModal(b)}
                      className="admin-table__row group hover:bg-slate-50 transition-colors cursor-pointer"
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
                      <td><div className="text-sm font-semibold text-rose-500">{b.final_price?.toLocaleString('vi-VN')} đ</div></td>
                      <td>{getStatusText(b.booking_status)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BookingDetailModal 
        booking={detailModal} 
        isOpen={!!detailModal} 
        onClose={() => setDetailModal(null)} 
      />
    </div>
  )
}
