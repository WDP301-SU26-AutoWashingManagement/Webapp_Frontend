import { useEffect, useState } from 'react'
import {
  Plus, Search, RefreshCw, Pencil, Trash2, X, Check, Award, ChevronLeft, ChevronRight, Hash, Percent, Calendar
} from 'lucide-react'
import type { Tier, CreateTierInput, TierClass } from '../../types/tier'
import { adminTierService } from '../../services/adminTierService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getId = (t: Tier) => t._id ?? t.id ?? ''

const TIER_LABEL: Record<string, string> = {
  member: 'Thành viên (Member)',
  silver: 'Bạc (Silver)',
  gold: 'Vàng (Gold)',
  platinum: 'Bạch kim (Platinum)',
}

const TIER_CLASS: Record<string, string> = {
  member: 'bg-slate-100 text-slate-700 border-slate-200',
  silver: 'bg-blue-50 text-blue-700 border-blue-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
  platinum: 'bg-purple-50 text-purple-700 border-purple-200',
}

const TIER_ICON_COLOR: Record<string, string> = {
  member: 'text-slate-500',
  silver: 'text-blue-500',
  gold: 'text-amber-500',
  platinum: 'text-purple-500',
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface TierModalProps {
  initial?: Tier | null
  onClose: () => void
  onSaved: () => void
}

function TierModal({ initial, onClose, onSaved }: TierModalProps) {
  const isEdit = !!initial
  const [form, setForm] = useState<CreateTierInput>({
    tier_name: initial?.tier_name ?? 'member',
    min_membership_points: initial?.min_membership_points ?? 0,
    booking_window_days: initial?.booking_window_days ?? 7,
    discount_percentage: initial?.discount_percentage ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.min_membership_points < 0) {
      showError('Điểm tích luỹ tối thiểu không được âm')
      return
    }
    if (form.booking_window_days < 1) {
      showError('Số ngày đặt trước tối thiểu phải là 1')
      return
    }
    if (form.discount_percentage < 0 || form.discount_percentage > 100) {
      showError('Phần trăm giảm giá phải từ 0 - 100')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminTierService.update(getId(initial!), form)
      } else {
        await adminTierService.create(form)
      }
      showSuccess(isEdit ? 'Cập nhật cấp bậc thành công' : 'Thêm cấp bậc thành công')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể lưu cấp bậc'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">
            {isEdit ? 'Chỉnh sửa cấp bậc' : 'Thêm cấp bậc mới'}
          </h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Tên cấp bậc <span className="text-red-500">*</span></label>
            <select
              className="admin-form-input"
              value={form.tier_name}
              onChange={e => setForm(f => ({ ...f, tier_name: e.target.value as TierClass }))}
              disabled={isEdit}
            >
              <option value="member">Thành viên (Member)</option>
              <option value="silver">Bạc (Silver)</option>
              <option value="gold">Vàng (Gold)</option>
              <option value="platinum">Bạch kim (Platinum)</option>
            </select>
            {isEdit && <p className="admin-form-hint">Không thể thay đổi hạng sau khi tạo</p>}
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Điểm tích luỹ tối thiểu <span className="text-red-500">*</span></label>
            <input
              type="number"
              className="admin-form-input"
              value={form.min_membership_points}
              min={0}
              onChange={e => setForm(f => ({ ...f, min_membership_points: Number(e.target.value) }))}
            />
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Khoảng ngày đặt trước <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="admin-form-input"
                value={form.booking_window_days}
                min={1}
                onChange={e => setForm(f => ({ ...f, booking_window_days: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Giảm giá (%) <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="admin-form-input"
                value={form.discount_percentage}
                min={0}
                max={100}
                onChange={e => setForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="admin-modal__footer">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm cấp bậc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

export default function AdminTiersPage() {
  const [items, setItems] = useState<Tier[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | Tier | null>(null)


  const fetchData = async (pg = page) => {
    setLoading(true)
    try {
      const res = await adminTierService.list({
        page: pg,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages || Math.ceil(res.total / PAGE_SIZE) || 1)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tải danh sách cấp bậc'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData(1); setPage(1) }, [search])
  useEffect(() => { void fetchData(page) }, [page])



  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Cấp bậc (Tiers)</h1>
          <p className="admin-page__subtitle">Quản lý hạng thành viên · {total} hạng</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModal('create')}>
          <Plus size={15} /> Thêm cấp bậc
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm kiếm hạng..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
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
              <th>Tên cấp bậc</th>
              <th>Điểm yêu cầu</th>
              <th>Cửa sổ đặt trước</th>
              <th>Giảm giá</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="admin-table__empty">
                <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="admin-table__empty">Không có cấp bậc nào</td></tr>
            ) : items.map(tier => {
              const id = getId(tier)
              return (
                <tr key={id} className="admin-table__row">
                  <td>
                    <div className="admin-promo-code">
                      <Award size={14} className={TIER_ICON_COLOR[tier.tier_name] || 'text-slate-500'} />
                      <span className={`admin-table__badge border ${TIER_CLASS[tier.tier_name] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {TIER_LABEL[tier.tier_name] || tier.tier_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-table__meta">
                      <Hash size={12} />
                      {tier.min_membership_points.toLocaleString('vi-VN')} điểm
                    </div>
                  </td>
                  <td>
                    <div className="admin-table__meta">
                      <Calendar size={12} />
                      {tier.booking_window_days} ngày
                    </div>
                  </td>
                  <td>
                    <span className="admin-table__badge admin-table__badge--green">
                      <Percent size={10} /> {tier.discount_percentage}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => setModal(tier)}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
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
            Trang {page} / {totalPages} ({total} hạng)
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
        <TierModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); void fetchData(page) }}
        />
      )}
    </div>
  )
}
