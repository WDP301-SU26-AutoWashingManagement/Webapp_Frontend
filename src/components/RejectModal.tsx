import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, PenTool } from 'lucide-react';
import { bookingChecklistService } from '../services/bookingChecklistService';
import { showSuccess, showError } from '../utils/toast';

const SignaturePad = ({ onSignatureChange, placeholder }: { onSignatureChange: (signature: string | null) => void, placeholder: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
      if (canvas) onSignatureChange(canvas.toDataURL('image/png'));
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden relative bg-white shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full touch-none cursor-crosshair"
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
          onClick={clearCanvas}
          className="absolute top-2 right-2 px-3 py-1 bg-rose-100 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-200 transition-colors"
        >
          Ký lại
        </button>
      )}
      {!hasSignature && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-sm italic">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default function RejectModal({ appointmentId, isOpen, onClose, onSuccess }: any) {
  const [reason, setReason] = useState('');
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim() || !adminSignature || !customerSignature) {
      showError('Vui lòng điền đủ lí do từ chối và 2 chữ ký.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const payload = {
        reject_reason: reason,
        admin_signature: adminSignature,
        customer_signature: customerSignature
      };

      await bookingChecklistService.rejectReport(appointmentId, payload);
      showSuccess('Từ chối khiếu nại thành công!');
      onSuccess();
    } catch (err) {
      showError('Lỗi khi từ chối khiếu nại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Từ chối Khiếu nại</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Lí do từ chối <span className="text-rose-500">*</span></h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lí do từ chối (VD: Xe đã bị xước từ trước, kiểm tra camera...)"
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <PenTool size={16} className="text-indigo-500" /> Chữ ký Quản lý / NV <span className="text-rose-500">*</span>
              </h3>
              <SignaturePad placeholder="Quản lý ký vào đây" onSignatureChange={setAdminSignature} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <PenTool size={16} className="text-amber-500" /> Chữ ký Khách hàng <span className="text-rose-500">*</span>
              </h3>
              <SignaturePad placeholder="Khách hàng ký xác nhận" onSignatureChange={setCustomerSignature} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim() || !adminSignature || !customerSignature}
            className="px-5 py-2 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Xác nhận Từ chối
          </button>
        </div>

      </div>
    </div>
  );
}
