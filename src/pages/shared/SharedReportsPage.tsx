import { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Eye, Search, AlertTriangle, CheckCircle, Trash2, MessageSquare, Calendar, XCircle, Upload, X } from 'lucide-react'
import { bookingChecklistService, type BookingChecklist } from '../../services/bookingChecklistService'
import { bookingService } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import { useAuth } from '../../hooks/useAuth'
import BookingDetailModal from '../../components/BookingDetailModal'
import CompensationModal from '../../components/CompensationModal'
import RejectModal from '../../components/RejectModal'

export default function SharedReportsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailModal, setDetailModal] = useState<any | null>(null)
  const [compensationModalOpen, setCompensationModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [bookingDetailItem, setBookingDetailItem] = useState<any | null>(null)
  const [initialChecklist, setInitialChecklist] = useState<BookingChecklist | null>(null)
  const [appointmentDetail, setAppointmentDetail] = useState<WashBooking | null>(null)
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [previewBillModal, setPreviewBillModal] = useState<{ appointmentId: string, base64: string } | null>(null)

  useEffect(() => {
    if (detailModal && detailModal._id) {
      const fetchDetails = async () => {
        setLoadingChecklist(true)
        try {
          const cl = await bookingChecklistService.getByAppointmentId(detailModal._id).catch(() => null)
          setInitialChecklist(cl)
        } catch (error) {
          console.error('Failed to load checklist', error)
          setInitialChecklist(null)
        } finally {
          setLoadingChecklist(false)
        }
      }
      fetchDetails()
    } else {
      setInitialChecklist(null)
    }
  }, [detailModal])
  const limit = 8

  const fetchReports = async (currentPage: number, tab: string) => {
    setLoading(true)
    try {
      const res = await bookingChecklistService.getAllReports({
        page: currentPage,
        limit,
        status: tab === 'all' ? undefined : tab
      })
      setData(res || { items: [], total: 0 })
    } catch (error) {
      showError('Không thể tải danh sách khiếu nại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(page, activeTab)
  }, [page, activeTab])

  const filteredItems = (data.items || []).filter((item: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const displayId = (item.appointment_code || '').toLowerCase()
      const title = (item.report?.title || '').toLowerCase()
      const phone = (item.report?.phone || '').toLowerCase()
      return displayId.includes(q) || title.includes(q) || phone.includes(q)
    }
    return true
  })

  const totalPages = Math.ceil((data.total || 0) / limit)

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(page - 1)
        pages.push(page)
        pages.push(page + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }


  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá báo cáo này không?')) return
    try {
      await bookingChecklistService.deleteReport(appointmentId)
      showSuccess('Đã xoá báo cáo thành công')
      setDetailModal(null)
      fetchReports(page, activeTab)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Lỗi khi xoá báo cáo')
    }
  }

  const handleUploadBill = async (e: React.ChangeEvent<HTMLInputElement>, appointmentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setPreviewBillModal({ appointmentId, base64: base64Image });
    } catch (error) {
      showError('Lỗi khi đọc file ảnh');
    } finally {
      e.target.value = ''; // Reset input
    }
  }

  const confirmUploadBill = async () => {
    if (!previewBillModal) return;
    try {
      await bookingChecklistService.uploadCompensationBill(previewBillModal.appointmentId, previewBillModal.base64);
      showSuccess('Đã tải lên bill chuyển khoản thành công, khiếu nại đã hoàn tất!');

      // Update detailModal locally to reflect changes
      if (detailModal && detailModal._id === previewBillModal.appointmentId) {
        setDetailModal({
          ...detailModal,
          report: {
            ...detailModal.report,
            compensation: {
              ...detailModal.report.compensation,
              transfer_image: previewBillModal.base64
            }
          }
        });
      }

      fetchReports(page, activeTab);
    } catch (error: any) {
      showError(error.response?.data?.message || 'Lỗi khi tải lên bill chuyển khoản');
    } finally {
      setPreviewBillModal(null);
    }
  }

  return (
    <div className="admin-page animate-in fade-in duration-300">
      <div className="admin-page__header flex flex-col gap-4">
        <div>
          <h1 className="admin-page__title">Quản lý Báo cáo / Khiếu nại</h1>
          <p className="admin-page__subtitle">Xem và xử lý các phản hồi từ khách hàng sau khi hoàn tất dịch vụ.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã đơn, tiêu đề, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 bg-white min-w-[250px] transition-colors"
            />
          </div>

          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value as any)
              setPage(1)
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 min-w-[160px] shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <option value="pending">Chờ xác nhận</option>
            <option value="accepted">Đã xác nhận</option>
            <option value="rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>

          <button
            onClick={() => fetchReports(page, activeTab)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-medium ml-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="admin-card flex flex-col min-h-[500px]">
        <div className="admin-table-wrap flex-1">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tiêu đề</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-indigo-500 mx-auto" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="admin-empty-text py-10">Không tìm thấy báo cáo nào</td></tr>
              ) : (
                filteredItems.map((item: any) => {
                  const id = item.appointment_code || 'N/A'
                  const report = item.report || {}
                  const isConfirm = report.isConfirm

                  return (
                    <tr key={item._id} className="admin-table__row group hover:bg-slate-50 transition-colors">
                      <td><div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">#{id}</div></td>
                      <td>
                        <div className="text-sm font-medium text-slate-800">{report.fullname || item.customer_id?.full_name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{report.phone || item.customer_id?.phone || ''}</div>
                      </td>
                      <td>
                        <div className="text-sm text-slate-700 font-medium truncate max-w-[250px]">{report.title || 'Không có tiêu đề'}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-slate-900">{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-slate-500">{new Date(item.updatedAt).toLocaleTimeString('vi-VN')}</div>
                      </td>
                      <td>
                        {report.status === 'rejected' ? (
                          <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-semibold flex items-center gap-1 w-max border border-rose-100">
                            <XCircle size={12} /> Đã từ chối
                          </span>
                        ) : report.status === 'accepted' ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-semibold flex items-center gap-1 w-max border border-emerald-100">
                            <CheckCircle size={12} /> Đã xác nhận đền bù
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs font-semibold flex items-center gap-1 w-max border border-amber-100">
                            <AlertTriangle size={12} /> Chờ xác nhận
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setBookingDetailItem(item)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                          >
                            <Eye size={14} /> Chi tiết
                          </button>
                          <button
                            onClick={() => setDetailModal(item)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition shadow-sm flex items-center gap-1.5"
                          >
                            <MessageSquare size={14} /> Khiếu nại
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 mt-auto">
            <div className="text-sm text-slate-500">
              Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng số {data.total} đơn)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              {getPageNumbers().map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof p === 'number' && setPage(p)}
                  disabled={p === '...'}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium ${p === page
                    ? 'bg-indigo-600 text-white border border-indigo-600'
                    : p === '...'
                      ? 'text-slate-400 cursor-default'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi tiết Báo cáo */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetailModal(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết Báo cáo #{detailModal.appointment_code}</h3>
                <p className="text-sm text-slate-500">Khách hàng: {detailModal.report?.fullname}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Cột 1: Thông tin Khiếu nại */}
                <div className="space-y-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-max">
                  <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-500" />
                    Nội dung Báo cáo / Khiếu nại
                  </h3>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Thông tin liên hệ</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">Số điện thoại</span>
                        <span className="text-sm font-medium text-slate-800">{detailModal.customer_id?.user_id?.phone || detailModal.report?.phone || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">Email</span>
                        <span className="text-sm font-medium text-slate-800">{detailModal.report?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Nội dung phản hồi</h4>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-bold text-slate-800 mb-2">{detailModal.report?.title}</div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{detailModal.report?.description}</p>
                    </div>
                  </div>

                  {detailModal.report?.evidence && detailModal.report.evidence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Hình ảnh bằng chứng</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {detailModal.report.evidence.map((img: string, idx: number) => (
                          <a key={idx} href={img} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors">
                            <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột 2: Checklist ban đầu */}
                <div className="space-y-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-max">
                  <h3 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    Biên bản kiểm tra xe ban đầu (Checklist)
                  </h3>
                  {loadingChecklist ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-3">
                      <RefreshCw className="animate-spin text-indigo-400" size={32} />
                      <span className="text-slate-500 text-sm font-medium">Đang tải biên bản...</span>
                    </div>
                  ) : initialChecklist ? (
                    <div className="space-y-5">
                      {initialChecklist.checklist_items && initialChecklist.checklist_items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Các hạng mục đã kiểm tra</h4>
                          <ul className="space-y-2">
                            {initialChecklist.checklist_items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {item.checked ? (
                                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                ) : (
                                  <div className="w-[18px] h-[18px] border-2 border-slate-300 rounded mt-0.5 shrink-0 bg-white" />
                                )}
                                <span className="leading-snug">{item.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {initialChecklist.note && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Ghi chú của nhân viên</h4>
                          <p className="text-sm text-amber-800 p-3 bg-amber-50 rounded-lg border border-amber-100 whitespace-pre-wrap">{initialChecklist.note}</p>
                        </div>
                      )}

                      {initialChecklist.images && initialChecklist.images.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Hình ảnh hiện trạng xe</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {initialChecklist.images.map((img: string, idx: number) => (
                              <a key={idx} href={img} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors">
                                <img src={img} alt="Checklist img" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chữ ký xác nhận */}
                      {(initialChecklist.customer_signature || initialChecklist.customer_signature_after) && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-3">Chữ ký xác nhận</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {initialChecklist.customer_signature && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                <span className="text-xs text-slate-500 font-medium block mb-2">Chữ ký lúc nhận xe</span>
                                <div className="border-t border-b py-2 bg-slate-50">
                                  <img src={initialChecklist.customer_signature} alt="Chữ ký nhận xe" className="h-16 mx-auto object-contain mix-blend-multiply" />
                                </div>
                              </div>
                            )}
                            {initialChecklist.customer_signature_after && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                <span className="text-xs text-slate-500 font-medium block mb-2">Chữ ký lúc giao xe</span>
                                <div className="border-t border-b py-2 bg-slate-50">
                                  <img src={initialChecklist.customer_signature_after} alt="Chữ ký giao xe" className="h-16 mx-auto object-contain mix-blend-multiply" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!initialChecklist.checklist_items?.length && !initialChecklist.note && !initialChecklist.images?.length && !initialChecklist.customer_signature && !initialChecklist.customer_signature_after && (
                        <p className="text-sm text-slate-500 italic text-center p-4">Biên bản này trống.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200 border-dashed flex flex-col items-center justify-center space-y-2 mt-4">
                      <AlertTriangle className="text-slate-400" size={32} />
                      <p className="text-slate-600 font-medium text-sm">Không tìm thấy biên bản</p>
                      <p className="text-slate-500 text-xs text-center max-w-[250px]">Đơn đặt lịch này có thể chưa được tạo biên bản kiểm tra xe ban đầu.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kết quả xử lý Đền bù */}
              {detailModal.report?.status === 'accepted' && detailModal.report?.compensation && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
                  <div className="border-b border-emerald-100 pb-2 mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-emerald-700 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Biên bản cam kết đền bù
                    </h3>
                    {!detailModal.report.compensation.transfer_image && (
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors text-xs font-medium">
                        <Upload size={14} />
                        Tải lên bill
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadBill(e, detailModal._id)} />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Số tiền đền bù</h4>
                        <p className="text-lg font-bold text-rose-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailModal.report.compensation.compensation_amount)}</p>
                      </div>

                      {/* Hiển thị QR nhận tiền của khách hàng */}
                      {detailModal.report.compensation.qr_image ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">QR tài khoản nhận tiền (KH cung cấp)</h4>
                          <a href={detailModal.report.compensation.qr_image} target="_blank" rel="noreferrer" className="block w-32 h-auto rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors">
                            <img src={detailModal.report.compensation.qr_image} alt="Customer QR" className="w-full object-cover" />
                          </a>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">QR tài khoản nhận tiền</h4>
                          <div className="bg-slate-50 text-slate-500 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            Khách hàng chưa tải lên ảnh QR nhận tiền
                          </div>
                        </div>
                      )}

                      {detailModal.report.compensation.transfer_image ? (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                          <a href={detailModal.report.compensation.transfer_image} target="_blank" rel="noreferrer" className="block w-32 h-auto rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors">
                            <img src={detailModal.report.compensation.transfer_image} alt="Transfer bill" className="w-full object-cover" />
                          </a>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">Ảnh bill chuyển khoản</h4>
                          <div className="bg-amber-50 text-amber-600 px-3 py-2 rounded-lg border border-amber-200 text-sm font-medium">
                            <AlertTriangle size={16} className="inline mr-1" />
                            Chưa có bill chuyển khoản
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Chữ ký xác nhận đền bù</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {detailModal.report.compensation.admin_signature && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-xs text-slate-500 font-medium block mb-1">Đại diện cửa hàng</span>
                            <img src={detailModal.report.compensation.admin_signature} alt="Admin signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                          </div>
                        )}
                        {detailModal.report.compensation.customer_signature && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-xs text-slate-500 font-medium block mb-1">Ký cam kết (KH)</span>
                            <img src={detailModal.report.compensation.customer_signature} alt="Customer signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                          </div>
                        )}
                      </div>

                      {detailModal.report.compensation.customer_signature_confirm ? (
                        <div className="mt-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                          <span className="text-xs text-emerald-600 font-bold block mb-1">Chữ ký nhận tiền (KH)</span>
                          <img src={detailModal.report.compensation.customer_signature_confirm} alt="Customer signature confirm" className="h-12 mx-auto object-contain mix-blend-multiply" />
                        </div>
                      ) : (
                        <div className="mt-4 bg-amber-50/30 text-amber-600 px-3 py-2.5 rounded-xl border border-amber-100 text-xs text-center font-medium">
                          Chờ khách hàng nhận tiền & ký xác nhận hoàn tất
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Kết quả xử lý Từ chối */}
              {detailModal.report?.status === 'rejected' && (
                <div className="mt-6 bg-white p-5 rounded-xl border border-rose-200 shadow-sm">
                  <h3 className="text-base font-bold text-rose-700 border-b border-rose-100 pb-2 flex items-center gap-2 mb-4">
                    <XCircle size={18} />
                    Biên bản từ chối khiếu nại
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Lí do từ chối</h4>
                      <p className="text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100 whitespace-pre-wrap">{detailModal.report.reject_details?.reason || detailModal.report.reject_reason || 'Không có lí do'}</p>
                    </div>

                    {(detailModal.report.reject_details?.admin_signature || detailModal.report.reject_details?.customer_signature) && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Chữ ký xác nhận</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {detailModal.report.reject_details.admin_signature && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Đại diện cửa hàng</span>
                              <img src={detailModal.report.reject_details.admin_signature} alt="Admin signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                            </div>
                          )}
                          {detailModal.report.reject_details.customer_signature && (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-xs text-slate-500 font-medium block mb-1">Khách hàng</span>
                              <img src={detailModal.report.reject_details.customer_signature} alt="Customer signature" className="h-12 mx-auto object-contain mix-blend-multiply" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {detailModal.report?.isConfirm && (
                  <button
                    onClick={() => handleDelete(detailModal._id)}
                    className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-semibold hover:bg-rose-50 transition flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Xoá báo cáo
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailModal(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg text-sm transition"
                >
                  Đóng
                </button>
                {!detailModal.report?.isConfirm && (
                  <>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-semibold hover:bg-rose-50 transition flex items-center gap-2"
                    >
                      Từ chối khiếu nại
                    </button>
                    <button
                      onClick={() => setCompensationModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle size={16} />
                      Chấp nhận đền bù
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Đơn đặt lịch */}
      <BookingDetailModal
        booking={bookingDetailItem}
        isOpen={!!bookingDetailItem}
        onClose={() => setBookingDetailItem(null)}
        hideStaffActions={true}
      />

      {detailModal && (
        <CompensationModal
          isOpen={compensationModalOpen}
          onClose={() => setCompensationModalOpen(false)}
          appointmentId={detailModal._id}
          customer={appointmentDetail?.customer}
          onSuccess={() => {
            setCompensationModalOpen(false)
            setDetailModal(null)
            fetchReports(page, activeTab)
          }}
        />
      )}

      {/* Rejection Modal */}
      {detailModal && (
        <RejectModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          appointmentId={detailModal._id}
          onSuccess={() => {
            setRejectModalOpen(false)
            setDetailModal(null)
            fetchReports(page, activeTab)
          }}
        />
      )}
      {/* Preview Bill Modal */}
      {previewBillModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Xác nhận ảnh chuyển khoản</h2>
              <button
                onClick={() => setPreviewBillModal(null)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <p className="text-sm text-slate-600 mb-4 text-center font-medium">Bản xem trước hình ảnh biên lai tải lên</p>
              <div className="w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 shadow-sm mb-4">
                <img src={previewBillModal.base64} alt="Preview" className="w-full h-auto" />
              </div>

              <div className="w-full max-w-sm bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 leading-none">Kiểm tra độ tin cậy AI</h4>
                  </div>
                </div>
                <button type="button" className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition-colors">
                  Kiểm tra
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setPreviewBillModal(null)}
                className="px-5 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy thay đổi
              </button>
              <button
                onClick={confirmUploadBill}
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Xác nhận tải lên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
