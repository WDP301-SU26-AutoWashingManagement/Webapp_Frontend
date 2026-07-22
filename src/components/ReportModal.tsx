import { useState, useEffect } from 'react'
import { X, Upload, MessageSquareWarning, AlertTriangle } from 'lucide-react'
import { bookingChecklistService } from '../services/bookingChecklistService'
import { showError, showSuccess } from '../utils/toast'
import { getApiErrorMessage } from '../utils/errors'
import { useAuth } from '../hooks/useAuth'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string | null
  onSuccess?: () => void
}

export default function ReportModal({ isOpen, onClose, appointmentId, onSuccess }: ReportModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fullname, setFullname] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHandoverSigned, setIsHandoverSigned] = useState(false)
  const [loadingCheck, setLoadingCheck] = useState(false)

  useEffect(() => {
    if (isOpen && appointmentId) {
      setLoadingCheck(true)
      bookingChecklistService.getByAppointmentId(appointmentId)
        .then(checklist => {
          setIsHandoverSigned(!!checklist?.customer_signature_after)
        })
        .catch(() => setIsHandoverSigned(false))
        .finally(() => setLoadingCheck(false))
    } else {
      setIsHandoverSigned(false)
    }
  }, [isOpen, appointmentId])

  if (!isOpen || !appointmentId) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setEvidenceFiles(prev => [...prev, ...files].slice(0, 10)) // Max 10 files (matches Backend limit)
    }
  }

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isHandoverSigned) {
      showError('Xe đã được ký xác nhận bàn giao, không thể tạo đơn khiếu nại.')
      return
    }

    if (!title.trim() || !description.trim() || !fullname.trim()) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('fullname', fullname)
      if (phone) formData.append('phone', phone)
      if (email) formData.append('email', email)

      evidenceFiles.forEach(file => {
        formData.append('evidence', file)
      })

      await bookingChecklistService.createReport(appointmentId, formData)

      showSuccess('Gửi khiếu nại thành công! Chúng tôi sẽ sớm liên hệ lại với bạn.')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      showError(getApiErrorMessage(err, 'Lỗi khi gửi khiếu nại'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="text-amber-500" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Tạo Khiếu nại / Báo cáo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isHandoverSigned && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2 mb-4 shadow-sm">
              <AlertTriangle className="shrink-0 text-amber-600" size={18} />
              <span>Đơn hàng này đã được ký xác nhận bàn giao xe. Bạn không thể tạo thêm đơn khiếu nại.</span>
            </div>
          )}

          <form id="report-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tiêu đề <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isHandoverSigned || loadingCheck}
                placeholder="Vd: Xe chưa được rửa sạch phần bánh"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={fullname}
                  onChange={e => setFullname(e.target.value)}
                  disabled={isHandoverSigned || loadingCheck}
                  placeholder="Nhập họ tên"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={isHandoverSigned || loadingCheck}
                  placeholder="Để tiện liên hệ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả chi tiết <span className="text-rose-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isHandoverSigned || loadingCheck}
                placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hình ảnh bằng chứng (Tối đa 10 ảnh)</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {evidenceFiles.map((file, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    {!isHandoverSigned && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {!isHandoverSigned && evidenceFiles.length < 10 && (
                  <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-indigo-500 hover:border-indigo-500 cursor-pointer transition-colors bg-slate-50">
                    <Upload size={18} />
                    <span className="text-[10px] mt-1 font-medium">Tải ảnh</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
            disabled={isSubmitting}
          >
            {isHandoverSigned ? 'Đóng' : 'Hủy'}
          </button>
          <button
            type="submit"
            form="report-form"
            disabled={isSubmitting || isHandoverSigned || loadingCheck}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>
        </div>
      </div>
    </div>
  )
}
