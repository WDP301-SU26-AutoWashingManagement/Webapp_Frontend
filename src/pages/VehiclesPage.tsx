import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Car, Pencil, Plus, Trash2, Zap, X, HelpCircle, Palette, AlertTriangle, Bike } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AccountPageShell from '../components/account/AccountPageShell'
import { AUTH_INPUT_CLASS } from '../components/auth/authUi'
import { vehicleService } from '../services/vehicleService'
import type { Vehicle, VehicleClass, VehicleMake, VehicleModelData } from '../types/vehicle'
import { getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

type VehicleFormState = {
  license_plate: string
  vehicle_class_id: string
  make_id: string
  model_id: string
  custom_make_name: string
  custom_model_name: string
  vehicle_model: string
  fuel_type: string
  color: string
}

const EMPTY_FORM: VehicleFormState = {
  license_plate: '',
  vehicle_class_id: '',
  make_id: '',
  model_id: '',
  custom_make_name: '',
  custom_model_name: '',
  vehicle_model: '',
  fuel_type: 'Xăng',
  color: '',
}

const COLOR_PRESETS = [
  { name: 'Trắng', bg: 'bg-white', border: 'border-slate-300' },
  { name: 'Đen', bg: 'bg-slate-900 border-slate-950 ring-1 ring-slate-800', border: 'border-slate-950' },
  { name: 'Xám', bg: 'bg-slate-500', border: 'border-slate-500' },
  { name: 'Đỏ', bg: 'bg-red-500', border: 'border-red-500' },
  { name: 'Xanh dương', bg: 'bg-blue-500', border: 'border-blue-500' },
  { name: 'Xanh lá', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { name: 'Vàng', bg: 'bg-yellow-400', border: 'border-yellow-400' },
]

function vehicleId(v: Vehicle): string {
  return v._id ?? v.id ?? ''
}

const getColorDot = (color: string) => {
  const normalized = color.trim().toLowerCase();
  if (normalized.includes('trắng')) return 'bg-white border border-slate-300 shadow-sm';
  if (normalized.includes('đen')) return 'bg-slate-900 ring-1 ring-slate-800';
  if (normalized.includes('xám') || normalized.includes('grey') || normalized.includes('gray')) return 'bg-slate-500';
  if (normalized.includes('đỏ') || normalized.includes('red')) return 'bg-red-500';
  if (normalized.includes('xanh dương') || normalized.includes('xanh nước biển') || normalized.includes('blue')) return 'bg-blue-500';
  if (normalized.includes('xanh lá') || normalized.includes('green')) return 'bg-emerald-500';
  if (normalized.includes('xanh')) return 'bg-blue-500';
  if (normalized.includes('vàng') || normalized.includes('yellow')) return 'bg-yellow-400';
  if (normalized.includes('cam') || normalized.includes('orange')) return 'bg-orange-500';
  if (normalized.includes('hồng') || normalized.includes('pink')) return 'bg-pink-400';
  if (normalized.includes('nâu') || normalized.includes('brown')) return 'bg-amber-800';
  if (normalized.includes('bạc') || normalized.includes('silver')) return 'bg-slate-300 border border-slate-400/30';
  return 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500'; 
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 20 
    } 
  }
} as const

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [classes, setClasses] = useState<VehicleClass[]>([])
  const [makes, setMakes] = useState<VehicleMake[]>([])
  const [models, setModels] = useState<VehicleModelData[]>([])

  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmVehicle, setDeleteConfirmVehicle] = useState<Vehicle | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vList, cList, mList, mdList] = await Promise.all([
        vehicleService.list(),
        vehicleService.listClasses(),
        vehicleService.listMakes(),
        vehicleService.listModels()
      ])
      setVehicles(vList)
      setClasses(cList)
      setMakes(mList)
      setModels(mdList)
    } catch (err) {
      showError(getApiErrorMessage(err, 'Không tải được dữ liệu'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      vehicle_class_id: classes[0]?._id ?? '',
      make_id: makes[0]?._id ?? '',
      model_id: '', 
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (vehicle: Vehicle) => {
    const model = models.find(m => m._id === vehicle.model_id)
    setForm({
      license_plate: vehicle.license_plate,
      vehicle_class_id: vehicle.vehicle_class_id ?? '',
      make_id: model?.make_id ?? 'other',
      model_id: vehicle.model_id ?? 'other',
      custom_make_name: '',
      custom_model_name: '',
      vehicle_model: vehicle.vehicle_model || '',
      fuel_type: vehicle.fuel_type,
      color: vehicle.color,
    })
    setEditingId(vehicleId(vehicle))
    setShowForm(true)
  }

  const filteredModels = models.filter(m => m.make_id === form.make_id)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.license_plate.trim()) {
      showError('Vui lòng điền đầy đủ Biển số xe')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        license_plate: form.license_plate.trim().toUpperCase(),
        vehicle_model: form.vehicle_model.trim() || 'Khác',
        fuel_type: form.fuel_type || 'Xăng',
        color: form.color || 'Khác',
      }

      if (form.vehicle_class_id && form.vehicle_class_id !== 'other') {
        payload.vehicle_class_id = form.vehicle_class_id
      }
      if (form.model_id && form.model_id !== 'other') {
        payload.model_id = form.model_id
      } else {
        payload.model_id = 'other'
        const selectedMake = makes.find(m => m._id === form.make_id)
        payload.make_name = form.make_id === 'other'
          ? (form.custom_make_name.trim() || 'Khác')
          : (selectedMake ? selectedMake.make_name : 'Khác')
        payload.model_name = form.custom_model_name.trim() || 'Khác'
      }

      if (editingId) {
        await vehicleService.update(editingId, payload)
        showSuccess('Cập nhật phương tiện thành công')
      } else {
        await vehicleService.create(payload)
        showSuccess('Thêm phương tiện thành công')
      }
      resetForm()
      await loadData()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Lưu phương tiện thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (vehicle: Vehicle) => {
    setDeleteConfirmVehicle(vehicle)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmVehicle) return
    const id = vehicleId(deleteConfirmVehicle)
    if (!id) return

    try {
      await vehicleService.remove(id)
      showSuccess('Đã xóa phương tiện')
      await loadData()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Xóa phương tiện thất bại'))
    } finally {
      setDeleteConfirmVehicle(null)
    }
  }

  return (
    <AccountPageShell
      title="Phương tiện"
      description="Quản lý xe và phương tiện đăng ký rửa xe."
      maxWidthClass="max-w-5xl"
      action={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition duration-300 hover:from-cyan-600 hover:to-teal-600 hover:shadow-lg hover:shadow-cyan-600/25 active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Thêm phương tiện
        </button>
      }
    >
      {/* Dashboard Stats */}
      {!loading && vehicles.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          <div className="flex items-center gap-4 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/15 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/25">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng phương tiện</p>
              <p className="text-xl font-bold text-slate-800">{vehicles.length} xe</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/15 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xe điện (Eco-friendly)</p>
              <p className="text-xl font-bold text-slate-800">{vehicles.filter(v => v.fuel_type === 'Điện').length} xe</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/15 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xăng & Dầu</p>
              <p className="text-xl font-bold text-slate-800">
                {vehicles.filter(v => v.fuel_type === 'Xăng' || v.fuel_type === 'Dầu').length} xe
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tip Banner */}
      {!loading && vehicles.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 bg-cyan-50/50 border border-cyan-500/10 rounded-xl p-3 text-xs text-cyan-800"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-cyan-600 animate-pulse" />
          <span><strong>Mẹo nhỏ:</strong> Nhấp trực tiếp vào bất kỳ thẻ xe nào bên dưới để chỉnh sửa thông tin nhanh chóng!</span>
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? (
                    <span className="flex items-center gap-2 text-[#0ea5b7]">
                      <Pencil className="h-4 w-4" />
                      Chỉnh sửa phương tiện
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-[#0ea5b7]">
                      <Plus className="h-4 w-4" />
                      Thêm phương tiện mới
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Plate preview */}
                <div className="flex justify-center mb-1">
                  <div className="inline-flex flex-col items-center justify-center bg-white border-2 border-slate-800 rounded-lg px-6 py-1.5 shadow-sm font-mono min-w-[160px] h-15 select-none relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-[#0ea5b7]" />
                    {/* Metal rivets */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400/50 shadow-inner" />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400/50 shadow-inner" />
                    <span className="text-[9px] text-slate-400 tracking-widest font-bold">VIET NAM</span>
                    <span className="text-slate-800 font-extrabold tracking-widest text-lg leading-none mt-0.5">
                      {form.license_plate ? form.license_plate.toUpperCase() : '59A1-12345'}
                    </span>
                  </div>
                </div>

                {/* License Plate Input */}
                <label className="block text-sm">
                  <span className="font-semibold text-slate-700">Biển số xe *</span>
                  <input
                    type="text"
                    required
                    placeholder="VD: 59A1-12345"
                    value={form.license_plate}
                    onChange={(e) => setForm((p) => ({ ...p, license_plate: e.target.value }))}
                    className={`${AUTH_INPUT_CLASS} mt-1.5 uppercase`}
                    disabled={saving}
                  />
                </label>

                {/* Brands & Models Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="block text-sm space-y-1.5">
                    <label className="block">
                      <span className="font-semibold text-slate-700">Hãng xe</span>
                      <select
                        value={form.make_id}
                        onChange={(e) => {
                          const make_id = e.target.value;
                          const defaultModel = make_id === 'other' ? 'other' : (models.find(m => m.make_id === make_id)?._id ?? '');
                          setForm((p) => ({ ...p, make_id, model_id: defaultModel }))
                        }}
                        className={`${AUTH_INPUT_CLASS} mt-1.5`}
                        disabled={saving}
                      >
                        <option value="">Chọn hãng xe</option>
                        {makes.filter(opt => opt.make_name !== 'Khác').map((opt) => (
                          <option key={opt._id} value={opt._id}>{opt.make_name}</option>
                        ))}
                        {makes.filter(opt => opt.make_name === 'Khác').map((opt) => (
                          <option key={opt._id} value={opt._id}>{opt.make_name}</option>
                        ))}
                      </select>
                    </label>
                    {form.make_id === 'other' && (
                      <input
                        type="text"
                        placeholder="Nhập tên hãng xe"
                        value={form.custom_make_name}
                        onChange={(e) => setForm((p) => ({ ...p, custom_make_name: e.target.value }))}
                        className={`${AUTH_INPUT_CLASS}`}
                        disabled={saving}
                      />
                    )}
                  </div>

                  <div className="block text-sm space-y-1.5">
                    <label className="block">
                      <span className="font-semibold text-slate-700">Dòng xe (Model)</span>
                      <select
                        value={form.model_id}
                        onChange={(e) => setForm((p) => ({ ...p, model_id: e.target.value }))}
                        className={`${AUTH_INPUT_CLASS} mt-1.5`}
                        disabled={saving || (!form.make_id && form.make_id !== 'other')}
                      >
                        <option value="">Chọn dòng xe</option>
                        {filteredModels.filter(opt => opt.model_name !== 'Khác').map((opt) => (
                          <option key={opt._id} value={opt._id}>{opt.model_name}</option>
                        ))}
                        {filteredModels.filter(opt => opt.model_name === 'Khác').map((opt) => (
                          <option key={opt._id} value={opt._id}>{opt.model_name}</option>
                        ))}
                      </select>
                    </label>
                    {form.model_id === 'other' && (
                      <input
                        type="text"
                        placeholder="Nhập tên dòng xe"
                        value={form.custom_model_name}
                        onChange={(e) => setForm((p) => ({ ...p, custom_model_name: e.target.value }))}
                        className={`${AUTH_INPUT_CLASS}`}
                        disabled={saving || (!form.make_id && form.make_id !== 'other')}
                      />
                    )}
                  </div>
                </div>

                {/* Class Dropdown */}
                <label className="block text-sm">
                  <span className="font-semibold text-slate-700">Loại xe (Kiểu dáng) *</span>
                  <select
                    required
                    value={form.vehicle_class_id}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle_class_id: e.target.value }))}
                    className={`${AUTH_INPUT_CLASS} mt-1.5`}
                    disabled={saving}
                  >
                    <option value="">Chọn loại xe</option>
                    {classes.map((opt) => (
                      <option key={opt._id} value={opt._id}>
                        {opt.class_name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Vehicle model version */}
                <label className="block text-sm">
                  <span className="font-semibold text-slate-700">Tên xe (Phiên bản cụ thể)</span>
                  <input
                    type="text"
                    placeholder="VD: SH 150i, Camry 2.5Q..."
                    value={form.vehicle_model}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle_model: e.target.value }))}
                    className={`${AUTH_INPUT_CLASS} mt-1.5`}
                    disabled={saving}
                  />
                </label>

                {/* Fuel Type segmented chips selection */}
                <div className="block text-sm">
                  <span className="font-semibold text-slate-700">Loại nhiên liệu *</span>
                  <div className="grid grid-cols-3 gap-2.5 mt-1.5">
                    {[
                      { value: 'Xăng', label: 'Xăng', emoji: '⛽', activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10' },
                      { value: 'Dầu', label: 'Dầu', emoji: '🛢️', activeColor: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10' },
                      { value: 'Điện', label: 'Điện', emoji: '⚡', activeColor: 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/10' },
                    ].map((opt) => {
                      const isActive = form.fuel_type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={saving}
                          onClick={() => setForm(p => ({ ...p, fuel_type: opt.value }))}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition duration-200 select-none ${
                            isActive
                              ? opt.activeColor
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color input + quick selector presets */}
                <div className="block text-sm">
                  <label className="block">
                    <span className="font-semibold text-slate-700">Màu xe *</span>
                    <input
                      type="text"
                      required
                      placeholder="VD: Trắng, Đen, Đỏ..."
                      value={form.color}
                      onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                      className={`${AUTH_INPUT_CLASS} mt-1.5`}
                      disabled={saving}
                    />
                  </label>
                  <div className="mt-2.5">
                    <span className="text-xs text-slate-500 font-medium">Chọn nhanh màu phổ biến:</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {COLOR_PRESETS.map((preset) => {
                        const isSelected = form.color.trim().toLowerCase() === preset.name.toLowerCase();
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            disabled={saving}
                            onClick={() => setForm(p => ({ ...p, color: preset.name }))}
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200 select-none ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-50 text-[#0ea5b7] ring-2 ring-cyan-500/10 font-bold'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`h-2.5 w-2.5 rounded-full border border-black/10 ${preset.bg}`} />
                            <span>{preset.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-white shadow-md shadow-cyan-500/15 transition hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicle Grid Container */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-5">Danh sách phương tiện</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#0ea5b7]" />
            <p className="mt-3 text-sm text-slate-500">Đang tải danh sách xe...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-50/20 px-6 py-12 text-center animate-in fade-in duration-300">
            <Car className="h-12 w-12 text-cyan-500/50 animate-bounce" aria-hidden />
            <p className="mt-4 font-bold text-slate-800">Chưa có phương tiện nào</p>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Đăng ký xe ngay để tối ưu hóa quá trình đặt lịch rửa xe.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-cyan-600 hover:to-teal-600"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Thêm xe đầu tiên
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {vehicles.map((vehicle) => {
              const id = vehicleId(vehicle)
              const model = models.find(m => m._id === vehicle.model_id)
              const make = makes.find(m => m._id === model?.make_id)
              const vClass = classes.find(c => c._id === vehicle.vehicle_class_id)
              const makeName = make?.make_name || 'Khác'
              const modelName = model?.model_name || 'Khác'
              const isMotorbike = vClass?.class_name.toLowerCase().includes('xe máy');

              return (
                <motion.div
                  key={id || vehicle.license_plate}
                  variants={cardVariants}
                  whileHover={{ 
                    y: -6, 
                    borderColor: 'rgba(14, 165, 183, 0.35)', 
                    boxShadow: '0 12px 30px -10px rgba(14, 165, 183, 0.15), 0 8px 10px -6px rgba(14, 165, 183, 0.05)' 
                  }}
                  onClick={() => openEdit(vehicle)}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all duration-300 flex flex-col justify-between relative overflow-hidden group cursor-pointer select-none"
                >
                  {/* Accent border highlight on hover */}
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-teal-400 transition-all duration-300" />
                  
                  <div>
                    {/* Card Header Row */}
                    <div className="flex items-start justify-between">
                      {/* Vietnamese License Plate Mockup with metal rivets */}
                      <div className="inline-flex items-center gap-1 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded px-2.5 py-1 font-mono select-none h-11 shadow-inner relative overflow-hidden min-w-[125px] justify-center">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#0ea5b7]/80" />
                        {/* Screw rivets */}
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400/50 shadow-inner" />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400/50 shadow-inner" />
                        
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[6px] text-slate-400 font-bold tracking-widest leading-none">VIETNAM</span>
                          <span className="text-slate-800 font-extrabold tracking-wide text-xs leading-none mt-0.5">
                            {vehicle.license_plate}
                          </span>
                        </div>
                      </div>
                      
                      {/* Class icon */}
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                        isMotorbike ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-cyan-50 text-[#0ea5b7] group-hover:bg-[#0ea5b7] group-hover:text-white'
                      }`}>
                        {isMotorbike ? <Bike className="h-5 w-5" /> : <Car className="h-5 w-5" />}
                      </span>
                    </div>

                    {/* Make & Model info */}
                    <h3 className="font-bold text-slate-800 text-base mt-4 group-hover:text-cyan-600 transition-colors duration-200">
                      {makeName === 'Khác' && modelName === 'Khác'
                        ? vehicle.vehicle_model || 'Xe khác'
                        : `${makeName} ${modelName}`}
                    </h3>

                    {vehicle.vehicle_model && makeName !== 'Khác' && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Phiên bản: {vehicle.vehicle_model}
                      </p>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {/* Class name Badge */}
                      <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold text-[#0ea5b7] border border-cyan-100/40">
                        {vClass?.class_name || 'Loại xe'}
                      </span>

                      {/* Fuel type Badge */}
                      {vehicle.fuel_type === 'Điện' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100/40 animate-pulse">
                          <Zap className="h-2.5 w-2.5 fill-purple-400 text-purple-500" />
                          Điện
                        </span>
                      ) : vehicle.fuel_type === 'Dầu' ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100/40">
                          Dầu
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100/40">
                          Xăng
                        </span>
                      )}

                      {/* Color Badge with dot */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/50 transition-colors duration-300 group-hover:bg-white">
                        <span className={`h-2 w-2 rounded-full border border-black/5 ${getColorDot(vehicle.color)} transition-transform duration-300 group-hover:scale-125`} />
                        {vehicle.color}
                      </span>
                    </div>
                  </div>

                  {/* Divider and Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100/60 flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(vehicle);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0ea5b7] hover:bg-cyan-50/50 transition duration-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(vehicle);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition duration-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </section>

      {/* Modal xác nhận xóa phương tiện */}
      <AnimatePresence>
        {deleteConfirmVehicle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4 shadow-inner">
                  <AlertTriangle className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận xóa xe</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Bạn có chắc chắn muốn xóa xe có biển số <strong className="text-slate-800 font-semibold">{deleteConfirmVehicle.license_plate}</strong> không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmVehicle(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 shadow-md shadow-red-500/10 active:scale-95"
                >
                  Xóa xe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AccountPageShell>
  )
}
