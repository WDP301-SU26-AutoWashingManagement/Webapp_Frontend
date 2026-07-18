import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Search, Eye } from 'lucide-react';
import { showError } from '../utils/toast';
import { bookingService, type BookingListResult } from '../services/bookingService';
import type { WashBooking } from '../types/booking';
import BookingDetailModal from './BookingDetailModal';

export default function StaffWashingBookingCard() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);

    const [detailModal, setDetailModal] = useState<WashBooking | null>(null);

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];
        return { startDate: localISOTime, endDate: localISOTime };
    });

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };

            if (dateRange.startDate) {
                const start = new Date(dateRange.startDate);
                start.setHours(0, 0, 0, 0);
                params.from_date = start.toISOString();
            }
            if (dateRange.endDate) {
                const end = new Date(dateRange.endDate);
                end.setHours(23, 59, 59, 999);
                params.to_date = end.toISOString();
            }

            const res = await bookingService.getWashingBooking(params);
            setData(res);

        } catch (error) {
            showError('Không thể tải danh sách booking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [dateRange]);

    // Client-side search filtering
    const filteredItems = data.items.filter((b: WashBooking) => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            const plate = b.vehicle?.plate_number?.toLowerCase() || '';
            const id = (b._id ?? b.id!)?.toLowerCase() || '';
            const shortId = id.slice(-6);
            if (!plate.includes(q) && !shortId.includes(q) && !id.includes(q)) return false;
        }
        return true;
    });

    return (
        <div className="p-6 bg-slate-50 min-h-[calc(100vh-80px)] pb-20">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm mã đơn, biển số xe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-cyan-500 bg-white min-w-[200px]"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="text-sm text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                            />
                            <span className="text-slate-400 text-xs font-bold">→</span>
                            <input
                                type="date"
                                min={dateRange.startDate}
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="text-sm text-slate-700 outline-none bg-transparent cursor-pointer font-medium"
                            />
                        </div>

                        <button onClick={fetchBookings} className="flex items-center justify-center p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                            <RefreshCw size={16} className={loading ? 'animate-spin text-[#0ea5b7]' : ''} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10"><RefreshCw className="animate-spin text-cyan-500 mx-auto" size={30} /></div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200 font-medium">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</div>
                    ) : (
                        filteredItems.map((booking: WashBooking) => {
                            const id = (booking._id ?? booking.id!).slice(-6).toUpperCase();
                            const date = new Date(booking.scheduled_at);

                            return (
                                <div key={booking._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                                        {/* Info */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-xl font-extrabold text-slate-900">{booking.vehicle?.plate_number || 'N/A'}</h2>
                                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-xs border border-slate-200 shadow-sm">
                                                    #{id}
                                                </span>
                                                <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-semibold rounded-full truncate max-w-[200px]">
                                                    {booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ lẻ'}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-slate-500 text-sm mt-2 font-medium">
                                                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                                                <span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({date.toLocaleDateString('vi-VN')}) • Khách: <span className="text-slate-700 font-semibold">{booking.customer?.full_name || 'Khách vãng lai'}</span></span>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="shrink-0 flex items-center gap-3">
                                            <button
                                                onClick={() => { setDetailModal(booking) }}
                                                className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-sm font-semibold text-sm"
                                            >
                                                <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            <BookingDetailModal
                booking={detailModal}
                isOpen={!!detailModal}
                onClose={() => setDetailModal(null)}
            />
        </div>
    );
}
