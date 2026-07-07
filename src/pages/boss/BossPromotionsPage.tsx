import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, RefreshCw, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Check, ChevronLeft, ChevronRight, Tag, Calendar, Percent, Hash,
} from 'lucide-react'
import type { Promotion, PromotionType, CreatePromotionInput } from '../../types/promotion'
import type { Service } from '../../types/service'
import { adminPromotionService } from '../../services/adminPromotionService'
import { adminServiceService } from '../../services/adminServiceService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getId = (p: Promotion) => p._id ?? p.id ?? ''

const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const toInputDate = (iso?: string) => {
  if (!iso) return ''
  return iso.slice(0, 10)
}

const getStatus = (p: Promotion): 'active' | 'inactive' | 'expired' | 'scheduled' => {
  if (!p.is_active) return 'inactive'
  const now = Date.now()
  if (p.end_date && new Date(p.end_date).getTime() < now) return 'expired'
  if (p.start_date && new Date(p.start_date).getTime() > now) return 'scheduled'
  return 'active'
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Đang chạy',
  inactive: 'Tạm ngừng',
  expired: 'Hết hạn',
  scheduled: 'Chưa bắt đầu',
}
const STATUS_CLASS: Record<string, string> = {
  active: 'admin-status-badge--active',
  inactive: 'admin-status-badge--inactive',
  expired: 'admin-status-badge--expired',
  scheduled: 'admin-status-badge--scheduled',
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface PromotionModalProps {
  initial?: Promotion | null
  onClose: () => void
  onSaved: () => void
}

function PromotionModal({ initial, onClose, onSaved }: PromotionModalProps) {
  const isEdit = !!initial
  const [form, setForm] = useState<CreatePromotionInput>({
    promotion_name: initial?.promotion_name ?? '',
    description: initial?.description ?? '',
    code: initial?.code ?? '',
    type: initial?.type ?? 'discount',
    discount_percentage: initial?.discount_percentage ?? 0,
    discount_amount: initial?.discount_amount ?? 0,
    min_order_amount: initial?.min_order_amount ?? 0,
    start_date: toInputDate(initial?.start_date),
    end_date: toInputDate(initial?.end_date),
    is_active: initial?.is_active ?? true,
    service_ids: initial?.service_ids ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    codeRef.current?.focus()
    adminServiceService.list({ limit: 100, is_active: true })
      .then(res => setServices(res.items))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (code.length < 3) {
      showError('Mã khuyến mãi phải có ít nhất 3 ký tự')
      return
    }
    if (form.type === 'discount' && (form.discount_percentage ?? 0) > 100) {
      showError('Phần trăm giảm không được vượt quá 100%')
      return
    }
    if (form.type === 'bonus_service' && (!form.service_ids || form.service_ids.length === 0)) {
      showError('Vui lòng chọn ít nhất 1 dịch vụ tặng kèm')
      return
    }
    if (!form.start_date || !form.end_date) {
      showError('Vui lòng chọn ngày bắt đầu và kết thúc')
      return
    }
    if (form.start_date > form.end_date) {
      showError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminPromotionService.update(getId(initial!), {
          promotion_name: form.promotion_name,
          description: form.description,
          type: form.type,
          discount_percentage: form.discount_percentage,
          discount_amount: form.discount_amount,
          min_order_amount: form.min_order_amount,
          start_date: form.start_date,
          end_date: form.end_date,
          is_active: form.is_active,
          service_ids: form.service_ids,
        })
      } else {
        await adminPromotionService.create({
          ...form,
          code,
        })
      }
      showSuccess(isEdit ? 'Cập nhật khuyến mãi thành công' : 'Thêm khuyến mãi thành công')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể lưu khuyến mãi'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">
            {isEdit ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
          </h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Tên chương trình KM <span className="text-red-500">*</span></label>
            <input
              className="admin-form-input"
              value={form.promotion_name}
              onChange={e => setForm(f => ({ ...f, promotion_name: e.target.value }))}
              placeholder="VD: Tri ân khách hàng hè..."
              maxLength={100}
              required
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Mã khuyến mãi (Code) <span className="text-red-500">*</span></label>
              <input
                ref={codeRef}
                className="admin-form-input uppercase"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER2025"
                maxLength={50}
                disabled={isEdit}
                required
              />
              {isEdit && <p className="admin-form-hint">Mã không thể chỉnh sửa sau khi tạo</p>}
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Đơn tối thiểu (đ) <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="admin-form-input"
                value={form.min_order_amount}
                min={0}
                onChange={e => setForm(f => ({ ...f, min_order_amount: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Loại khuyến mãi <span className="text-red-500">*</span></label>
            <select
              className="admin-form-input"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as PromotionType }))}
            >
              <option value="discount">Giảm giá</option>
              <option value="bonus_service">Tặng thêm dịch vụ</option>
            </select>
          </div>

          {form.type === 'discount' && (
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Giảm phần trăm (%) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={form.discount_percentage}
                  min={0}
                  max={100}
                  onChange={e => setForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Tối đa (đ) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="admin-form-input"
                  value={form.discount_amount}
                  min={0}
                  onChange={e => setForm(f => ({ ...f, discount_amount: Number(e.target.value) }))}
                />
              </div>
            </div>
          )}

          {form.type === 'bonus_service' && (
            <div className="admin-form-group">
              <label className="admin-form-label">Chọn dịch vụ tặng kèm <span className="text-red-500">*</span></label>
              <div className="admin-form-input max-h-[150px] overflow-y-auto space-y-2 p-3 bg-slate-50">
                {services.length === 0 ? <p className="text-sm text-slate-500">Đang tải dịch vụ...</p> : services.map(srv => {
                  const id = srv._id || srv.id || ''
                  const isChecked = form.service_ids?.includes(id)
                  return (
                    <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...(form.service_ids || []), id]
                            : (form.service_ids || []).filter(x => x !== id)
                          setForm(f => ({ ...f, service_ids: newIds }))
                        }}
                      />
                      <span>{srv.service_name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label className="admin-form-label">Mô tả chi tiết</label>
            <textarea
              className="admin-form-input"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="VD: Giảm 10% tối đa 50k..."
              rows={2}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="admin-form-input"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Ngày kết thúc <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="admin-form-input"
                value={form.end_date}
                min={form.start_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                required
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
              <span className="admin-toggle__label">{form.is_active ? 'Kích hoạt' : 'Tạm ngừng'}</span>
            </label>
          </div>

          <div className="admin-modal__footer">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm khuyến mãi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function BossPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [modal, setModal] = useState<'create' | Promotion | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = async (pg = page) => {
    setLoading(true)
    try {
      const res = await adminPromotionService.list({
        page: pg,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        is_active: filterActive,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages || Math.ceil(res.total / PAGE_SIZE) || 1)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tải danh sách khuyến mãi'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData(1); setPage(1) }, [search, filterActive])
  useEffect(() => { void fetchData(page) }, [page])

  const handleToggle = async (p: Promotion) => {
    const id = getId(p)
    setTogglingId(id)
    try {
      await adminPromotionService.toggleActive(id, !p.is_active)
      showSuccess(`Đã ${p.is_active ? 'tạm ngừng' : 'kích hoạt'} khuyến mãi`)
      void fetchData(page)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể cập nhật trạng thái'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (p: Promotion) => {
    if (!window.confirm(`Xoá mã "${p.code}"? Hành động này không thể hoàn tác.`)) return
    const id = getId(p)
    setDeletingId(id)
    try {
      await adminPromotionService.remove(id)
      showSuccess('Đã xoá khuyến mãi')
      void fetchData(page)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể xoá khuyến mãi'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Khuyến mãi</h1>
          <p className="admin-page__subtitle">Quản lý mã giảm giá · {total} mã</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModal('create')}>
          <Plus size={15} /> Thêm khuyến mãi
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm mã khuyến mãi..."
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
              {val === undefined ? 'Tất cả' : val ? 'Đang hoạt động' : 'Tạm ngừng'}
            </button>
          ))}
        </div>

        <button
          className="admin-btn admin-btn--ghost ml-auto"
          onClick={() => void fetchData(page)}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="text-center">Mã</th>
              <th>Chương trình</th>
              <th className="text-center">Mô tả</th>
              <th className="text-center">Thời hạn</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-table__empty">
                <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="admin-table__empty">Không có khuyến mãi nào</td></tr>
            ) : items.map(promo => {
              const id = getId(promo)
              const status = getStatus(promo)
              return (
                <tr key={id} className="admin-table__row">
                  <td className="text-center">
                    <div className="admin-promo-code mx-auto w-fit">
                      <Tag size={12} />
                      {promo.code}
                    </div>
                  </td>
                  <td>
                    <p className="font-medium">{promo.promotion_name}</p>
                    {/* <p className="text-xs text-slate-500 truncate max-w-[200px]" title={promo.description}>{promo.description}</p> */}
                  </td>
                  <td className="text-center">
                    <span className={`admin-table__badge mx-auto w-fit ${promo.type === 'discount' ? 'admin-table__badge--purple' : 'admin-table__badge--blue'}`}>
                      {promo.type === 'discount'
                        ? <>Giảm giá</>
                        : <>Tặng dịch vụ</>
                      }
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="admin-table__meta mx-auto w-fit">
                      <Calendar size={12} />
                      <span>{fmtDate(promo.start_date)} → {fmtDate(promo.end_date)}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="relative inline-flex items-center cursor-pointer" title={promo.is_active ? "Đang hoạt động" : "Đã tạm ngưng"}>
                      <input type="checkbox" className="sr-only peer" checked={promo.is_active} onChange={() => void handleToggle(promo)} disabled={togglingId === id} />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => setModal(promo)}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => void handleDelete(promo)}
                        disabled={deletingId === id}
                        title="Xoá"
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
            Trang {page} / {totalPages} ({total} mã)
          </span>
          <div className="admin-pagination__controls">
            <button className="admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
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
            <button className="admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <PromotionModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); void fetchData(page) }}
        />
      )}
    </div>
  )
}
