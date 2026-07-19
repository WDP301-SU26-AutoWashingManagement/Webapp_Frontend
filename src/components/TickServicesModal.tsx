import React, { useState, useEffect } from 'react'
import { X, Check, CheckCircle2, Circle, Zap, AlertCircle } from 'lucide-react'
import type { WashBooking } from '../types/booking'
import { bookingService } from '../services/bookingService'

interface TickServicesModalProps {
  booking: WashBooking | null
  isOpen: boolean
  onClose: () => void
  onCheckin: () => void
}

export default function TickServicesModal({ booking: initialBooking, isOpen, onClose, onCheckin }: TickServicesModalProps) {
  const [booking, setBooking] = useState<WashBooking | null>(initialBooking)
  const [loadingFull, setLoadingFull] = useState(false)
  const [localStatuses, setLocalStatuses] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && initialBooking) {
      setBooking(initialBooking)
      const id = initialBooking._id ?? initialBooking.id!
      setLoadingFull(true)
      bookingService.getById(id).then(fullBooking => {
        setBooking(fullBooking)
        if (fullBooking.services) {
          const initial: Record<string, boolean> = {}
          fullBooking.services.forEach(s => {
            initial[s._id] = !!s.is_completed
          })
          setLocalStatuses(initial)
        }
      }).catch(err => {
        console.error("Lỗi khi tải chi tiết booking:", err)
      }).finally(() => {
        setLoadingFull(false)
      })
    } else {
      setBooking(null)
      setLocalStatuses({})
    }
  }, [isOpen, initialBooking])

  const handleToggleLocal = (itemId: string) => {
    setLocalStatuses(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleSave = async (andCheckin = false) => {
    if (!booking) return;
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];
      const bId = booking._id ?? booking.id!;
      
      booking.services?.forEach(svc => {
        const isCurrentlyCompleted = !!svc.is_completed;
        const isLocallyCompleted = !!localStatuses[svc._id];
        
        if (isCurrentlyCompleted !== isLocallyCompleted) {
          promises.push(bookingService.toggleService(bId, svc._id));
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      if (andCheckin) {
        onCheckin();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Lỗi khi lưu dịch vụ:", error);
      alert("Đã có lỗi xảy ra khi lưu. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen || !booking) return null

  // Group services
  const combos: Record<string, { name: string, price: number, items: any[] }> = {};
  const individuals: Array<any> = [];

  booking.services?.forEach(svc => {
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
      combos[pkgId].items.push(svc);
    } else {
      individuals.push(svc);
    }
  });

  const renderServiceItem = (svc: any) => {
    const isAutomated = svc.service_id?.is_automated || svc.service_id?.service_name?.toLowerCase() === 'dịch vụ rửa xe';
    const isCompleted = localStatuses[svc._id] || false;
    
    return (
      <div key={svc._id} className={`flex items-center gap-2 mb-1 ${!isAutomated ? 'cursor-pointer hover:bg-slate-100 -mx-2 px-2 py-1 rounded' : 'py-1'}`} onClick={() => {
        if (!isAutomated) {
          handleToggleLocal(svc._id);
        }
      }}>
        {!isAutomated && (
            <div className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                {isCompleted && <Check size={14} strokeWidth={3} />}
            </div>
        )}
        {isAutomated && (
            <Zap size={16} className="shrink-0 text-amber-500" />
        )}
        <span className={`text-[14px] ${isCompleted ? 'text-slate-800' : 'text-slate-600'} ${isAutomated ? 'font-semibold text-amber-700' : ''}`}>
          {svc.service_id?.service_name || 'Dịch vụ'}
        </span>
      </div>
    )
  }

  // Check if all manual are checked
  let allManualChecked = true;
  booking.services?.forEach(svc => {
      const isAuto = svc.service_id?.is_automated || svc.service_id?.service_name?.toLowerCase() === 'dịch vụ rửa xe';
      if (svc.service_id && !isAuto && !localStatuses[svc._id]) {
          allManualChecked = false;
      }
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Cập nhật Dịch vụ Thủ công</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-sm flex gap-2 mb-4">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Vui lòng đánh dấu hoàn thành <strong>tất cả</strong> các dịch vụ thủ công trước khi chuyển sang bước Check-in.</p>
          </div>

          {loadingFull ? (
            <div className="py-10 text-center text-slate-500">Đang tải...</div>
          ) : (
            <>
              {Object.values(combos).map((combo, idx) => (
                <div key={`combo-${idx}`} className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm mb-3">
                  <span className="font-bold text-cyan-700 block mb-2">{combo.name}</span>
                  <div className="flex flex-col ml-1">
                    {combo.items.map(item => renderServiceItem(item))}
                  </div>
                </div>
              ))}
              {individuals.length > 0 && (
                <div className="flex flex-col gap-2">
                  {individuals.map((ind, idx) => (
                    <div key={`ind-${idx}`} className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                      {renderServiceItem(ind)}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-between gap-3">
          <button 
            disabled={isSaving}
            onClick={() => handleSave(false)} 
            className="flex-1 px-4 py-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu lại'}
          </button>
          <button 
            disabled={!allManualChecked || loadingFull || isSaving}
            onClick={() => handleSave(true)} 
            className="flex-1 px-4 py-2 bg-[#0ea5b7] disabled:bg-slate-300 text-white font-medium rounded-xl hover:bg-[#0b8fa0] transition-colors"
          >
            Chuyển Check-in
          </button>
        </div>
      </div>
    </div>
  )
}
