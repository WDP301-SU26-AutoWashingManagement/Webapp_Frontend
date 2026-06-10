import React, { useEffect, useState } from 'react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'

export default function StaffCheckinPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

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

    const handleCheckin = async (id: string) => {
        try {
            await bookingService.checkin(id)
            showSuccess('Đã nhận xe')
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi nhận xe')
        }
    }

    const handleStart = async (id: string) => {
        try {
            await bookingService.start(id)
            showSuccess('Đã bắt đầu dịch vụ')
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi bắt đầu dịch vụ')
        }
    }

    const handleComplete = async (b: WashBooking) => {
        const id = b._id ?? b.id!
        try {
            await bookingService.complete(id)
            showSuccess('Đã hoàn thành dịch vụ')
            fetchBookings()
        } catch (error) {
            showError('Lỗi khi hoàn thành dịch vụ')
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

    const filteredItems = data.items.filter((b: WashBooking) => 
        ['confirmed', 'checked_in', 'in_progress'].includes(b.booking_status)
    );

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Checkin & Quy trình</h1>
                    <p className="admin-page__subtitle">Nhận xe, theo dõi quá trình rửa xe của kỹ thuật viên.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Xe đang thực hiện</h2>
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
                                    <td colSpan={6} className="admin-empty-text">Không có xe nào đang thực hiện.</td>
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
                                                    {b.booking_status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleCheckin(id)}
                                                            className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition"
                                                        >
                                                            Nhận xe
                                                        </button>
                                                    )}
                                                    {b.booking_status === 'checked_in' && (
                                                        <button
                                                            onClick={() => handleStart(id)}
                                                            className="text-xs font-semibold bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100 transition"
                                                        >
                                                            Bắt đầu
                                                        </button>
                                                    )}
                                                    {b.booking_status === 'in_progress' && (
                                                        <button
                                                            onClick={() => handleComplete(b)}
                                                            className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded hover:bg-emerald-100 transition"
                                                        >
                                                            Hoàn thành
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
