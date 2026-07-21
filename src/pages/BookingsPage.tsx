import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, Car, MapPin, Eye, MessageSquareWarning, MessageSquare, CheckCircle, AlertTriangle, X, XCircle } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { bookingService } from '../services/bookingService'
import type { BookingStatus, WashBooking } from '../types/booking'
import BookingDetailModal from '../components/BookingDetailModal'
import ReportModal from '../components/ReportModal'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  formatScheduledAt,
  getBookingPlate,
  getBookingServiceName,
} from '../utils/bookingStatus'
import { getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

type BookingTab = 'upcoming' | 'completed' | 'compensated' | 'cancelled'

const TAB_CONFIG: { id: BookingTab; label: string; statuses: BookingStatus[] }[] = [
  {
    id: 'upcoming',
    label: 'Đang xử lý',
    statuses: ['pending', 'confirmed', 'arrived', 'checked_in', 'in_progress', 'washed'],
  },
  { id: 'completed', label: 'Hoàn thành', statuses: ['completed'] },
  { id: 'compensated', label: 'Đã đền bù', statuses: ['compensated'] },
  { id: 'cancelled', label: 'Đã hủy', statuses: ['cancelled'] },
]

function bookingId(b: WashBooking): string {
  return b._id ?? b.id ?? ''
}

function matchesTab(booking: WashBooking, tab: BookingTab): boolean {
  const config = TAB_CONFIG.find((t) => t.id === tab)
  return config?.statuses.includes(booking.booking_status) ?? false
}

export default function BookingsPage() {
  const [searchParams] = useSearchParams()
  const [bookings, setBookings] = useState<WashBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 5

  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
  const [reportModal, setReportModal] = useState<{ isOpen: boolean, appointmentId: string | null }>({ isOpen: false, appointmentId: null })
  const [viewReportModal, setViewReportModal] = useState<{ isOpen: boolean; report: any }>({ isOpen: false, report: null })
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const loadBookings = useCallback(async (currentPage: number) => {
    setLoading(true)
    try {
      const activeTabConfig = TAB_CONFIG.find((t) => t.id === activeTab)
      const statusString = activeTabConfig?.statuses.join(',') || ''

      const res = await bookingService.list({
        page: currentPage,
        limit,
        booking_status: statusString
      })
      setBookings(res.items)
      setTotalPages(Math.ceil((res.total || 0) / limit) || 1)
    } catch (err) {
      setBookings([])
      setTotalPages(1)
      showError(getApiErrorMessage(err, 'Không tải được lịch hẹn'))
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    setPage(1)
    void loadBookings(1)
  }, [activeTab, loadBookings])

  const filteredBookings = bookings

  if (searchParams.get('action') === 'new') {
    return <Navigate to="/bookings/new" replace />
  }

  const handleCancelClick = (booking: WashBooking) => {
    setCancelModal({ isOpen: true, booking })
    setCancelReason('')
  }

  const performCancel = async () => {
    if (!cancelModal.booking) return
    const id = bookingId(cancelModal.booking)
    if (!id) return

    if (!cancelReason.trim()) {
      showError('Vui lòng nhập lý do hủy lịch')
      return
    }

    setIsCancelling(true)
    try {
      await bookingService.cancel(id, cancelReason.trim())
      showSuccess('Đã hủy lịch hẹn')
      setCancelModal({ isOpen: false, booking: null })
      void loadBookings(page)
    } catch (err) {
      showError(getApiErrorMessage(err, 'Hủy lịch thất bại'))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <AccountPageShell
      title="Lịch sử đặt lịch"
      description="Xem lịch rửa xe sắp tới và lịch sử đặt chỗ."
      action={
        <Link
          to="/bookings/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#0c8fa0]"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Đặt lịch mới
        </Link>
      }
    >
      <section className="rounded-xl border border-cyan-500/15 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === tab.id
                ? 'bg-cyan-50 text-[#0ea5b7]'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải lịch hẹn...</p>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-cyan-500/25 bg-cyan-50/30 px-6 py-12 text-center">
              <CalendarDays className="h-12 w-12 text-cyan-500/60" aria-hidden />
              <p className="mt-4 font-medium text-slate-800">
                Chưa có lịch hẹn {TAB_CONFIG.find((t) => t.id === activeTab)?.label.toLowerCase()}
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Đặt lịch rửa xe để theo dõi trạng thái và lịch sử tại đây.
              </p>
              {activeTab === 'upcoming' && (
                <Link
                  to="/bookings/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#0c8fa0]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Đặt lịch mới
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredBookings.map((booking) => {
                const id = bookingId(booking)
                const plate = getBookingPlate(booking)
                const serviceName = getBookingServiceName(booking)
                const canCancel = ['pending', 'confirmed'].includes(booking.booking_status)

                const formatBranchAddress = (branch: any) => {
                  if (!branch || typeof branch === 'string') return null;
                  const addr = branch.branch_address;
                  if (!addr) return null;
                  if (typeof addr === 'string') return addr;
                  const parts = [addr.street, addr.ward, addr.district, addr.city].filter(Boolean);
                  return parts.length > 0 ? parts.join(', ') : null;
                }
                const branchAddressStr = formatBranchAddress(booking.branch_id);

                return (
                  <li
                    key={id || booking.scheduled_at}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-cyan-500/20"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BOOKING_STATUS_STYLES[booking.booking_status]}`}
                          >
                            {BOOKING_STATUS_LABELS[booking.booking_status]}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {formatScheduledAt(booking.scheduled_at)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                          <Car className="h-4 w-4 shrink-0 text-cyan-600" aria-hidden />
                          <span className="font-mono font-medium text-slate-800">{plate}</span>
                          {serviceName && <span>· {serviceName}</span>}
                        </div>
                        {branchAddressStr && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                            <span>{branchAddressStr}</span>
                          </div>
                        )}
                        {(() => {
                          const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
                          const cachedTotal = paidInvoices[booking._id || booking.id!];
                          const displayedTotal = cachedTotal !== undefined
                            ? cachedTotal
                            : ((booking.discount_amount !== undefined)
                              ? (booking.final_price ?? 0)
                              : Math.max(0, (booking.final_price ?? booking.base_price ?? 0) - Math.round((booking.final_price ?? booking.base_price ?? 0) * ((booking.customer?.tier_id?.discount_percentage || 0) / 100))));

                          return (
                            <p className="mt-2 text-sm font-semibold text-[#0ea5b7]">
                              {displayedTotal.toLocaleString('vi-VN')} đ
                            </p>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col gap-2 mt-4 sm:mt-0 sm:items-end shrink-0">
                        <button
                          type="button"
                          onClick={() => setDetailModal(booking)}
                          className="rounded-lg border border-cyan-200 px-3 py-2 text-sm font-medium text-cyan-600 transition hover:bg-cyan-50 flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-4 w-4" /> Chi tiết
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(booking)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 flex items-center justify-center"
                          >
                            Hủy lịch
                          </button>
                        )}
                        {booking.booking_status === 'washed' && !(booking as any).report && (
                          <button
                            type="button"
                            onClick={() => setReportModal({ isOpen: true, appointmentId: bookingId(booking) })}
                            className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-50 flex items-center justify-center gap-1.5"
                          >
                            <MessageSquareWarning className="h-4 w-4" /> Khiếu nại
                          </button>
                        )}
                        {(booking as any).report && (
                          <button
                            type="button"
                            onClick={() => setViewReportModal({ isOpen: true, report: (booking as any).report })}
                            className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="h-4 w-4" /> Xem khiếu nại
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1
                  setPage(newPage)
                  void loadBookings(newPage)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Trang trước
              </button>
              <span className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => {
                  const newPage = page + 1
                  setPage(newPage)
                  void loadBookings(newPage)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Cancel Booking Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Xác nhận hủy lịch</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn hủy lịch hẹn lúc{' '}
                <span className="font-semibold text-slate-700">
                  {cancelModal.booking ? formatScheduledAt(cancelModal.booking.scheduled_at) : ''}
                </span>{' '}
                không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lý do hủy <span className="text-rose-500">*</span>
              </label>
              <textarea
                autoFocus
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-rose-400 focus:ring-1 focus:ring-rose-400 resize-none min-h-[120px] shadow-sm"
                placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy lịch hẹn này..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setCancelModal({ isOpen: false, booking: null })}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
              >
                Trở lại
              </button>
              <button
                type="button"
                onClick={() => void performCancel()}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <BookingDetailModal
        booking={detailModal}
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        hideStaffActions={true}
      />

      <ReportModal
        isOpen={reportModal.isOpen}
        appointmentId={reportModal.appointmentId}
        onClose={() => setReportModal({ isOpen: false, appointmentId: null })}
        onSuccess={() => loadBookings(page)}
      />

      {viewReportModal.isOpen && viewReportModal.report && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-indigo-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Chi tiết khiếu nại của bạn</h3>
              </div>
              <button onClick={() => setViewReportModal({ isOpen: false, report: null })} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tiêu đề</h4>
                <p className="text-slate-800 font-bold">{viewReportModal.report.title}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái xử lý</h4>
                {viewReportModal.report.status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"><XCircle size={14}/> Đã từ chối</span>
                ) : viewReportModal.report.isConfirm ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"><CheckCircle size={14}/> Đã tiếp nhận & Xử lý</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"><AlertTriangle size={14}/> Đang chờ xử lý</span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nội dung chi tiết</h4>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {viewReportModal.report.description}
                </div>
              </div>
              {viewReportModal.report.evidence && viewReportModal.report.evidence.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hình ảnh đính kèm</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {viewReportModal.report.evidence.map((img: string, idx: number) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors">
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Kết quả xử lý Từ chối */}
              {viewReportModal.report.status === 'rejected' && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-rose-200 shadow-sm">
                  <h3 className="text-base font-bold text-rose-700 border-b border-rose-100 pb-2 flex items-center gap-2 mb-4">
                    <XCircle size={18} />
                    Biên bản từ chối khiếu nại
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Lí do từ chối</h4>
                      <p className="text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">{viewReportModal.report.reject_details?.reason || viewReportModal.report.reject_reason || 'Không có lí do'}</p>
                    </div>
                    
                    {(viewReportModal.report.reject_details?.admin_signature || viewReportModal.report.reject_details?.customer_signature) && (
                      <div>
                         <h4 className="text-sm font-semibold text-slate-900 mb-2">Chữ ký xác nhận</h4>
                         <div className="grid grid-cols-2 gap-4">
                           {viewReportModal.report.reject_details.admin_signature && (
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                                <span className="text-xs text-slate-500 font-medium block mb-1">Đại diện cửa hàng</span>
                                <img src={viewReportModal.report.reject_details.admin_signature} alt="Admin signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                              </div>
                           )}
                           {viewReportModal.report.reject_details.customer_signature && (
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                                <span className="text-xs text-slate-500 font-medium block mb-1">Khách hàng</span>
                                <img src={viewReportModal.report.reject_details.customer_signature} alt="Customer signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                              </div>
                           )}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kết quả xử lý Đền bù */}
              {viewReportModal.report.status === 'accepted' && viewReportModal.report.compensation && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
                  <h3 className="text-base font-bold text-emerald-700 border-b border-emerald-100 pb-2 flex items-center gap-2 mb-4">
                    <CheckCircle size={18} />
                    Biên bản cam kết đền bù
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Số tiền đền bù</h4>
                        <p className="text-lg font-bold text-rose-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewReportModal.report.compensation.compensation_amount)}</p>
                      </div>
                      
                      {viewReportModal.report.compensation.transfer_image ? (
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                           <a href={viewReportModal.report.compensation.transfer_image} target="_blank" rel="noreferrer" className="block w-32 h-auto rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors">
                             <img src={viewReportModal.report.compensation.transfer_image} alt="Transfer bill" className="w-full object-cover" />
                           </a>
                        </div>
                      ) : (
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                           <div className="bg-amber-50 text-amber-600 px-3 py-2 rounded-lg border border-amber-200 text-sm">
                             Đang chờ kế toán tải lên bill chuyển khoản...
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                       <h4 className="text-sm font-semibold text-slate-900 mb-2">Chữ ký xác nhận đền bù</h4>
                       <div className="grid grid-cols-2 gap-4">
                         {viewReportModal.report.compensation.admin_signature && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Đại diện cửa hàng</span>
                              <img src={viewReportModal.report.compensation.admin_signature} alt="Admin signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                            </div>
                         )}
                         {viewReportModal.report.compensation.customer_signature && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Khách hàng</span>
                              <img src={viewReportModal.report.compensation.customer_signature} alt="Customer signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                            </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewReportModal({ isOpen: false, report: null })}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountPageShell>
  )
}
