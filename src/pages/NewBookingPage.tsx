/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AccountPageShell from '../components/account/AccountPageShell'
import { AUTH_INPUT_CLASS } from '../components/auth/authUi'
import { bookingService } from '../services/bookingService'
import { promotionService } from '../services/promotionService'
import { servicePackageService } from '../services/servicePackageService'
import { adminServicePackageService } from '../services/adminServicePackageService'
import { vehicleService } from '../services/vehicleService'
import { branchService } from '../services/branchService'
import type { Branch } from '../services/branchService'
import type { Promotion } from '../types/promotion'
import type { Vehicle } from '../types/vehicle'
import ReactAriaDatePicker from '../components/ReactAriaDatePicker'

// Định nghĩa lại Type này vì type ServicePackage mặc định đang bị thiếu các trường này
interface BookingServiceType {
  _id?: string
  id?: string
  service_name: string
  service_price: number
  duration_minutes: number
  vehicle_type: string
  is_active?: boolean
}

import { formatPrice } from '../utils/bookingStatus'
import {
  DEFAULT_BOOKING_WINDOW_DAYS,
  getEarliestBookableTime,
  getLatestBookableTime,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
  getScheduleFieldHints,
  validateScheduledAt,
} from '../utils/bookingSchedule'
import { estimateBookingPrice, formatPromotionLabel } from '../utils/promotionPricing'
import { getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'
import { getStoredCustomerProfile } from '../lib/authSession'
import { MapPin, Calendar, CheckCircle2, ChevronRight, ChevronLeft, Star, Plus } from 'lucide-react'

const BOOKING_WINDOW_DAYS = DEFAULT_BOOKING_WINDOW_DAYS

export default function NewBookingPage() {
  const navigate = useNavigate()

  // -- UI State --
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const [saving, setSaving] = useState(false)
  const [loadingFormOptions, setLoadingFormOptions] = useState(true)
  const formOptionsLoaded = useRef(false)

  // -- Data State --
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [individualServices, setIndividualServices] = useState<BookingServiceType[]>([])
  const [comboPackages, setComboPackages] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  // -- Form State --
  const [form, setForm] = useState({
    branch_id: '',
    vehicle_id: '',
    combo_package_id: '',
    service_ids: [] as string[],
    scheduled_at: '',
    promotion_code: '',
    vat_requested: false,
    tax_code: '',
  })

  const [activeTab, setActiveTab] = useState<'combo' | 'single'>('combo')
  const [validatedPromotion, setValidatedPromotion] = useState<Promotion | null>(null)
  const [validatingPromotion, setValidatingPromotion] = useState(false)
  const [recommendation, setRecommendation] = useState<import('../types/booking').IBookingRecommendation | null>(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  const loadFormOptions = useCallback(async (force = false) => {
    if (formOptionsLoaded.current && !force) return

    setLoadingFormOptions(true)
    try {
      const [vehicleList, packages, branchList, comboRes] = await Promise.all([
        vehicleService.list(),
        servicePackageService.listActive(),
        branchService.list(),
        adminServicePackageService.list({ limit: 100, is_active: true }),
      ])

      const combosWithServices = await Promise.all(
        comboRes.items.map(async (combo) => {
          const id = combo._id ?? combo.id ?? ''
          const services = await adminServicePackageService.listDetailedServicesByPackage(id)
          const basePrice = services.reduce((sum, s) => sum + (Number(s.service_price) || 0), 0)
          const discountPct = combo.package_discount_percentage || 0
          const finalPrice = Math.max(0, basePrice * (1 - discountPct / 100))
          return { ...combo, services, finalPrice }
        })
      )

      setVehicles(vehicleList)
      setIndividualServices(packages as unknown as BookingServiceType[])
      setComboPackages(combosWithServices)
      setBranches(branchList)

      // Auto-select branch if there is only one
      if (branchList.length === 1 && branchList[0]._id) {
        setForm(p => ({ ...p, branch_id: branchList[0]._id! }))
      }
      formOptionsLoaded.current = true
    } catch (err) {
      setVehicles([])
      setIndividualServices([])
      setComboPackages([])
      setBranches([])
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

  const dateValue = form.scheduled_at ? form.scheduled_at.split('T')[0] : ''
  const timeValue = form.scheduled_at ? form.scheduled_at.split('T')[1] : ''

  const [apiSlots, setApiSlots] = useState<{ timeStr: string; available_bays: number }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [lastFetchedDate, setLastFetchedDate] = useState<string>('')

  useEffect(() => {
    let active = true;
    if (!form.branch_id || !dateValue) {
      setApiSlots([]);
      setLastFetchedDate('');
      return;
    }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await bookingService.getAvailableSlots(form.branch_id, dateValue);
        if (!active) return;

        const mapped = res.map(slot => {
          const d = new Date(slot.scheduled_at);
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          return { timeStr, available_bays: slot.available_bays };
        });
        setApiSlots(mapped);
        setLastFetchedDate(dateValue);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách slot trống:", err);
      } finally {
        if (active) setLoadingSlots(false);
      }
    };
    void fetchSlots();
    return () => { active = false; };
  }, [form.branch_id, dateValue]);

  useEffect(() => {
    // Only validate the time when we have finished fetching slots for the current date
    if (dateValue !== lastFetchedDate) return;

    if (apiSlots.length > 0 && dateValue) {
      const isValid = apiSlots.some(s => s.timeStr === timeValue);
      if (!isValid) {
        setForm(p => ({ ...p, scheduled_at: `${dateValue}T${apiSlots[0].timeStr}` }));
      }
    } else if (apiSlots.length === 0 && dateValue) {
      setForm(p => ({ ...p, scheduled_at: `${dateValue}T` }));
    }
  }, [apiSlots, dateValue, timeValue, lastFetchedDate]);


  useEffect(() => {
    let active = true;
    if (!form.vehicle_id) {
      setRecommendation(null);
      return;
    }
    const fetchReco = async () => {
      setLoadingRecommendation(true);
      try {
        const res = await bookingService.getRecommendation(form.vehicle_id, form.branch_id || undefined);
        if (active) setRecommendation(res);
      } catch (err) {
        if (active) setRecommendation(null);
      } finally {
        if (active) setLoadingRecommendation(false);
      }
    };
    void fetchReco();
    return () => { active = false; };
  }, [form.vehicle_id, form.branch_id]);

  // Tự động điền Ngày/Giờ khi Auto-Pilot tải xong
  useEffect(() => {
    if (recommendation?.suggested_scheduled_at) {
      const d = new Date(recommendation.suggested_scheduled_at);
      const yyyy = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const newTime = `${yyyy}-${MM}-${dd}T${hh}:${mm}`;

      setForm(p => ({ ...p, scheduled_at: newTime }));
    }
  }, [recommendation]);

  const handleApplyRecommendation = async () => {
    if (!recommendation) return;

    // Auto-fill branch
    let newBranchId = form.branch_id;
    if (recommendation.branch_id) {
      newBranchId = recommendation.branch_id;
    }

    // Auto-fill time
    let newTime = form.scheduled_at;
    if (recommendation.suggested_scheduled_at) {
      const d = new Date(recommendation.suggested_scheduled_at);
      const yyyy = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      newTime = `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
    }

    // Auto-fill combo/services
    let comboId = '';
    const sIds: string[] = [];
    recommendation.recommended_items.forEach(item => {
      if (item.service_package_id) {
        comboId = item.service_package_id;
      } else {
        sIds.push(item.service_id);
      }
    });

    // Auto-fill promotion
    let promoCode = form.promotion_code;
    if (recommendation.applicable_promotion) {
      promoCode = recommendation.applicable_promotion.code;
      try {
        const { promotion } = await promotionService.validateCode(promoCode)
        setValidatedPromotion(promotion)
      } catch (e) { }
    }

    setForm(p => ({
      ...p,
      branch_id: newBranchId,
      scheduled_at: newTime,
      combo_package_id: comboId,
      service_ids: sIds,
      promotion_code: promoCode,
    }));

    showSuccess('Đã áp dụng cấu hình Gợi ý Thông minh!');
    setStep(2);
  };

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => (v._id ?? v.id) === form.vehicle_id),
    [vehicles, form.vehicle_id],
  )

  const compatibleServices = useMemo(() => {
    if (!selectedVehicle) return individualServices
    // Do Backend mới cập nhật Vehicle model dùng vehicle_class_id thay cho vehicle_type
    // Tạm thời hiển thị tất cả các dịch vụ lẻ
    return individualServices
  }, [individualServices, selectedVehicle])

  const selectedCombo = useMemo(
    () => comboPackages.find(c => (c._id ?? c.id) === form.combo_package_id),
    [comboPackages, form.combo_package_id]
  )

  const includedServiceIdsInCombo = useMemo(() => {
    if (!selectedCombo || !selectedCombo.services) return []
    return selectedCombo.services.map((s: any) => s._id ?? s.id)
  }, [selectedCombo])

  const selectedServices = useMemo(
    () =>
      compatibleServices.filter((pkg) => {
        const id = pkg._id ?? pkg.id
        return id && form.service_ids.includes(id) && !includedServiceIdsInCombo.includes(id)
      }),
    [compatibleServices, form.service_ids, includedServiceIdsInCombo],
  )

  const customerProfile = getStoredCustomerProfile();
  const tierDiscountPercentage = useMemo(() => {
    const tier = customerProfile?.tier_id;
    if (tier && typeof tier === 'object' && tier.discount_percentage) {
      return tier.discount_percentage;
    }
    return 0;
  }, [customerProfile]);

  const priceEstimate = useMemo(() => {
    let totalBasePrice = 0
    if (selectedCombo) {
      totalBasePrice += selectedCombo.finalPrice
    }
    if (selectedServices.length > 0) {
      totalBasePrice += selectedServices.reduce((sum, pkg) => sum + (pkg.service_price || 0), 0)
    }

    if (totalBasePrice === 0) return null
    return estimateBookingPrice(totalBasePrice, validatedPromotion, tierDiscountPercentage)
  }, [selectedServices, selectedCombo, validatedPromotion, tierDiscountPercentage])

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
        promotion_code: promotion.code,
      }))
      showSuccess(message || 'Mã khuyến mãi hợp lệ')
    } catch (err) {
      setValidatedPromotion(null)
      showError(getApiErrorMessage(err, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'))
    } finally {
      setValidatingPromotion(false)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!form.branch_id || !form.vehicle_id || !form.scheduled_at) {
        showError('Vui lòng chọn đầy đủ Chi nhánh, Phương tiện và Thời gian')
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
    }
    if (step === 2) {
      if (!form.combo_package_id && form.service_ids.length === 0) {
        showError('Vui lòng chọn ít nhất một Combo hoặc Dịch vụ lẻ')
        return
      }
    }
    if (step === 3) {
      if (form.vat_requested && !form.tax_code.trim()) {
        showError('Vui lòng nhập Mã số thuế khi yêu cầu xuất VAT')
        return
      }
    }
    setStep(s => Math.min(s + 1, totalSteps))
  }

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 1))
  }

  const handleCreateSubmit = async () => {
    setSaving(true)
    try {
      const promotionId = validatedPromotion?._id ?? validatedPromotion?.id

      const servicesPayload: Array<{ service_id: string; service_package_id?: string }> = []

      form.service_ids.forEach(id => {
        servicesPayload.push({ service_id: id })
      })

      if (form.combo_package_id && includedServiceIdsInCombo.length > 0) {
        includedServiceIdsInCombo.forEach((id: string) => {
          servicesPayload.push({
            service_id: id,
            service_package_id: form.combo_package_id
          })
        })
      }

      await bookingService.create({
        branch_id: form.branch_id,
        vehicle_id: form.vehicle_id,
        scheduled_at: parseDatetimeLocalValue(form.scheduled_at)!.toISOString(),
        services: servicesPayload,
        booking_source: 'web',
        ...(promotionId ? { promotion_id: promotionId } : {}),
        vat_requested: form.vat_requested,
        tax_code: form.tax_code,
      })
      showSuccess('Đặt lịch thành công')
      navigate('/bookings')
    } catch (err) {
      showError(getApiErrorMessage(err, 'Đặt lịch thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const formatAddress = (branch: Branch) => {
    if (!branch.branch_address) return 'Chưa có địa chỉ'
    const a = branch.branch_address
    return `${a.street}, ${a.ward}, ${a.district}, ${a.city}`
  }

  return (
    <AccountPageShell
      title="Đặt lịch trực tuyến"
      description="Chỉ với vài thao tác để xế yêu của bạn được chăm sóc hoàn hảo."
      maxWidthClass="max-w-5xl"
    >
      <div className="mx-auto max-w-6xl">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#0ea5b7] rounded-full z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>

            {[1, 2, 3].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${s <= step ? 'bg-[#0ea5b7] text-white shadow-md shadow-cyan-200' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>
                  {s < step ? <CheckCircle2 size={20} /> : s}
                </div>
                <span className={`text-xs font-semibold ${s <= step ? 'text-slate-800' : 'text-slate-400'} hidden sm:block`}>
                  {s === 1 && 'Cơ bản'}
                  {s === 2 && 'Dịch vụ'}
                  {s === 3 && 'Xác nhận'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 md:p-8 flex-1">

            {/* STEP 1: CƠ BẢN */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Tiêu đề bước */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Chọn chi nhánh & Thời gian</h3>
                    <p className="mt-0.5 text-sm text-slate-500">Chọn cơ sở, phương tiện và khung giờ bạn muốn mang xe đến.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* CỘT TRÁI: Chi nhánh & Xe */}
                  <div className="space-y-5">
                    {/* Chi nhánh phục vụ */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <MapPin size={16} className="text-cyan-600" /> Chi nhánh phục vụ <span className="text-rose-500">*</span>
                        </span>
                        <select
                          required
                          value={form.branch_id}
                          onChange={(e) => setForm((p) => ({ ...p, branch_id: e.target.value }))}
                          className={`${AUTH_INPUT_CLASS} mt-2 w-full`}
                          disabled={loadingFormOptions}
                        >
                          <option value="">{loadingFormOptions ? 'Đang tải chi nhánh...' : '— Chọn chi nhánh —'}</option>
                          {branches.map(b => (
                            <option key={b._id} value={b._id}>Cơ sở {formatAddress(b)}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* Chọn xe */}
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Star size={16} className="text-cyan-600" /> Chọn xe của bạn <span className="text-rose-500">*</span>
                        </span>
                        <select
                          required
                          value={form.vehicle_id}
                          onChange={(e) => {
                            const vehicle_id = e.target.value
                            setForm((p) => {
                              const vehicle = vehicles.find((v) => (v._id ?? v.id) === vehicle_id)
                              const next = { ...p, vehicle_id }
                              if (vehicle && form.service_ids.length > 0) {
                                // Tạm bỏ kiểm tra mismatch vì vehicle_type đã bị thay bằng vehicle_class_id
                              }
                              return next
                            })
                          }}
                          className={`${AUTH_INPUT_CLASS} mt-2 w-full`}
                        >
                          <option value="">{loadingFormOptions ? 'Đang tải xe...' : '— Chọn phương tiện —'}</option>
                          {vehicles.map((v) => (
                            <option key={v._id ?? v.id} value={v._id ?? v.id}>
                              {v.license_plate} — {v.vehicle_model || 'Xe của tôi'}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Link to="/vehicles" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                        <Plus size={14} /> Thêm xe mới
                      </Link>
                    </div>

                    {/* Khối Gợi ý AI */}
                    {loadingRecommendation && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm animate-pulse flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-200 shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
                          <div className="h-3 bg-indigo-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    )}
                    {!loadingRecommendation && recommendation && (
                      <div className="relative rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 shadow-sm overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-indigo-500 rounded-full opacity-10 blur-xl"></div>
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                            ✨
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-indigo-900 mb-1">Auto-Pilot Booking</h4>
                            <p className="text-xs text-indigo-700 italic leading-relaxed mb-3">"{recommendation.reason}"</p>

                            <div className="bg-white/60 rounded-lg p-3 border border-indigo-100 mb-3 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-700">Dịch vụ:</span>
                                <span className="text-right text-indigo-900 font-bold max-w-[150px] truncate">
                                  {recommendation.recommended_items.map(i => i.name).join(', ')}
                                </span>
                              </div>
                              {recommendation.suggested_scheduled_at && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-slate-700">Khung giờ sớm nhất:</span>
                                  <span className="text-right text-indigo-900 font-bold">
                                    {new Date(recommendation.suggested_scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(recommendation.suggested_scheduled_at).toLocaleDateString('vi-VN')})
                                  </span>
                                </div>
                              )}
                              {recommendation.applicable_promotion && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-slate-700">Khuyến mãi:</span>
                                  <span className="text-right text-rose-600 font-bold">
                                    {recommendation.applicable_promotion.code}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleApplyRecommendation()}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-indigo-200"
                            >
                              Áp dụng nhanh & Tiếp tục
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hint text moved here to balance column heights */}
                    <p className="mt-2 flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
                      <span className="shrink-0">💡</span>
                      <span>{getScheduleFieldHints(BOOKING_WINDOW_DAYS)}</span>
                    </p>
                  </div>

                  {/* CỘT PHẢI: Thời gian */}
                  <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Calendar size={16} className="text-cyan-600" /> Thời gian mang xe đến <span className="text-rose-500">*</span>
                    </span>

                    {/* Chọn ngày */}
                    <div className="mt-2">
                      <ReactAriaDatePicker
                        value={dateValue}
                        minDate={scheduleBounds.min.split('T')[0]}
                        maxDate={scheduleBounds.max.split('T')[0]}
                        onChange={(newDate) => {
                          if (!newDate) {
                            setForm((p) => ({ ...p, scheduled_at: '' }))
                            return
                          }
                          setForm((p) => ({ ...p, scheduled_at: `${newDate}T` }))
                        }}
                      />
                    </div>

                    {/* Lưới khung giờ */}
                    <div className="mt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn khung giờ</span>
                        {timeValue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                            <CheckCircle2 size={12} /> Đã chọn {timeValue}
                          </span>
                        )}
                      </div>

                      {!form.branch_id ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-400">
                          Vui lòng chọn chi nhánh trước
                        </div>
                      ) : !dateValue ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-400">
                          Vui lòng chọn ngày
                        </div>
                      ) : loadingSlots ? (
                        <div className="flex h-32 items-center justify-center gap-2 text-sm font-medium text-cyan-600">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
                          Đang tải...
                        </div>
                      ) : apiSlots.length > 0 ? (
                        <div className="slots-scroll grid max-h-[280px] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4">
                          {apiSlots.map(s => {
                            const isSelected = s.timeStr === timeValue;
                            return (
                              <button
                                key={s.timeStr}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, scheduled_at: `${dateValue}T${s.timeStr}` }))}
                                className={`flex flex-col items-center justify-center rounded-lg border px-1 py-2.5 transition-all ${isSelected
                                  ? 'border-cyan-600 bg-cyan-600 text-white shadow-md'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'
                                  }`}
                              >
                                <span className="text-[15px] font-bold leading-tight">{s.timeStr}</span>
                                <span className={`mt-0.5 text-[10px] font-medium ${isSelected ? 'text-cyan-100' : 'text-slate-400'}`}>
                                  Còn {s.available_bays} chỗ
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-rose-200 bg-rose-50 text-sm font-medium text-rose-500">
                          Đã hết chỗ trong ngày này
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CHỌN DỊCH VỤ */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Star className="text-yellow-500" /> Chọn Dịch vụ
                </h3>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 self-start">
                  <button
                    onClick={() => setActiveTab('combo')}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'combo' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Combo trọn gói
                  </button>
                  <button
                    onClick={() => setActiveTab('single')}
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'single' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Dịch vụ lẻ
                  </button>
                </div>

                <div className="flex-1 overflow-auto">
                  {activeTab === 'combo' && (
                    <>
                      {comboPackages.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-slate-500">Đang tải hoặc không có combo nào.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {comboPackages.map((pkg) => {
                            const id = pkg._id ?? pkg.id ?? ''
                            const isSelected = form.combo_package_id === id

                            const handleSelectCombo = () => {
                              setForm(p => {
                                const newComboId = isSelected ? '' : id
                                let newServiceIds = p.service_ids

                                // Nếu chọn combo mới, tự động bỏ tick các dịch vụ lẻ đã có trong combo này
                                if (newComboId) {
                                  const comboServices = pkg.services?.map((s: any) => s._id ?? s.id) || []
                                  newServiceIds = p.service_ids.filter(sid => !comboServices.includes(sid))
                                }

                                return { ...p, combo_package_id: newComboId, service_ids: newServiceIds }
                              })
                            }

                            return (
                              <div
                                key={id}
                                onClick={handleSelectCombo}
                                className={`relative cursor-pointer p-5 transition-all flex items-start gap-4 ${isSelected ? 'bg-[#fff5ee]' : 'hover:bg-slate-50'}`}
                              >
                                <div className="pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="w-5 h-5 rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer"
                                  />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex justify-between items-start gap-4">
                                    <h4 className="font-bold text-slate-800 text-base">{pkg.package_name}</h4>
                                  </div>
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="text-sm text-slate-600">
                                      <span className="font-medium text-slate-700">Gồm các dịch vụ:</span>{' '}
                                      {pkg.services?.map((s: any) => s.service_name).join(' - ') || 'Chưa có chi tiết'}
                                    </p>
                                    <p className="text-lg font-bold text-[#ea580c] whitespace-nowrap">{formatPrice(pkg.finalPrice)}</p>
                                  </div>
                                  <div className="text-sm font-medium text-slate-500">
                                    Giảm {pkg.package_discount_percentage}% - {pkg.services?.length || 0} dịch vụ
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'single' && (
                    <>
                      {compatibleServices.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-slate-500">Không tìm thấy dịch vụ lẻ nào khả dụng.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {compatibleServices.map((pkg) => {
                            const id = pkg._id ?? pkg.id ?? ''
                            const isIncludedInCombo = includedServiceIdsInCombo.includes(id)
                            const isSelected = form.service_ids.includes(id) || isIncludedInCombo

                            const toggleService = () => {
                              if (isIncludedInCombo) return // Không cho click nếu đã nằm trong combo
                              setForm(p => {
                                if (p.service_ids.includes(id)) {
                                  return { ...p, service_ids: p.service_ids.filter(sid => sid !== id) }
                                } else {
                                  return { ...p, service_ids: [...p.service_ids, id] }
                                }
                              })
                            }

                            return (
                              <div
                                key={id}
                                onClick={toggleService}
                                className={`relative cursor-pointer p-5 transition-all flex items-start gap-4 
                                  ${isIncludedInCombo ? 'bg-slate-50/50 cursor-not-allowed opacity-70'
                                    : isSelected ? 'bg-[#fff5ee]'
                                      : 'hover:bg-slate-50'}`}
                              >
                                <div className="pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className={`w-5 h-5 rounded border-slate-300 cursor-pointer ${isIncludedInCombo ? 'text-slate-400 focus:ring-slate-400' : 'text-[#ea580c] focus:ring-[#ea580c]'}`}
                                  />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-slate-800 text-base">{pkg.service_name}</h4>
                                      {isIncludedInCombo && (
                                        <span className="bg-slate-200 text-slate-600 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                                          Thuộc Combo
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-lg font-bold whitespace-nowrap ${isIncludedInCombo ? 'text-slate-400' : 'text-[#ea580c]'}`}>{formatPrice(pkg.service_price)}</p>
                                  </div>
                                  <div className="text-sm font-medium text-slate-500">
                                    ⏱ {pkg.duration_minutes} phút
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: KHUYẾN MÃI & XÁC NHẬN */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" /> Xác nhận & Đặt lịch
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  {/* Cột Tóm tắt đơn & Ưu đãi */}
                  <div className="md:col-span-3 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-3 mb-4 uppercase text-xs tracking-wider">Thông tin đơn đặt lịch</h4>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between"><span className="text-slate-500">Chi nhánh:</span> <span className="font-semibold text-slate-800">{branches.find(b => b._id === form.branch_id)?.branch_address?.district || 'Đã chọn'}</span></li>
                        <li className="flex justify-between"><span className="text-slate-500">Phương tiện:</span> <span className="font-semibold text-slate-800">{selectedVehicle?.license_plate}</span></li>
                        <li className="flex justify-between"><span className="text-slate-500">Thời gian:</span> <span className="font-semibold text-slate-800">{form.scheduled_at ? new Date(form.scheduled_at).toLocaleString('vi-VN') : ''}</span></li>
                        <li className="flex justify-between items-start">
                          <span className="text-slate-500 mt-0.5">Dịch vụ:</span>
                          <div className="font-semibold text-slate-800 text-right flex flex-col gap-1 items-end">
                            {selectedCombo && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md text-xs border border-cyan-100">[Combo] {selectedCombo.package_name}</span>
                                {selectedCombo.services && selectedCombo.services.length > 0 && (
                                  <div className="text-xs text-slate-500 font-normal mt-0.5 max-w-[200px] text-right">
                                    Bao gồm: {selectedCombo.services.map((s: any) => s.service_name).join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedServices.map(s => (
                              <span key={s._id}>{s.service_name}</span>
                            ))}
                          </div>
                        </li>
                        {form.vat_requested && <li className="flex justify-between"><span className="text-slate-500">Xuất VAT:</span> <span className="font-semibold text-blue-600">Có (MST: {form.tax_code})</span></li>}
                      </ul>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5">
                      <label className="block text-sm">
                        <span className="font-semibold text-slate-700">Mã giảm giá (Nếu có)</span>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={form.promotion_code}
                            onChange={(e) => {
                              setValidatedPromotion(null)
                              setForm((p) => ({ ...p, promotion_code: e.target.value.toUpperCase() }))
                            }}
                            placeholder="Nhập mã khuyến mãi..."
                            className={`${AUTH_INPUT_CLASS} flex-1 uppercase border-rose-200 focus:border-rose-400 focus:ring-rose-200`}
                            disabled={validatingPromotion}
                          />
                          <button
                            type="button"
                            onClick={() => void handleApplyPromotion()}
                            disabled={validatingPromotion || !form.promotion_code.trim()}
                            className="shrink-0 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
                          >
                            {validatingPromotion ? 'Đang kiểm tra...' : 'Áp dụng'}
                          </button>
                        </div>
                        {validatedPromotion && (
                          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <CheckCircle2 size={16} /> Đã áp dụng: {formatPromotionLabel(validatedPromotion)}
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="vat_req"
                          checked={form.vat_requested}
                          onChange={e => setForm(p => ({ ...p, vat_requested: e.target.checked }))}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600"
                        />
                        <div className="flex-1">
                          <label htmlFor="vat_req" className="font-medium text-slate-700 cursor-pointer block">Tôi muốn xuất hóa đơn đỏ (VAT) cho dịch vụ này</label>
                          {form.vat_requested && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                              <input
                                type="text"
                                placeholder="Nhập Mã số thuế công ty..."
                                required={form.vat_requested}
                                value={form.tax_code}
                                onChange={e => setForm(p => ({ ...p, tax_code: e.target.value }))}
                                className={AUTH_INPUT_CLASS}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột Tính tiền */}
                  <div className="md:col-span-2">
                    <div className="bg-[#0ea5b7] text-white rounded-2xl p-6 shadow-lg shadow-cyan-200 relative overflow-hidden h-full flex flex-col">
                      {/* Decoration pattern */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>

                      <h4 className="font-bold text-cyan-50 mb-6 uppercase tracking-widest text-xs relative z-10">Tổng thanh toán dự kiến</h4>

                      {priceEstimate ? (
                        <div className="space-y-3 relative z-10 flex-1">
                          {selectedCombo && (
                            <div className="flex justify-between items-start text-sm text-cyan-100">
                              <span className="pr-4">Gói Combo ({selectedCombo.package_name})</span>
                              <span className="whitespace-nowrap">{formatPrice(selectedCombo.finalPrice)}</span>
                            </div>
                          )}
                          {selectedServices.map(s => (
                            <div key={s._id || s.id} className="flex justify-between items-start text-sm text-cyan-100">
                              <span className="pr-4">{s.service_name}</span>
                              <span className="whitespace-nowrap">{formatPrice(s.service_price || 0)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center text-sm text-white font-medium pt-2 border-t border-cyan-500/50">
                            <span>Tạm tính</span>
                            <span>{formatPrice(priceEstimate.basePrice)}</span>
                          </div>
                          {tierDiscountPercentage > 0 && (
                            <div className="flex justify-between items-center text-sm text-emerald-200 font-medium pt-1">
                              <span>Ưu đãi hạng ({tierDiscountPercentage}%)</span>
                              <span>− {formatPrice(Math.round(priceEstimate.basePrice * tierDiscountPercentage / 100))}</span>
                            </div>
                          )}
                          {(priceEstimate.discount - Math.round(priceEstimate.basePrice * tierDiscountPercentage / 100)) > 0 && (
                            <div className="flex justify-between items-center text-sm text-rose-200 font-medium pt-1">
                              <span>Mã khuyến mãi</span>
                              <span>− {formatPrice(priceEstimate.discount - Math.round(priceEstimate.basePrice * tierDiscountPercentage / 100))}</span>
                            </div>
                          )}
                          <div className="border-t border-cyan-400/50 my-4 pt-4"></div>
                          <div>
                            <div className="text-xs text-cyan-100 mb-1">Thành tiền</div>
                            <div className="text-3xl font-black">{formatPrice(priceEstimate.finalPrice)}</div>
                          </div>
                          <div className="mt-auto pt-4 text-xs text-cyan-100 italic">
                            * Thanh toán sau khi hoàn thành dịch vụ.
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center opacity-50 text-sm">Chưa có thông tin giá</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
            {step > 1 ? (
              <button onClick={handlePrev} className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-800 transition px-4 py-2">
                <ChevronLeft size={18} /> Quay lại
              </button>
            ) : <div></div>}

            {step < totalSteps ? (
              <button onClick={handleNext} className="flex items-center gap-2 bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-slate-700 transition shadow-sm">
                Tiếp tục <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleCreateSubmit} disabled={saving} className="flex items-center gap-2 bg-[#0ea5b7] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#0c8fa0] transition shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Đang tạo đơn...' : 'Hoàn tất Đặt lịch'} <CheckCircle2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </AccountPageShell>
  )
}
