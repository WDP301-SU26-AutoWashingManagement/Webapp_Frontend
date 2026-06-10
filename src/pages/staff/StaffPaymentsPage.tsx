import React, { useEffect, useState } from 'react'
import { Banknote, ShieldCheck, X } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'

export default function StaffPaymentsPage() {
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [payingBooking, setPayingBooking] = useState<WashBooking | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash')

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

    const handleConfirmPayment = () => {
        // Todo: Integrate with backend invoice / payment API
        showSuccess('Đã xác nhận thanh toán thành công!')
        setPayingBooking(null)
        // fetchBookings() might be needed if we update status to PAID in the future
    }

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
                    <h1 className="admin-page__title">Thanh toán</h1>
                    <p className="admin-page__subtitle">Xử lý thanh toán tại quầy cho các dịch vụ đã hoàn thành.</p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-card__header pb-2">
                    <h2 className="admin-card__title">Đơn chờ thanh toán</h2>
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
                                    <td colSpan={6} className="admin-empty-text">Đang tải...</td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr className="admin-table__row">
                                    <td colSpan={6} className="admin-empty-text">Không có đơn nào chờ thanh toán.</td>
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
                                            <td><div className="text-sm font-bold text-emerald-600">{b.final_price?.toLocaleString('vi-VN')} đ</div></td>
                                            <td>{getStatusText(b.booking_status)}</td>
                                            <td>
                                                <div className="flex gap-2 items-center">
                                                    <button
                                                        onClick={() => setExpandedId(isExpanded ? null : id)}
                                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline mr-2"
                                                    >
                                                        {isExpanded ? 'Chi tiết' : 'Chi tiết'}
                                                    </button>
                                                    <button
                                                        onClick={() => setPayingBooking(b)}
                                                        className="text-xs font-semibold bg-rose-50 text-rose-600 px-3 py-1.5 rounded hover:bg-rose-100 transition"
                                                    >
                                                        Thanh toán
                                                    </button>
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
                                                            <p className="text-slate-500 mb-1">Giảm giá</p>
                                                            <p className="text-rose-500">{b.discount_amount ? `- ${b.discount_amount.toLocaleString('vi-VN')} đ` : '0 đ'}</p>
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

            {/* Payment Modal */}
            {payingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Thanh toán hóa đơn</h3>
                            <button onClick={() => setPayingBooking(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-[#0ea5b7] text-white rounded-xl p-5 shadow-lg shadow-cyan-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                                <h4 className="font-bold text-cyan-50 mb-4 uppercase tracking-widest text-xs relative z-10">Tổng thanh toán</h4>
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <div className="text-xs text-cyan-100 mb-1">Mã đơn: {(payingBooking._id ?? payingBooking.id!)?.slice(-6).toUpperCase()}</div>
                                        <div className="text-sm text-cyan-100">{payingBooking.vehicle?.plate_number}</div>
                                    </div>
                                    <div className="text-3xl font-black">{payingBooking.final_price?.toLocaleString('vi-VN')} đ</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 text-sm">Phương thức thanh toán</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all ${paymentMethod === 'bank' ? 'border-[#0ea5b7] bg-cyan-50 text-[#0ea5b7]' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
                                        <input type="radio" name="payment" value="bank" className="sr-only" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                                        <Banknote size={28} className={paymentMethod === 'bank' ? 'text-[#0ea5b7]' : 'text-slate-400'} />
                                        <span className="font-medium text-sm text-center">Chuyển khoản (QR)</span>
                                    </label>
                                    <label className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-xl transition-all ${paymentMethod === 'cash' ? 'border-[#0ea5b7] bg-cyan-50 text-[#0ea5b7]' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
                                        <input type="radio" name="payment" value="cash" className="sr-only" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                                        <ShieldCheck size={28} className={paymentMethod === 'cash' ? 'text-[#0ea5b7]' : 'text-slate-400'} />
                                        <span className="font-medium text-sm text-center">Tiền mặt tại quầy</span>
                                    </label>
                                </div>
                            </div>

                            {paymentMethod === 'bank' && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center flex-col gap-2">
                                    <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                        [QR Code]
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">Khách hàng quét mã QR để thanh toán qua PayOS</p>
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setPayingBooking(null)} className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition">
                                Đóng
                            </button>
                            <button onClick={handleConfirmPayment} className="px-5 py-2.5 rounded-lg bg-[#0ea5b7] text-white font-bold hover:bg-[#0c8e9d] transition shadow-md shadow-cyan-200">
                                Xác nhận đã thu tiền
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
