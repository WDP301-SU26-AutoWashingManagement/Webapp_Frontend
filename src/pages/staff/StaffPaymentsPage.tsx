import React, { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
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
    const [searchQuery, setSearchQuery] = useState('')
    const limit = 8

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

    const filteredItems = data.items.filter((b: WashBooking) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim()
            const plate = b.vehicle?.plate_number?.toLowerCase() || ''
            const id = (b._id ?? b.id!)?.toLowerCase() || ''
            const shortId = id.slice(-6)
            if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false
        }
        return true
    });
    const totalPages = Math.ceil((data.total || 0) / limit);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
            }
        }
        return pages;
    }

    return (
        <div className="admin-page max-w-full px-4 lg:px-8">
            <div className="admin-page__header flex justify-between items-end">
                <div>
                    <h1 className="admin-page__title text-2xl">Lịch hẹn hoàn thành</h1>
                    <p className="admin-page__subtitle">Danh sách các lịch hẹn đã hoàn thành và thanh toán.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm mã đơn, biển số xe..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 bg-white shadow-sm min-w-[220px]"
                        />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 bg-white shadow-sm"
                    />
                    <button
                        onClick={() => fetchBookings(page, selectedDate)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all text-sm font-semibold shadow-sm"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : ''} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[500px] overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 text-lg">Danh sách giao dịch</h2>
                    <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                        {data.total} giao dịch
                    </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-bold">Mã HĐ</th>
                                <th className="px-5 py-4 font-bold">Thời gian</th>
                                <th className="px-5 py-4 font-bold">Khách hàng / Xe</th>
                                <th className="px-5 py-4 font-bold">Dịch vụ</th>
                                <th className="px-5 py-4 font-bold">Tổng thanh toán</th>
                                <th className="px-5 py-4 font-bold">Trạng thái</th>
                                <th className="px-5 py-4 font-bold text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center"><RefreshCw className="animate-spin text-blue-500 mx-auto" /></td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">Chưa có giao dịch nào hoàn thành.</td>
                                </tr>
                            ) : (
                                filteredItems.map((b: WashBooking) => {
                                    const id = (b._id ?? b.id!).slice(-6).toUpperCase()

                                    return (
                                        <tr
                                            key={b._id || b.id}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-slate-900">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs font-medium text-slate-500">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-800">{b.vehicle?.plate_number || 'N/A'}</div>
                                                {b.customer?.full_name && (
                                                    <div className="text-xs font-medium text-slate-500 mt-0.5">{b.customer.full_name}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-700 max-w-[200px] truncate">
                                                    {b.service_package?.name || b.service_package?.service_name || 'Dịch vụ'}
                                                </div>
                                                {b.customer?.tier_id && (
                                                    <div className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wide">
                                                        Hạng: {b.customer.tier_id.tier_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-black text-rose-500 text-base">
                                                    {(() => {
                                                        const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
                                                        const cachedTotal = paidInvoices[b._id || b.id!];
                                                        const displayedTotal = cachedTotal !== undefined ? cachedTotal : ((b.discount_amount !== undefined) ? (b.final_price ?? 0) : Math.max(0, (b.final_price ?? b.base_price ?? 0) - Math.round((b.final_price ?? b.base_price ?? 0) * ((b.customer?.tier_id?.discount_percentage || 0) / 100))));
                                                        return displayedTotal.toLocaleString('vi-VN');
                                                    })()} đ
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">
                                                        Đã thu tiền
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end items-center">
                                                    <button
                                                        onClick={() => setDetailModal(b)}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
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

                {/* Phân trang */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 mt-auto">
                        <div className="text-sm text-slate-500">
                            Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng số {data.total} đơn)
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 mr-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            {getPageNumbers().map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => typeof p === 'number' && setPage(p)}
                                    disabled={p === '...'}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                        page === p 
                                        ? 'bg-blue-500 text-white shadow-sm' 
                                        : p === '...' 
                                            ? 'text-slate-400 cursor-default' 
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 ml-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
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
