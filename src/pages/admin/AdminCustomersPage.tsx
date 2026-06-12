import { useEffect, useState } from 'react'
import {
  Search, RefreshCw, X, ChevronLeft, ChevronRight, User, Star
} from 'lucide-react'
import { adminCustomerService, type AdminCustomer } from '../../services/adminCustomerService'
import { showError } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'

const PAGE_SIZE = 10

export default function AdminCustomersPage() {
  const [items, setItems] = useState<AdminCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

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

  useEffect(() => { void fetchData(1); setPage(1) }, [search])
  useEffect(() => { void fetchData(page) }, [page])

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Khách hàng</h1>
          <p className="admin-page__subtitle">Quản lý danh sách tài khoản khách hàng · {total} khách hàng</p>
        </div>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="admin-table__empty">
                <RefreshCw size={20} className="animate-spin text-cyan-500 mx-auto" />
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="admin-table__empty">Không có khách hàng nào</td></tr>
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
    </div>
  )
}
