import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { CalendarDays, CalendarPlus, Car, MapPin, Eye, MessageSquareWarning, MessageSquare, CheckCircle, AlertTriangle, X, XCircle, Upload, PenTool, Loader2 } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { bookingChecklistService } from '../services/bookingChecklistService'
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
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { env } from '../config/env'
import { getAccessToken } from '../lib/authSession'

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
  const [viewReportModal, setViewReportModal] = useState<{ isOpen: boolean; report: any; appointmentId?: string | null }>({ isOpen: false, report: null, appointmentId: null })
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const [confirmSignatureModal, setConfirmSignatureModal] = useState<{ isOpen: boolean; appointmentId: string | null }>({ isOpen: false, appointmentId: null });
  const [customerSignatureConfirm, setCustomerSignatureConfirm] = useState<string | null>(null);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [previewBillModal, setPreviewBillModal] = useState<{ appointmentId: string, base64: string, targetType: 'QR' | 'BILL' } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyStep, setVerifyStep] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');

  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>, appointmentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setPreviewBillModal({ appointmentId, base64: base64Image, targetType: 'QR' });
    } catch (error) {
      showError('Lỗi khi đọc file ảnh');
    } finally {
      e.target.value = '';
    }
  };

  const handleVerifyBill = async () => {
    if (!previewBillModal) return;
    setIsVerifying(true);
    setVerifyProgress(0);
    setVerifyStep('Đang khởi tạo AI...');
    setVerifyResult(null);
    setVerifyError('');

    try {
      const byteString = atob(previewBillModal.base64.split(',')[1]);
      const mimeString = previewBillModal.base64.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const formData = new FormData();
      formData.append('image', blob, 'qr.png');
      formData.append('type', 'QR');

      const token = getAccessToken();

      await fetchEventSource(`${env.apiBaseUrl}/confidence/verify-image`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
        onmessage(ev) {
          try {
            const data = JSON.parse(ev.data);
            if (data.progress !== undefined) {
              setVerifyProgress(data.progress);
              if (data.progress === -1) {
                setVerifyError(data.step || 'Lỗi xử lý ảnh QR');
                setIsVerifying(false);
              } else {
                setVerifyStep(data.step);
              }
            }
            if (data.progress === 100 && data.data) {
              setVerifyResult(data.data);
              setIsVerifying(false);
            }
          } catch (e) {
            console.error(e);
          }
        },
        onerror(err) {
          setVerifyError('Lỗi kết nối máy chủ xác thực AI');
          setIsVerifying(false);
          throw err;
        }
      });
    } catch (err) {
      if (!verifyError) {
        setVerifyError('Đã xảy ra lỗi khi xác thực');
      }
      setIsVerifying(false);
    }
  };

  const confirmUploadQr = async () => {
    if (!previewBillModal) return;

    if (!verifyResult) {
      showError('Vui lòng kiểm tra độ tin cậy trước khi xác nhận tải lên');
      return;
    }

    const confidencePercent = Math.round((verifyResult.confidence || 0) * 100);
    if (confidencePercent < 70) {
      showError(`Độ tin cậy của ảnh chỉ đạt ${confidencePercent}% (Yêu cầu phải từ 70% trở lên mới được tải lên)`);
      return;
    }

    try {
      await bookingChecklistService.uploadCompensationQr(previewBillModal.appointmentId, previewBillModal.base64);
      showSuccess(`Tải lên ảnh QR nhận tiền thành công (Độ tin cậy: ${confidencePercent}%)!`);

      setViewReportModal((prev: any) => {
        if (!prev) return prev;
        return { ...prev, report: { ...prev.report, compensation: { ...prev.report.compensation, qr_image: previewBillModal.base64 } } };
      });
      void loadBookings(page);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Lỗi khi tải lên mã QR');
    } finally {
      setPreviewBillModal(null);
      setVerifyResult(null);
      setVerifyError('');
      setVerifyProgress(0);
    }
  };

  const handleConfirmSignatureSubmit = async () => {
    if (!confirmSignatureModal.appointmentId || !customerSignatureConfirm) {
      showError('Vui lòng ký xác nhận trước khi gửi.');
      return;
    }

    try {
      setIsSubmittingConfirm(true);
      await bookingChecklistService.customerConfirmCompensation(confirmSignatureModal.appointmentId, customerSignatureConfirm);
      showSuccess('Xác nhận nhận tiền đền bù thành công! Lịch hẹn đã hoàn tất đền bù.');
      setConfirmSignatureModal({ isOpen: false, appointmentId: null });
      setCustomerSignatureConfirm(null);
      setViewReportModal({ isOpen: false, report: null });
      void loadBookings(page);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Lỗi khi ký xác nhận');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const [signedHandoverIds, setSignedHandoverIds] = useState<Set<string>>(new Set())

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

      // Kiểm tra trạng thái ký bàn giao xe cho các đơn washed / completed
      const washedOrCompletedBookings = res.items.filter((b: WashBooking) =>
        b.booking_status === 'washed' || b.booking_status === 'completed'
      )
      if (washedOrCompletedBookings.length > 0) {
        Promise.all(
          washedOrCompletedBookings.map((b: WashBooking) => {
            const id = bookingId(b)
            return bookingChecklistService.getByAppointmentId(id)
              .then(checklist => ({ id, hasSigned: !!checklist?.customer_signature_after }))
              .catch(() => ({ id, hasSigned: false }))
          })
        ).then(results => {
          setSignedHandoverIds(prev => {
            const newSet = new Set(prev)
            results.forEach(r => {
              if (r.hasSigned) newSet.add(r.id)
              else newSet.delete(r.id)
            })
            return newSet
          })
        })
      }
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
                          className="w-full sm:w-36 rounded-lg border border-cyan-200 px-3 py-2 text-xs sm:text-sm font-medium text-cyan-600 transition hover:bg-cyan-50 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                          <Eye className="h-4 w-4" /> Chi tiết
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(booking)}
                            className="w-full sm:w-36 rounded-lg border border-red-200 px-3 py-2 text-xs sm:text-sm font-medium text-red-600 transition hover:bg-red-50 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                          >
                            Hủy lịch
                          </button>
                        )}
                        {!(booking as any).report && (
                          signedHandoverIds.has(bookingId(booking)) ? (
                            <span className="w-full sm:w-36 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap">
                              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Đã bàn giao xe
                            </span>
                          ) : booking.booking_status === 'washed' ? (
                            <button
                              type="button"
                              onClick={() => setReportModal({ isOpen: true, appointmentId: bookingId(booking) })}
                              className="w-full sm:w-36 rounded-lg border border-amber-200 px-3 py-2 text-xs sm:text-sm font-medium text-amber-600 transition hover:bg-amber-50 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                            >
                              <MessageSquareWarning className="h-4 w-4 shrink-0" /> Khiếu nại
                            </button>
                          ) : null
                        )}
                        {(booking as any).report && (
                          <button
                            type="button"
                            onClick={() => setViewReportModal({ isOpen: true, report: (booking as any).report, appointmentId: bookingId(booking) })}
                            className="w-full sm:w-36 rounded-lg border border-indigo-200 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" /> Xem khiếu nại
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"><XCircle size={14} /> Đã từ chối</span>
                ) : viewReportModal.report.isConfirm ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"><CheckCircle size={14} /> Đã tiếp nhận & Xử lý</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"><AlertTriangle size={14} /> Đang chờ xử lý</span>
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
                      <div key={idx} onClick={() => setPreviewImage(img)} className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer">
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
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

                      {/* Ảnh QR nhận tiền */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">QR tài khoản nhận tiền</h4>
                        {viewReportModal.report.compensation.qr_image ? (
                          <div className="space-y-2">
                            <div onClick={() => setPreviewImage(viewReportModal.report.compensation.qr_image)} className="block w-32 h-auto rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer">
                              <img src={viewReportModal.report.compensation.qr_image} alt="QR Code" className="w-full object-cover" />
                            </div>
                            {!viewReportModal.report.compensation.transfer_image && (
                              <div className="mt-2">
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-slate-200">
                                  <Upload size={12} /> Cập nhật QR khác
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadQr(e, viewReportModal.appointmentId || '')} />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Tải lên mã QR ngân hàng để cửa hàng chuyển tiền bồi thường nhanh hơn.</p>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#0ea5b7] hover:text-[#0c8fa0] text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-cyan-200/50">
                              <Upload size={12} /> Tải ảnh QR nhận tiền
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadQr(e, viewReportModal.appointmentId || '')} />
                            </label>
                          </div>
                        )}
                      </div>

                      {viewReportModal.report.compensation.transfer_image ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                          <div onClick={() => setPreviewImage(viewReportModal.report.compensation.transfer_image)} className="block w-32 h-auto rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors cursor-pointer">
                            <img src={viewReportModal.report.compensation.transfer_image} alt="Transfer bill" className="w-full object-cover" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                          <div className="bg-amber-50 text-amber-600 px-3 py-2 rounded-lg border border-amber-200 text-sm font-medium">
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
                            <span className="text-xs text-slate-500 font-medium block mb-1">Ký cam kết (KH)</span>
                            <img src={viewReportModal.report.compensation.customer_signature} alt="Customer signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                          </div>
                        )}
                      </div>

                      {viewReportModal.report.compensation.customer_signature_confirm ? (
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                          <span className="text-xs text-emerald-600 font-bold block mb-1">Chữ ký nhận tiền (KH)</span>
                          <img src={viewReportModal.report.compensation.customer_signature_confirm} alt="Customer signature confirm" className="h-12 mx-auto object-contain mix-blend-multiply" />
                        </div>
                      ) : (
                        viewReportModal.report.compensation.transfer_image && (
                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => setConfirmSignatureModal({ isOpen: true, appointmentId: viewReportModal.appointmentId || null })}
                              className="w-full py-2 bg-[#0ea5b7] hover:bg-[#0c8fa0] text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                            >
                              <PenTool size={16} /> Ký xác nhận đã nhận tiền
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewReportModal({ isOpen: false, report: null, appointmentId: null })}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ký xác nhận nhận tiền đền bù */}
      {confirmSignatureModal.isOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Ký Nhận Tiền Đền Bù</h2>
              <button
                onClick={() => {
                  setConfirmSignatureModal({ isOpen: false, appointmentId: null });
                  setCustomerSignatureConfirm(null);
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-slate-600 font-medium">
                Vui lòng ký vào khung bên dưới để xác nhận bạn đã nhận được số tiền đền bù từ cửa hàng.
              </p>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <PenTool size={16} className="text-[#0ea5b7]" /> Chữ ký của bạn <span className="text-rose-500">*</span>
                </h3>
                <SignaturePad placeholder="Vui lòng ký vào đây" onSignatureChange={setCustomerSignatureConfirm} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmSignatureModal({ isOpen: false, appointmentId: null });
                  setCustomerSignatureConfirm(null);
                }}
                className="px-5 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                disabled={isSubmittingConfirm}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSignatureSubmit}
                disabled={isSubmittingConfirm || !customerSignatureConfirm}
                className="px-5 py-2 bg-[#0ea5b7] text-white font-medium rounded-xl hover:bg-[#0c8fa0] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingConfirm && <Loader2 size={16} className="animate-spin" />}
                Xác nhận hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Preview Bill/QR Modal */}
      {previewBillModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">
                Xác thực: Mã QR nhận tiền
              </h2>
              <button
                onClick={() => {
                  setPreviewBillModal(null)
                  setVerifyResult(null)
                  setVerifyError('')
                  setVerifyProgress(0)
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <p className="text-sm text-slate-600 mb-4 text-center font-medium">Bản xem trước hình ảnh mã QR nhận tiền</p>
              <div className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm mb-4 shrink-0 bg-slate-50 flex items-center justify-center">
                <img src={previewBillModal.base64} alt="Preview" className="w-full max-h-[50vh] object-contain" />
              </div>

              <div className="w-full max-w-sm bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 shrink-0">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 leading-none">Kiểm tra độ tin cậy</h4>
                    </div>
                  </div>
                  {!isVerifying && !verifyResult && (
                    <button type="button" onClick={handleVerifyBill} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition-colors">
                      Kiểm tra
                    </button>
                  )}
                </div>

                {isVerifying && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs font-medium text-indigo-700 mb-1">
                      <span>{verifyStep}</span>
                      <span>{verifyProgress}%</span>
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(verifyProgress, 0)}%` }}></div>
                    </div>
                  </div>
                )}

                {verifyError && (
                  <div className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-600 text-xs mt-1">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {verifyResult && (
                  <div className="w-full p-3 bg-white border border-indigo-100 rounded-lg flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-600">Độ tin cậy:</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${(verifyResult.confidence * 100) >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {Math.round(verifyResult.confidence * 100)}%
                      </span>
                    </div>
                    {verifyResult.reason && (
                      <div className={`text-xs p-1.5 rounded border ${(verifyResult.confidence * 100) >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        <span className="font-semibold">Chi tiết:</span> {verifyResult.reason}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      {(verifyResult.details?.amount || verifyResult.details?.analysis?.amount) && (
                        <>
                          <span className="text-slate-500">Số tiền:</span>
                          <span className="font-semibold text-slate-800 text-right">
                            {verifyResult.type === 'QR' && verifyResult.details?.analysis?.amount
                              ? verifyResult.details.analysis.amount.toLocaleString('vi-VN') + ' VNĐ'
                              : verifyResult.details.amount}
                          </span>
                        </>
                      )}
                      {(verifyResult.details?.provider || verifyResult.details?.analysis?.providerName) && (
                        <>
                          <span className="text-slate-500">Ngân hàng:</span>
                          <span className="font-semibold text-slate-800 text-right">
                            {verifyResult.type === 'QR'
                              ? verifyResult.details?.analysis?.providerName
                              : verifyResult.details?.provider}
                          </span>
                        </>
                      )}
                      {verifyResult.type === 'QR' && verifyResult.details?.analysis?.accountNumber && (
                        <>
                          <span className="text-slate-500">Số tài khoản:</span>
                          <span className="font-semibold text-slate-800 text-right">{verifyResult.details.analysis.accountNumber}</span>
                        </>
                      )}
                    </div>

                    {(verifyResult.confidence * 100) < 70 && (
                      <div className="w-full mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
                        <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                        <span>Độ tin cậy chưa đạt 70%. Không thể xác nhận tải lên!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setPreviewBillModal(null)
                  setVerifyResult(null)
                  setVerifyError('')
                  setVerifyProgress(0)
                }}
                className="px-5 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy thay đổi
              </button>
              <button
                onClick={confirmUploadQr}
                disabled={!verifyResult || (verifyResult.confidence * 100) < 70}
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              >
                <Upload size={16} />
                Xác nhận tải lên
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountPageShell>
  )
}

const SignaturePad = ({ onSignatureChange, placeholder }: { onSignatureChange: (signature: string | null) => void, placeholder: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden relative bg-white shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full touch-none cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {hasSignature && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2 right-2 px-3 py-1 bg-rose-100 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-200 transition-colors"
        >
          Ký lại
        </button>
      )}
      {!hasSignature && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-sm italic">
          {placeholder}
        </div>
      )}
    </div>
  );
};
