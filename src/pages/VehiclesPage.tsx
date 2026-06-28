import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Car, Pencil, Plus, Trash2 } from 'lucide-react'
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

function vehicleId(v: Vehicle): string {
  return v._id ?? v.id ?? ''
}

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
      model_id: '', // Will be selected based on make
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

  const handleDelete = async (vehicle: Vehicle) => {
    const id = vehicleId(vehicle)
    if (!id) return
    if (!window.confirm(`Xóa phương tiện ${vehicle.license_plate}?`)) return

    try {
      await vehicleService.remove(id)
      showSuccess('Đã xóa phương tiện')
      await loadData()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Xóa phương tiện thất bại'))
    }
  }

  return (
    <AccountPageShell
      title="Phương tiện"
      description="Quản lý xe và phương tiện đăng ký rửa xe."
      action={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Thêm phương tiện
        </button>
      }
    >
      {showForm && (
        <section className="rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Chỉnh sửa phương tiện' : 'Thêm phương tiện mới'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Biển số xe *</span>
              <input
                type="text"
                required
                placeholder="VD: 59A1-12345"
                value={form.license_plate}
                onChange={(e) => setForm((p) => ({ ...p, license_plate: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1 uppercase`}
                disabled={saving}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div className="block text-sm space-y-2">
                <label className="block">
                  <span className="font-medium text-slate-700">Hãng xe</span>
                  <select
                    value={form.make_id}
                    onChange={(e) => {
                      const make_id = e.target.value;
                      const defaultModel = make_id === 'other' ? 'other' : (models.find(m => m.make_id === make_id)?._id ?? '');
                      setForm((p) => ({ ...p, make_id, model_id: defaultModel }))
                    }}
                    className={`${AUTH_INPUT_CLASS} mt-1`}
                    disabled={saving}
                  >
                    <option value="">Chọn hãng xe</option>
                    {makes.filter(opt => opt.make_name !== 'Khác').map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.make_name}</option>
                    ))}
                    {makes.filter(opt => opt.make_name === 'Khác').map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.make_name}</option>
                    ))}
                    {/* <option value="other">Khác (Nhập tùy chọn)</option> */}
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

              <div className="block text-sm space-y-2">
                <label className="block">
                  <span className="font-medium text-slate-700">Dòng xe (Model)</span>
                  <select
                    value={form.model_id}
                    onChange={(e) => setForm((p) => ({ ...p, model_id: e.target.value }))}
                    className={`${AUTH_INPUT_CLASS} mt-1`}
                    disabled={saving || (!form.make_id && form.make_id !== 'other')}
                  >
                    <option value="">Chọn dòng xe</option>
                    {filteredModels.filter(opt => opt.model_name !== 'Khác').map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.model_name}</option>
                    ))}
                    {filteredModels.filter(opt => opt.model_name === 'Khác').map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.model_name}</option>
                    ))}
                    {/* <option value="other">Khác (Nhập tùy chọn)</option> */}
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

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Loại xe (Kiểu dáng) *</span>
              <select
                required
                value={form.vehicle_class_id}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_class_id: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
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

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Tên xe (Phiên bản cụ thể)</span>
              <input
                type="text"
                placeholder="VD: SH 150i, Camry 2.5Q..."
                value={form.vehicle_model}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_model: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Loại nhiên liệu *</span>
                <select
                  required
                  value={form.fuel_type}
                  onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value }))}
                  className={`${AUTH_INPUT_CLASS} mt-1`}
                  disabled={saving}
                >
                  <option value="Xăng">Xăng</option>
                  <option value="Dầu">Dầu (Diesel)</option>
                  <option value="Điện">Điện</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Màu xe *</span>
                <input
                  type="text"
                  required
                  placeholder="VD: Trắng, Đen..."
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  className={`${AUTH_INPUT_CLASS} mt-1`}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#0ea5b7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8fa0] disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-cyan-500/30 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Danh sách phương tiện</h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
        ) : vehicles.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-cyan-500/25 bg-cyan-50/30 px-6 py-12 text-center">
            <Car className="h-12 w-12 text-cyan-500/60" aria-hidden />
            <p className="mt-4 font-medium text-slate-800">Chưa có phương tiện nào</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Thêm biển số và thông tin xe để đặt lịch rửa xe nhanh hơn.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0ea5b7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c8fa0]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Thêm phương tiện đầu tiên
            </button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {vehicles.map((vehicle) => {
              const id = vehicleId(vehicle)
              const model = models.find(m => m._id === vehicle.model_id)
              const make = makes.find(m => m._id === model?.make_id)
              const vClass = classes.find(c => c._id === vehicle.vehicle_class_id)

              return (
                <li
                  key={id || vehicle.license_plate}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0ea5b7]">
                      <Car className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-base font-bold tracking-wide text-slate-900">
                        {vehicle.license_plate}
                      </p>
                      <p className="text-sm text-slate-600">
                        {make?.make_name === 'Khác' && model?.model_name === 'Khác'
                          ? vehicle.vehicle_model || 'Xe khác'
                          : `${make?.make_name || 'Hãng xe'} ${model?.model_name || 'Dòng xe'} ${vehicle.vehicle_model ? `- ${vehicle.vehicle_model}` : ''}`.trim()
                        }
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {vClass?.class_name || 'Loại xe'} · {vehicle.color} · {vehicle.fuel_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/25 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-500/50 hover:text-[#0ea5b7]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Xóa
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </AccountPageShell>
  )
}
