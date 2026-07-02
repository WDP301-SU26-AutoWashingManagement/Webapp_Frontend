import { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
import apiClient from '../../services/apiClient'
import { showError } from '../../utils/toast'
import BookingDetailModal from '../../components/BookingDetailModal'
import { useAuth } from '../../hooks/useAuth'
import { branchService, type Branch } from '../../services/branchService'
import { bookingService } from '../../services/bookingService'

export default function StaffTransactionHistoryPage() {
    const { user } = useAuth()
    const isBoss = user?.role === 'boss'
    const [branches, setBranches] = useState<Branch[]>([])
    const [selectedBranch, setSelectedBranch] = useState<string>('all')
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
    const [detailModal, setDetailModal] = useState<any | null>(null)
    const [page, setPage] = useState(1)
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
    const [searchQuery, setSearchQuery] = useState('')
    const limit = 8

    useEffect(() => {
        if (isBoss) {
            branchService.list().then(res => setBranches(res)).catch(() => {})
        }
    }, [isBoss])

    const fetchBookings = async (range: { startDate: string, endDate: string }, branchId: string) => {
        setLoading(true)
        try {
            const body: any = {}
            if (range.startDate) {
                const start = new Date(range.startDate);
                start.setHours(0, 0, 0, 0);
                body.startDate = start.toISOString();
            }
            if (range.endDate) {
                const end = new Date(range.endDate);
                end.setHours(23, 59, 59, 999);
                body.endDate = end.toISOString();
            }
            if (branchId !== 'all') {
                body.branch_id = branchId;
            }
            const res = await apiClient.post<{ data: any[] }>('/admin/paid-bookings', body)
            setData(res.data || [])
            setPage(1)
        } catch (error) {
            showError('Không thể tải lịch sử giao dịch')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings(dateRange, selectedBranch)
    }, [dateRange, selectedBranch])

    const filteredItems = data.filter((b: any) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim()
            const plate = b.vehicle?.plate_number?.toLowerCase() || ''
            const id = (b._id ?? b.id!)?.toLowerCase() || ''
            const shortId = id.slice(-6)
            if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false
        }
        return true
    });
    
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / limit));
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);
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
                    <h1 className="admin-page__title text-2xl">Lịch sử giao dịch</h1>
                    <p className="admin-page__subtitle">Danh sách các hóa đơn đã thu tiền của khách theo thời gian thanh toán thực tế.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isBoss && (
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl bg-white shadow-sm font-medium text-slate-700 outline-none focus:border-blue-500 min-w-[200px]"
                        >
                            <option value="all">Tất cả chi nhánh</option>
                            {branches.map(b => (
                                <option key={b._id || b.id} value={b._id || b.id}>
                                    {b.branch_address?.street ? `${b.branch_address.street}, ${b.branch_address.district}` : (b._id || b.id)}
                                </option>
                            ))}
                        </select>
                    )}
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
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => {
                                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 bg-white shadow-sm"
                        />
                        <span className="text-slate-400 text-xs font-semibold">→</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => {
                                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 bg-white shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => fetchBookings(dateRange, selectedBranch)}
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
                    <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                        {filteredItems.length} giao dịch
                    </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-bold">Mã HĐ</th>
                                <th className="px-5 py-4 font-bold">Thanh toán lúc</th>
                                <th className="px-5 py-4 font-bold">Lịch hẹn</th>
                                <th className="px-5 py-4 font-bold">Khách hàng / Xe</th>
                                <th className="px-5 py-4 font-bold">Dịch vụ</th>
                                <th className="px-5 py-4 font-bold">Số tiền thu</th>
                                <th className="px-5 py-4 font-bold text-center">Thao tác</th>
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
                                paginatedItems.map((b: any) => {
                                    const id = (b.appointment?._id ?? b._id ?? '').slice(-6).toUpperCase()
                                    const paidAt = b.paid_at ? new Date(b.paid_at) : null;
                                    const scheduledAt = b.appointment?.scheduled_at ? new Date(b.appointment.scheduled_at) : null;

                                    return (
                                        <tr
                                            key={b._id || b.id}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{id}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {paidAt ? (
                                                    <>
                                                        <div className="font-medium text-emerald-600">{paidAt.toLocaleDateString('vi-VN')}</div>
                                                        <div className="text-xs font-bold text-emerald-500">{paidAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                {scheduledAt ? (
                                                    <>
                                                        <div className="font-medium text-slate-600">{scheduledAt.toLocaleDateString('vi-VN')}</div>
                                                        <div className="text-xs text-slate-400">{scheduledAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-800">{b.vehicle?.license_plate || b.vehicle?.plate_number || 'N/A'}</div>
                                                {b.customer?.full_name && (
                                                    <div className="text-xs font-medium text-slate-500 mt-0.5">{b.customer.full_name}</div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-700 max-w-[200px] truncate">
                                                    {b.service_package?.package_name || b.service_package?.name || b.service_package?.service_name || 'Dịch vụ'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-black text-rose-500 text-base">
                                                    {(b.total || 0).toLocaleString('vi-VN')} đ
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center items-center">
                                                    <button
                                                        disabled={loadingDetailId === b._id}
                                                        onClick={async () => {
                                                            setLoadingDetailId(b._id);
                                                            try {
                                                                const appointmentId = b.appointment_id || b.appointment?._id || b._id;
                                                                const fullBooking = await bookingService.getById(appointmentId);
                                                                
                                                                // Sync financial data exactly as Invoice calculated
                                                                fullBooking.base_price = b.subtotal;
                                                                fullBooking.discount_amount = b.discount_amount;
                                                                fullBooking.final_price = b.total;
                                                                
                                                                setDetailModal(fullBooking);
                                                            } catch (err) {
                                                                showError('Không thể tải chi tiết lịch hẹn');
                                                            } finally {
                                                                setLoadingDetailId(null);
                                                            }
                                                        }}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {loadingDetailId === b._id ? (
                                                            <RefreshCw size={14} className="animate-spin" />
                                                        ) : (
                                                            <Eye size={14} /> 
                                                        )}
                                                        Chi tiết
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
                            Hiển thị trang <span className="font-semibold text-slate-900">{page}</span> / <span className="font-semibold text-slate-900">{totalPages}</span> (Tổng số {filteredItems.length} đơn)
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
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p
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
