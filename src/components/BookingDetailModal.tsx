import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Car, Tag, FileText, Download,  Image as  Banknote } from 'lucide-react'
import type { WashBooking } from '../types/booking'
import { bookingChecklistService, type BookingChecklist } from '../services/bookingChecklistService'
import CreateChecklistModal from './CreateChecklistModal'
import ViewChecklistModal from './ViewChecklistModal'

interface BookingDetailModalProps {
  booking: WashBooking | null
  isOpen: boolean
  onClose: () => void
  onPay?: (booking: WashBooking) => void
  hideStaffActions?: boolean
}

export default function BookingDetailModal({ booking, isOpen, onClose, onPay, hideStaffActions = false }: BookingDetailModalProps) {
  const [checklist, setChecklist] = useState<BookingChecklist | null>(null)
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const fetchChecklist = async () => {
    if (!booking) return
    setLoadingChecklist(true)
    try {
      const appointmentId = booking._id ?? booking.id!
      const data = await bookingChecklistService.getByAppointmentId(appointmentId)
      setChecklist(data)
    } catch (error) {
      console.error("Lỗi khi tải biên bản kiểm tra:", error)
    } finally {
      setLoadingChecklist(false)
    }
  }

  useEffect(() => {
    if (isOpen && booking) {
      fetchChecklist()
    } else {
      setChecklist(null)
    }
  }, [isOpen, booking])

  if (!isOpen || !booking) return null

  const id = (booking._id ?? booking.id!)?.slice(-6).toUpperCase()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Chờ xác nhận</span>
      case 'confirmed': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Đã xác nhận</span>
      case 'checked_in': return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Đã nhận xe</span>
      case 'in_progress': return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Đang rửa</span>
      case 'washed': return <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">Rửa xong</span>
      case 'completed': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Hoàn thành</span>
      case 'cancelled': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Đã hủy</span>
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>
    }
  }

  const schedDate = new Date(booking.scheduled_at)

  const formatBranchAddress = (branch: any) => {
    if (!branch || typeof branch === 'string') return null;
    const addr = branch.branch_address;
    if (!addr) return null;
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.ward, addr.district, addr.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  const branchAddressStr = formatBranchAddress(booking.branch_id);

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
                  <Calendar size={16} className="text-blue-500" /> Thời gian & Địa điểm
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
                  {(branchAddressStr || booking.branch_id) && (
                    <>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div>
                        <span className="text-sm text-slate-500 block mb-1">Chi nhánh:</span>
                        <span className="text-sm font-bold text-slate-800 block">
                          {branchAddressStr || (typeof booking.branch_id === 'string' ? `ID: ${booking.branch_id}` : `RAW: ${JSON.stringify(booking.branch_id)}`)}
                        </span>
                      </div>
                    </>
                  )}
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

              {/* Biên bản kiểm tra xe */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-cyan-500" /> Biên bản nhận xe
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {loadingChecklist ? (
                    <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
                  ) : checklist ? (
                    <div 
                      onClick={() => setShowViewModal(true)}
                      className="w-full flex items-center justify-between cursor-pointer hover:bg-slate-100 p-2 -m-2 rounded-lg transition-colors group"
                    >
                      <div>
                        <span className="text-sm font-bold text-slate-800 block group-hover:text-cyan-600 transition-colors">Biên bản đồng kiểm xe</span>
                        <span className="text-xs text-slate-500 block mt-1">
                          Đã kiểm tra lúc {checklist.createdAt ? new Date(checklist.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation(); // Ngăn mở Modal xem chi tiết khi bấm nút tải
                          const url = await bookingChecklistService.getPdfDownloadUrl(checklist._id)
                          window.open(url, '_blank')
                        }}
                        className="px-3 py-1.5 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 hover:text-cyan-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Download size={14} /> Tải PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="text-sm text-slate-500 italic py-1">
                        Chưa có biên bản kiểm tra xe cho lịch hẹn này.
                      </div>
                      {!hideStaffActions && (
                        <div className="flex justify-start">
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-3 py-1.5 bg-cyan-600 text-white hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                          >
                            Tạo biên bản
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                  <div className="space-y-2">
                    <span className="text-sm text-slate-500 block mb-1">Chi tiết dịch vụ:</span>
                    {booking.services && booking.services.length > 0 ? (
                      (() => {
                        const combos: Record<string, { name: string, price: number, items: string[] }> = {};
                        const individuals: Array<{ name: string, price: number }> = [];
                        
                        booking.services.forEach(svc => {
                          if (svc.service_package_id) {
                            const pkgId = svc.service_package_id._id;
                            if (!combos[pkgId]) {
                              combos[pkgId] = {
                                name: svc.service_package_id.package_name,
                                price: 0,
                                items: []
                              };
                            }
                            combos[pkgId].price += svc.price_snapshot;
                            combos[pkgId].items.push(svc.service_id?.service_name || 'Dịch vụ');
                          } else {
                            individuals.push({
                              name: svc.service_id?.service_name || 'Dịch vụ',
                              price: svc.price_snapshot
                            });
                          }
                        });

                        return (
                          <>
                            {Object.values(combos).map((combo, idx) => (
                              <div key={`combo-${idx}`} className="flex justify-between items-start text-sm mb-2">
                                <span className="text-slate-800 flex-1 pr-2 flex flex-col">
                                  <span className="font-semibold text-cyan-700">{combo.name}</span>
                                  <span className="text-[12px] text-slate-500 ml-2 mt-0.5 whitespace-pre-wrap leading-relaxed">
                                    {combo.items.map(item => `• ${item}`).join('\n')}
                                  </span>
                                </span>
                                <span className="font-medium text-slate-700 shrink-0 mt-0.5">
                                  {combo.price.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            ))}
                            {individuals.map((ind, idx) => (
                              <div key={`ind-${idx}`} className="flex justify-between items-start text-sm mb-2">
                                <span className="text-slate-800 flex-1 pr-2 font-medium">
                                  {ind.name}
                                </span>
                                <span className="font-medium text-slate-700 shrink-0 mt-0.5">
                                  {ind.price.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            ))}
                          </>
                        );
                      })()
                    ) : (
                      <span className="text-sm font-bold text-slate-800 block">
                        {booking.service_package?.name || booking.service_package?.service_name || 'Dịch vụ lẻ'}
                      </span>
                    )}
                  </div>
                  
                  <div className="h-px bg-slate-200 my-2"></div>
                  
                  {/* Hiển thị Giá gốc */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Tổng phí dịch vụ:</span>
                    <span className="text-sm font-medium text-slate-700">
                      {(booking.base_price ?? booking.final_price ?? 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Hiển thị Hạng thành viên */}
                  {(() => {
                    const tierDiscAmount = booking.applied_tier_discount !== undefined 
                        ? booking.applied_tier_discount 
                        : (booking.customer?.tier_id?.discount_percentage 
                            ? Math.round((booking.base_price ?? booking.final_price ?? 0) * (booking.customer.tier_id.discount_percentage / 100))
                            : 0);

                    if (tierDiscAmount > 0) {
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">
                            Hạng {booking.customer?.tier_id?.tier_name || 'thành viên'}:
                          </span>
                          <span className="text-sm font-medium text-emerald-600">
                            -{tierDiscAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Hiển thị Khuyến mãi khác */}
                  {(() => {
                    let purePromotionDiscount = 0;
                    if (booking.applied_promotion_discount !== undefined) {
                      purePromotionDiscount = booking.applied_promotion_discount;
                    } else {
                      const base = booking.base_price ?? booking.final_price ?? 0;
                      const tierDiscPct = booking.customer?.tier_id?.discount_percentage || 0;
                      const tierDiscAmount = Math.round(base * (tierDiscPct / 100));
                      purePromotionDiscount = Math.max(0, (booking.discount_amount || 0) - tierDiscAmount);
                    }
                    
                    if (purePromotionDiscount > 0) {
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Khuyến mãi khác:</span>
                          <span className="text-sm font-medium text-emerald-600">
                            -{purePromotionDiscount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="h-px bg-slate-200 my-2"></div>
                  
                  {/* Hiển thị Tổng tiền thanh toán chính xác */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Tổng thanh toán:</span>
                    <span className="text-lg font-black text-rose-500">
                      {(() => {
                        const paidInvoices = JSON.parse(localStorage.getItem('paid_invoices') || '{}');
                        const cachedTotal = paidInvoices[booking._id || booking.id!];
                        if (cachedTotal !== undefined) return cachedTotal.toLocaleString('vi-VN');
                        
                        const base = booking.base_price ?? booking.final_price ?? 0;
                        const tierDiscPct = booking.customer?.tier_id?.discount_percentage || 0;
                        const tierDiscAmount = Math.round(base * (tierDiscPct / 100));
                        
                        const totalDiscount = booking.discount_amount || tierDiscAmount;
                        const finalPrice = Math.max(0, base - totalDiscount);
                        return finalPrice.toLocaleString('vi-VN');
                      })()} đ
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

      <CreateChecklistModal 
        booking={booking} 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => {
          setShowCreateModal(false);
          fetchChecklist();
        }} 
      />

      <ViewChecklistModal
        checklist={checklist}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
      />
    </div>
  )
}
