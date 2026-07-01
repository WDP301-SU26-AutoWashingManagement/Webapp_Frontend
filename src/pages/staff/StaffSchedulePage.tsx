import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Users, Clock, Calendar as CalendarIcon, RefreshCcw, AlertTriangle, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { scheduleService, type Schedule } from '../../services/scheduleService'
import { staffManagerService } from '../../services/staffManagerService'
import { showSuccess, showError } from '../../utils/toast'

function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}



export default function StaffSchedulePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager'

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [selectedDateA, setSelectedDateA] = useState<string>('')
  const [selectedShiftA, setSelectedShiftA] = useState<string>('')
  const [selectedStaffA, setSelectedStaffA] = useState<string>('')
  const [selectedDateB, setSelectedDateB] = useState<string>('')
  const [selectedShiftB, setSelectedShiftB] = useState<string>('')
  const [selectedStaffB, setSelectedStaffB] = useState<string>('')
  const [isSwapping, setIsSwapping] = useState(false)

  const handleSwapConfirm = async () => {
    if (!selectedStaffA || !selectedStaffB) return
    const [schedule_id_1, staff_id_1] = selectedStaffA.split('_')
    const [schedule_id_2, staff_id_2] = selectedStaffB.split('_')
    setIsSwapping(true)
    try {
      await scheduleService.switchStaff(schedule_id_1, staff_id_1, schedule_id_2, staff_id_2)
      showSuccess('Đã hoán đổi thành công! Email thông báo đã được gửi.')
      setIsSwapModalOpen(false)
      setSelectedDateA(''); setSelectedShiftA(''); setSelectedStaffA('')
      setSelectedDateB(''); setSelectedShiftB(''); setSelectedStaffB('')
      await fetchSchedules()
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi hoán đổi ca')
    } finally {
      setIsSwapping(false)
    }
  }

  const [isAssignShiftModalOpen, setIsAssignShiftModalOpen] = useState(false)
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<any>(null)
  const [selectedDateForAssign, setSelectedDateForAssign] = useState<Date | null>(null)
  const [selectedShiftToAssign, setSelectedShiftToAssign] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  const handleOpenAssignModal = (staff: any, date: Date) => {
    setSelectedStaffForAssign(staff)
    setSelectedDateForAssign(date)
    setSelectedShiftToAssign('')
    setIsAssignShiftModalOpen(true)
  }

  const handleAssignShiftConfirm = async () => {
    if (!selectedStaffForAssign || !selectedShiftToAssign) return
    setIsAssigning(true)
    try {
      const staffId = selectedStaffForAssign._id || selectedStaffForAssign.user_id?._id || selectedStaffForAssign
      await scheduleService.addStaffToSchedule(selectedShiftToAssign, staffId)
      showSuccess('Đã phân ca cho nhân viên thành công!')
      setIsAssignShiftModalOpen(false)
      setSelectedStaffForAssign(null)
      setSelectedDateForAssign(null)
      setSelectedShiftToAssign('')
      await fetchSchedules()
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi phân ca')
    } finally {
      setIsAssigning(false)
    }
  }

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getStartOfWeek(today)
  })
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [allStaff, setAllStaff] = useState<any[]>([])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const data = await scheduleService.getAllSchedules()
      const filtered = (user?.role !== 'boss' && user?.branch_id)
        ? data.filter(s => {
          const bId = typeof s.branch_id === 'object' ? (s.branch_id as any)._id : s.branch_id
          const uBId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id
          return bId === uBId
        })
        : data
      setSchedules(filtered)
    } catch (error) {
      console.error('Failed to load schedules', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const params: any = { limit: 100 }
      if (user?.role !== 'boss' && user?.branch_id) {
        const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id
        if (userBranchId) params.branch_id = userBranchId
      }
      const data = await staffManagerService.getAllStaff(params)
      if (data && Array.isArray(data.items)) {
        setAllStaff(data.items)
      }
    } catch (error) {
      console.error('Failed to load staff list', error)
    }
  }

  useEffect(() => {
    fetchSchedules()
    fetchStaff()
  }, [user])

  const displayStaff = React.useMemo(() => {
    if (allStaff.length > 0) return allStaff

    const staffMap = new Map()
    schedules.forEach(s => {
      s.assigned_staff.forEach((staff: any) => {
        const staffId = staff._id || staff.user_id?._id || staff
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, staff)
        }
      })
    })
    return Array.from(staffMap.values())
  }, [allStaff, schedules])

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() + i)
    return d
  })

  const goPrevWeek = () => setCurrentWeekStart(prev => { const n = new Date(prev); n.setDate(prev.getDate() - 7); return n })
  const goNextWeek = () => setCurrentWeekStart(prev => { const n = new Date(prev); n.setDate(prev.getDate() + 7); return n })

  const getSchedulesForDate = (date: Date) =>
    schedules.filter(s => {
      const sd = new Date(s.shift_date)
      return sd.getDate() === date.getDate() && sd.getMonth() === date.getMonth() && sd.getFullYear() === date.getFullYear()
    }).sort((a, b) => a.start_time.localeCompare(b.start_time))

  const getSchedulesForStaffOnDate = (staffId: string, date: Date) => {
    return getSchedulesForDate(date).filter(s =>
      s.assigned_staff.some((st: any) => {
        const id = st._id || st.user_id?._id || st;
        return id === staffId;
      })
    )
  }

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

  let swapError: string | null = null
  if (selectedStaffA && selectedStaffB) {
    const [schedule_id_1, staff_id_1] = selectedStaffA.split('_')
    const [schedule_id_2, staff_id_2] = selectedStaffB.split('_')
    if (selectedStaffA === selectedStaffB) {
      swapError = 'Không thể đổi ca với chính phân công này.'
    } else if (schedule_id_1 === schedule_id_2) {
      swapError = 'Hai nhân viên đang ở cùng một ca, không thể hoán đổi.'
    } else {
      const s1 = schedules.find(s => s._id === schedule_id_1)
      const s2 = schedules.find(s => s._id === schedule_id_2)
      if (s1 && s2) {
        const staff2InS1 = s1.assigned_staff.some((st: any) => (st._id || st) === staff_id_2)
        const staff1InS2 = s2.assigned_staff.some((st: any) => (st._id || st) === staff_id_1)
        if (staff2InS1 && staff1InS2) swapError = 'Cả hai nhân viên đều đã có mặt trong ca của nhau.'
        else if (staff2InS1) swapError = 'Nhân viên thay thế đã có mặt trong ca gốc.'
        else if (staff1InS2) swapError = 'Nhân viên gốc đã có mặt trong ca thay thế.'
      }
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Lịch làm việc</h1>
          <p className="admin-page__subtitle">Theo dõi và quản lý ca làm việc trong tuần.</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="admin-btn admin-btn--ghost" onClick={goPrevWeek} style={{ padding: '0.375rem' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={16} style={{ color: '#0d9488' }} />
              Tuần {weekDays[0].toLocaleDateString('vi-VN')} – {weekDays[6].toLocaleDateString('vi-VN')}
            </div>
            <button className="admin-btn admin-btn--ghost" onClick={goNextWeek} style={{ padding: '0.375rem' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

            <button className="admin-btn admin-btn--ghost" onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}>
              Về tuần này
            </button>
            {isManager && (
              <button
                onClick={() => {
                  setSelectedDateA(''); setSelectedShiftA(''); setSelectedStaffA('')
                  setSelectedDateB(''); setSelectedShiftB(''); setSelectedStaffB('')
                  setIsSwapModalOpen(true)
                }}
                style={{ padding: '0.4rem 0.875rem', background: '#FAEEDA', color: '#633806', border: '1px solid #EF9F27', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}
              >
                <RefreshCcw size={14} /> Hoán đổi ca
              </button>
            )}
          </div>
        </div>

        {/* Calendar Matrix */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', borderRight: '1px solid #e2e8f0', width: '200px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Nhân viên</span>
                </th>
                {weekDays.map((date, index) => {
                  const isToday = new Date().toDateString() === date.toDateString()
                  return (
                    <th key={index} style={{ padding: '0.75rem', borderRight: index < 6 ? '1px solid #e2e8f0' : 'none', minWidth: '130px', textAlign: 'center', background: isToday ? '#E1F5EE' : 'transparent' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? '#0F6E56' : '#64748b' }}>
                        {dayNames[index]}
                      </div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: isToday ? '#085041' : '#334155', marginTop: '0.125rem' }}>
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Đang tải...</td></tr>
              ) : displayStaff.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Không có dữ liệu nhân viên</td></tr>
              ) : (
                displayStaff.map((staff, sIndex) => {
                  const staffId = staff._id || staff.user_id?._id || staff
                  const staffName = staff.full_name || staff.user_id?.full_name || staff.email || staff.user_id?.email || 'Chưa cập nhật'

                  return (
                    <tr key={staffId} style={{ borderBottom: sIndex < displayStaff.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      {/* Staff Info Cell */}
                      <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0', position: 'sticky', left: 0, background: '#fff', zIndex: 10, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={staffName}>
                          {staffName}
                        </div>
                      </td>

                      {/* Days Cells */}
                      {weekDays.map((date, index) => {
                        const daySchedules = getSchedulesForStaffOnDate(staffId, date)
                        const isToday = new Date().toDateString() === date.toDateString()

                        return (
                          <td key={index} style={{ padding: '0.5rem', borderRight: index < 6 ? '1px solid #e2e8f0' : 'none', verticalAlign: 'top', background: isToday ? '#f7fdfb' : 'transparent' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {daySchedules.map(shift => (
                                <div key={shift._id} style={{
                                  background: '#EAF3DE', border: '1px solid #97C459', borderRadius: '6px', padding: '0.5rem', textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#27500A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {shift.start_time} - {shift.end_time}
                                  </div>
                                </div>
                              ))}

                              {isManager && (
                                <button
                                  onClick={() => handleOpenAssignModal(staff, date)}
                                  style={{
                                    width: '100%', padding: '0.375rem',
                                    background: 'transparent',
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: '6px', color: '#64748b',
                                    fontSize: '0.6875rem', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex',
                                    justifyContent: 'center', alignItems: 'center', gap: '3px'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#93c5fd' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                >
                                  <Plus size={12} /> Thêm ca
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Swap Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <RefreshCcw className="text-indigo-600" size={24} />
                Hoán đổi ca làm việc
              </h3>
            </div>

            <div className="p-8 space-y-8">
              <div className="relative">
                {(() => {
                  const getFormattedDate = (d: string | Date) => {
                    const date = new Date(d)
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                  }

                  const availableSchedulesA = schedules.filter(s => getFormattedDate(s.shift_date) === selectedDateA)
                  const staffForShiftA = selectedShiftA
                    ? availableSchedulesA.find(s => s._id === selectedShiftA)?.assigned_staff.map(staff => ({
                      id: `${selectedShiftA}_${(staff as any)._id || staff}`,
                      label: (staff as any).full_name || (staff as any).user_id?.full_name || (staff as any).email || 'Chưa cập nhật'
                    })) || []
                    : []

                  const availableSchedulesB = schedules.filter(s => getFormattedDate(s.shift_date) === selectedDateB)
                  let staffForShiftB = selectedShiftB
                    ? availableSchedulesB.find(s => s._id === selectedShiftB)?.assigned_staff.map(staff => {
                      const st_2 = (staff as any)._id || staff
                      return {
                        id: `${selectedShiftB}_${st_2}`,
                        label: (staff as any).full_name || (staff as any).user_id?.full_name || (staff as any).email || 'Chưa cập nhật',
                        rawStaffId: st_2
                      }
                    }) || []
                    : []

                  if (selectedStaffA && selectedShiftB) {
                    const [sched_1, st_1] = selectedStaffA.split('_')
                    const s1 = schedules.find(s => s._id === sched_1)
                    const s2 = schedules.find(s => s._id === selectedShiftB)
                    staffForShiftB = staffForShiftB.filter(b => {
                      if (sched_1 === selectedShiftB) return false
                      if (s2 && s2.assigned_staff.some((s: any) => (s._id || s) === st_1)) return false
                      if (s1 && s1.assigned_staff.some((s: any) => (s._id || s) === b.rawStaffId)) return false
                      return true
                    })
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">1</div>
                          <h4 className="font-semibold text-slate-700 text-lg">Ca hiện tại (Ca gốc)</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày làm việc</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" value={selectedDateA} onChange={e => { setSelectedDateA(e.target.value); setSelectedShiftA(''); setSelectedStaffA('') }} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Khung giờ</label>
                          <select className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm" value={selectedShiftA} onChange={e => { setSelectedShiftA(e.target.value); setSelectedStaffA('') }} disabled={!selectedDateA}>
                            <option value="">-- Chọn khung giờ --</option>
                            {availableSchedulesA.length === 0 && selectedDateA
                              ? <option value="" disabled>Không có ca làm việc nào</option>
                              : availableSchedulesA.map(s => <option key={s._id} value={s._id}>{s.start_time} - {s.end_time}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Nhân viên cần đổi ca</label>
                          <select className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm" value={selectedStaffA} onChange={e => setSelectedStaffA(e.target.value)} disabled={!selectedShiftA}>
                            <option value="">-- Chọn nhân viên --</option>
                            {staffForShiftA.length === 0 && selectedShiftA
                              ? <option value="" disabled>Chưa có nhân viên trong ca này</option>
                              : staffForShiftA.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-3 rounded-full border-4 border-white shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                        <RefreshCcw size={24} className="text-indigo-500" />
                      </div>

                      <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-xl space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-indigo-100">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">2</div>
                          <h4 className="font-semibold text-indigo-700 text-lg">Ca thay thế (Đổi với ai)</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày làm việc</label>
                          <input type="date" className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm" value={selectedDateB} onChange={e => { setSelectedDateB(e.target.value); setSelectedShiftB(''); setSelectedStaffB('') }} disabled={!selectedStaffA} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Khung giờ</label>
                          <select className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm" value={selectedShiftB} onChange={e => { setSelectedShiftB(e.target.value); setSelectedStaffB('') }} disabled={!selectedDateB}>
                            <option value="">-- Chọn khung giờ --</option>
                            {availableSchedulesB.length === 0 && selectedDateB
                              ? <option value="" disabled>Không có ca làm việc nào</option>
                              : availableSchedulesB.map(s => <option key={s._id} value={s._id}>{s.start_time} - {s.end_time}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Nhân viên thay thế</label>
                          <select className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm" value={selectedStaffB} onChange={e => setSelectedStaffB(e.target.value)} disabled={!selectedShiftB}>
                            <option value="">-- Chọn nhân viên --</option>
                            {staffForShiftB.length === 0 && selectedShiftB
                              ? <option value="" disabled>Không có NV khả dụng</option>
                              : staffForShiftB.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {swapError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 items-start">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-800 font-medium">{swapError}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-amber-800">
                    Hành động này sẽ cập nhật trực tiếp vào cơ sở dữ liệu và tự động gửi <strong>Email thông báo</strong> cho cả 2 nhân viên.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsSwapModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSwapConfirm} disabled={!selectedStaffA || !selectedStaffB || !!swapError || isSwapping} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSwapping && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận đổi ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {isAssignShiftModalOpen && selectedStaffForAssign && selectedDateForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                Phân ca làm việc
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-medium">Thông tin:</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                    <Users size={14} className="text-slate-500" />
                    {selectedStaffForAssign.user_id?.full_name || selectedStaffForAssign.full_name || 'Chưa cập nhật'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                    <CalendarIcon size={14} className="text-slate-500" />
                    {selectedDateForAssign.toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Chọn ca khả dụng</label>
                <select className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedShiftToAssign} onChange={e => setSelectedShiftToAssign(e.target.value)}>
                  <option value="">-- Chọn ca làm việc --</option>
                  {(() => {
                    const dateSchedules = getSchedulesForDate(selectedDateForAssign);
                    const staffId = selectedStaffForAssign._id || selectedStaffForAssign.user_id?._id || selectedStaffForAssign;
                    const availableShifts = dateSchedules.filter(s =>
                      !s.assigned_staff.some((st: any) => {
                        const stId = st._id || st.user_id?._id || st;
                        return stId === staffId;
                      }) &&
                      s.assigned_staff.length < s.max_staff
                    );

                    return availableShifts.map(shift => (
                      <option key={shift._id} value={shift._id}>
                        {shift.start_time} - {shift.end_time} (Còn {shift.max_staff - shift.assigned_staff.length} slot)
                      </option>
                    ))
                  })()}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-800">Hành động này sẽ phân công nhân viên vào ca đã chọn và gửi Email thông báo.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsAssignShiftModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors" disabled={isAssigning}>
                Hủy bỏ
              </button>
              <button onClick={handleAssignShiftConfirm} disabled={!selectedShiftToAssign || isAssigning} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isAssigning && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}