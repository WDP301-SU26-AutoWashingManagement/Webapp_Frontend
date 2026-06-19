import React from 'react'
import { X, Calendar, Clock, User, Phone, Car, Tag, CreditCard, CheckCircle2 } from 'lucide-react'
import type { WashBooking } from '../types/booking'
import { Banknote } from 'lucide-react'

interface BookingDetailModalProps {
  booking: WashBooking | null
  isOpen: boolean
  onClose: () => void
  onPay?: (booking: WashBooking) => void
}

export default function BookingDetailModal({ booking, isOpen, onClose, onPay }: BookingDetailModalProps) {
  if (!isOpen || !booking) return null

  const id = (booking._id ?? booking.id!)?.slice(-6).toUpperCase()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">pending</span>
      case 'confirmed': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">confirmed</span>
      case 'checked_in': return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">checked_in</span>
      case 'in_progress': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">in_progress</span>
      case 'washed': return <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">washed</span>
      case 'completed': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">completed</span>
      case 'cancelled': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">cancelled</span>
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>
    }
  }

  const schedDate = new Date(booking.scheduled_at)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">Chi tiết đơn #{id}</h2>
            {getStatusBadge(booking.booking_status)}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Cột 1 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Thời gian
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Giờ hẹn:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {schedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Ngày hẹn:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {schedDate.toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} className="text-emerald-500" /> Khách hàng
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Họ tên:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {booking.customer?.full_name || 'Khách vãng lai'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">SĐT:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {booking.customer?.phone_number || '---'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2 */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Car size={16} className="text-amber-500" /> Xe khách
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Biển số:</span>
                    <span className="text-sm font-bold text-slate-800 bg-white px-2 py-1 border border-slate-200 rounded">
                      {booking.vehicle?.plate_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Hãng/Dòng xe:</span>
                    <span className="text-sm font-bold text-slate-800">
                      {booking.vehicle?.brand} {booking.vehicle?.vehicle_model}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag size={16} className="text-purple-500" /> Dịch vụ & Thanh toán
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                  <div>
                    <span className="text-sm text-slate-500 block mb-1">Gói dịch vụ:</span>
                    <span className="text-sm font-bold text-slate-800 block">
                      {booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ lẻ'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Tổng tiền:</span>
                    <span className="text-lg font-black text-rose-500">
                      {(Math.max(0, (booking.final_price ?? booking.base_price ?? 0) - Math.round((booking.final_price ?? booking.base_price ?? 0) * ((booking.customer?.tier_id?.discount_percentage || 0) / 100)))).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between items-center">
          <div>
            {onPay && booking && booking.booking_status === 'washed' && (
              <button 
                onClick={() => {
                  onClose()
                  onPay(booking)
                }}
                className="px-6 py-2 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2"
              >
                <Banknote size={16} /> Thanh toán đơn này
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  )
}
