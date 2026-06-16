import React, { useEffect, useState, useRef } from 'react'
import { Banknote, ShieldCheck, X, RefreshCw, QrCode } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import type { BookingListResult } from '../../services/bookingService'
import { invoiceService, type Invoice } from '../../services/invoiceService'
import type { WashBooking } from '../../types/booking'
import { showError, showSuccess } from '../../utils/toast'
import { useAuth } from '../../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'

export default function StaffPaymentsPage() {
    const { user } = useAuth()
    const [data, setData] = useState<BookingListResult>({ items: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [payingBooking, setPayingBooking] = useState<WashBooking | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash')

    // Payment state
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | null>(null)
    const pollingRef = useRef<number | null>(null)

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
        return () => stopPolling()
    }, [])

    const stopPolling = () => {
        if (pollingRef.current) {
            window.clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }

    const openPaymentModal = async (b: WashBooking) => {
        setPayingBooking(b)
        setPaymentMethod('bank')
        setPaymentMode(null)
        setInvoice(null)
        setIsProcessing(true)
        try {
            const inv = await invoiceService.createInvoice(b._id || b.id!)
            setInvoice(inv)
        } catch (err: any) {
            if (err.message && err.message.toLowerCase().includes('tồn tại')) {
                showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
            } else {
                showError(err.message || 'Không thể tạo hoá đơn');
            }
            setPayingBooking(null)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConfirmCash = async () => {
        if (!invoice || !user) return
        setIsProcessing(true)
        try {
            await invoiceService.confirmCash(invoice._id, (user as any).id || (user as any)._id)
            showSuccess('Thanh toán tiền mặt thành công!')
            setPayingBooking(null)
            fetchBookings()
        } catch (err: any) {
            showError(err.message || 'Lỗi khi xác nhận tiền mặt')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCreateQR = async () => {
        if (!invoice) return
        setIsProcessing(true)
        try {
            const inv = await invoiceService.createPaymentLink(invoice._id)
            setInvoice(inv)
            setPaymentMode('qr')
            // Bắt đầu polling ngầm
            pollingRef.current = window.setInterval(async () => {
                try {
                    const synced = await invoiceService.syncPaymentStatus(invoice._id)
                    if (synced.invoice_status === 'paid') {
                        stopPolling()
                        showSuccess('Khách đã chuyển khoản thành công!')
                        setPayingBooking(null)
                        fetchBookings()
                    }
                } catch (e) {
                    // ignore polling errors
                }
            }, 3000)
        } catch (err: any) {
            showError(err.message || 'Lỗi khi tạo mã QR PayOS')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCancelQR = async () => {
        if (!invoice) return
        stopPolling()
        setIsProcessing(true)
        try {
            const inv = await invoiceService.cancelPaymentLink(invoice._id, 'Khách đổi phương thức')
            setInvoice(inv)
            setPaymentMode(null)
        } catch (err: any) {
            showError(err.message || 'Lỗi khi huỷ QR')
        } finally {
            setIsProcessing(false)
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return <span className="text-emerald-500 font-medium">Hoàn thành</span>
            case 'in_progress': return <span className="text-purple-500 font-medium">Đang thực hiện</span>
            default: return status
        }
    }

    // Ở đây mình lấy in_progress (hoặc completed nếu cần thanh toán sau)
    const filteredItems = data.items.filter((b: WashBooking) => b.booking_status === 'in_progress' || b.booking_status === 'completed');

    return (
        <div className="admin-page">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Thanh toán</h1>
                    <p className="admin-page__subtitle">Xử lý thanh toán tại quầy cho các dịch vụ.</p>
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
                                    <td colSpan={6} className="admin-empty-text py-10"><RefreshCw className="animate-spin text-[#0ea5b7] mx-auto" /></td>
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
                                        <tr className="admin-table__row hover:bg-slate-50">
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
                                                        {isExpanded ? 'Đóng' : 'Chi tiết'}
                                                    </button>
                                                    {b.booking_status === 'completed' ? (
                                                        <span className="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            Đã thanh toán
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openPaymentModal(b)}
                                                            disabled={isProcessing}
                                                            className={`text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                                        >
                                                            Thanh toán
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

            {/* Payment Modal Mới đã tích hợp API */}
            {payingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Thanh toán hóa đơn</h3>
                            <button onClick={() => { setPayingBooking(null); stopPolling(); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {isProcessing && !invoice ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={32} className="animate-spin text-[#0ea5b7]" />
                                <p className="text-slate-500 font-medium">Đang tạo hoá đơn...</p>
                            </div>
                        ) : invoice ? (
                            <div className="p-6 space-y-6">
                                <div className="bg-[#0ea5b7] text-white rounded-xl p-5 shadow-lg shadow-cyan-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                                    <h4 className="font-bold text-cyan-50 mb-4 uppercase tracking-widest text-xs relative z-10">Tổng thanh toán</h4>
                                    <div className="relative z-10 flex justify-between items-end">
                                        <div>
                                            <div className="text-xs text-cyan-100 mb-1">Mã đơn: {(payingBooking._id ?? payingBooking.id!)?.slice(-6).toUpperCase()}</div>
                                            <div className="text-sm text-cyan-100">{payingBooking.vehicle?.plate_number}</div>
                                        </div>
                                        <div className="text-3xl font-black">{invoice.total.toLocaleString('vi-VN')} đ</div>
                                    </div>
                                </div>

                                {!paymentMode ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={handleCreateQR}
                                            disabled={isProcessing}
                                            className="flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-xl border-slate-200 hover:bg-cyan-50 hover:border-[#0ea5b7] text-slate-600 hover:text-[#0ea5b7] transition-all disabled:opacity-50"
                                        >
                                            <QrCode size={32} />
                                            <span className="font-medium text-sm">Chuyển khoản (QR)</span>
                                        </button>
                                        <button 
                                            onClick={handleConfirmCash}
                                            disabled={isProcessing}
                                            className="flex flex-col items-center justify-center gap-3 p-4 border-2 rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-500 text-slate-600 hover:text-emerald-600 transition-all disabled:opacity-50"
                                        >
                                            <ShieldCheck size={32} />
                                            <span className="font-medium text-sm">Tiền mặt tại quầy</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4">
                                            {invoice.qr_code && invoice.qr_code.startsWith('data:image') ? (
                                                <img src={invoice.qr_code} alt="QR Code" className="w-48 h-48" />
                                            ) : invoice.qr_code ? (
                                                <QRCodeSVG value={invoice.qr_code} size={192} />
                                            ) : (
                                                <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">
                                                    <RefreshCw className="animate-spin text-[#0ea5b7]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 text-center mb-3">Khách hàng quét mã QR để thanh toán qua PayOS</p>
                                        
                                        <div className="flex items-center gap-2 text-[#0ea5b7] text-sm font-medium mb-5 bg-cyan-50 px-4 py-2 rounded-full">
                                            <RefreshCw size={14} className="animate-spin" /> Đang chờ thanh toán...
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            {invoice.checkout_url && (
                                                <button 
                                                    onClick={() => window.open(invoice.checkout_url, '_blank')}
                                                    className="text-white bg-[#0ea5b7] hover:bg-[#0c8e9d] px-4 py-2 rounded-lg text-sm font-medium transition shadow-md shadow-cyan-200"
                                                >
                                                    Mở link PayOS (Test)
                                                </button>
                                            )}
                                            <button 
                                                onClick={handleCancelQR}
                                                className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition"
                                            >
                                                Huỷ mã QR
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}
