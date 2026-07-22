import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, PenTool, Image as ImageIcon } from 'lucide-react';
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

export default function CompensationModal({ appointmentId, customer, isOpen, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState('');
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setAmount(rawValue);
  };
  const displayAmount = amount ? new Intl.NumberFormat('vi-VN').format(Number(amount)) : '';

  const handleSubmit = async () => {
    if (!amount || !adminSignature || !customerSignature) {
      showError('Vui lòng điền đủ số tiền đền bù và 2 chữ ký.');
      return;
    }
    
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showError('Số tiền đền bù không hợp lệ. Phải lớn hơn 0.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload = {
        branch_info: 'Chi nhánh hệ thống Hybrid Wash',
        customer_info: {
          fullname: customer?.full_name || customer?.fullname || 'Khách hàng',
          phone: customer?.phone_number || customer?.phone || '',
          email: customer?.email || '',
        },
        compensation_amount: numericAmount,
        transfer_image: null,
        admin_signature: adminSignature,
        customer_signature: customerSignature
      };

      await bookingChecklistService.acceptReport(appointmentId, payload);
      showSuccess('Biên bản đền bù tạo thành công!');
      onSuccess();
    } catch (err) {
      showError('Lỗi khi tạo biên bản đền bù');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Tạo Biên bản Đền bù</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Số tiền đền bù (VNĐ) <span className="text-rose-500">*</span></h3>
            <input
              type="text"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="VD: 500.000"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {amount && Number(amount) <= 0 && (
              <p className="text-rose-500 text-xs mt-1">Số tiền phải lớn hơn 0</p>
            )}
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
            disabled={isSubmitting || !amount || Number(amount) <= 0 || !adminSignature || !customerSignature}
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Xác nhận tạo & Hoàn tất
          </button>
        </div>

      </div>
    </div>
  );
}
