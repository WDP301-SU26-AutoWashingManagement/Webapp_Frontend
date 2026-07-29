import React, { useState, useRef, useEffect } from 'react';
import { X, CheckSquare, Image as ImageIcon, FileText, Loader2, PenTool, Upload, Eye } from 'lucide-react';
import type { WashBooking } from '../types/booking';
import { bookingChecklistService } from '../services/bookingChecklistService';
import { showSuccess, showError } from '../utils/toast';

interface CreateChecklistModalProps {
  booking: WashBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// DANH SÁCH MỤC KIỂM TRA CHUẨN MẶC ĐỊNH (FRONTEND TEMPLATE):
// Backend thiết kế Schema checklist_items là mảng động Array<{ label: string, checked: boolean }>.
// Frontend định nghĩa sẵn (hardcode template) danh sách các mục khảo sát tiêu chuẩn khi nhận xe để Nhân viên không phải tự gõ lại.
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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems(DEFAULT_ITEMS.map(label => ({ label, checked: false })));
      setNote('');
      setImages([]);
      setSignature(null);
      setPreviewImageUrl(null);
    }
  }, [isOpen, booking?._id, booking?.id]);

  if (!isOpen || !booking) return null;

  // HÀM ĐẢO TRẠNG THÁI CHECKBOX KHI BẤM TÍCH / BỎ TÍCH MỘT MỤC CHECKLIST:
  const handleToggleItem = (index: number) => {
    // 1. Sao chép (clone) mảng items ra mảng mới newItems (Tuân thủ tính bất biến Immutability của React)
    const newItems = [...items];
    // 2. Đảo ngược giá trị true/false của thuộc tính checked tại vị trí index được chọn
    newItems[index].checked = !newItems[index].checked;
    // 3. Cập nhật mảng newItems mới vào State để React render lại ô checkbox trên giao diện
    setItems(newItems);
  };

  // 1. XỬ LÝ CHỌN ẢNH TỪ MÁY TÍNH / THIẾT BỊ:
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Lưu mảng các đối tượng File nhị phân (tối đa 10 ảnh hiện trạng xe) vào State
      setImages(prev => [...prev, ...selectedFiles].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      showError('Vui lòng thêm ít nhất một ảnh hiện trạng xe.');
      return;
    }

    // Yêu cầu bắt buộc phải có chữ ký xác nhận nhận xe của khách hàng
    if (!signature) {
      showError('Vui lòng yêu cầu khách hàng ký xác nhận.');
      return;
    }

    try {
      setIsSubmitting(true);
      const appointmentId = booking._id ?? booking.id!;
      
      // 2. ĐÓNG GÓI MULTIPART FORM-DATA:
      const formData = new FormData();
      formData.append('appointment_id', appointmentId);
      formData.append('checklist_items', JSON.stringify(items)); // Danh sách mục kiểm tra tình trạng xe (JSON String)
      
      if (note.trim()) {
        formData.append('note', note.trim());
      }

      // 3. ĐÍNH KÈM CHỮ KÝ: Gửi chữ ký khách dưới dạng chuỗi Data URI Base64 (tạo từ Canvas)
      if (signature) {
        formData.append('customer_signature', signature);
      }

      // 4. ĐÍNH KÈM CÁC FILE ẢNH NHỊ PHÂN: Lặp mảng images và append từng file vào key 'images'
      images.forEach(img => {
        formData.append('images', img);
      });

      // 5. GỬI REQUEST HTTP POST /booking-checklists VỀ BACKEND ĐỂ UPLOAD VÀ TẠO BIÊN BẢN
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
              <ImageIcon size={16} className="text-emerald-500" /> Hình ảnh hiện trạng (Tối đa 10 ảnh)
            </h3>

            <div className="flex flex-wrap gap-3">
              {images.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div 
                    key={idx} 
                    onClick={() => setPreviewImageUrl(objectUrl)}
                    className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-50 cursor-pointer hover:border-cyan-500 hover:shadow-md transition-all"
                  >
                    <img 
                      src={objectUrl} 
                      alt={`preview-${idx}`} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Hover overlay with Eye icon */}
                    <div className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={20} className="drop-shadow" />
                    </div>

                    {/* Delete button (X) on top-right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow transition-transform hover:scale-110 z-10"
                      title="Xóa ảnh"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}

              {images.length < 10 && (
                <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors bg-emerald-50/30">
                  <Upload size={20} />
                  <span className="text-[11px] mt-1 font-semibold">Tải ảnh</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                </label>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                Đã chọn <span className="font-semibold text-emerald-700">{images.length}</span>/10 ảnh. Nhấp vào ảnh để xem phóng to.
              </div>
            )}
          </div>

          {/* Signature */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <PenTool size={16} className="text-indigo-500" /> Chữ ký khách hàng
            </h3>
            <SignaturePad key={booking?._id || booking?.id} onSignatureChange={setSignature} />
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

      {/* Lightbox Preview Modal cho ảnh phóng to */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/60 hover:bg-rose-600 text-white rounded-full backdrop-blur-sm transition-colors shadow-lg"
              title="Đóng xem ảnh"
            >
              <X size={20} />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Xem ảnh hiện trạng phóng to" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
