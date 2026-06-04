import { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, X, Check, Building, Phone, Clock, Power, Edit } from 'lucide-react'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { branchService } from '../../services/branchService'
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '../../services/branchService'

interface BranchModalProps {
  branch?: Branch
  onClose: () => void
  onSaved: () => void
}

function BranchModal({ branch, onClose, onSaved }: BranchModalProps) {
  const [form, setForm] = useState<CreateBranchPayload>({
    branch_address: {
      street: '',
      ward: '',
      district: '',
      city: '',
    },
    branch_phone: '',
    operating_time: {
      default_open: '08:00',
      default_close: '18:00',
      weekend_open: '08:00',
      weekend_close: '18:00',
    },
    bay_counts: 2,
    is_active: true,
  })

  const [geoInput, setGeoInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [fetchingAddress, setFetchingAddress] = useState(false)

  const handleAutoFillAddress = async () => {
    if (!geoInput.trim()) return
    const parts = geoInput.split(',').map(s => s.trim())
    if (parts.length < 2) {
      showError('Toạ độ không hợp lệ. Vui lòng nhập theo định dạng Vĩ độ, Kinh độ')
      return
    }
    const lat = parseFloat(parts[0])
    const lon = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) {
      showError('Toạ độ phải là số hợp lệ')
      return
    }

    setFetchingAddress(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      )
      const data = await res.json()

      if (data && data.address) {
        const addr = data.address
        console.log('Nominatim raw address:', addr) // ← thêm dòng này
        setForm(f => ({
          ...f,
          branch_address: {
            // Nominatim VN: không có province → dùng postcode để suy ra, hoặc để user tự nhập
            // city thực ra là quận/huyện, suburb là phường
            city: f.branch_address?.city || '',  // ← để trống, user tự nhập tỉnh/thành

            // addr.city của Nominatim VN thường là quận/huyện
            district: addr.city || addr.city_district || addr.district || addr.county || f.branch_address?.district || '',

            // addr.suburb thường là phường/xã ở VN
            ward: addr.suburb || addr.quarter || addr.neighbourhood || f.branch_address?.ward || '',

            // road đã có sẵn, bỏ "Hẻm" prefix nếu muốn
            street: addr.road || f.branch_address?.street || '',
          }
        }))
        showSuccess('Đã tự động điền địa chỉ thành công')
      } else {
        showError('Không tìm thấy địa chỉ cho toạ độ này')
      }
    } catch (err) {
      showError('Lỗi khi lấy địa chỉ từ toạ độ')
    } finally {
      setFetchingAddress(false)
    }
  }

  useEffect(() => {
    if (branch) {
      setForm({
        branch_address: {
          street: branch.branch_address?.street || '',
          ward: branch.branch_address?.ward || '',
          district: branch.branch_address?.district || '',
          city: branch.branch_address?.city || '',
        },
        branch_phone: branch.branch_phone || '',
        operating_time: {
          default_open: branch.operating_time?.default_open || '08:00',
          default_close: branch.operating_time?.default_close || '18:00',
          weekend_open: branch.operating_time?.weekend_open || '08:00',
          weekend_close: branch.operating_time?.weekend_close || '18:00',
        },
        bay_counts: branch.bay_counts || 2,
        is_active: branch.is_active ?? true,
      })
      if (branch.geo && branch.geo.latitude && branch.geo.longitude) {
        setGeoInput(`${branch.geo.latitude}, ${branch.geo.longitude}`)
      }
    }
  }, [branch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Parse Geo
    let geo: { latitude: number; longitude: number } | undefined
    if (geoInput.trim()) {
      const parts = geoInput.split(',').map(s => s.trim())
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          geo = { latitude: lat, longitude: lng }
        }
      }
    }

    const payload: any = { ...form }
    if (geo) payload.geo = geo

    setSaving(true)
    try {
      if (branch?._id || branch?.id) {
        const id = branch._id || branch.id
        if (id) {
          await branchService.update(id, payload as UpdateBranchPayload)
          showSuccess('Cập nhật chi nhánh thành công!')
        }
      } else {
        await branchService.create(payload)
        showSuccess('Tạo chi nhánh thành công!')
      }
      onSaved()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi lưu chi nhánh'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" style={{ maxWidth: '600px' }}>
        <div className="admin-modal__header">
          <h2 className="admin-modal__title">{branch ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}</h2>
          <button type="button" onClick={onClose} className="admin-modal__close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal__body" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">Địa chỉ</h3>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Thành phố/Tỉnh <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="admin-form-input"
                value={form.branch_address?.city}
                onChange={e => setForm(f => ({ ...f, branch_address: { ...f.branch_address!, city: e.target.value } }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Quận/Huyện <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="admin-form-input"
                value={form.branch_address?.district}
                onChange={e => setForm(f => ({ ...f, branch_address: { ...f.branch_address!, district: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Phường/Xã <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="admin-form-input"
                value={form.branch_address?.ward}
                onChange={e => setForm(f => ({ ...f, branch_address: { ...f.branch_address!, ward: e.target.value } }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Số nhà, Tên đường <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="admin-form-input"
                value={form.branch_address?.street}
                onChange={e => setForm(f => ({ ...f, branch_address: { ...f.branch_address!, street: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="admin-form-group mt-2">
            <label className="admin-form-label">Toạ độ Google Maps (Vĩ độ, Kinh độ)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="admin-form-input flex-1"
                value={geoInput}
                onChange={e => setGeoInput(e.target.value)}
                placeholder="VD: 21.028511, 105.804817"
              />
              <button
                type="button"
                onClick={handleAutoFillAddress}
                disabled={fetchingAddress || !geoInput.trim()}
                className="admin-btn admin-btn--primary px-3 whitespace-nowrap"
              >
                {fetchingAddress ? 'Đang quét...' : 'Tự động lấy địa chỉ'}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              * Click chuột phải vào vị trí trên Google Maps, copy dãy số (Vĩ độ, Kinh độ) dán vào đây và ấn Tự động lấy địa chỉ.
            </p>
          </div>

          <hr className="my-4 border-slate-200" />
          <h3 className="font-semibold text-slate-800 mb-3 text-sm">Thông tin khác</h3>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Số điện thoại</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.branch_phone}
                onChange={e => setForm(f => ({ ...f, branch_phone: e.target.value }))}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Số làn phục vụ <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                className="admin-form-input"
                value={form.bay_counts}
                onChange={e => setForm(f => ({ ...f, bay_counts: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Mở cửa (Ngày thường)</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  className="admin-form-input flex-1"
                  value={form.operating_time?.default_open}
                  onChange={e => setForm(f => ({ ...f, operating_time: { ...f.operating_time!, default_open: e.target.value } }))}
                />
                <span className="self-center">-</span>
                <input
                  type="time"
                  className="admin-form-input flex-1"
                  value={form.operating_time?.default_close}
                  onChange={e => setForm(f => ({ ...f, operating_time: { ...f.operating_time!, default_close: e.target.value } }))}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Mở cửa (Cuối tuần)</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  className="admin-form-input flex-1"
                  value={form.operating_time?.weekend_open}
                  onChange={e => setForm(f => ({ ...f, operating_time: { ...f.operating_time!, weekend_open: e.target.value } }))}
                />
                <span className="self-center">-</span>
                <input
                  type="time"
                  className="admin-form-input flex-1"
                  value={form.operating_time?.weekend_close}
                  onChange={e => setForm(f => ({ ...f, operating_time: { ...f.operating_time!, weekend_close: e.target.value } }))}
                />
              </div>
            </div>
          </div>

          <div className="admin-modal__footer mt-6 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--ghost">Huỷ</button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Lưu chi nhánh
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BossBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalData, setModalData] = useState<{ open: boolean, branch?: Branch }>({ open: false })

  const loadBranches = async () => {
    setLoading(true)
    try {
      const data = await branchService.list()
      setBranches(data)
    } catch (err) {
      showError('Không thể lấy danh sách chi nhánh')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  const handleToggleActive = async (branch: Branch) => {
    const id = branch._id || branch.id
    if (!id) return

    try {
      if (branch.is_active) {
        // Backend: DELETE actually means "Ngừng hoạt động" (set is_active = false)
        await branchService.remove(id)
        showSuccess('Đã tạm dừng chi nhánh')
      } else {
        // Backend: PATCH /activate means "Kích hoạt" (set is_active = true)
        await branchService.toggleActive(id)
        showSuccess('Đã kích hoạt chi nhánh')
      }
      loadBranches()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi khi thay đổi trạng thái'))
    }
  }

  const filtered = branches.filter(b => {
    const address = b.branch_address
    const full = `${address?.street} ${address?.ward} ${address?.district} ${address?.city}`.toLowerCase()
    return full.includes(search.toLowerCase())
  })

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Hệ thống chi nhánh</h1>
          <p className="admin-page__subtitle">Quản lý mạng lưới chi nhánh, địa chỉ và số làn phục vụ.</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalData({ open: true })}>
          <Plus size={15} /> Thêm chi nhánh mới
        </button>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            placeholder="Tìm theo tên đường, quận, thành phố..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
              <Building size={32} className="text-slate-400" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Chưa có chi nhánh nào</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Địa chỉ</th>
                <th>Giờ hoạt động</th>
                <th>Làn (Bay)</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(branch => {
                const id = branch._id || branch.id
                return (
                  <tr key={id}>
                    <td>
                      <div className="font-semibold text-slate-800">{branch.branch_address?.street}</div>
                      <div className="text-xs text-slate-500">{branch.branch_address?.ward}, {branch.branch_address?.district}, {branch.branch_address?.city}</div>
                      {branch.branch_phone && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone size={10} /> {branch.branch_phone}</div>}
                    </td>
                    <td>
                      <div className="text-sm flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {branch.operating_time?.default_open} - {branch.operating_time?.default_close}</div>
                      <div className="text-xs text-slate-500 mt-0.5">T7-CN: {branch.operating_time?.weekend_open} - {branch.operating_time?.weekend_close}</div>
                    </td>
                    <td>
                      <span className="admin-card__badge bg-blue-50 text-blue-700 border-blue-200">{branch.bay_counts}</span>
                    </td>
                    <td>
                      {branch.is_active ? (
                        <span className="admin-card__badge bg-emerald-50 text-emerald-700 border-emerald-200">Hoạt động</span>
                      ) : (
                        <span className="admin-card__badge bg-slate-100 text-slate-600 border-slate-300">Tạm ngưng</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="admin-btn admin-btn--ghost px-2 py-1"
                          title={branch.is_active ? "Tạm ngưng" : "Kích hoạt"}
                          onClick={() => handleToggleActive(branch)}
                        >
                          <Power size={14} className={branch.is_active ? "text-amber-500" : "text-emerald-500"} />
                        </button>
                        <button className="admin-btn admin-btn--ghost px-2 py-1" onClick={() => setModalData({ open: true, branch })}>
                          <Edit size={14} className="text-cyan-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalData.open && (
        <BranchModal
          branch={modalData.branch}
          onClose={() => setModalData({ open: false })}
          onSaved={() => {
            setModalData({ open: false })
            loadBranches()
          }}
        />
      )}
    </div>
  )
}
