import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, Car, MapPin, Eye } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { bookingService } from '../services/bookingService'
import type { BookingStatus, WashBooking } from '../types/booking'
import BookingDetailModal from '../components/BookingDetailModal'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  formatPrice,
  formatScheduledAt,
  getBookingPlate,
  getBookingServiceName,
} from '../utils/bookingStatus'
import { getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

type BookingTab = 'upcoming' | 'completed' | 'cancelled'

const TAB_CONFIG: { id: BookingTab; label: string; statuses: BookingStatus[] }[] = [
  {
    id: 'upcoming',
    label: 'Sắp tới',
    statuses: ['pending', 'confirmed', 'checked_in', 'in_progress'],
  },
  { id: 'completed', label: 'Hoàn thành', statuses: ['completed'] },
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

  const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await bookingService.list({ page: 1, limit: 50 })
      setBookings(items)
    } catch (err) {
      setBookings([])
      showError(getApiErrorMessage(err, 'Không tải được lịch hẹn'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  const filteredBookings = useMemo(
    () => bookings.filter((b) => matchesTab(b, activeTab)),
    [bookings, activeTab],
  )

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
      await loadBookings()
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
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
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
    </AccountPageShell>
  )
}
