import React, { useState, useEffect } from 'react'
import { Check, X, Plus, RefreshCw, AlertCircle, CalendarOff } from 'lucide-react'
import { staffManagerService, type StaffAbsentRequest } from '../../services/staffManagerService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'

export default function StaffLeaveRequestsPage() {
  const [activeTab, setActiveTab] = useState<'my' | 'pending' | 'approved'>('my')

  const [myRequests, setMyRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingMy, setLoadingMy] = useState(true)

  const [pendingRequests, setPendingRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const [isManager, setIsManager] = useState<boolean>(true) // default true until we know they are not

  const [approvedRequests, setApprovedRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingApproved, setLoadingApproved] = useState(false)
  const [approvedError, setApprovedError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ from_date: '', to_date: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean, requestId: string, status: 'approved' | 'rejected', note: string, saving: boolean } | null>(null)

  const loadMyRequests = async () => {
    try {
      setLoadingMy(true)
      const data = await staffManagerService.getMyRequests()
      setMyRequests(data)
    } catch (err) {
      showError('Không thể tải danh sách đơn của bạn')
    } finally {
      setLoadingMy(false)
    }
  }

  const loadPendingRequests = async () => {
    try {
      setLoadingPending(true)
      setPendingError(null)
      const data = await staffManagerService.getPendingRequests()
      setPendingRequests(data)
    } catch (err: any) {
      if (err?.status === 403 || err?.response?.status === 403) {
         setPendingError('Bạn không có quyền quản lý để duyệt đơn.')
      } else {
         setPendingError('Không thể tải danh sách đơn chờ duyệt.')
      }
    } finally {
      setLoadingPending(false)
    }
  }

  const loadApprovedRequests = async () => {
    try {
      setLoadingApproved(true)
      setApprovedError(null)
      const data = await staffManagerService.getStaffOff()
      setApprovedRequests(data)
    } catch (err: any) {
      if (err?.status === 403 || err?.response?.status === 403) {
         setApprovedError('Bạn không có quyền quản lý để xem danh sách này.')
      } else {
         setApprovedError('Không thể tải danh sách đơn đã duyệt.')
      }
    } finally {
      setLoadingApproved(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'my') {
        loadMyRequests()
    } else if (activeTab === 'pending') {
      loadPendingRequests()
    } else if (activeTab === 'approved') {
      loadApprovedRequests()
    }
  }, [activeTab])

  // Check if user is a manager
  useEffect(() => {
    staffManagerService.getPendingRequests()
      .then(() => {
        setIsManager(true)
        if (activeTab === 'my') {
            setActiveTab('pending')
        }
      })
      .catch((err: any) => {
        if (err?.status === 403 || err?.response?.status === 403) {
          setIsManager(false)
          if (activeTab !== 'my') setActiveTab('my')
        }
      })
  }, [])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.from_date || !form.to_date || !form.reason) {
      showError('Vui lòng điền đầy đủ thông tin')
      return
    }
    setSaving(true)
    try {
      await staffManagerService.createRequest({
        from_date: new Date(form.from_date).toISOString(),
        to_date: new Date(form.to_date).toISOString(),
        reason: form.reason
      })
      showSuccess('Tạo đơn xin nghỉ thành công!')
      setIsModalOpen(false)
      setForm({ from_date: '', to_date: '', reason: '' })
      loadMyRequests()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi khi tạo đơn'))
    } finally {
      setSaving(false)
    }
  }

  const openReviewModal = (id: string, status: 'approved' | 'rejected') => {
    setReviewModal({
      isOpen: true,
      requestId: id,
      status: status,
      note: status === 'approved' ? 'Đã duyệt' : 'Từ chối',
      saving: false
    })
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewModal) return

    setReviewModal(prev => prev ? { ...prev, saving: true } : null)
    try {
      await staffManagerService.reviewRequest(reviewModal.requestId, reviewModal.status, reviewModal.note)
      showSuccess(`Đã ${reviewModal.status === 'approved' ? 'duyệt' : 'từ chối'} đơn!`)
      setReviewModal(null)
      loadPendingRequests()
    } catch (err) {
      showError(getErrorMessage(err, 'Lỗi thao tác'))
      setReviewModal(prev => prev ? { ...prev, saving: false } : null)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Quản lý nghỉ phép</h1>
          <p className="admin-page__subtitle">Tạo đơn xin nghỉ và duyệt đơn dành cho cấp quản lý.</p>
        </div>
        {!isManager && (
          <button className="admin-btn admin-btn--primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={15} /> Tạo đơn xin nghỉ
          </button>
        )}
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {!isManager && (
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 500, borderBottom: activeTab === 'my' ? '2px solid #0d9488' : '2px solid transparent', color: activeTab === 'my' ? '#0d9488' : '#64748b', cursor: 'pointer', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
            onClick={() => setActiveTab('my')}
          >
            Đơn của tôi
          </button>
        )}
        {isManager && (
          <>
            <button
              style={{ paddingBottom: '0.75rem', fontWeight: 500, borderBottom: activeTab === 'pending' ? '2px solid #0d9488' : '2px solid transparent', color: activeTab === 'pending' ? '#0d9488' : '#64748b', cursor: 'pointer', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => setActiveTab('pending')}
            >
              Duyệt đơn (Quản lý)
            </button>
            <button
              style={{ paddingBottom: '0.75rem', fontWeight: 500, borderBottom: activeTab === 'approved' ? '2px solid #0d9488' : '2px solid transparent', color: activeTab === 'approved' ? '#0d9488' : '#64748b', cursor: 'pointer', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => setActiveTab('approved')}
            >
              Đơn đã duyệt
            </button>
          </>
        )}
      </div>

      {!isManager && activeTab === 'my' && (
        <div className="admin-table-wrap">
          {loadingMy ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách...</div>
          ) : myRequests.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
                <CalendarOff size={32} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Bạn chưa có đơn xin nghỉ phép nào</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Nhấn vào nút "Tạo đơn xin nghỉ" ở trên nếu bạn cần xin nghỉ.</p>
            </div>
          ) : (
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Từ ngày</th>
                  <th style={{ textAlign: 'center' }}>Đến ngày</th>
                  <th style={{ textAlign: 'center' }}>Lý do</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Ghi chú phản hồi</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((req) => (
                  <tr key={req._id || req.id}>
                    <td style={{ textAlign: 'center' }}>{new Date(req.from_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.to_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}>{req.reason}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{
                        backgroundColor: req.request_status === 'approved' ? '#dcfce7' : req.request_status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: req.request_status === 'approved' ? '#166534' : req.request_status === 'rejected' ? '#991b1b' : '#92400e'
                      }}>
                        {req.request_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}>{req.reviewer_note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="admin-table-wrap">
          {loadingPending ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách chờ duyệt...</div>
          ) : pendingError ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#fee2e2', borderRadius: '50%', marginBottom: '1rem' }}>
                <AlertCircle size={32} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991b1b' }}>Từ chối truy cập</h3>
              <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{pendingError}</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
                <Check size={32} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Không có đơn nào chờ duyệt</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Mọi đơn xin nghỉ đã được xử lý xong.</p>
            </div>
          ) : (
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Nhân viên ID</th>
                  <th style={{ textAlign: 'center' }}>Từ ngày</th>
                  <th style={{ textAlign: 'center' }}>Đến ngày</th>
                  <th style={{ textAlign: 'center' }}>Lý do</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req._id || req.id}>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}><span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{req.staff_id}</span></td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.from_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.to_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}>{req.reason}</td>
                    <td style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openReviewModal((req._id || req.id)!, 'approved')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                        <Check size={16} /> Duyệt
                      </button>
                      <button 
                        onClick={() => openReviewModal((req._id || req.id)!, 'rejected')} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontWeight: 500, fontSize: '0.875rem' }}>
                        <X size={16} /> Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div className="admin-table-wrap">
          {loadingApproved ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đã duyệt...</div>
          ) : approvedError ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#fee2e2', borderRadius: '50%', marginBottom: '1rem' }}>
                <AlertCircle size={32} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991b1b' }}>Từ chối truy cập</h3>
              <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{approvedError}</p>
            </div>
          ) : approvedRequests.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
                <CalendarOff size={32} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Không có nhân viên nào đang nghỉ</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Danh sách các đơn đã được phê duyệt trống.</p>
            </div>
          ) : (
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Nhân viên ID</th>
                  <th style={{ textAlign: 'center' }}>Từ ngày</th>
                  <th style={{ textAlign: 'center' }}>Đến ngày</th>
                  <th style={{ textAlign: 'center' }}>Lý do</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {approvedRequests.map((req) => (
                  <tr key={req._id || req.id}>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}><span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{req.staff_id}</span></td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.from_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.to_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}>{req.reason}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{
                        backgroundColor: req.request_status === 'approved' ? '#dcfce7' : req.request_status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: req.request_status === 'approved' ? '#166534' : req.request_status === 'rejected' ? '#991b1b' : '#92400e'
                      }}>
                        {req.request_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}><span style={{ fontSize: '0.875rem', color: '#334155' }}>{req.reviewer_note || (req.request_status === 'approved' ? 'Đã duyệt' : 'Từ chối')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Tạo đơn */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Tạo đơn xin nghỉ</h2>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal__close"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Nghỉ từ ngày</label>
                <input type="date" className="admin-form-input" value={form.from_date} onChange={e => setForm({...form, from_date: e.target.value})} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Nghỉ đến ngày</label>
                <input type="date" className="admin-form-input" value={form.to_date} onChange={e => setForm({...form, to_date: e.target.value})} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Lý do nghỉ</label>
                <textarea className="admin-form-input" rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required placeholder="Ghi rõ lý do bạn xin nghỉ phép..." />
              </div>
              <div className="admin-modal__footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn--ghost">Hủy</button>
                <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                  {saving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />} Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phản hồi đơn */}
      {reviewModal?.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">{reviewModal.status === 'approved' ? 'Phê duyệt đơn' : 'Từ chối đơn'}</h2>
              <button onClick={() => setReviewModal(null)} className="admin-modal__close"><X size={18} /></button>
            </div>
            <form onSubmit={submitReview} className="admin-modal__body">
              <div className="admin-form-group">
                <label className="admin-form-label">Ghi chú phản hồi</label>
                <textarea 
                  className="admin-form-input" 
                  rows={3} 
                  value={reviewModal.note} 
                  onChange={e => setReviewModal(prev => prev ? { ...prev, note: e.target.value } : null)} 
                  required 
                  placeholder="Nhập lời nhắn cho nhân viên..." 
                />
              </div>
              <div className="admin-modal__footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setReviewModal(null)} className="admin-btn admin-btn--ghost">Hủy</button>
                <button type="submit" disabled={reviewModal.saving} className="admin-btn admin-btn--primary" style={{ backgroundColor: reviewModal.status === 'approved' ? '#0d9488' : '#dc2626' }}>
                  {reviewModal.saving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />} Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
