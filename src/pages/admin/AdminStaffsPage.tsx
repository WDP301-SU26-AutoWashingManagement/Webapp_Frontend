import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, RefreshCw, X, Check, Users, Mail, Phone, Lock, Building, Wrench, Edit, Trash2, Eye
} from 'lucide-react'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { adminStaffService } from '../../services/adminStaffService'
import type { CreateStaffPayload } from '../../services/adminStaffService'
import { branchService } from '../../services/branchService'
import type { Branch } from '../../services/branchService'
import { useAuth } from '../../hooks/useAuth'

interface StaffModalProps {
  onClose: () => void
  onSaved: () => void
}

function StaffModal({ onClose, onSaved }: StaffModalProps) {
  const [form, setForm] = useState<CreateStaffPayload>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    staff_type: 'technical',
    branch_id: '',
  })
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(true)

  useEffect(() => {
    nameRef.current?.focus()

    async function fetchBranches() {
      try {
        const data = await branchService.list()
        setBranches(data)
      } catch (err) {
        showError('Không tải được danh sách chi nhánh')
      } finally {
        setLoadingBranches(false)
      }
    }
    void fetchBranches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.full_name.trim().length < 3) {
      showError('Họ và tên phải có ít nhất 3 ký tự')
      return
    }
    if (!form.password || form.password.length < 6) {
      showError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (!form.branch_id) {
      showError('Vui lòng chọn chi nhánh')
      return
    }

    setSaving(true)
    try {
      await adminStaffService.createStaff(form)
      showSuccess('Tạo tài khoản nhân viên thành công!')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tạo tài khoản nhân viên'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Thêm tài khoản nhân viên</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Họ và tên <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Users size={15} />
              </span>
              <input
                ref={nameRef}
                type="text"
                className="admin-form-input pl-9"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={15} />
              </span>
              <input
                type="email"
                className="admin-form-input pl-9"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="nguyenvana@example.com"
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Số điện thoại</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone size={15} />
              </span>
              <input
                type="text"
                className="admin-form-input pl-9"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">
              Loại nhân viên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Wrench size={15} />
              </span>
              <div className="admin-form-input pl-9 bg-slate-50 text-slate-500 flex items-center">
                Kỹ thuật viên (Technical)
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Mật khẩu <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={15} />
              </span>
              <input
                type="text"
                className="admin-form-input pl-9"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mật khẩu ít nhất 6 ký tự"
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Chi nhánh <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Building size={15} />
              </span>
              <select
                className="admin-form-input pl-9"
                value={form.branch_id}
                onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                required
                disabled={loadingBranches}
              >
                <option value="">{loadingBranches ? 'Đang tải danh sách...' : '-- Chọn chi nhánh --'}</option>
                {branches.map(b => {
                  const id = b._id ?? b.id ?? ''
                  const address = b.branch_address ? `${b.branch_address.street}, ${b.branch_address.district}` : 'Không có địa chỉ'
                  return (
                    <option key={id} value={id}>
                      {address}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="admin-modal__footer mt-6">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditStaffModal({ staff, onClose, onSaved }: { staff: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({
    staff_type: staff.staff_type || 'technical',
    salary_coefficient: staff.salary_coefficient ?? 1,
    hour_per_week: staff.hour_per_week ?? 40,
    annual_leave_days: staff.annual_leave_days ?? 12,
    used_leave_days: staff.used_leave_days ?? 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminStaffService.updateStaff(staff._id, form)
      showSuccess('Cập nhật nhân viên thành công!')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi khi cập nhật nhân viên'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Chỉnh sửa nhân viên</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Loại nhân viên</label>
            <div className="admin-form-input bg-slate-50 text-slate-500 flex items-center">
              Kỹ thuật viên (Technical)
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Hệ số lương</label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="admin-form-input"
              value={form.salary_coefficient}
              onChange={e => setForm(f => ({ ...f, salary_coefficient: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Giờ làm việc / Tuần</label>
            <input
              type="number"
              min="0"
              className="admin-form-input"
              value={form.hour_per_week}
              onChange={e => setForm(f => ({ ...f, hour_per_week: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="admin-form-group flex-1">
              <label className="admin-form-label">Tổng phép năm</label>
              <input
                type="number"
                min="0"
                className="admin-form-input"
                value={form.annual_leave_days}
                onChange={e => setForm(f => ({ ...f, annual_leave_days: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="admin-form-group flex-1">
              <label className="admin-form-label">Đã nghỉ</label>
              <input
                type="number"
                min="0"
                className="admin-form-input"
                value={form.used_leave_days}
                onChange={e => setForm(f => ({ ...f, used_leave_days: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="admin-modal__footer mt-6">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetailStaffModal({ staffId, onClose }: { staffId: string, onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await adminStaffService.getStaffDetail(staffId)
        if (res.success && res.data) {
          setDetail(res.data)
        }
      } catch (err) {
        showError('Lỗi tải chi tiết nhân viên')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [staffId])

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Chi tiết hồ sơ nhân viên</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <div className="admin-modal__body">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải chi tiết...</div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
                  {detail.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{detail.full_name || 'Không xác định'}</h3>
                  <p className="text-slate-500">{detail.staff_code} &bull; <span className="capitalize">{detail.staff_type}</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 mb-1">Email</p>
                  <p className="font-medium">{detail.email || '---'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Số điện thoại</p>
                  <p className="font-medium">{detail.phone || '---'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Ngày vào làm</p>
                  <p className="font-medium">{detail.hire_date ? new Date(detail.hire_date).toLocaleDateString('vi-VN') : '---'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Hệ số lương</p>
                  <p className="font-medium">{detail.salary_coefficient}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Giờ làm / Tuần</p>
                  <p className="font-medium">{detail.hour_per_week}h</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Trạng thái tài khoản</p>
                  <p className="font-medium">{detail.is_active !== false ? <span className="text-green-600">Hoạt động</span> : <span className="text-red-600">Đã khóa</span>}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mt-4 flex gap-8">
                <div>
                  <p className="text-slate-500 mb-1">Tổng phép năm</p>
                  <p className="font-bold text-lg text-slate-800">{detail.annual_leave_days ?? 12}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Đã nghỉ</p>
                  <p className="font-bold text-lg text-amber-600">{detail.used_leave_days ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Còn lại</p>
                  <p className="font-bold text-lg text-teal-600">{(detail.annual_leave_days ?? 12) - (detail.used_leave_days ?? 0)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-red-500">Không tìm thấy thông tin nhân viên</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminStaffsPage() {
  const { user } = useAuth()
  const isAdminOrBoss = user?.role === 'admin' || user?.role === 'boss'

  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [page, setPage] = useState(1)

  const [staffs, setStaffs] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  const [editingStaff, setEditingStaff] = useState<any | null>(null)
  const [detailStaffId, setDetailStaffId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'boss') {
      branchService.list().then(setBranches).catch(console.error)
    }
  }, [user?.role])

  const fetchStaffs = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 10 }
      if (search) params.search = search

      // Boss can see all branches. Admin and Manager can only see their own branch.
      if (user?.role !== 'boss' && user?.branch_id) {
        const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id
        if (userBranchId) {
          params.branch_id = userBranchId
        }
      } else if (user?.role === 'boss' && selectedBranch) {
        params.branch_id = selectedBranch
      }

      params.staff_type = 'technical'

      const res = await adminStaffService.getStaffList(params)
      if (res.success && res.data) {
        setStaffs(res.data.data || [])
        setTotalPages(res.data.pagination?.total_pages || 1)
      } else {
        setStaffs([])
      }
    } catch (err) {
      showError('Không tải được danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này không?')) return;
    try {
      await adminStaffService.deleteStaff(id);
      showSuccess('Xóa nhân viên thành công');
      fetchStaffs();
    } catch (error) {
      showError(getErrorMessage(error, 'Lỗi khi xóa nhân viên'));
    }
  }

  useEffect(() => {
    fetchStaffs()
  }, [page, search, selectedBranch])

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Nhân viên</h1>
          <p className="admin-page__subtitle">Quản lý và cấp quyền tài khoản cho nhân viên phổ thông và kỹ thuật viên.</p>
        </div>
        {isAdminOrBoss && (
          <button className="admin-btn admin-btn--primary" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Thêm nhân viên
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="admin-filters flex items-center gap-4">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm theo mã nhân viên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>

        {isAdminOrBoss ? (
          <div className="flex gap-4">
            {user?.role === 'boss' && (
              <select
                className="admin-form-input w-48"
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id ?? b.id} value={b._id ?? b.id}>
                    {b.branch_address ? `${b.branch_address.street}, ${b.branch_address.district}` : 'Chi nhánh'}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="admin-form-input w-48 bg-slate-50 text-slate-500 cursor-not-allowed flex items-center">
            Kỹ thuật (Technical)
          </div>
        )}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải danh sách...</div>
        ) : staffs.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Chưa có nhân viên nào</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Mã NV</th>
                <th>Loại NV</th>
                <th>Hệ số lương</th>
                <th>Giờ/Tuần</th>
                <th>Nghỉ phép</th>
                <th>Ngày vào làm</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map(staff => (
                <tr key={staff._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {staff.full_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{staff.full_name || 'Không xác định'}</div>
                        <div className="text-xs text-slate-500">{staff.email || 'Không có email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-medium text-slate-900">{staff.staff_code}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                      {staff.staff_type}
                    </span>
                  </td>
                  <td>{staff.salary_coefficient}</td>
                  <td>{staff.hour_per_week}h</td>
                  <td>
                    <span className="text-slate-600 font-medium">{staff.used_leave_days ?? 0}</span>
                    <span className="text-slate-400"> / {staff.annual_leave_days ?? 12}</span>
                  </td>
                  <td>{staff.hire_date ? new Date(staff.hire_date).toLocaleDateString('vi-VN') : '---'}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setDetailStaffId(staff._id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      {isAdminOrBoss && (
                        <>
                          <button 
                            onClick={() => setEditingStaff(staff)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteStaff(staff._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm font-medium ${page === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <StaffModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            fetchStaffs()
          }}
        />
      )}

      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSaved={() => {
            setEditingStaff(null)
            fetchStaffs()
          }}
        />
      )}

      {detailStaffId && (
        <DetailStaffModal
          staffId={detailStaffId}
          onClose={() => setDetailStaffId(null)}
        />
      )}
    </div>
  )
}
