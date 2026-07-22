import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, FileText, Loader2, PenTool, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import type { WashBooking } from '../types/booking';
import { bookingChecklistService, type BookingChecklist } from '../services/bookingChecklistService';
import { showSuccess, showError } from '../utils/toast';
import { env } from '../config/env';

interface ConfirmHandoverModalProps {
  booking: WashBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SignaturePad = ({ onSignatureChange }: { onSignatureChange: (signature: string | null) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 550;
    const height = 180;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureChange(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div ref={containerRef} className="border border-slate-300 rounded-xl overflow-hidden relative bg-white shadow-inner w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-[180px] touch-none cursor-crosshair block"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {hasSignature && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2.5 right-2.5 px-3 py-1 bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-200 transition-colors shadow-sm"
        >
          Ký lại
        </button>
      )}
      {!hasSignature && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-sm italic font-medium">
          Khách hàng ký nhận xe vào đây
        </div>
      )}
    </div>
  );
};

export default function ConfirmHandoverModal({ booking, isOpen, onClose, onSuccess }: ConfirmHandoverModalProps) {
  const [checklist, setChecklist] = useState<BookingChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [signatureAfter, setSignatureAfter] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      const appointmentId = booking._id || booking.id!;
      setLoading(true);
      bookingChecklistService.getByAppointmentId(appointmentId)
        .then(res => {
          setChecklist(res);
          if (res?.customer_signature_after) {
            setSignatureAfter(res.customer_signature_after);
          }
        })
        .catch(err => {
          console.error('Lỗi lấy thông tin checklist:', err);
          showError('Không thể lấy thông tin biên bản kiểm tra xe.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
    if (!isOpen) {
      setChecklist(null);
      setSignatureAfter(null);
      setIsSubmitting(false);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (!signatureAfter) {
      showError('Vui lòng yêu cầu khách hàng ký tên xác nhận nhận lại xe.');
      return;
    }

    if (!checklist) {
      showError('Không tìm thấy biên bản kiểm tra xe để cập nhật.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('customer_signature_after', signatureAfter);

      await bookingChecklistService.update(checklist._id, formData);
      showSuccess('Xác nhận nhận xe thành công!');
      onSuccess();
    } catch (error: any) {
      console.error('Lỗi cập nhật chữ ký giao xe:', error);
      showError(error.message || 'Lỗi khi cập nhật chữ ký xác nhận nhận xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Chi tiết Biên bản xe & Ký bàn giao</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã đơn: <span className="font-semibold text-slate-700">#{booking.appointment_code || booking.id}</span>
              {checklist?.createdAt && (
                <span> • Ngày lập: {new Date(checklist.createdAt).toLocaleString('vi-VN')}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Đang tải thông tin biên bản xe...</p>
            </div>
          ) : (
            <>
              {checklist && (
                <>
                  {/* Các mục đã kiểm tra */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <CheckSquare size={16} className="text-cyan-600" /> Các mục đã kiểm tra
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

                  {/* Ghi chú hiện trạng */}
                  {checklist.note && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText size={16} className="text-amber-500" /> Ghi chú hiện trạng
                      </h4>
                      <div className="w-full p-4 text-sm text-slate-700 border border-slate-200 rounded-xl bg-slate-50 whitespace-pre-wrap">
                        {checklist.note}
                      </div>
                    </div>
                  )}

                  {/* Hình ảnh đính kèm */}
                  {checklist.images && checklist.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <ImageIcon size={16} className="text-emerald-500" /> Hình ảnh đính kèm
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                              className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors bg-slate-50"
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

                  {/* Chữ ký xác nhận đồng kiểm (2 ô song song nằm ngang) */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <PenTool size={16} className="text-indigo-500" /> Chữ ký xác nhận đồng kiểm
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. Chữ ký ban đầu */}
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 mb-2">1. Chữ ký lúc nhận xe (Ban đầu)</span>
                        {checklist.customer_signature ? (
                          <div className="h-[180px] flex items-center justify-center w-full bg-white rounded-lg border border-slate-200 p-2">
                            <img
                              src={checklist.customer_signature}
                              alt="Chữ ký ban đầu"
                              className="max-w-full max-h-full object-contain mix-blend-multiply"
                            />
                          </div>
                        ) : (
                          <div className="h-[180px] flex items-center justify-center text-xs text-slate-400 italic bg-white rounded-lg border border-slate-200 w-full">
                            Chưa có chữ ký ban đầu
                          </div>
                        )}
                      </div>

                      {/* 2. Chữ ký bàn giao xe (SignaturePad) */}
                      <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/40 flex flex-col items-center">
                        <span className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
                          2. Chữ ký bàn giao xe (Sau khi rửa) <span className="text-rose-500">*</span>
                        </span>
                        <div className="w-full">
                          <SignaturePad onSignatureChange={setSignatureAfter} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end space-x-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200/60 rounded-xl transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              'Xác nhận & Tiến hành thanh toán'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
