import React, { useEffect, useState } from 'react'
import { Banknote, ShieldCheck, X } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'

export default function StaffBookingsPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')

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

    const handleConfirm = async (id: string) => {
        try {
            await bookingService.confirm(id)
            showSuccess('Đã xác nhận booking')
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi xác nhận booking')
        }
    }



    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return <span className="text-amber-500 font-medium">Chờ xác nhận</span>
            case 'confirmed': return <span className="text-blue-500 font-medium">Đã xác nhận</span>
            case 'checked_in': return <span className="text-indigo-500 font-medium">Đã nhận xe</span>
            case 'in_progress': return <span className="text-purple-500 font-medium">Đang thực hiện</span>
            case 'completed': return <span className="text-emerald-500 font-medium">Hoàn thành</span>
            case 'cancelled': return <span className="text-rose-500 font-medium">Đã hủy</span>
            default: return status
        }
    }

    const filteredItems = data.items.filter((b: WashBooking) => {
        if (activeTab === 'all') return true;
        return b.booking_status === 'pending';
    });

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Quản lý booking</h1>
                    <p className="admin-page__subtitle">Xem danh sách booking mới và xác nhận đơn cho khách.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Booking chờ xác nhận</h2>
                </div>

                <div className="flex gap-6 border-b border-slate-200 px-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('pending')} className={`font-medium text-sm pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-[#0ea5b7] text-[#0ea5b7]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Chờ xác nhận</button>
                    <button onClick={() => setActiveTab('all')} className={`font-medium text-sm pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-[#0ea5b7] text-[#0ea5b7]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Tất cả</button>
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
                                    <td colSpan={6} className="admin-empty-text">Chưa có booking nào trong mục này.</td>
                                </tr>
                            ) : (
                                filteredItems.map((b: WashBooking) => {
                                    const id = b._id ?? b.id!
                                    const isExpanded = expandedId === id

                                    return (
                                    <React.Fragment key={id}>
                                        <tr className="admin-table__row">
                                            <td><div className="text-sm font-medium text-slate-900">{id.slice(-6).toUpperCase()}</div></td>
                                            <td>
                                                <div className="text-sm text-slate-900">{new Date(b.scheduled_at).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs text-slate-500">{new Date(b.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td><div className="text-sm font-bold text-slate-700">{b.vehicle?.plate_number || 'N/A'}</div></td>
                                            <td><div className="text-sm text-slate-600 truncate max-w-[200px]">{b.service_package?.name || b.service_package?.service_name || 'Dịch vụ lẻ'}</div></td>
                                            <td>{getStatusText(b.booking_status)}</td>
                                            <td>
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : id)}
                                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline mr-2"
                                                    >
                                                        {isExpanded ? 'Đóng' : 'Chi tiết'}
                                                    </button>
                                                    {b.booking_status === 'pending' && (
                                                        <button
                                                            onClick={() => handleConfirm(id)}
                                                            className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition"
                                                        >
                                                            Xác nhận
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <td colSpan={6} className="p-4 shadow-inner">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Phương tiện</p>
                                                            <p className="font-semibold text-slate-800">{b.vehicle?.brand} {b.vehicle?.vehicle_model}</p>
                                                            <p className="text-slate-600">{b.vehicle?.plate_number}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Gói dịch vụ chính</p>
                                                            <p className="font-semibold text-slate-800">{b.service_package?.name || b.service_package?.service_name || 'Không có'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Giá trị đơn</p>
                                                            <p className="font-semibold text-emerald-600">{b.final_price?.toLocaleString('vi-VN')} đ</p>
                                                            {b.discount_amount ? <p className="text-rose-500 text-xs">Giảm: {b.discount_amount.toLocaleString('vi-VN')} đ</p> : null}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500 mb-1">Trạng thái</p>
                                                            <p>{getStatusText(b.booking_status)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
