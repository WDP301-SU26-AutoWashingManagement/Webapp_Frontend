import React, { useState, useEffect } from 'react'
import { Check, X, Plus, RefreshCw, AlertCircle, CalendarOff, Clock, CheckCircle, XCircle, User } from 'lucide-react'
import { staffManagerService, type StaffAbsentRequest } from '../../services/staffManagerService'
import { showError, showSuccess } from '../../utils/toast'
import { getErrorMessage } from '../../utils/errors'
import { useAuth } from '../../hooks/useAuth'

import { LeaveDaysTable } from '../../components/manager/LeaveDaysTable'

export default function StaffLeaveRequestsPage() {
  const [mainTab, setMainTab] = useState<'leave_days' | 'requests'>('leave_days')
  const [activeTab, setActiveTab] = useState<'my' | 'pending' | 'approved' | 'rejected'>('my')

  const [myRequests, setMyRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingMy, setLoadingMy] = useState(true)

  const { user } = useAuth()
  const [allowedStaffIds, setAllowedStaffIds] = useState<string[] | null>(null)
  const [staffList, setStaffList] = useState<any[]>([])

  // Fetch allowed staff IDs for the current manager's branch
  useEffect(() => {
    if (user?.role !== 'boss' && user?.branch_id) {
      const fetchAllowedStaff = async () => {
        try {
          const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id;
          const data = await staffManagerService.getAllStaff({ limit: 1000, branch_id: userBranchId } as any);
          if (data && Array.isArray(data.data)) {
            const ids = data.data
              .filter((s: any) => {
                const uId = typeof s.user_id === 'object' ? s.user_id._id : s.user_id;
                return String(uId) !== String(user.user_id);
              })
              .map((s: any) => {
                const uId = typeof s.user_id === 'object' ? s.user_id._id : s.user_id;
                return String(uId);
              });
            setAllowedStaffIds(ids);
            setStaffList(data.data);
          }
        } catch (error) {
          console.error("Failed to load allowed staff", error);
        }
      };
      fetchAllowedStaff();
    }
  }, [user]);

  const [pendingRequests, setPendingRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const [isManager, setIsManager] = useState<boolean>(true) // default true until we know they are not

  const [approvedRequests, setApprovedRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingApproved, setLoadingApproved] = useState(false)
  const [approvedError, setApprovedError] = useState<string | null>(null)

  const [rejectedRequests, setRejectedRequests] = useState<StaffAbsentRequest[]>([])
  const [loadingRejected, setLoadingRejected] = useState(false)
  const [rejectedError, setRejectedError] = useState<string | null>(null)

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
      const filtered = (user?.role !== 'boss' && user?.branch_id && allowedStaffIds)
        ? data.filter(req => allowedStaffIds.includes(String(req.staff_id)))
        : data;
      setPendingRequests(filtered)
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
      const filtered = (user?.role !== 'boss' && user?.branch_id && allowedStaffIds)
        ? data.filter(req => allowedStaffIds.includes(String(req.staff_id)))
        : data;
      setApprovedRequests(filtered)
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

  const loadRejectedRequests = async () => {
    try {
      setLoadingRejected(true)
      setRejectedError(null)
      const data = await staffManagerService.getRejectedRequests()
      const filtered = (user?.role !== 'boss' && user?.branch_id && allowedStaffIds)
        ? data.filter(req => allowedStaffIds.includes(String(req.staff_id)))
        : data;
      setRejectedRequests(filtered)
    } catch (err: any) {
      if (err?.status === 403 || err?.response?.status === 403) {
        setRejectedError('Bạn không có quyền quản lý để xem danh sách này.')
      } else {
        setRejectedError('Không thể tải danh sách đơn đã từ chối.')
      }
    } finally {
      setLoadingRejected(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyRequests()
    } else if (activeTab === 'pending') {
      loadPendingRequests()
    } else if (activeTab === 'approved') {
      loadApprovedRequests()
    } else if (activeTab === 'rejected') {
      loadRejectedRequests()
    }
  }, [activeTab, allowedStaffIds])

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

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setMainTab('leave_days')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            mainTab === 'leave_days'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Quản lý ngày phép
        </button>
        <button
          onClick={() => setMainTab('requests')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${
            mainTab === 'requests'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Đơn nghỉ phép
        </button>
      </div>

      {mainTab === 'leave_days' ? (
        <LeaveDaysTable />
      ) : (
        <>
          <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit mb-6 shadow-sm border border-slate-200">
            {!isManager && (
              <button
                onClick={() => setActiveTab('my')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'my' 
                    ? 'bg-white text-teal-700 shadow border border-slate-200/60' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <User size={16} />
                Đơn của tôi
              </button>
            )}
            {isManager && (
              <>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'pending' 
                      ? 'bg-white text-amber-600 shadow border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <Clock size={16} />
                  Duyệt đơn
                  {pendingRequests.length > 0 && activeTab !== 'pending' && (
                    <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs ml-1 font-bold">{pendingRequests.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'approved' 
                      ? 'bg-white text-teal-700 shadow border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <CheckCircle size={16} />
                  Đơn đã duyệt
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'rejected' 
                      ? 'bg-white text-rose-600 shadow border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <XCircle size={16} />
                  Đơn từ chối
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
                  <th style={{ textAlign: 'left' }}>Nhân viên</th>
                  <th style={{ textAlign: 'center' }}>Từ ngày</th>
                  <th style={{ textAlign: 'center' }}>Đến ngày</th>
                  <th style={{ textAlign: 'center' }}>Lý do</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req._id || req.id}>
                    <td style={{ textAlign: 'left' }}>
                      {(() => {
                        let staff = typeof req.staff_id === 'object' && req.staff_id !== null ? req.staff_id as any : null;
                        if (!staff) {
                          staff = staffList.find(s => String(s._id) === String(req.staff_id) || String(s.user_id?._id || s.user_id) === String(req.staff_id)) || null;
                        }
                        const staffName = staff?.full_name || staff?.user_id?.full_name || staff?.email || 'Chưa cập nhật';
                        const staffInitial = staffName.charAt(0).toUpperCase();
                        const staffContact = staff?.email || staff?.user_id?.email || String(req.staff_id);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                              {staffInitial}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{staffName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staffContact}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
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
                  <th style={{ textAlign: 'left' }}>Nhân viên</th>
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
                    <td style={{ textAlign: 'left' }}>
                      {(() => {
                        let staff = typeof req.staff_id === 'object' && req.staff_id !== null ? req.staff_id as any : null;
                        if (!staff) {
                          staff = staffList.find(s => String(s._id) === String(req.staff_id) || String(s.user_id?._id || s.user_id) === String(req.staff_id)) || null;
                        }
                        const staffName = staff?.full_name || staff?.user_id?.full_name || staff?.email || 'Chưa cập nhật';
                        const staffInitial = staffName.charAt(0).toUpperCase();
                        const staffContact = staff?.email || staff?.user_id?.email || String(req.staff_id);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                              {staffInitial}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{staffName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staffContact}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
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

      {activeTab === 'rejected' && (
        <div className="admin-table-wrap">
          {loadingRejected ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đã từ chối...</div>
          ) : rejectedError ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#fee2e2', borderRadius: '50%', marginBottom: '1rem' }}>
                <AlertCircle size={32} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991b1b' }}>Từ chối truy cập</h3>
              <p style={{ color: '#dc2626', marginTop: '0.5rem' }}>{rejectedError}</p>
            </div>
          ) : rejectedRequests.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: '#f8fafc', borderRadius: '50%', marginBottom: '1rem' }}>
                <CalendarOff size={32} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#334155' }}>Không có đơn nào bị từ chối</h3>
              <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Danh sách các đơn đã bị từ chối trống.</p>
            </div>
          ) : (
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Nhân viên</th>
                  <th style={{ textAlign: 'center' }}>Từ ngày</th>
                  <th style={{ textAlign: 'center' }}>Đến ngày</th>
                  <th style={{ textAlign: 'center' }}>Lý do</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {rejectedRequests.map((req) => (
                  <tr key={req._id || req.id}>
                    <td style={{ textAlign: 'left' }}>
                      {(() => {
                        let staff = typeof req.staff_id === 'object' && req.staff_id !== null ? req.staff_id as any : null;
                        if (!staff) {
                          staff = staffList.find(s => String(s._id) === String(req.staff_id) || String(s.user_id?._id || s.user_id) === String(req.staff_id)) || null;
                        }
                        const staffName = staff?.full_name || staff?.user_id?.full_name || staff?.email || 'Chưa cập nhật';
                        const staffInitial = staffName.charAt(0).toUpperCase();
                        const staffContact = staff?.email || staff?.user_id?.email || String(req.staff_id);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                              {staffInitial}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{staffName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staffContact}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.from_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(req.to_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}>{req.reason}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        {req.request_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word' }}><span style={{ fontSize: '0.875rem', color: '#334155' }}>{req.reviewer_note || 'Từ chối'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      </>
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
                <input type="date" className="admin-form-input" value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Nghỉ đến ngày</label>
                <input type="date" className="admin-form-input" value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Lý do nghỉ</label>
                <textarea className="admin-form-input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required placeholder="Ghi rõ lý do bạn xin nghỉ phép..." />
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
