import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import PaymentModal from '../../components/PaymentModal'

export default function StaffCheckinPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'checkin'|'cancel'|'', booking: WashBooking|null}>({
        isOpen: false, action: '', booking: null
    })
    const [detailModal, setDetailModal] = useState<WashBooking | null>(null)
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

    const handleCheckin = async () => {
        if (!confirmModal.booking) return;
        try {
            await bookingService.checkin(confirmModal.booking._id || confirmModal.booking.id!)
            showSuccess('Đã nhận xe')
            setConfirmModal({ isOpen: false, action: '', booking: null })
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi nhận xe')
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return <span className="text-blue-500 font-medium">confirmed</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) =>
        b.booking_status === 'confirmed'
    );

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Checkin xe</h1>
                    <p className="admin-page__subtitle">Xác nhận nhận xe từ khách hàng khi khách mang xe tới.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Xe đợi Checkin</h2>
                </div>

                <div className="admin-table-wrap mt-2">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Thời gian</th>
                                <th>Biển số xe</th>
                                <th>Dịch vụ</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Đang tải...</td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Không có xe nào đang chờ nhận.</td>
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
                                            <td><div className="text-sm text-slate-600 truncate max-w-[200px]">{b.service_package?.name || b.service_package?.service_name || 'Dịch vụ lẻ'}</div></td>
                                            <td>{getStatusText(b.booking_status)}</td>
                                            <td>
                                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {b.booking_status === 'confirmed' && (
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, action: 'checkin', booking: b })}
                                                            className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition"
                                                        >
                                                            Nhận xe
                                                        </button>
                                                    )}
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

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Chuyển trạng thái</h2>
                        <p className="text-slate-600 mb-6 text-sm">Bạn có chắc Xe của khách đã tới cửa hàng và muốn <strong className="text-indigo-600">Nhận xe</strong> cho đơn <span className="font-bold">#{(confirmModal.booking?._id || confirmModal.booking?.id)?.slice(-6).toUpperCase()}</span>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({ isOpen: false, action: '', booking: null })} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Huỷ bỏ</button>
                            <button onClick={handleCheckin} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1">
                                <Check size={16} /> Chính xác
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal 
              isOpen={paymentModal.isOpen} 
              onClose={() => setPaymentModal({isOpen: false, booking: null})} 
              booking={paymentModal.booking!} 
              onSuccess={() => {
                setPaymentModal({isOpen: false, booking: null})
                fetchBookings()
              }}
            />

            <BookingDetailModal 
                booking={detailModal} 
                isOpen={!!detailModal} 
                onClose={() => setDetailModal(null)} 
                onPay={(b) => setPaymentModal({isOpen: true, booking: b})}
            />
        </div>
    )
}
