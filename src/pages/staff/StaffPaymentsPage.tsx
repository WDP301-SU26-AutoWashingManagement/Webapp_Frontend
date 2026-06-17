import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'

export default function StaffPaymentsPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [detailModal, setDetailModal] = useState<WashBooking | null>(null)

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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return <span className="text-emerald-500 font-medium">Hoàn thành</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) => b.booking_status === 'completed');

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Lịch hẹn hoàn thành</h1>
                    <p className="admin-page__subtitle">Danh sách các lịch hẹn đã hoàn thành và thanh toán.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Đã thanh toán</h2>
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
                                    <td colSpan={6} className="admin-empty-text">Chưa có lịch hẹn nào hoàn thành.</td>
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
                                                <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        Đã thanh toán
                                                    </span>
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

            <BookingDetailModal 
                booking={detailModal} 
                isOpen={!!detailModal} 
                onClose={() => setDetailModal(null)} 
            />
        </div>
    )
}
