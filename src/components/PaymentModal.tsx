import React, { useEffect, useState, useRef } from 'react'
import { X, CreditCard, RefreshCw, Banknote, QrCode, Tag, Copy, Lightbulb } from 'lucide-react'
import { invoiceService, type Invoice } from '../services/invoiceService'
import type { WashBooking } from '../types/booking'
import { showError, showSuccess } from '../utils/toast'
import { useAuth } from '../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'
import { promotionService } from '../services/promotionService'
import type { Promotion } from '../types/promotion'
import { computePromotionDiscount, formatPromotionLabel } from '../utils/promotionPricing'
import { parseVietQR } from '../utils/vietqr'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: WashBooking
  onSuccess: () => void
}

const getQuickCashSuggestions = (total: number) => {
  const standardBills = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
  const suggestions = new Set<number>();
  suggestions.add(total); // Khớp số
  
  // Find bills that are greater than total
  for (const bill of standardBills) {
    if (bill > total) {
      suggestions.add(bill);
    }
  }
  
  const next10k = Math.ceil(total / 10000) * 10000;
  const next50k = Math.ceil(total / 50000) * 50000;
  if (next10k > total) suggestions.add(next10k);
  if (next50k > total) suggestions.add(next50k);
  
  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);
}

export default function PaymentModal({ isOpen, onClose, booking, onSuccess }: PaymentModalProps) {
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'qr' | null>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const pollingRef = useRef<number | null>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [promotions, setPromotions] = useState<(Promotion & { calculatedDiscount: number })[]>([])
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null)
  const [loadingPromotions, setLoadingPromotions] = useState(false)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [bankInfo, setBankInfo] = useState<{ accountName: string, accountNumber: string, bankName: string } | null>(null)

  // Phân tích mã QR VietQR để lấy thông tin ngân hàng
  useEffect(() => {
    if (paymentMode === 'qr' && invoice?.qr_code) {
      const parsed = parseVietQR(invoice.qr_code);
      if (parsed) {
        fetch('https://api.vietqr.io/v2/banks')
          .then(r => r.json())
          .then(data => {
            const bank = data.data?.find((b: any) => b.bin === parsed.bin);
            setBankInfo({
              accountName: parsed.accountName,
              accountNumber: parsed.accountNumber,
              bankName: bank ? bank.shortName : parsed.bin
            });
          })
          .catch(() => {
            setBankInfo({
              accountName: parsed.accountName,
              accountNumber: parsed.accountNumber,
              bankName: parsed.bin
            });
          });
      }
    } else {
      setBankInfo(null);
    }
  }, [paymentMode, invoice?.qr_code]);

  // Load promotions khi mở modal
  useEffect(() => {
    if (isOpen && booking && !invoice) {
      setLoadingPromotions(true)
      promotionService.list()
        .then(list => {
          const tierDiscountPct = booking.customer?.tier_id?.discount_percentage || 0;
          const basePrice = booking.base_price ?? booking.final_price ?? 0;
          const tierDiscountAmount = Math.round(basePrice * (tierDiscountPct / 100));
          const priceAfterTier = Math.max(0, basePrice - tierDiscountAmount);

          // Tính toán discount cho từng promotion và lọc các mã hợp lệ
          const withDiscounts = list.map((p: any) => {
            const discount = computePromotionDiscount(priceAfterTier, p);
            return { ...p, calculatedDiscount: discount };
          }).filter((p: any) => p.calculatedDiscount > 0 || p.type === 'bonus_service'); // Chỉ giữ lại mã có tác dụng

          // Sắp xếp theo số tiền giảm giảm dần
          withDiscounts.sort((a, b) => b.calculatedDiscount - a.calculatedDiscount);

          setPromotions(withDiscounts);

          // Auto-select mã giảm nhiều nhất
          if (withDiscounts.length > 0) {
            setSelectedPromotionId(withDiscounts[0]._id || withDiscounts[0].id!);
          }
        })
        .catch(err => {
          console.error('Failed to load promotions', err);
        })
        .finally(() => {
          setLoadingPromotions(false)
        })
    }

    if (!isOpen) {
      // Reset all states khi đóng modal
      stopPolling()
      setInvoice(null)
      setPaymentMode(null)
      setPromotions([])
      setSelectedPromotionId(null)
      setIsCreatingInvoice(false)
      setStep(1)
      setCashReceived(0)
    }
  }, [isOpen, booking, invoice])

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handleNextStep = () => {
    setStep(2)
  }

  const ensureInvoice = async () => {
    if (invoice) return invoice
    if (!booking) throw new Error('Booking data is missing')
    const inv = await invoiceService.createInvoice(booking._id || booking.id!, {
      promotion_id: selectedPromotionId || undefined
    })
    setInvoice(inv)
    return inv
  }

  const handleSelectCashMode = async () => {
    setLoading(true)
    try {
      const currentInvoice = await ensureInvoice()
      setCashReceived(currentInvoice.total)
      setPaymentMode('cash')
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('tồn tại')) {
        showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
        onClose()
      } else {
        showError(err.message || 'Lỗi khi chuẩn bị hóa đơn thanh toán tiền mặt')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCash = async () => {
    if (!user || !invoice) return
    setLoading(true)
    try {
      await invoiceService.confirmCash(invoice._id, (user as any).id || (user as any)._id)
      showSuccess('Thanh toán tiền mặt thành công!')

      // LƯU CACHE TẠM CHO FRONTEND DO BACKEND KHÔNG TRẢ VỀ DỮ LIỆU INVOICE TRONG BOOKING
      const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
      paidInvoices[booking._id || booking.id!] = invoice.total;
      localStorage.setItem('paid_invoices', JSON.stringify(paidInvoices));

      onSuccess()
      onClose()
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('tồn tại')) {
        showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
        onClose()
      } else {
        showError(err.message || 'Lỗi khi xác nhận tiền mặt')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQR = async () => {
    setLoading(true)
    try {
      const currentInvoice = await ensureInvoice()
      const inv = await invoiceService.createPaymentLink(currentInvoice._id)
      setInvoice(inv)
      setPaymentMode('qr')
      // Start polling
      pollingRef.current = window.setInterval(async () => {
        try {
          const synced = await invoiceService.syncPaymentStatus(currentInvoice._id)
          if (synced.invoice_status === 'paid') {
            stopPolling()
            showSuccess('Khách đã chuyển khoản thành công!')

            // LƯU CACHE TẠM CHO FRONTEND DO BACKEND KHÔNG TRẢ VỀ DỮ LIỆU INVOICE TRONG BOOKING
            const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
            paidInvoices[booking._id || booking.id!] = currentInvoice.total;
            localStorage.setItem('paid_invoices', JSON.stringify(paidInvoices));

            onSuccess()
            onClose()
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000)
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('tồn tại')) {
        showError('Đơn này đã tạo Hóa đơn trước đó. Vui lòng liên hệ Admin để xử lý.');
        onClose()
      } else {
        showError(err.message || 'Lỗi khi tạo mã QR PayOS')
      }
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
      <div className={`bg-white rounded-2xl w-full ${paymentMode === 'qr' ? 'max-w-2xl' : 'max-w-md'} p-6 shadow-2xl relative transition-all duration-300 animate-in zoom-in-95`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="flex items-center mb-4">
          {step === 2 && paymentMode !== 'qr' && (
            <button 
              onClick={() => { 
                if (paymentMode === 'cash') {
                  setPaymentMode(null);
                } else {
                  setStep(1); 
                  setInvoice(null); 
                }
              }} 
              className="mr-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={22} className="text-blue-500" /> Thanh toán
          </h2>
        </div>

        {step === 1 ? (
          // BƯỚC 1: Chọn Khuyến mãi và Tạo Hóa Đơn
          <div className="space-y-4">
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 font-medium">Tổng phí dịch vụ:</span>
                <span className="font-bold text-slate-800">{(booking.base_price ?? booking.final_price ?? 0).toLocaleString('vi-VN')} đ</span>
              </div>
              {booking.customer?.tier_id?.discount_percentage ? (
                <div className="flex justify-between items-center mb-2 text-emerald-600 text-sm">
                  <span className="font-medium">Ưu đãi hạng ({booking.customer.tier_id.discount_percentage}%):</span>
                  <span className="font-semibold">-{(Math.round((booking.base_price ?? booking.final_price ?? 0) * (booking.customer.tier_id.discount_percentage / 100))).toLocaleString('vi-VN')} đ</span>
                </div>
              ) : null}

              {selectedPromotionId && promotions.find(p => (p._id || p.id) === selectedPromotionId)?.calculatedDiscount ? (
                <div className="flex justify-between items-center mb-2 text-emerald-600 text-sm">
                  <span className="font-medium">Sẽ được giảm (Khuyến mãi):</span>
                  <span className="font-semibold">-{(promotions.find(p => (p._id || p.id) === selectedPromotionId)?.calculatedDiscount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              ) : <div className="mb-2"></div>}

              <div className="border-t border-slate-200 border-dashed my-3"></div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-800 font-bold">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-rose-500">
                  {(() => {
                    const bPrice = booking.base_price ?? booking.final_price ?? 0;
                    const tDiscount = Math.round(bPrice * ((booking.customer?.tier_id?.discount_percentage || 0) / 100));
                    const pDiscount = selectedPromotionId ? (promotions.find(p => (p._id || p.id) === selectedPromotionId)?.calculatedDiscount || 0) : 0;
                    return Math.max(0, bPrice - tDiscount - pDiscount).toLocaleString('vi-VN');
                  })()} đ
                </span>
              </div>

              {/* Promo code selector */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                  <Tag size={16} className="text-rose-500" /> Chọn mã khuyến mãi
                </label>
                {loadingPromotions ? (
                  <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Đang tải khuyến mãi...</div>
                ) : (
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedPromotionId || ''}
                    onChange={e => setSelectedPromotionId(e.target.value || null)}
                    disabled={isCreatingInvoice}
                  >
                    <option value="">-- Không áp dụng khuyến mãi --</option>
                    {promotions.map((p, index) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {formatPromotionLabel(p)} {index === 0 && p.calculatedDiscount > 0 ? ' (🔥 Tốt nhất)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
            >
              Tiếp tục thanh toán
            </button>
          </div>
        ) : (
          // BƯỚC 2: Chọn phương thức Thanh toán & Hiển thị QR
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 font-medium">Tổng phí dịch vụ:</span>
                <span className="font-bold text-slate-800">{(booking.base_price ?? booking.final_price ?? 0).toLocaleString('vi-VN')} đ</span>
              </div>
              
              {booking.customer?.tier_id?.discount_percentage ? (
                <div className="flex justify-between items-center mb-2 text-emerald-600 text-sm">
                  <span className="font-medium">Ưu đãi hạng ({booking.customer.tier_id.discount_percentage}%):</span>
                  <span className="font-semibold">-{(Math.round((booking.base_price ?? booking.final_price ?? 0) * (booking.customer.tier_id.discount_percentage / 100))).toLocaleString('vi-VN')} đ</span>
                </div>
              ) : null}

              {(() => {
                const bPrice = booking.base_price ?? booking.final_price ?? 0;
                const tDiscountAmount = Math.round(bPrice * ((booking.customer?.tier_id?.discount_percentage || 0) / 100));
                let pDiscountAmount = 0;
                if (invoice) {
                  pDiscountAmount = invoice.discount_amount - tDiscountAmount;
                } else if (selectedPromotionId) {
                  pDiscountAmount = promotions.find(p => (p._id || p.id) === selectedPromotionId)?.calculatedDiscount || 0;
                }
                const isPromoActive = invoice ? invoice.discount_amount > 0 : pDiscountAmount > 0;
                
                return isPromoActive && (
                  <div className="flex justify-between items-center mb-2 text-emerald-600 text-sm">
                    <span className="font-medium">Giảm giá (Khuyến mãi):</span>
                    <span className="font-semibold">-{pDiscountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )
              })()}

              <div className="border-t border-slate-200 border-dashed my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-bold">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-rose-500">
                  {(() => {
                    if (invoice && invoice.total !== undefined) return invoice.total.toLocaleString('vi-VN');
                    const bPrice = booking.base_price ?? booking.final_price ?? 0;
                    const tDiscount = Math.round(bPrice * ((booking.customer?.tier_id?.discount_percentage || 0) / 100));
                    const pDiscount = selectedPromotionId ? (promotions.find(p => (p._id || p.id) === selectedPromotionId)?.calculatedDiscount || 0) : 0;
                    return Math.max(0, bPrice - tDiscount - pDiscount).toLocaleString('vi-VN');
                  })()} đ
                </span>
              </div>
            </div>

            {/* Chế độ chọn phương thức */}
            {!paymentMode && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSelectCashMode}
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

            {/* Chế độ xác nhận Tiền mặt */}
            {paymentMode === 'cash' && invoice && (
              <div className="animate-in fade-in zoom-in duration-300 space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="text-emerald-600 bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 text-sm">Xác nhận thanh toán tiền mặt</h3>
                    <p className="text-xs text-emerald-700">Vui lòng nhập số tiền nhận từ khách để tính tiền thừa.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Tổng tiền cần thanh toán */}
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Tổng tiền cần thanh toán:</span>
                    <span className="font-bold text-slate-800 text-lg">
                      {invoice.total.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Số tiền khách đưa */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Số tiền khách đưa
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        className="w-full text-right font-black text-2xl text-slate-800 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl p-3.5 pr-10 focus:outline-none transition-all"
                        value={cashReceived === 0 ? '' : cashReceived.toLocaleString('vi-VN')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          setCashReceived(val ? parseInt(val, 10) : 0)
                        }}
                        placeholder="0"
                      />
                      <span className="absolute right-4 font-bold text-slate-400 text-lg">đ</span>
                    </div>
                  </div>

                  {/* Gợi ý nhanh */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Gợi ý mệnh giá nhanh
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {getQuickCashSuggestions(invoice.total).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setCashReceived(suggestion)}
                          className={`text-xs font-bold px-3 py-2 rounded-lg border transition ${
                            cashReceived === suggestion
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {suggestion === invoice.total ? 'Chẵn tiền' : suggestion.toLocaleString('vi-VN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kết quả tiền thừa / còn thiếu */}
                  {cashReceived >= invoice.total ? (
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex justify-between items-center animate-in fade-in duration-200">
                      <span className="text-sm text-emerald-800 font-medium">Tiền thừa trả khách:</span>
                      <span className="text-xl font-black text-emerald-700">
                        {(cashReceived - invoice.total).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex justify-between items-center animate-in fade-in duration-200">
                      <span className="text-sm text-rose-800 font-medium">Khách còn thiếu:</span>
                      <span className="text-xl font-black text-rose-600">
                        {(invoice.total - cashReceived).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                {/* Hành động */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode(null)}
                    disabled={loading}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCash}
                    disabled={loading || cashReceived < invoice.total}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      'Xác nhận thanh toán'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Chế độ đang quét QR (Thiết kế giống PayOS) */}
            {paymentMode === 'qr' && invoice && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

                  {/* Header Hướng dẫn */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200">
                    <div className="text-slate-600"><Lightbulb size={24} /></div>
                    <p className="text-sm text-slate-700 font-medium">
                      Mở App Ngân hàng bất kỳ để <strong className="text-slate-900">quét mã VietQR</strong> hoặc <strong className="text-slate-900">chuyển khoản</strong> chính xác số tiền, nội dung bên dưới
                    </p>
                  </div>

                  <div className="p-6 flex flex-col md:flex-row gap-8">

                    {/* Cột Left: QR Code */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-red-600 font-black text-xl tracking-tight">Viet</span>
                        <span className="text-blue-800 font-black text-xl tracking-tight">QR</span>
                        <span className="bg-yellow-400 text-slate-900 font-bold text-sm px-1.5 rounded ml-1">PRO</span>
                      </div>

                      <div className="p-2 border border-slate-200 rounded-xl bg-white shadow-sm">
                        {invoice.qr_code && invoice.qr_code.startsWith('data:image') ? (
                          <img src={invoice.qr_code} alt="QR Code" className="w-52 h-52 object-contain" />
                        ) : invoice.qr_code ? (
                          <QRCodeSVG value={invoice.qr_code} size={208} />
                        ) : (
                          <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">Đang tải QR...</div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-sm font-semibold mt-1">
                        <span className="text-blue-800 italic">napas 247</span>
                        <span className="w-px h-4 bg-slate-300"></span>
                        <span className="text-blue-600">{bankInfo?.bankName || 'BANK'}</span>
                      </div>
                    </div>

                    {/* Cột Right: Thông tin chuyển khoản */}
                    <div className="flex-1 w-full flex flex-col justify-center">
                      {bankInfo ? (
                        <div className="space-y-4">

                          {/* Ngân hàng */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs border border-blue-100">
                              {bankInfo.bankName.substring(0, 3)}
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Ngân hàng</p>
                              <p className="font-bold text-slate-800 text-sm">{bankInfo.bankName}</p>
                            </div>
                          </div>

                          {/* Chủ tài khoản */}
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Chủ tài khoản:</p>
                            <p className="font-bold text-slate-800 text-sm uppercase">{bankInfo.accountName || 'KHUU TRONG QUAN'}</p>
                          </div>

                          {/* Số tài khoản */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Số tài khoản:</p>
                              <p className="font-bold text-slate-800 text-base">{bankInfo.accountNumber}</p>
                            </div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(bankInfo.accountNumber); showSuccess('Đã copy số tài khoản') }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md transition-colors"
                            >
                              Sao chép
                            </button>
                          </div>

                          {/* Số tiền */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Số tiền:</p>
                              <p className="font-bold text-slate-800 text-base">{invoice.total.toLocaleString('vi-VN')} vnd</p>
                            </div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(invoice.total.toString()); showSuccess('Đã copy số tiền') }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md transition-colors"
                            >
                              Sao chép
                            </button>
                          </div>

                          {/* Nội dung */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">Nội dung:</p>
                              <p className="font-bold text-slate-800 text-base">{invoice.order_code}</p>
                            </div>
                            <button
                              onClick={() => { navigator.clipboard.writeText(invoice.order_code!.toString()); showSuccess('Đã copy nội dung') }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md transition-colors"
                            >
                              Sao chép
                            </button>
                          </div>

                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-sm text-slate-500 gap-2">
                          <RefreshCw size={24} className="animate-spin text-slate-300" />
                          {invoice.qr_code ? 'Đang giải mã thông tin VietQR...' : 'Đang tải thông tin...'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Lưu ý */}
                  <div className="bg-orange-50/50 p-4 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-700">
                      Lưu ý: Nhập chính xác số tiền <strong className="text-slate-900">{invoice.total.toLocaleString('vi-VN')}</strong>, nội dung <strong className="text-slate-900">{invoice.order_code}</strong> khi chuyển khoản
                    </p>
                  </div>
                </div>

                {/* Hành động dưới cùng */}
                <div className="flex justify-center gap-3 mt-5">
                  <button
                    onClick={handleCancelQR}
                    className="text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    Huỷ mã QR
                  </button>

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
