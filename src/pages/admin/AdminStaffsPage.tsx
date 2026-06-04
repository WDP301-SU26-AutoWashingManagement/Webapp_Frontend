import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, RefreshCw, X, Check, Users, Mail, Phone, Lock, Building, Wrench
} from 'lucide-react'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { adminStaffService } from '../../services/adminStaffService'
import type { CreateStaffPayload } from '../../services/adminStaffService'
import { branchService } from '../../services/branchService'
import type { Branch } from '../../services/branchService'

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
    staff_type: 'physical',
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
              <select
                className="admin-form-input pl-9"
                value={form.staff_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    staff_type: e.target.value as "technical" | "physical",
                  }))
                }
                required
              >
                <option value="physical">Nhân viên phổ thông (Physical)</option>
                <option value="technical">Kỹ thuật viên (Technical)</option>
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

export default function AdminStaffsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Nhân viên</h1>
          <p className="admin-page__subtitle">Quản lý và cấp quyền tài khoản cho nhân viên phổ thông và kỹ thuật viên.</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
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
      </div>

      {/* Table (Placeholder for now) */}
      <div className="admin-table-wrap">
        <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
            <Users size={32} className="text-slate-400" />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Chưa có danh sách</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem', maxWidth: '400px', marginInline: 'auto' }}>
            .
          </p>
        </div>
      </div>

      {modalOpen && (
        <StaffModal
          onClose={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
