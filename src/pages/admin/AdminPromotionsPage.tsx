import { useEffect, useState, useRef } from 'react'
import {
  Plus, Search, RefreshCw, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Check, ChevronLeft, ChevronRight, Tag, Calendar, Percent, Hash,
} from 'lucide-react'
import type { Promotion, PromotionDiscountType, CreatePromotionInput } from '../../types/promotion'
import { adminPromotionService } from '../../services/adminPromotionService'
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
  if (p.end_at && new Date(p.end_at).getTime() < now) return 'expired'
  if (p.start_at && new Date(p.start_at).getTime() > now) return 'scheduled'
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
    promotion_code: initial?.promotion_code ?? '',
    discount_type: initial?.discount_type ?? 'percentage',
    discount_value: initial?.discount_value ?? 0,
    start_at: toInputDate(initial?.start_at),
    end_at: toInputDate(initial?.end_at),
    is_active: initial?.is_active ?? true,
    auto_post: initial?.auto_notification ?? false,
  })
  const [saving, setSaving] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { codeRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.promotion_code.trim().toUpperCase()
    if (code.length < 3) {
      showError('Mã khuyến mãi phải có ít nhất 3 ký tự')
      return
    }
    if (!isEdit && form.discount_value < 0) {
      showError('Giá trị giảm không được âm')
      return
    }
    if (!isEdit && form.discount_type === 'percentage' && form.discount_value > 100) {
      showError('Phần trăm giảm không được vượt quá 100%')
      return
    }
    if (!form.start_at || !form.end_at) {
      showError('Vui lòng chọn ngày bắt đầu và kết thúc')
      return
    }
    if (form.start_at > form.end_at) {
      showError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminPromotionService.update(getId(initial!), {
          discount_type: form.discount_type,
          start_at: form.start_at,
          end_at: form.end_at,
          is_active: form.is_active,
          auto_post: form.auto_post,
        })
      } else {
        await adminPromotionService.create({
          promotion_code: code,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          start_at: form.start_at,
          end_at: form.end_at,
          is_active: form.is_active,
          auto_post: form.auto_post,
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
            <label className="admin-form-label">Mã khuyến mãi <span className="text-red-500">*</span></label>
            <input
              ref={codeRef}
              className="admin-form-input uppercase"
              value={form.promotion_code}
              onChange={e => setForm(f => ({ ...f, promotion_code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER2025"
              maxLength={50}
              disabled={isEdit}
            />
            {isEdit && <p className="admin-form-hint">Mã không thể chỉnh sửa sau khi tạo</p>}
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Loại giảm giá <span className="text-red-500">*</span></label>
              <select
                className="admin-form-input"
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as PromotionDiscountType }))}
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">
                Giá trị giảm {form.discount_type === 'percentage' ? '(%)' : '(đ)'}
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                className="admin-form-input"
                value={form.discount_value}
                min={0}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                disabled={isEdit}
                onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
              />
              {isEdit && (
                <p className="admin-form-hint">
                  Giá trị giảm không thể đổi sau khi tạo (giới hạn phía server).
                </p>
              )}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="admin-form-input"
                value={form.start_at}
                onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Ngày kết thúc <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="admin-form-input"
                value={form.end_at}
                min={form.start_at}
                onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Thông báo tự động</label>
            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={!!form.auto_post}
                onChange={e => setForm(f => ({ ...f, auto_post: e.target.checked }))}
              />
              <span className="admin-toggle__track" />
              <span className="admin-toggle__label">
                {form.auto_post ? 'Bật' : 'Tắt'}
              </span>
            </label>
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

export default function AdminPromotionsPage() {
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
    if (!window.confirm(`Xoá mã "${p.promotion_code}"? Hành động này không thể hoàn tác.`)) return
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
              <th>Mã KM</th>
              <th>Loại / Giá trị</th>
              <th>Thời hạn</th>
              <th>Thông báo</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
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
                  <td>
                    <div className="admin-promo-code">
                      <Tag size={12} />
                      {promo.promotion_code}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-table__badge ${promo.discount_type === 'percentage' ? 'admin-table__badge--purple' : 'admin-table__badge--blue'}`}>
                      {promo.discount_type === 'percentage'
                        ? <><Percent size={10} /> {promo.discount_value}%</>
                        : <><Hash size={10} /> {promo.discount_value.toLocaleString('vi-VN')}đ</>
                      }
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__meta">
                      <Calendar size={12} />
                      <span>{fmtDate(promo.start_at)} → {fmtDate(promo.end_at)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-table__meta">
                      {promo.auto_notification ? 'Có' : 'Không'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-status-badge ${STATUS_CLASS[status]}`}
                      onClick={() => void handleToggle(promo)}
                      disabled={togglingId === id}
                      title={promo.is_active ? 'Nhấn để tạm ngừng' : 'Nhấn để kích hoạt'}
                    >
                      {togglingId === id
                        ? <RefreshCw size={12} className="animate-spin" />
                        : promo.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
                      }
                      {STATUS_LABEL[status]}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="admin-action-group">
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
