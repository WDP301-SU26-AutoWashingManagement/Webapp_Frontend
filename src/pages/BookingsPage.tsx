import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus, Car } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { bookingService } from '../services/bookingService'
import type { BookingStatus, WashBooking } from '../types/booking'
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
    label: 'upcoming',
    statuses: ['pending', 'confirmed', 'checked_in', 'in_progress'],
  },
  { id: 'completed', label: 'completed', statuses: ['completed'] },
  { id: 'cancelled', label: 'cancelled', statuses: ['cancelled'] },
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

  const handleCancel = async (booking: WashBooking) => {
    const id = bookingId(booking)
    if (!id) return
    const reason = window.prompt('Lý do hủy lịch hẹn:')
    if (!reason?.trim()) return

    try {
      await bookingService.cancel(id, reason.trim())
      showSuccess('Đã hủy lịch hẹn')
      await loadBookings()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Hủy lịch thất bại'))
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
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
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
                        {booking.final_price != null && (
                          <p className="mt-2 text-sm font-semibold text-[#0ea5b7]">
                            {formatPrice(booking.final_price)}
                          </p>
                        )}
                      </div>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => void handleCancel(booking)}
                          className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </AccountPageShell>
  )
}
