import React, { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { bookingService, type BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'

export default function StaffPaymentsPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [detailModal, setDetailModal] = useState<WashBooking | null>(null)
    const [page, setPage] = useState(1)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const limit = 10

    const fetchBookings = async (currentPage: number, dateStr: string) => {
        setLoading(true)
        try {
            const params: any = { page: currentPage, limit, booking_status: 'completed' }
            if (dateStr) {
                const start = new Date(dateStr);
                start.setHours(0, 0, 0, 0);
                const end = new Date(dateStr);
                end.setHours(23, 59, 59, 999);
                params.from_date = start.toISOString();
                params.to_date = end.toISOString();
            }
            const res = await bookingService.list(params)
            setData(res)
        } catch (error) {
            showError('Không thể tải danh sách booking')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings(page, selectedDate)
    }, [page, selectedDate])

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return <span className="text-emerald-500 font-medium">completed</span>
            default: return status
        }
    }

    const filteredItems = data.items;
    const totalPages = Math.ceil((data.total || 0) / limit);

    return (
        <div className="admin-page">
            <div className="admin-page__header flex justify-between items-end">
                <div>
                    <h1 className="admin-page__title">Lịch hẹn hoàn thành</h1>
                    <p className="admin-page__subtitle">Danh sách các lịch hẹn đã hoàn thành và thanh toán.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
                    />
                    <button
                        onClick={() => fetchBookings(page, selectedDate)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="admin-card flex flex-col min-h-[500px]">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Đã thanh toán</h2>
                </div>
                
                <div className="admin-table-wrap mt-2 flex-1">
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

                {/* Phân trang */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 mt-auto">
                        <div className="text-sm text-slate-500">
                            Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng số {data.total} đơn)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BookingDetailModal 
                booking={detailModal} 
                isOpen={!!detailModal} 
                onClose={() => setDetailModal(null)} 
            />
        </div>
    )
}
