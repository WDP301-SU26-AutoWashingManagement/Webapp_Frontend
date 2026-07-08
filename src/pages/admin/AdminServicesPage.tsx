import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, RefreshCw, Pencil, Trash2, ToggleLeft, ToggleRight,
  Clock, DollarSign, X, Check, ChevronLeft, ChevronRight,
} from 'lucide-react'
import type { Service, CreateServiceInput } from '../../types/service'
import { adminServiceService } from '../../services/adminServiceService'
import type { ServiceGroup } from '../../types/serviceGroup'
import { adminServiceGroupService } from '../../services/adminServiceGroupService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPrice = (n: number) => n.toLocaleString('vi-VN') + 'đ'
const getId = (s: Service) => s._id ?? s.id ?? ''

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ServiceModalProps {
  initial?: Service | null
  groups: ServiceGroup[]
  onClose: () => void
  onSaved: (pkg: Service) => void
}

function ServiceModal({ initial, groups, onClose, onSaved }: ServiceModalProps) {
  const isEdit = !!initial
  const [form, setForm] = useState<CreateServiceInput>({
    service_group_id: initial?.service_group_id ?? (groups[0]?._id ?? groups[0]?.id ?? ''),
    service_name: initial?.service_name ?? '',
    description: initial?.description ?? '',
    service_price: initial?.service_price ?? 0,
    duration_minutes: initial?.duration_minutes ?? 30,
    is_active: initial?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.service_group_id) {
      showError('Vui lòng chọn nhóm dịch vụ')
      return
    }
    if (form.service_name.trim().length < 2) {
      showError('Tên dịch vụ phải có ít nhất 2 ký tự')
      return
    }
    if (form.service_price < 0) { showError('Giá không được âm'); return }
    if (!Number.isInteger(form.duration_minutes) || form.duration_minutes < 1) {
      showError('Thời gian phải là số phút nguyên (ít nhất 1)')
      return
    }

    setSaving(true)
    try {
      let saved: Service
      if (isEdit) {
        saved = await adminServiceService.update(getId(initial!), form)
      } else {
        saved = await adminServiceService.create(form)
      }
      showSuccess(isEdit ? 'Cập nhật dịch vụ thành công' : 'Thêm dịch vụ thành công')
      onSaved(saved)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể lưu dịch vụ'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{isEdit ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Nhóm dịch vụ <span className="text-red-500">*</span></label>
            <select
              className="admin-form-input"
              value={form.service_group_id}
              onChange={e => setForm(f => ({ ...f, service_group_id: e.target.value }))}
            >
              <option value="">-- Chọn nhóm dịch vụ --</option>
              {groups.map(g => (
                <option key={g._id || g.id} value={g._id || g.id}>{g.group_name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Tên dịch vụ <span className="text-red-500">*</span></label>
            <input
              ref={nameRef}
              className="admin-form-input"
              value={form.service_name}
              onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}
              placeholder="Rửa xe cơ bản..."
              maxLength={100}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mô tả</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về dịch vụ..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Giá (đ) <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="admin-form-input"
                value={form.service_price}
                min={0}
                onChange={e => setForm(f => ({ ...f, service_price: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Thời gian (phút) <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="admin-form-input"
                value={form.duration_minutes}
                min={1}
                onChange={e => setForm(f => ({
                  ...f,
                  duration_minutes: Math.max(1, Math.floor(Number(e.target.value) || 0)),
                }))}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Trạng thái</label>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <span className="admin-toggle__track" />
              <span className="admin-toggle__label">{form.is_active ? 'Đang hoạt động' : 'Tạm ngừng'}</span>
            </label>
          </div>

          <div className="admin-modal__footer">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [modal, setModal] = useState<'create' | Service | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = async (pg = page) => {
    setLoading(true)
    try {
      const res = await adminServiceService.list({
        page: pg,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        is_active: filterActive,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages || Math.ceil(res.total / PAGE_SIZE) || 1)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tải danh sách dịch vụ'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    adminServiceGroupService.list({ limit: 100, is_active: true })
      .then(res => setGroups(res.items))
      .catch(console.error)
  }, [])

  useEffect(() => { void fetchData(1); setPage(1) }, [search, filterActive])
  useEffect(() => { void fetchData(page) }, [page])

  const handleSaved = () => {
    setModal(null)
    void fetchData(page)
  }

  const handleToggle = async (pkg: Service) => {
    const id = getId(pkg)
    setTogglingId(id)
    try {
      await adminServiceService.toggleActive(id, !pkg.is_active)
      showSuccess(`Đã ${pkg.is_active ? 'tạm ngừng' : 'kích hoạt'} dịch vụ`)
      void fetchData(page)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể cập nhật trạng thái'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (pkg: Service) => {
    if (pkg.is_active) {
      showError('Vui lòng tạm ngừng dịch vụ trước khi xóa')
      return
    }
    if (!window.confirm(`Xoá dịch vụ "${pkg.service_name}"? Hành động này không thể hoàn tác.`)) return
    const id = getId(pkg)
    setDeletingId(id)
    try {
      await adminServiceService.remove(id)
      showSuccess('Đã xoá dịch vụ')
      void fetchData(page)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể xoá dịch vụ'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm theo tên dịch vụ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>

        <div className="admin-filter-tabs">
          {([undefined, true, false] as (boolean | undefined)[]).map(val => (
            <button
              key={String(val)}
              className={`admin-filter-tab ${filterActive === val ? 'admin-filter-tab--active' : ''}`}
              onClick={() => setFilterActive(val)}
            >
              {val === undefined ? 'Tất cả' : val ? 'Hoạt động' : 'Tạm ngừng'}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => void fetchData(page)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="admin-btn admin-btn--primary" onClick={() => setModal('create')}>
            <Plus size={15} /> Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Dịch vụ</th>
              <th>Nhóm</th>
              <th>Giá</th>
              <th>Thời gian</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-table__empty">
                <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="admin-table__empty">Không có dịch vụ nào</td></tr>
            ) : items.map(pkg => {
              const id = getId(pkg)
              const group = groups.find(g => (g._id || g.id) === pkg.service_group_id)
              return (
                <tr key={id} className="admin-table__row">
                  <td>
                    <div className="admin-table__primary">
                      {pkg.service_code && <span className="text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded mr-2">{pkg.service_code}</span>}
                      {pkg.service_name}
                    </div>
                    {pkg.description && (
                      <div className="admin-table__secondary">{pkg.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="admin-table__meta">{group?.group_name || '---'}</span>
                  </td>
                  <td>
                    <span className="admin-table__badge admin-table__badge--blue font-semibold">
                      {fmtPrice(pkg.service_price)}
                    </span>
                  </td>
                  <td>
                    <span className="admin-table__meta">
                      <Clock size={12} /> {pkg.duration_minutes} phút
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="relative inline-flex items-center cursor-pointer" title={pkg.is_active ? "Đang hoạt động" : "Đã tạm ngưng"}>
                      <input type="checkbox" className="sr-only peer" checked={pkg.is_active} onChange={() => void handleToggle(pkg)} disabled={togglingId === id} />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => setModal(pkg)}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => void handleDelete(pkg)}
                        disabled={deletingId === id || pkg.is_active}
                        title={pkg.is_active ? 'Tạm ngừng dịch vụ trước khi xóa' : 'Xoá'}
                      >
                        {deletingId === id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination__info">
            Trang {page} / {totalPages} ({total} dịch vụ)
          </span>
          <div className="admin-pagination__controls">
            <button
              className="admin-pagination__btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = i + 1
              return (
                <button
                  key={pg}
                  className={`admin-pagination__btn ${page === pg ? 'admin-pagination__btn--active' : ''}`}
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </button>
              )
            })}
            <button
              className="admin-pagination__btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ServiceModal
          initial={modal === 'create' ? null : modal}
          groups={groups}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
