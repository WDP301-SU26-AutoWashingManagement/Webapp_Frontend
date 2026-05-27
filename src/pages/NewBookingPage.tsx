import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { AUTH_INPUT_CLASS } from '../components/auth/authUi'
import { bookingService } from '../services/bookingService'
import { promotionService } from '../services/promotionService'
import { servicePackageService } from '../services/servicePackageService'
import { vehicleService } from '../services/vehicleService'
import type { ServicePackage } from '../types/servicePackage'
import type { Promotion } from '../types/promotion'
import { getVehicleTypeLabel, type Vehicle } from '../types/vehicle'
import { formatPrice } from '../utils/bookingStatus'
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
import { showError, showSuccess } from '../utils/toast'

const BOOKING_WINDOW_DAYS = DEFAULT_BOOKING_WINDOW_DAYS

export default function NewBookingPage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([])
  const [loadingFormOptions, setLoadingFormOptions] = useState(true)
  const formOptionsLoaded = useRef(false)
  const [form, setForm] = useState({
    vehicle_id: '',
    service_package_id: '',
    scheduled_at: '',
    promotion_code: '',
  })
  const [validatedPromotion, setValidatedPromotion] = useState<Promotion | null>(null)
  const [validatingPromotion, setValidatingPromotion] = useState(false)

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
    void loadFormOptions(true)
  }, [loadFormOptions])

  const scheduleBounds = useMemo(
    () => ({
      min: toDatetimeLocalValue(getEarliestBookableTime()),
      max: toDatetimeLocalValue(getLatestBookableTime(BOOKING_WINDOW_DAYS)),
    }),
    [],
  )

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => (v._id ?? v.id) === form.vehicle_id),
    [vehicles, form.vehicle_id],
  )

  const compatiblePackages = useMemo(() => {
    if (!selectedVehicle) return servicePackages
    return servicePackages.filter(
      (pkg) => pkg.vehicle_type === selectedVehicle.vehicle_type,
    )
  }, [servicePackages, selectedVehicle])

  const selectedPackage = useMemo(
    () =>
      compatiblePackages.find(
        (pkg) => (pkg._id ?? pkg.id) === form.service_package_id,
      ),
    [compatiblePackages, form.service_package_id],
  )

  const priceEstimate = useMemo(() => {
    if (!selectedPackage) return null
    return estimateBookingPrice(selectedPackage.service_price, validatedPromotion)
  }, [selectedPackage, validatedPromotion])

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
      navigate('/bookings')
    } catch (err) {
      showError(getApiErrorMessage(err, 'Đặt lịch thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountPageShell
      title="Đặt lịch rửa xe"
      description="Chọn phương tiện, gói dịch vụ và thời gian hẹn phù hợp."
    >
      <section className="rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Phương tiện *</span>
            <select
              required
              value={form.vehicle_id}
              onChange={(e) => {
                const vehicle_id = e.target.value
                setForm((p) => {
                  const vehicle = vehicles.find((v) => (v._id ?? v.id) === vehicle_id)
                  const next = { ...p, vehicle_id }
                  if (vehicle && p.service_package_id) {
                    const pkg = servicePackages.find(
                      (item) => (item._id ?? item.id) === p.service_package_id,
                    )
                    if (pkg && pkg.vehicle_type !== vehicle.vehicle_type) {
                      next.service_package_id = ''
                    }
                  }
                  return next
                })
              }}
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
              disabled={saving || loadingFormOptions || !form.vehicle_id}
            >
              <option value="">
                {loadingFormOptions
                  ? 'Đang tải gói dịch vụ...'
                  : !form.vehicle_id
                    ? '— Chọn phương tiện trước —'
                    : '— Chọn gói dịch vụ —'}
              </option>
              {compatiblePackages.map((pkg) => {
                const id = pkg._id ?? pkg.id ?? ''
                return (
                  <option key={id || pkg.service_name} value={id}>
                    {pkg.service_name} — {formatPrice(pkg.service_price)} (
                    {pkg.duration_minutes} phút · {getVehicleTypeLabel(pkg.vehicle_type)})
                  </option>
                )
              })}
            </select>
            {form.vehicle_id && compatiblePackages.length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                Chưa có gói dịch vụ cho loại xe{' '}
                {selectedVehicle ? getVehicleTypeLabel(selectedVehicle.vehicle_type) : ''}.
              </span>
            )}
            {servicePackages.length === 0 && !loadingFormOptions && (
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

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0ea5b7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:opacity-50"
            >
              {saving ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
            </button>
            <Link
              to="/bookings"
              className="rounded-lg border border-cyan-500/30 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
            >
              Hủy
            </Link>
          </div>
        </form>
      </section>
    </AccountPageShell>
  )
}
