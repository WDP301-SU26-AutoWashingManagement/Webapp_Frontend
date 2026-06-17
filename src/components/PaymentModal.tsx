import React, { useEffect, useState, useRef } from 'react'
import { X, CreditCard, RefreshCw, Banknote, QrCode } from 'lucide-react'
import { invoiceService, type Invoice } from '../services/invoiceService'
import type { WashBooking } from '../types/booking'
import { showError, showSuccess } from '../utils/toast'
import { useAuth } from '../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: WashBooking
  onSuccess: () => void
}

export default function PaymentModal({ isOpen, onClose, booking, onSuccess }: PaymentModalProps) {
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | null>(null)
  const pollingRef = useRef<number | null>(null)

  const createPromiseRef = useRef<Promise<any> | null>(null)

  // Tạo invoice khi mở modal
  useEffect(() => {
    if (isOpen && booking && !invoice) {
      if (!createPromiseRef.current) {
        setLoading(true)
        createPromiseRef.current = invoiceService.createInvoice(booking._id || booking.id!)
          .then(inv => {
            setInvoice(inv)
          })
          .catch(err => {
            if (err.message && err.message.toLowerCase().includes('tồn tại')) {
              showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
            } else {
              showError(err.message || 'Không thể tạo hoá đơn')
            }
            onClose()
          })
          .finally(() => {
            setLoading(false)
          })
      }
    }
    
    if (!isOpen) {
      // Reset ref khi đóng modal để lần sau mở lại có thể tạo (nếu cần)
      createPromiseRef.current = null
      stopPolling()
      setInvoice(null)
      setPaymentMode(null)
    }
  }, [isOpen, booking, invoice])

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handleConfirmCash = async () => {
    if (!invoice || !user) return
    setLoading(true)
    try {
      await invoiceService.confirmCash(invoice._id, (user as any).id || (user as any)._id)
      showSuccess('Thanh toán tiền mặt thành công!')
      onSuccess()
      onClose()
    } catch (err: any) {
      showError(err.message || 'Lỗi khi xác nhận tiền mặt')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQR = async () => {
    if (!invoice) return
    setLoading(true)
    try {
      const inv = await invoiceService.createPaymentLink(invoice._id)
      setInvoice(inv)
      setPaymentMode('qr')
      // Start polling
      pollingRef.current = window.setInterval(async () => {
        try {
          const synced = await invoiceService.syncPaymentStatus(invoice._id)
          if (synced.invoice_status === 'paid') {
            stopPolling()
            showSuccess('Khách đã chuyển khoản thành công!')
            onSuccess()
            onClose()
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000)
    } catch (err: any) {
      showError(err.message || 'Lỗi khi tạo mã QR PayOS')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelQR = async () => {
    if (!invoice) return
    stopPolling()
    setLoading(true)
    try {
      const inv = await invoiceService.cancelPaymentLink(invoice._id, 'Khách đổi phương thức')
      setInvoice(inv)
      setPaymentMode(null)
    } catch (err: any) {
      showError(err.message || 'Lỗi khi huỷ QR')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard size={22} className="text-blue-500" /> Thanh toán
        </h2>

        {loading && !invoice ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : invoice ? (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-700">{booking.vehicle?.plate_number}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Dịch vụ:</span>
                <span className="font-semibold text-slate-700">{booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ'}</span>
              </div>
              <div className="border-t border-slate-200 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-rose-500">{invoice.total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Chế độ chọn phương thức */}
            {!paymentMode && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleConfirmCash}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-slate-600 hover:text-emerald-600 font-semibold disabled:opacity-50"
                >
                  <Banknote size={28} />
                  <span>Tiền mặt</span>
                </button>
                <button 
                  onClick={handleCreateQR}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600 font-semibold disabled:opacity-50"
                >
                  <QrCode size={28} />
                  <span>Quét mã QR</span>
                </button>
              </div>
            )}

            {/* Chế độ đang quét QR */}
            {paymentMode === 'qr' && (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-slate-500 mb-3 text-center">Khách hàng quét mã QR dưới đây qua ứng dụng ngân hàng</p>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4">
                  {invoice.qr_code && invoice.qr_code.startsWith('data:image') ? (
                    <img src={invoice.qr_code} alt="QR Code" className="w-48 h-48" />
                  ) : invoice.qr_code ? (
                    <QRCodeSVG value={invoice.qr_code} size={192} />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400">Đang tải QR...</div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-5">
                  <RefreshCw size={14} className="animate-spin" /> Đang chờ thanh toán...
                </div>
                <div className="flex gap-3 mt-2">
                  {invoice.checkout_url && (
                    <button 
                      onClick={() => window.open(invoice.checkout_url, '_blank')}
                      className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Mở link PayOS (Để Test)
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
  )
}
