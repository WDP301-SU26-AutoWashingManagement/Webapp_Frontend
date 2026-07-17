import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, RefreshCw, X, Check, Users, Mail, Phone, Lock, Building, UserSquare, Edit, Trash2, Eye, Ban
} from 'lucide-react'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { bossAccountService } from '../../services/bossAccountService'
import type { CreateInternalAccountPayload } from '../../services/bossAccountService'
import { adminStaffService } from '../../services/adminStaffService'
import { branchService } from '../../services/branchService'
import type { Branch } from '../../services/branchService'

interface AccountModalProps {
  onClose: () => void
  onSaved: () => void
}

function AccountModal({ onClose, onSaved }: AccountModalProps) {
  const [form, setForm] = useState<CreateInternalAccountPayload>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
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
      await bossAccountService.createAccount(form)
      showSuccess('Tạo tài khoản thành công!')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Không thể tạo tài khoản'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Thêm tài khoản nội bộ</h2>
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
              Vai trò <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <UserSquare size={15} />
              </span>
              <select
                className="admin-form-input pl-9"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as "admin" | "staff",
                  }))
                }
                required
              >
                <option value="staff">Quản lý chi nhánh </option>
                <option value="admin">Quản lý hệ thống </option>
              </select>
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

function EditAdminModal({ admin, branches, onClose, onSaved }: { admin: any, branches: Branch[], onClose: () => void, onSaved: () => void }) {
  const defaultBranchId = typeof admin.branch_id === 'string' ? admin.branch_id : (admin.branch_id?._id || admin.branch_id?.id || admin.user_id?.branch_id || '')
  const [form, setForm] = useState({
    branch_id: defaultBranchId,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (admin.is_manager) {
        await adminStaffService.updateStaff(admin._id, form)
      } else {
        await bossAccountService.updateAdmin(admin._id, form)
      }
      showSuccess('Cập nhật tài khoản thành công!')
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi khi cập nhật tài khoản'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Chỉnh sửa tài khoản</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body">
          <div className="admin-form-group">
            <label className="admin-form-label">Chi nhánh</label>
            <select
              className="admin-form-input"
              value={form.branch_id}
              onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              required
            >
              {branches.map(b => (
                <option key={b._id ?? b.id} value={b._id ?? b.id}>
                  {b.branch_address ? `${b.branch_address.street}, ${b.branch_address.district}` : 'Chi nhánh'}
                </option>
              ))}
            </select>
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

function DetailAdminModal({ admin, branches, onClose }: { admin: any, branches: Branch[], onClose: () => void }) {
  const adminId = admin._id
  const isManager = admin.is_manager
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        let res: any;
        if (isManager) {
          res = await adminStaffService.getStaffDetail(adminId)
          if (res.success && res.data) {
            // map it back to admin format for the UI
            setDetail({
              _id: res.data._id,
              user_id: {
                full_name: res.data.full_name,
                email: res.data.email,
                phone: res.data.phone,
                createdAt: res.data.hire_date || res.data.created_at,
                branch_id: res.data.branch_id,
                is_active: res.data.is_active
              },
              branch_id: res.data.branch_id
            })
          }
        } else {
          res = await bossAccountService.getAdminDetail(adminId)
          if (res.success && res.data) {
            setDetail(res.data)
          }
        }
      } catch (err) {
        showError('Lỗi tải chi tiết tài khoản')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [adminId])

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">Chi tiết tài khoản nội bộ</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <div className="admin-modal__body">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Đang tải chi tiết...</div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xl shrink-0">
                  {detail.user_id?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{detail.user_id?.full_name || 'Không xác định'}</h3>
                  <p className="text-slate-500">ID: {detail._id?.substring(0, 8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 mb-1">Email</p>
                  <p className="font-medium">{detail.user_id?.email || '---'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Số điện thoại</p>
                  <p className="font-medium">{detail.user_id?.phone || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-1">Chi nhánh quản lý</p>
                  <p className="font-medium">
                    {(() => {
                      let b = detail.branch_id
                      if (typeof b === 'string') {
                        b = branches.find(br => br._id === b || br.id === b)
                      }
                      if (!b && detail.user_id?.branch_id) {
                        b = branches.find(br => br._id === detail.user_id.branch_id || br.id === detail.user_id.branch_id)
                      }
                      return b?.branch_address
                        ? `${b.branch_address.street}, ${b.branch_address.district}`
                        : 'Tất cả chi nhánh'
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Trạng thái tài khoản</p>
                  <p className="font-medium">{detail.user_id?.is_active !== false ? <span className="text-green-600">Hoạt động</span> : <span className="text-red-600">Đã khóa</span>}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Ngày tham gia</p>
                  <p className="font-medium">{detail.user_id?.createdAt ? new Date(detail.user_id.createdAt).toLocaleDateString('vi-VN') : '---'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-red-500">Không tìm thấy thông tin tài khoản</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BossAccountsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [detailAdmin, setDetailAdmin] = useState<any | null>(null)
  const [confirmLockData, setConfirmLockData] = useState<{ admin: any; action: 'lock' | 'unlock' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmActionData, setConfirmActionData] = useState<{ admin: any, action: 'delete' | 'restore' } | null>(null)

  const [showTrash, setShowTrash] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const branchRes = await branchService.list()
      setBranches(branchRes)

      let adminRes, managerRes;
      if (showTrash) {
        [adminRes, managerRes] = await Promise.all([
          bossAccountService.getAdminTrash(selectedBranch),
          adminStaffService.getStaffTrash({ branch_id: selectedBranch })
        ])
      } else {
        [adminRes, managerRes] = await Promise.all([
          bossAccountService.getAdmins(selectedBranch),
          adminStaffService.getStaffList({ staff_type: 'manager', branch_id: selectedBranch, limit: 100 })
        ])
      }

      const adminData = adminRes.data || adminRes || []
      const managerData = (managerRes.data?.data || managerRes.data || managerRes || []).map((m: any) => ({
        _id: m._id,
        is_manager: true,
        branch_id: m.branch_id,
        user_id: {
          _id: m.user_id?._id || m.user_id,
          full_name: m.user_id?.full_name || m.full_name,
          email: m.user_id?.email || m.email,
          phone: m.user_id?.phone || m.phone,
          role: 'staff',
          is_active: m.user_id?.is_active !== undefined ? m.user_id.is_active : m.is_active,
          createdAt: m.hire_date || m.created_at
        }
      }))

      setAdmins([...adminData, ...managerData])
    } catch (err) {
      showError('Không thể tải danh sách quản trị viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBranch, showTrash])

  const filteredAdmins = admins.filter(admin => {
    const user = admin.user_id || {}
    const term = search.toLowerCase()
    const nameMatch = (user.full_name || '').toLowerCase().includes(term)
    const emailMatch = (user.email || '').toLowerCase().includes(term)

    let roleMatch = true
    if (roleFilter === 'admin') {
      roleMatch = user.role === 'admin'
    } else if (roleFilter === 'manager') {
      roleMatch = user.role === 'staff'
    }

    return (nameMatch || emailMatch) && roleMatch
  })

  const handleConfirmAction = async () => {
    if (!confirmActionData) return;
    const { admin, action } = confirmActionData;
    setConfirmActionData(null);
    setDeletingId(admin._id);
    try {
      if (action === 'delete') {
        if (admin.is_manager) {
          await adminStaffService.deleteStaff(admin._id);
        } else {
          await bossAccountService.deleteAdmin(admin._id);
        }
        showSuccess('Đã chuyển tài khoản vào mục đã xóa');
      } else {
        if (admin.is_manager) {
          await adminStaffService.restoreStaff(admin._id);
        } else {
          await bossAccountService.restoreAdmin(admin._id);
        }
        showSuccess('Khôi phục tài khoản thành công');
      }
      loadData();
    } catch (error) {
      showError(getErrorMessage(error, action === 'delete' ? 'Lỗi khi xóa tài khoản' : 'Lỗi khi khôi phục tài khoản'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Tài khoản nội bộ</h1>
          <p className="admin-page__subtitle">Quản lý và cấp quyền tài khoản cho Quản lý (Admin) và Nhân viên (Staff).</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Thêm tài khoản mới
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="admin-search-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              className="admin-search-input"
              placeholder="Tìm theo tên/email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="admin-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
            )}
          </div>

          <div className="flex gap-4">
            <select
              className="admin-form-input w-48"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản lý hệ thống </option>
              <option value="manager">Quản lý chi nhánh </option>
            </select>
            <select
              className="admin-form-input w-48"
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map(b => (
                <option key={b._id || b.id} value={b._id || b.id}>
                  {b.branch_address ? `${b.branch_address.street}, ${b.branch_address.district}` : 'Chi nhánh'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => setShowTrash(!showTrash)} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showTrash ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          <Trash2 size={16} />
          {showTrash ? 'Quay lại danh sách' : 'Tài khoản đã xóa'}
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : filteredAdmins.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Chưa có tài khoản nào</h3>
            <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px', marginInline: 'auto' }}>
              Không tìm thấy tài khoản quản trị nào trong hệ thống.
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Liên hệ</th>
                <th>Chi nhánh</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin, idx) => {
                const user = admin.user_id || {}
                let branch = admin.branch_id
                if (typeof branch === 'string') {
                  branch = branches.find(b => b._id === branch || b.id === branch)
                }
                if (!branch && user.branch_id) {
                  const uBranch = typeof user.branch_id === 'string' ? user.branch_id : (user.branch_id._id || user.branch_id.id)
                  branch = branches.find(b => b._id === uBranch || b.id === uBranch)
                }
                const branchAddress = branch?.branch_address ? `${branch.branch_address.street}, ${branch.branch_address.district}` : 'Chưa phân công chi nhánh'

                return (
                  <tr key={admin._id || idx}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {user.full_name || 'Không có tên'}
                            {user.is_active === false && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Bị khoá</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm"><Mail size={13} className="text-slate-400" /> {user.email || 'N/A'}</div>
                      <div className="flex items-center gap-1 text-sm mt-1"><Phone size={13} className="text-slate-400" /> {user.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200">
                        {branchAddress}
                      </span>
                    </td>
                    <td>
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Quản lý hệ thống
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          Quản lý chi nhánh
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {showTrash ? (
                          <button
                            onClick={() => setConfirmActionData({ admin, action: 'restore' })}
                            disabled={deletingId === admin._id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-50"
                            title="Khôi phục"
                          >
                            <RefreshCw size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setDetailAdmin(admin)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditingAdmin(admin)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="Sửa"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmActionData({ admin, action: 'delete' })}
                              disabled={deletingId === admin._id}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-50"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <AccountModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            loadData()
          }}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          branches={branches}
          onClose={() => setEditingAdmin(null)}
          onSaved={() => {
            setEditingAdmin(null)
            loadData()
          }}
        />
      )}

      {confirmActionData && (
        <div className="admin-modal-overlay" onClick={() => setConfirmActionData(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }}>
            <div className="admin-modal__header">
              <h3 className={`admin-modal__title flex items-center gap-2 ${confirmActionData.action === 'delete' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {confirmActionData.action === 'delete' ? <Trash2 size={18} /> : <RefreshCw size={18} />}
                {confirmActionData.action === 'delete' ? 'Xóa tài khoản?' : 'Khôi phục tài khoản?'}
              </h3>
              <button type="button" className="admin-modal__close" onClick={() => setConfirmActionData(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal__body px-6 py-5">
              <p className="text-slate-600 leading-relaxed text-sm">
                {confirmActionData.action === 'delete'
                  ? `Bạn có chắc chắn muốn xóa tài khoản ${confirmActionData.admin?.user_id?.full_name || confirmActionData.admin?.full_name || 'này'}? Tài khoản này sẽ được chuyển vào mục Tài khoản đã xóa.`
                  : `Bạn có chắc chắn muốn khôi phục tài khoản ${confirmActionData.admin?.user_id?.full_name || confirmActionData.admin?.full_name || 'này'}?`
                }
              </p>
            </div>
            <div className="admin-modal__footer flex justify-end gap-3 px-6 pb-6 pt-2">
              <button type="button" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200" onClick={() => setConfirmActionData(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-md ${
                  confirmActionData.action === 'delete' ? 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20'
                }`}
                onClick={handleConfirmAction}
              >
                {confirmActionData.action === 'delete' ? 'Đồng ý xóa' : 'Đồng ý khôi phục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailAdmin && (
        <DetailAdminModal
          admin={detailAdmin}
          branches={branches}
          onClose={() => setDetailAdmin(null)}
        />
      )}

    </div>
  )
}
