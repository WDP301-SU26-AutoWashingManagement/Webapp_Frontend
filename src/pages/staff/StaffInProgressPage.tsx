import React, { useEffect, useState } from 'react'
import { Banknote, PlayCircle, Check, RefreshCw } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import PaymentModal from '../../components/PaymentModal'

export default function StaffInProgressPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [detailModal, setDetailModal] = useState<WashBooking | null>(null)
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'start'|'complete'|'', booking: WashBooking|null}>({isOpen: false, action: '', booking: null})
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

    useEffect(() => {
        fetchBookings()
    }, [])

    const handleStartWashing = async () => {
        if (!confirmModal.booking) return;
        try {
            await bookingService.start(confirmModal.booking._id || confirmModal.booking.id!)
            showSuccess('Bắt đầu làm dịch vụ thành công')
            setConfirmModal({isOpen: false, action: '', booking: null})
            fetchBookings()
        } catch (err: any) {
            showError(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
        }
    }

    const openPaymentModal = (b: WashBooking) => {
        setPaymentModal({isOpen: true, booking: b})
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
            case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang thực hiện</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) => b.booking_status === 'checked_in' || b.booking_status === 'in_progress');

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Đang xử lý</h1>
                    <p className="admin-page__subtitle">Theo dõi xe đang rửa và tiến hành thanh toán khi xong.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Xe đang xử lý tại xưởng</h2>
                </div>
                
                <div className="admin-table-wrap mt-2">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Thời gian</th>
                                <th>Biển số xe</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-[#0ea5b7] mx-auto" /></td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Không có xe nào đang xử lý.</td>
                                </tr>
                            ) : (
                                filteredItems.map((b: WashBooking) => {
                                    const id = (b._id ?? b.id!).slice(-6).toUpperCase()

                                    return (
                                    <tr 
                                        key={b._id || b.id} 
                                        onClick={() => setDetailModal(b)}
                                        className="admin-table__row group hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <td><div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div></td>
                                        <td>
                                            <div className="text-sm text-slate-900">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td><div className="text-sm font-bold text-slate-700">{b.vehicle?.plate_number || 'N/A'}</div></td>
                                        <td><div className="text-sm font-bold text-emerald-600">{b.final_price?.toLocaleString('vi-VN')} đ</div></td>
                                        <td>{getStatusText(b.booking_status)}</td>
                                        <td>
                                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                {b.booking_status === 'checked_in' ? (
                                                    <button
                                                        onClick={() => setConfirmModal({isOpen: true, action: 'start', booking: b})}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded bg-purple-500 text-white hover:bg-purple-600 transition shadow-sm flex items-center gap-1"
                                                    >
                                                        <PlayCircle size={14} /> Bắt đầu rửa
                                                    </button>
                                                ) : b.booking_status === 'in_progress' ? (
                                                    <button
                                                        onClick={() => openPaymentModal(b)}
                                                        className={`text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm flex items-center gap-1 bg-rose-50 text-rose-600 hover:bg-rose-100`}
                                                    >
                                                        <Banknote size={14} /> Thanh toán
                                                    </button>
                                                ) : null}
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

            {/* Payment Modal Mới đã tích hợp API */}
            <PaymentModal 
              isOpen={paymentModal.isOpen} 
              onClose={() => setPaymentModal({isOpen: false, booking: null})} 
              booking={paymentModal.booking!} 
              onSuccess={() => {
                setPaymentModal({isOpen: false, booking: null})
                fetchBookings()
              }}
            />

            {/* --- MODAL XÁC NHẬN BẮT ĐẦU RỬA --- */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Chuyển trạng thái</h2>
                        <p className="text-slate-600 mb-6 text-sm">Bạn có chắc chắn muốn xác nhận <strong className="text-purple-600">Bắt đầu làm dịch vụ</strong> cho xe <span className="font-bold">{confirmModal.booking?.vehicle?.plate_number}</span> (Đơn #{confirmModal.booking?._id?.slice(-6).toUpperCase()})?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({isOpen: false, action: '', booking: null})} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
                            <button onClick={handleStartWashing} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1">
                                <Check size={16} /> Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BookingDetailModal 
                booking={detailModal} 
                isOpen={!!detailModal} 
                onClose={() => setDetailModal(null)} 
                onPay={openPaymentModal}
            />
        </div>
    )
}
