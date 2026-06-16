import { useEffect, useState, useRef } from 'react'
import { Check, X, CreditCard, Banknote, QrCode, RefreshCw } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import { invoiceService, type Invoice } from '../../services/invoiceService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import { useAuth } from '../../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'

// --- Component Modal Thanh Toán ---
function PaymentModal({
  isOpen, onClose, booking, onSuccess
}: {
  isOpen: boolean; onClose: () => void; booking: WashBooking; onSuccess: () => void;
}) {
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | null>(null)
  const pollingRef = useRef<number | null>(null)

  const createPromiseRef = useRef<Promise<any> | null>(null)

  // Tạo invoice khi mở modal
  useEffect(() => {
    if (isOpen && booking && !invoice) {
      if (!createPromiseRef.current) {
        setLoading(true)
        createPromiseRef.current = invoiceService.createInvoice(booking._id || booking.id!)
          .then(inv => {
            setInvoice(inv)
          })
          .catch(err => {
            if (err.message && err.message.toLowerCase().includes('tồn tại')) {
              showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
            } else {
              showError(err.message || 'Không thể tạo hoá đơn')
            }
            onClose()
          })
          .finally(() => {
            setLoading(false)
          })
      }
    }
    
    if (!isOpen) {
      // Reset ref khi đóng modal để lần sau mở lại có thể tạo (nếu cần)
      createPromiseRef.current = null
      stopPolling()
    }
  }, [isOpen, booking, invoice])

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handleConfirmCash = async () => {
    if (!invoice || !user) return
    setLoading(true)
    try {
      await invoiceService.confirmCash(invoice._id, (user as any).id || (user as any)._id)
      showSuccess('Thanh toán tiền mặt thành công!')
      onSuccess()
      onClose()
    } catch (err: any) {
      showError(err.message || 'Lỗi khi xác nhận tiền mặt')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQR = async () => {
    if (!invoice) return
    setLoading(true)
    try {
      const inv = await invoiceService.createPaymentLink(invoice._id)
      setInvoice(inv)
      setPaymentMode('qr')
      // Start polling
      pollingRef.current = window.setInterval(async () => {
        try {
          const synced = await invoiceService.syncPaymentStatus(invoice._id)
          if (synced.invoice_status === 'paid') {
            stopPolling()
            showSuccess('Khách đã chuyển khoản thành công!')
            onSuccess()
            onClose()
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000)
    } catch (err: any) {
      showError(err.message || 'Lỗi khi tạo mã QR PayOS')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelQR = async () => {
    if (!invoice) return
    stopPolling()
    setLoading(true)
    try {
      const inv = await invoiceService.cancelPaymentLink(invoice._id, 'Khách đổi phương thức')
      setInvoice(inv)
      setPaymentMode(null)
    } catch (err: any) {
      showError(err.message || 'Lỗi khi huỷ QR')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard size={22} className="text-blue-500" /> Thanh toán
        </h2>

        {loading && !invoice ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : invoice ? (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-700">{booking.vehicle?.plate_number}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Dịch vụ:</span>
                <span className="font-semibold text-slate-700">{booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ'}</span>
              </div>
              <div className="border-t border-slate-200 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-rose-500">{invoice.total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Chế độ chọn phương thức */}
            {!paymentMode && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleConfirmCash}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-slate-600 hover:text-emerald-600 font-semibold disabled:opacity-50"
                >
                  <Banknote size={28} />
                  <span>Tiền mặt</span>
                </button>
                <button 
                  onClick={handleCreateQR}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600 font-semibold disabled:opacity-50"
                >
                  <QrCode size={28} />
                  <span>Quét mã QR</span>
                </button>
              </div>
            )}

            {/* Chế độ đang quét QR */}
            {paymentMode === 'qr' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-slate-500 mb-3 text-center">Khách hàng quét mã QR dưới đây qua ứng dụng ngân hàng</p>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4">
                  {invoice.qr_code && invoice.qr_code.startsWith('data:image') ? (
                    <img src={invoice.qr_code} alt="QR Code" className="w-48 h-48" />
                  ) : invoice.qr_code ? (
                    <QRCodeSVG value={invoice.qr_code} size={192} />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">Đang tải QR...</div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-5">
                  <RefreshCw size={14} className="animate-spin" /> Đang chờ thanh toán...
                </div>
                <div className="flex gap-3 mt-2">
                  {invoice.checkout_url && (
                    <button 
                      onClick={() => window.open(invoice.checkout_url, '_blank')}
                      className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Mở link PayOS (Để Test)
                    </button>
                  )}
                  <button 
                    onClick={handleCancelQR}
                    className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Huỷ mã QR
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// --- Component Trang Quản Lý Booking ---
export default function StaffBookingsPage() {
  const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed' | 'all'>('pending')
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: string, booking: WashBooking | null}>({isOpen: false, action: '', booking: null})
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, booking: WashBooking | null}>({isOpen: false, booking: null})

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
      setConfirmModal({isOpen: false, action: '', booking: null})
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold">Chờ xác nhận</span>
      case 'confirmed': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">Đã xác nhận</span>
      case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
      case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang thực hiện</span>
      case 'completed': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold">Hoàn thành</span>
      case 'cancelled': return <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold">Đã hủy</span>
      default: return status
    }
  }

  const filteredItems = data.items.filter((b: WashBooking) => {
    if (activeTab === 'all') return true
    if (activeTab === 'in_progress') return ['confirmed', 'checked_in', 'in_progress'].includes(b.booking_status)
    return b.booking_status === activeTab
  })

  // Render các nút hành động dựa trên trạng thái
  const renderActions = (b: WashBooking) => {
    if (b.booking_status === 'pending') {
      return <button onClick={() => setConfirmModal({isOpen: true, action: 'confirm', booking: b})} className="text-xs font-semibold bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition">Xác nhận</button>
    }
    if (b.booking_status === 'confirmed') {
      return <button onClick={() => setConfirmModal({isOpen: true, action: 'checkin', booking: b})} className="text-xs font-semibold bg-indigo-500 text-white px-3 py-1.5 rounded hover:bg-indigo-600 transition">Nhận xe</button>
    }
    if (b.booking_status === 'checked_in') {
      return <button onClick={() => setConfirmModal({isOpen: true, action: 'start', booking: b})} className="text-xs font-semibold bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600 transition">Bắt đầu rửa</button>
    }
    if (b.booking_status === 'in_progress') {
      return <button onClick={() => setPaymentModal({isOpen: true, booking: b})} className="text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded hover:bg-emerald-600 transition flex items-center gap-1"><Banknote size={14}/> Thanh toán</button>
    }
    if (b.booking_status === 'completed') {
      return <span className="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Đã thanh toán</span>
    }
    return null
  }

  // Tên hành động tiếng Việt cho Modal
  const actionName = {
    'confirm': 'Xác nhận đơn',
    'checkin': 'Đã nhận xe khách',
    'start': 'Bắt đầu làm dịch vụ'
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
            { id: 'pending', label: 'Chờ xác nhận' },
            { id: 'in_progress', label: 'Đang xử lý' },
            { id: 'completed', label: 'Đã thanh toán' },
            { id: 'all', label: 'Tất cả' }
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
                    <tr key={b._id || b.id} className="admin-table__row group hover:bg-slate-50">
                      <td><div className="text-sm font-bold text-slate-700">#{id}</div></td>
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
                      <td><div className="text-sm font-semibold text-rose-500">{b.final_price?.toLocaleString('vi-VN')} đ</div></td>
                      <td>{getStatusText(b.booking_status)}</td>
                      <td>
                        <div className="flex justify-end gap-2 items-center">
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
              <button onClick={() => setConfirmModal({isOpen: false, action: '', booking: null})} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
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
        onClose={() => setPaymentModal({isOpen: false, booking: null})} 
        booking={paymentModal.booking!} 
        onSuccess={() => fetchBookings()} 
      />

    </div>
  )
}
