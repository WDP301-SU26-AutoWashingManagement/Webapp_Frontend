import React from 'react';
import { X, CheckSquare, Square, Image as ImageIcon, FileText, PenTool } from 'lucide-react';
import type { BookingChecklist } from '../services/bookingChecklistService';
import { env } from '../config/env';

interface ViewChecklistModalProps {
  checklist: BookingChecklist | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewChecklistModal({ checklist, isOpen, onClose }: ViewChecklistModalProps) {
  if (!isOpen || !checklist) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chi tiết Biên bản xe</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ngày lập: {checklist.createdAt ? new Date(checklist.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Checklist items */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckSquare size={16} className="text-cyan-600" /> Các mục đã kiểm tra
            </h3>
            <div className="space-y-2">
              {checklist.checklist_items.map((item, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border ${item.checked ? 'border-cyan-100 bg-cyan-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                  {item.checked ? (
                    <CheckSquare size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square size={18} className="text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${item.checked ? 'text-slate-800 font-medium' : 'text-slate-500 line-through'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {checklist.note && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" /> Ghi chú hiện trạng
              </h3>
              <div className="w-full p-4 text-sm text-slate-700 border border-slate-200 rounded-xl bg-slate-50 whitespace-pre-wrap">
                {checklist.note}
              </div>
            </div>
          )}

          {/* Images */}
          {checklist.images && checklist.images.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ImageIcon size={16} className="text-emerald-500" /> Hình ảnh đính kèm
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {checklist.images.map((img, idx) => {
                  const getImageUrl = (imgStr: string) => {
                    if (imgStr.startsWith('data:') || imgStr.startsWith('http')) return imgStr;
                    return `${env.apiBaseUrl.replace('/api/v1', '')}${imgStr}`;
                  };
                  const imgSrc = getImageUrl(img);

                  return (
                    <a 
                      key={idx} 
                      href={imgSrc} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors"
                    >
                      <img 
                        src={imgSrc} 
                        alt={`Ảnh hiện trạng ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signature */}
          {checklist.customer_signature && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <PenTool size={16} className="text-indigo-500" /> Chữ ký xác nhận
              </h3>
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex justify-center items-center h-32">
                <img 
                  src={checklist.customer_signature} 
                  alt="Chữ ký khách hàng" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
