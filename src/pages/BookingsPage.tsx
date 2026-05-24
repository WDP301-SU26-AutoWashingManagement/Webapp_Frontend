import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarPlus, CalendarDays, Car } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { AUTH_INPUT_CLASS } from '../components/auth/authUi'
import { bookingService } from '../services/bookingService'
import { promotionService } from '../services/promotionService'
import { servicePackageService } from '../services/servicePackageService'
import { vehicleService } from '../services/vehicleService'
import type { ServicePackage } from '../types/servicePackage'
import type { BookingStatus, WashBooking } from '../types/booking'
import type { Promotion } from '../types/promotion'
import type { Vehicle } from '../types/vehicle'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  formatPrice,
  formatScheduledAt,
  getBookingPlate,
  getBookingServiceName,
} from '../utils/bookingStatus'
import {
  DEFAULT_BOOKING_WINDOW_DAYS,
  getEarliestBookableTime,
  getLatestBookableTime,
  getScheduleFieldHints,
  parseDatetimeLocalValue,
  SLOT_DURATION_MINUTES,
  snapDatetimeLocalValue,
  toDatetimeLocalValue,
  validateScheduledAt,
} from '../utils/bookingSchedule'
import {
  estimateBookingPrice,
  formatPromotionLabel,
} from '../utils/promotionPricing'
import { getApiErrorMessage } from '../utils/errors'
import { showError, showInfo, showSuccess } from '../utils/toast'

const BOOKING_WINDOW_DAYS = DEFAULT_BOOKING_WINDOW_DAYS

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [bookings, setBookings] = useState<WashBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming')
  const [showForm, setShowForm] = useState(false)

  // Auto-open form when navigated with ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])
  const [saving, setSaving] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([])
  const [loadingFormOptions, setLoadingFormOptions] = useState(false)
  const formOptionsLoaded = useRef(false)
  const [form, setForm] = useState({
    vehicle_id: '',
    service_package_id: '',
    scheduled_at: '',
    promotion_code: '',
  })
  const [validatedPromotion, setValidatedPromotion] = useState<Promotion | null>(null)
  const [validatingPromotion, setValidatingPromotion] = useState(false)

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

  const loadFormOptions = useCallback(async (force = false) => {
    if (formOptionsLoaded.current && !force) return

    setLoadingFormOptions(true)
    try {
      const [vehicleList, packages] = await Promise.all([
        vehicleService.list(),
        servicePackageService.listActive(),
      ])
      setVehicles(vehicleList)
      setServicePackages(packages)
      formOptionsLoaded.current = true
    } catch (err) {
      setVehicles([])
      setServicePackages([])
      showError(getApiErrorMessage(err, 'Không tải được dữ liệu đặt lịch'))
    } finally {
      setLoadingFormOptions(false)
    }
  }, [])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  useEffect(() => {
    if (!showForm) return
    void loadFormOptions(true)
  }, [showForm, loadFormOptions])

  const filteredBookings = useMemo(
    () => bookings.filter((b) => matchesTab(b, activeTab)),
    [bookings, activeTab],
  )

  const scheduleBounds = useMemo(
    () => ({
      min: toDatetimeLocalValue(getEarliestBookableTime()),
      max: toDatetimeLocalValue(getLatestBookableTime(BOOKING_WINDOW_DAYS)),
    }),
    [showForm],
  )

  const selectedPackage = useMemo(
    () =>
      servicePackages.find(
        (pkg) => (pkg._id ?? pkg.id) === form.service_package_id,
      ),
    [servicePackages, form.service_package_id],
  )

  const priceEstimate = useMemo(() => {
    if (!selectedPackage) return null
    return estimateBookingPrice(selectedPackage.service_price, validatedPromotion)
  }, [selectedPackage, validatedPromotion])

  const resetBookingForm = useCallback(() => {
    setForm({
      vehicle_id: '',
      service_package_id: '',
      scheduled_at: '',
      promotion_code: '',
    })
    setValidatedPromotion(null)
  }, [])

  const handleApplyPromotion = async () => {
    const code = form.promotion_code.trim()
    if (!code) {
      showError('Vui lòng nhập mã khuyến mãi')
      return
    }

    setValidatingPromotion(true)
    try {
      const { promotion, message } = await promotionService.validateCode(code)
      setValidatedPromotion(promotion)
      setForm((prev) => ({
        ...prev,
        promotion_code: promotion.promotion_code,
      }))
      showSuccess(message || 'Mã khuyến mãi hợp lệ')
    } catch (err) {
      setValidatedPromotion(null)
      showError(getApiErrorMessage(err, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'))
    } finally {
      setValidatingPromotion(false)
    }
  }

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.vehicle_id || !form.service_package_id || !form.scheduled_at) {
      showError('Vui lòng chọn phương tiện, gói dịch vụ và thời gian')
      return
    }

    const scheduledAt = parseDatetimeLocalValue(form.scheduled_at)
    if (!scheduledAt) {
      showError('Thời gian hẹn không hợp lệ')
      return
    }

    const timeCheck = validateScheduledAt(scheduledAt, BOOKING_WINDOW_DAYS)
    if (!timeCheck.valid) {
      showError(timeCheck.message ?? 'Thời gian hẹn không hợp lệ')
      return
    }

    setSaving(true)
    try {
      const promotionId = validatedPromotion?._id ?? validatedPromotion?.id
      await bookingService.create({
        vehicle_id: form.vehicle_id,
        service_package_id: form.service_package_id,
        scheduled_at: scheduledAt.toISOString(),
        booking_source: 'web',
        ...(promotionId ? { promotion_id: promotionId } : {}),
      })
      showSuccess('Đặt lịch thành công')
      setShowForm(false)
      formOptionsLoaded.current = false
      resetBookingForm()
      await loadBookings()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Đặt lịch thất bại'))
    } finally {
      setSaving(false)
    }
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
      title="Lịch hẹn"
      description="Xem lịch rửa xe sắp tới và lịch sử đặt chỗ."
      action={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0]"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Đặt lịch mới
        </button>
      }
    >
      {showForm && (
        <section className="rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Đặt lịch rửa xe</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn phương tiện đã đăng ký và gói dịch vụ đang hoạt động.
          </p>
          <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Phương tiện *</span>
              <select
                required
                value={form.vehicle_id}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving || loadingFormOptions}
              >
                <option value="">
                  {loadingFormOptions ? 'Đang tải phương tiện...' : '— Chọn phương tiện —'}
                </option>
                {!loadingFormOptions && vehicles.length === 0 && (
                  <option value="" disabled>
                    Chưa có xe — thêm tại trang Phương tiện
                  </option>
                )}
                {vehicles.map((v) => {
                  const id = v._id ?? v.id ?? ''
                  return (
                    <option key={id || v.plate_number} value={id}>
                      {v.plate_number} — {v.brand} {v.vehicle_model}
                    </option>
                  )
                })}
              </select>
              <Link
                to="/vehicles"
                className="mt-1 inline-block text-xs font-medium text-[#0ea5b7] no-underline hover:underline"
              >
                + Thêm phương tiện mới
              </Link>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Gói dịch vụ *</span>
              <select
                required
                value={form.service_package_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, service_package_id: e.target.value }))
                }
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving || loadingFormOptions}
              >
                <option value="">
                  {loadingFormOptions ? 'Đang tải gói dịch vụ...' : '— Chọn gói dịch vụ —'}
                </option>
                {servicePackages.map((pkg) => {
                  const id = pkg._id ?? pkg.id ?? ''
                  return (
                    <option key={id || pkg.service_name} value={id}>
                      {pkg.service_name} — {formatPrice(pkg.service_price)} (
                      {pkg.duration_minutes} phút)
                    </option>
                  )
                })}
              </select>
              {servicePackages.length === 0 && (
                <span className="mt-1 block text-xs text-amber-700">
                  Chưa có gói dịch vụ khả dụng. Vui lòng thử lại sau.
                </span>
              )}
            </label>

            <div className="block text-sm">
              <span className="font-medium text-slate-700">Mã khuyến mãi</span>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={form.promotion_code}
                  onChange={(e) => {
                    setValidatedPromotion(null)
                    setForm((p) => ({
                      ...p,
                      promotion_code: e.target.value.toUpperCase(),
                    }))
                  }}
                  placeholder="VD: SALE20"
                  className={`${AUTH_INPUT_CLASS} flex-1 uppercase`}
                  disabled={saving || validatingPromotion}
                />
                <button
                  type="button"
                  onClick={() => void handleApplyPromotion()}
                  disabled={saving || validatingPromotion || !form.promotion_code.trim()}
                  className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-[#0ea5b7] transition hover:bg-cyan-100 disabled:opacity-50"
                >
                  {validatingPromotion ? 'Đang kiểm tra...' : 'Áp dụng mã'}
                </button>
              </div>
              {validatedPromotion && (
                <span className="mt-1 block text-xs font-medium text-emerald-700">
                  Đã áp dụng: {formatPromotionLabel(validatedPromotion)}
                </span>
              )}
            </div>

            {priceEstimate && (
              <div className="rounded-lg border border-cyan-500/15 bg-cyan-50/40 px-4 py-3 text-sm">
                <p className="font-medium text-slate-800">Tạm tính</p>
                <div className="mt-2 space-y-1 text-slate-600">
                  <p>Giá gốc: {formatPrice(priceEstimate.basePrice)}</p>
                  {priceEstimate.discount > 0 && (
                    <p>Giảm giá: −{formatPrice(priceEstimate.discount)}</p>
                  )}
                  <p className="font-semibold text-[#0ea5b7]">
                    Thanh toán: {formatPrice(priceEstimate.finalPrice)}
                  </p>
                </div>
              </div>
            )}

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Thời gian hẹn *</span>
              <input
                type="datetime-local"
                required
                value={form.scheduled_at}
                min={scheduleBounds.min}
                max={scheduleBounds.max}
                step={SLOT_DURATION_MINUTES * 60}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    scheduled_at: snapDatetimeLocalValue(e.target.value),
                  }))
                }
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving}
              />
              <span className="mt-1 block text-xs text-slate-500">
                {getScheduleFieldHints(BOOKING_WINDOW_DAYS)}
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#0ea5b7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:opacity-50"
              >
                {saving ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetBookingForm()
                }}
                disabled={saving}
                className="rounded-lg border border-cyan-500/30 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </form>
        </section>
      )}

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
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(true)
                    showInfo('Thêm phương tiện trước khi đặt lịch nếu bạn chưa có xe đăng ký')
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c8fa0]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Đặt lịch mới
                </button>
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
