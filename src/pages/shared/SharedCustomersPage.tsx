import { useEffect, useState } from 'react'
import {
  Search, RefreshCw, X, ChevronLeft, ChevronRight, User, Star, Plus, Edit2, Trash2
} from 'lucide-react'
import { adminCustomerService, type AdminCustomer, type CreateCustomerInput } from '../../services/adminCustomerService'
import { adminTierService } from '../../services/adminTierService'
import type { Tier } from '../../types/tier'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { useAuth } from '../../hooks/useAuth'

const PAGE_SIZE = 10

function CustomerModal({
  isOpen, onClose, onSuccess, initialData, tiers
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: AdminCustomer | null
  tiers: Tier[]
}) {
  const isEditing = !!initialData
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState<Partial<CreateCustomerInput> & { is_active?: boolean }>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    tier_id: '',
    membership_points: 0,
    reward_points: 0,
    is_active: true
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.user_id) {
        setForm({
          full_name: initialData.user_id.full_name,
          email: initialData.user_id.email,
          phone: initialData.user_id.phone,
          tier_id: initialData.tier_id?._id || '',
          membership_points: initialData.membership_points || 0,
          reward_points: initialData.reward_points || 0,
          is_active: initialData.user_id.is_active
        })
      } else {
        setForm({
          full_name: '',
          email: '',
          phone: '',
          password: '',
          tier_id: '',
          membership_points: 0,
          reward_points: 0,
          is_active: true
        })
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing && initialData) {
        await adminCustomerService.update(initialData._id || initialData.id, {
          ...form,
          password: form.password || undefined // Only send if changed
        })
        showSuccess('Cập nhật khách hàng thành công')
      } else {
        if (!form.password) {
          showError('Vui lòng nhập mật khẩu cho khách hàng mới')
          return
        }
        await adminCustomerService.create(form as CreateCustomerInput)
        showSuccess('Thêm khách hàng thành công')
      }
      onSuccess()
      onClose()
    } catch (err) {
      showError(getErrorMessage(err, isEditing ? 'Cập nhật thất bại' : 'Thêm mới thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal" style={{ maxWidth: 500 }}>
        <div className="admin-modal__header">
          <h3 className="admin-modal__title">{isEditing ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'}</h3>
          <button type="button" className="admin-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <form className="admin-modal__body space-y-4" onSubmit={handleSubmit}>
          
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Họ tên <span className="text-red-500">*</span></label>
              <input 
                className="admin-form-input" 
                required 
                value={form.full_name} 
                onChange={e => setForm({...form, full_name: e.target.value})} 
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Điện thoại</label>
              <input 
                className="admin-form-input" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email <span className="text-red-500">*</span></label>
            <input 
              type="email"
              className="admin-form-input" 
              required 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mật khẩu {isEditing && '(Bỏ trống nếu không đổi)'} {!isEditing && <span className="text-red-500">*</span>}</label>
            <input 
              type="password"
              className="admin-form-input" 
              required={!isEditing} 
              value={form.password || ''} 
              onChange={e => setForm({...form, password: e.target.value})} 
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Hạng thành viên</label>
            <select 
              className="admin-form-input"
              value={form.tier_id}
              onChange={e => setForm({...form, tier_id: e.target.value})}
            >
              <option value="">Thành viên thường</option>
              {tiers.map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>{t.tier_name}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Điểm tích lũy</label>
              <input 
                type="number"
                min="0"
                className="admin-form-input" 
                value={form.membership_points} 
                onChange={e => setForm({...form, membership_points: Number(e.target.value)})} 
              />
            </div>
            {isEditing && (
              <div className="admin-form-group">
                <label className="admin-form-label">Trạng thái tài khoản</label>
                <div className="mt-2 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={form.is_active}
                    onChange={e => setForm({...form, is_active: e.target.checked})}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <label htmlFor="is_active">Đang hoạt động</label>
                </div>
              </div>
            )}
          </div>

          <div className="admin-modal__footer mt-6">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? <RefreshCw size={16} className="animate-spin" /> : (isEditing ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SharedCustomersPage() {
  const [items, setItems] = useState<AdminCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tiers, setTiers] = useState<Tier[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'boss'

  const fetchData = async (pg = page) => {
    setLoading(true)
    try {
      const res = await adminCustomerService.list({
        page: pg,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
      })
      setItems(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages || Math.ceil(res.total / PAGE_SIZE) || 1)
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tải danh sách khách hàng'))
    } finally {
      setLoading(false)
    }
  }

  const fetchTiers = async () => {
    try {
      const res = await adminTierService.list({ limit: 100 })
      setTiers(res.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { void fetchData(1); setPage(1) }, [search])
  useEffect(() => { void fetchData(page) }, [page])
  useEffect(() => { void fetchTiers() }, [])

  const handleOpenCreate = () => {
    setEditingCustomer(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (customer: AdminCustomer) => {
    setEditingCustomer(customer)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá khách hàng này? Tất cả dữ liệu đặt lịch của khách sẽ bị mất!')) return
    setDeletingId(id)
    try {
      await adminCustomerService.remove(id)
      showSuccess('Đã xoá khách hàng')
      fetchData(page)
    } catch (err) {
      showError(getErrorMessage(err, 'Xoá thất bại'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Khách hàng</h1>
          <p className="admin-page__subtitle">Quản lý danh sách tài khoản khách hàng · {total} khách hàng</p>
        </div>
        {canManage && (
          <button className="admin-btn admin-btn--primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Thêm khách hàng
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm theo tên/email/sđt..."
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
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Hạng thành viên</th>
              <th>Điểm tích lũy</th>
              <th>Trạng thái</th>
              {canManage && <th className="text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canManage ? 6 : 5} className="admin-table__empty">
                <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={canManage ? 6 : 5} className="admin-table__empty">Không có khách hàng nào</td></tr>
            ) : items.map(customer => {
              const id = customer._id || customer.id
              const user = customer.user_id
              if (!user) return null

              return (
                <tr key={id} className="admin-table__row">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <div className="admin-table__primary">{user.full_name || 'Khách hàng ẩn danh'}</div>
                        <div className="admin-table__meta">
                          Truy cập app: {customer.has_online_access ? <span className="text-emerald-500 font-medium">Có</span> : <span className="text-slate-400">Không</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-slate-700">{user.phone || 'Chưa cập nhật'}</div>
                    {user.email && <div className="admin-table__secondary">{user.email}</div>}
                  </td>
                  <td>
                    {customer.tier_id ? (
                      <span className="admin-table__badge font-semibold" style={{ backgroundColor: '#fdf4ff', color: '#c026d3' }}>
                        {customer.tier_id.tier_name}
                      </span>
                    ) : (
                      <span className="admin-table__meta">Thành viên thường</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      {customer.membership_points || 0} điểm
                    </div>
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="admin-table__badge admin-table__badge--emerald font-semibold">Đang hoạt động</span>
                    ) : (
                      <span className="admin-table__badge admin-table__badge--red font-semibold">Bị khoá</span>
                    )}
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50/50 text-blue-500 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all duration-200" 
                          title="Sửa thông tin"
                          onClick={() => handleOpenEdit(customer)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50/50 text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                          title="Xóa khách hàng"
                          disabled={deletingId === id}
                          onClick={() => void handleDelete(id)}
                        >
                          {deletingId === id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  )}
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
            Trang {page} / {totalPages} ({total} khách hàng)
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

      <CustomerModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => fetchData(page)} 
        initialData={editingCustomer}
        tiers={tiers}
      />
    </div>
  )
}
