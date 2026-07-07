import React, { useState, useRef, useEffect } from 'react';
import { X, CheckSquare, Image as ImageIcon, FileText, Loader2, PenTool } from 'lucide-react';
import type { WashBooking } from '../types/booking';
import { bookingChecklistService } from '../services/bookingChecklistService';
import { showSuccess, showError } from '../utils/toast';

interface CreateChecklistModalProps {
  booking: WashBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_ITEMS = [
  'Bề mặt sơn (không trầy xước, móp méo)',
  'Kính chắn gió, kính sườn (nguyên vẹn)',
  'Gương chiếu hậu (đủ 2 bên, không vỡ)',
  'Lốp và mâm xe (không rách, biến dạng)',
  'Đồ cá nhân trên xe (đã nhắc khách tự bảo quản)',
  'Thảm lót sàn, nội thất (tình trạng ban đầu)'
];

const SignaturePad = ({ onSignatureChange }: { onSignatureChange: (signature: string | null) => void }) => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a'; // slate-900
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
        width={450}
        height={150}
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
          Ký vào đây
        </div>
      )}
    </div>
  );
};

export default function CreateChecklistModal({ booking, isOpen, onClose, onSuccess }: CreateChecklistModalProps) {
  const [items, setItems] = useState(DEFAULT_ITEMS.map(label => ({ label, checked: false })));
  const [note, setNote] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleToggleItem = (index: number) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      showError('Vui lòng thêm ít nhất một ảnh hiện trạng xe.');
      return;
    }

    if (!signature) {
      showError('Vui lòng yêu cầu khách hàng ký xác nhận.');
      return;
    }

    try {
      setIsSubmitting(true);
      const appointmentId = booking._id ?? booking.id!;
      
      const formData = new FormData();
      formData.append('appointment_id', appointmentId);
      formData.append('checklist_items', JSON.stringify(items));
      
      if (note.trim()) {
        formData.append('note', note.trim());
      }

      if (signature) {
        formData.append('customer_signature', signature);
      }

      images.forEach(img => {
        formData.append('images', img);
      });

      await bookingChecklistService.create(formData);
      showSuccess('Tạo biên bản thành công');
      onSuccess();
    } catch (error) {
      console.error('Lỗi tạo biên bản:', error);
      showError('Không thể tạo biên bản kiểm tra xe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Tạo Biên bản kiểm tra xe</h2>
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
              <CheckSquare size={16} className="text-cyan-600" /> Các mục kiểm tra
            </h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <label key={index} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={item.checked}
                    onChange={() => handleToggleItem(index)}
                    className="mt-0.5 w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-amber-500" /> Ghi chú hiện trạng
            </h3>
            <textarea
              className="w-full h-24 p-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              placeholder="Ghi chú về các vết xước, móp méo có sẵn..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Images */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ImageIcon size={16} className="text-emerald-500" /> Hình ảnh hiện trạng
            </h3>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            {images.length > 0 && (
              <div className="mt-2 text-sm text-slate-500">
                Đã chọn {images.length} ảnh.
              </div>
            )}
          </div>

          {/* Signature */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <PenTool size={16} className="text-indigo-500" /> Chữ ký khách hàng
            </h3>
            <SignaturePad onSignatureChange={setSignature} />
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
            disabled={isSubmitting || images.length === 0 || !signature}
            className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Xác nhận tạo
          </button>
        </div>

      </div>
    </div>
  );
}
