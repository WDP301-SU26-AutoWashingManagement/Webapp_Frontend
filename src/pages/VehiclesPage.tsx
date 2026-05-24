import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Car, Pencil, Plus, Trash2 } from 'lucide-react'
import AccountPageShell from '../components/account/AccountPageShell'
import { AUTH_INPUT_CLASS } from '../components/auth/authUi'
import { vehicleService } from '../services/vehicleService'
import type { Vehicle } from '../types/vehicle'
import {
  getVehicleTypeLabel,
  normalizeVehicleType,
  VEHICLE_TYPE_OPTIONS,
  VehicleType,
} from '../types/vehicle'

type VehicleFormState = {
  plate_number: string
  vehicle_type: VehicleType
  brand: string
  vehicle_model: string
}
import { getApiErrorMessage } from '../utils/errors'
import { showError, showSuccess } from '../utils/toast'

const EMPTY_FORM: VehicleFormState = {
  plate_number: '',
  vehicle_type: VehicleType.MOTORBIKE,
  brand: '',
  vehicle_model: '',
}

function vehicleId(v: Vehicle): string {
  return v._id ?? v.id ?? ''
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const list = await vehicleService.list()
      setVehicles(list)
    } catch (err) {
      setVehicles([])
      showError(getApiErrorMessage(err, 'Không tải được danh sách phương tiện'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVehicles()
  }, [loadVehicles])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (vehicle: Vehicle) => {
    setForm({
      plate_number: vehicle.plate_number,
      vehicle_type: normalizeVehicleType(vehicle.vehicle_type),
      brand: vehicle.brand,
      vehicle_model: vehicle.vehicle_model,
    })
    setEditingId(vehicleId(vehicle))
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.plate_number.trim() || !form.brand.trim() || !form.vehicle_model.trim()) {
      showError('Vui lòng điền đầy đủ thông tin phương tiện')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await vehicleService.update(editingId, {
          plate_number: form.plate_number.trim().toUpperCase(),
          vehicle_type: form.vehicle_type,
          brand: form.brand.trim(),
          vehicle_model: form.vehicle_model.trim(),
        })
        showSuccess('Cập nhật phương tiện thành công')
      } else {
        await vehicleService.create({
          plate_number: form.plate_number.trim().toUpperCase(),
          vehicle_type: form.vehicle_type,
          brand: form.brand.trim(),
          vehicle_model: form.vehicle_model.trim(),
        })
        showSuccess('Thêm phương tiện thành công')
      }
      resetForm()
      await loadVehicles()
    } catch (err) {
      showError(getApiErrorMessage(err, 'Lưu phương tiện thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicle: Vehicle) => {
    const id = vehicleId(vehicle)
    if (!id) return
    if (!window.confirm(`Xóa phương tiện ${vehicle.plate_number}?`)) return

    try {
      await vehicleService.remove(id)
      showSuccess('Đã xóa phương tiện')
      await loadVehicles()
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
                value={form.plate_number}
                onChange={(e) => setForm((p) => ({ ...p, plate_number: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1 uppercase`}
                disabled={saving}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Loại xe *</span>
              <select
                required
                value={form.vehicle_type}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value as VehicleType }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving}
              >
                {VEHICLE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Hãng xe *</span>
              <input
                type="text"
                required
                placeholder="VD: Honda, Yamaha..."
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Dòng xe / Model *</span>
              <input
                type="text"
                required
                placeholder="VD: Wave Alpha, Exciter..."
                value={form.vehicle_model}
                onChange={(e) => setForm((p) => ({ ...p, vehicle_model: e.target.value }))}
                className={`${AUTH_INPUT_CLASS} mt-1`}
                disabled={saving}
              />
            </label>
            <div className="flex flex-wrap gap-3">
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

      <section className="rounded-xl border border-cyan-500/15 bg-white p-6 shadow-sm">
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
              return (
                <li
                  key={id || vehicle.plate_number}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0ea5b7]">
                      <Car className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-mono text-base font-bold tracking-wide text-slate-900">
                        {vehicle.plate_number}
                      </p>
                      <p className="text-sm text-slate-600">
                        {vehicle.brand} · {vehicle.vehicle_model}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {getVehicleTypeLabel(vehicle.vehicle_type)}
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
