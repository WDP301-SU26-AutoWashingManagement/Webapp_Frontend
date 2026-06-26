import React, { useEffect, useState } from 'react'
import { Banknote, PlayCircle, Check, RefreshCw, Eye, Search } from 'lucide-react'
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
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'start' | 'washed' | '', booking: WashBooking | null }>({ isOpen: false, action: '', booking: null })
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, booking: WashBooking | null }>({ isOpen: false, booking: null })
    const [searchQuery, setSearchQuery] = useState('')

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
            setConfirmModal({ isOpen: false, action: '', booking: null })
            fetchBookings()
        } catch (err: any) {
            showError(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
        }
    }

    const handleWashedBooking = async () => {
        if (!confirmModal.booking) return;
        try {
            await bookingService.washed(confirmModal.booking._id || confirmModal.booking.id!)
            showSuccess('Đã hoàn thành rửa xe')
            setConfirmModal({ isOpen: false, action: '', booking: null })
            fetchBookings()
        } catch (err: any) {
            showError(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái')
        }
    }

    const openPaymentModal = (b: WashBooking) => {
        setPaymentModal({ isOpen: true, booking: b })
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'checked_in': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-semibold">Đã nhận xe</span>
            case 'in_progress': return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-semibold">Đang rửa</span>
            case 'washed': return <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-semibold">Rửa xong</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim()
            const plate = b.vehicle?.plate_number?.toLowerCase() || ''
            const id = (b._id ?? b.id!)?.toLowerCase() || ''
            const shortId = id.slice(-6)
            if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false
        }
        return b.booking_status === 'checked_in' || b.booking_status === 'in_progress' || b.booking_status === 'washed'
    });

    return (
        <div className="admin-page">
            <div className="admin-page__header flex justify-between items-end">
                <div>
                    <h1 className="admin-page__title">Đang xử lý</h1>
                    <p className="admin-page__subtitle">Theo dõi xe đang rửa và tiến hành thanh toán khi xong.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm mã đơn, biển số xe..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white min-w-[220px]"
                        />
                    </div>
                    <button
                        onClick={() => fetchBookings()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-500' : ''} />
                        Làm mới
                    </button>
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
                                <th className="text-center">Hành động</th>
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
                                            className="admin-table__row group hover:bg-slate-50 transition-colors"
                                        >
                                            <td><div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div></td>
                                            <td>
                                                <div className="text-sm text-slate-900">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td><div className="text-sm font-bold text-slate-700">{b.vehicle?.plate_number || 'N/A'}</div></td>
                                            <td><div className="text-sm font-bold text-emerald-600">
                                                {(() => {
                                                    const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
                                                    const cachedTotal = paidInvoices[b._id || b.id!];
                                                    const displayedTotal = cachedTotal !== undefined ? cachedTotal : ((b.discount_amount !== undefined) ? (b.final_price ?? 0) : Math.max(0, (b.final_price ?? b.base_price ?? 0) - Math.round((b.final_price ?? b.base_price ?? 0) * ((b.customer?.tier_id?.discount_percentage || 0) / 100))));
                                                    return displayedTotal.toLocaleString('vi-VN');
                                                })()} đ
                                            </div></td>
                                            <td>{getStatusText(b.booking_status)}</td>
                                            <td>
                                                <div className="flex justify-center gap-2 items-center">
                                                    {b.booking_status === 'checked_in' ? (
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, action: 'start', booking: b })}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded bg-purple-500 text-white hover:bg-purple-600 transition shadow-sm flex items-center gap-1"
                                                        >
                                                            <PlayCircle size={14} /> Bắt đầu rửa
                                                        </button>
                                                    ) : b.booking_status === 'in_progress' ? (
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, action: 'washed', booking: b })}
                                                            className="text-xs font-semibold px-3 py-1.5 rounded bg-teal-500 text-white hover:bg-teal-600 transition shadow-sm flex items-center gap-1"
                                                        >
                                                            <Check size={14} /> Đã rửa xong
                                                        </button>
                                                    ) : b.booking_status === 'washed' ? (
                                                        <button
                                                            onClick={() => openPaymentModal(b)}
                                                            className={`text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm flex items-center gap-1 bg-rose-50 text-rose-600 hover:bg-rose-100`}
                                                        >
                                                            <Banknote size={14} /> Thanh toán
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() => setDetailModal(b)}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <Eye size={14} /> Chi tiết
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
            </div>

            {/* Payment Modal Mới đã tích hợp API */}
            <PaymentModal
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal({ isOpen: false, booking: null })}
                booking={paymentModal.booking!}
                onSuccess={() => {
                    setPaymentModal({ isOpen: false, booking: null })
                    fetchBookings()
                }}
            />

            {/* --- MODAL XÁC NHẬN CHUYỂN TRẠNG THÁI --- */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Xác nhận thao tác</h2>
                        <p className="text-slate-600 mb-6 text-sm">
                            Bạn có chắc chắn muốn xác nhận <strong className={confirmModal.action === 'start' ? "text-purple-600" : "text-teal-600"}>
                                {confirmModal.action === 'start' ? 'Bắt đầu làm dịch vụ' : 'Hoàn thành rửa xe'}
                            </strong> cho xe <span className="font-bold">{confirmModal.booking?.vehicle?.plate_number}</span> (Đơn #{confirmModal.booking?._id?.slice(-6).toUpperCase()})?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, action: '', booking: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
                            <button
                                onClick={confirmModal.action === 'start' ? handleStartWashing : handleWashedBooking}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-1 ${confirmModal.action === 'start' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-teal-600 hover:bg-teal-700'
                                    }`}
                            >
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
