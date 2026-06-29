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

const STAFF_COLORS = [
  { bg: '#FCA5A5', color: '#7F1D1D', border: '#F87171' }, // Red
  { bg: '#FDBA74', color: '#7C2D12', border: '#FB923C' }, // Orange
  { bg: '#FDE047', color: '#713F12', border: '#FACC15' }, // Yellow
  { bg: '#86EFAC', color: '#14532D', border: '#4ADE80' }, // Green
  { bg: '#67E8F9', color: '#164E63', border: '#22D3EE' }, // Cyan
  { bg: '#93C5FD', color: '#1E3A8A', border: '#60A5FA' }, // Blue
  { bg: '#D8B4FE', color: '#4C1D95', border: '#C084FC' }, // Purple
  { bg: '#F9A8D4', color: '#831843', border: '#F472B6' }, // Pink
  { bg: '#D9F99D', color: '#3F6212', border: '#A3E635' }, // Lime
  { bg: '#E5E7EB', color: '#1F2937', border: '#9CA3AF' }, // Gray
  { bg: '#FDA4AF', color: '#881337', border: '#FB7185' }, // Rose
  { bg: '#FCD34D', color: '#78350F', border: '#FBBF24' }, // Amber
  { bg: '#5EEAD4', color: '#134E4A', border: '#2DD4BF' }, // Teal
  { bg: '#A5B4FC', color: '#312E81', border: '#818CF8' }, // Indigo
  { bg: '#C4B5FD', color: '#4C1D95', border: '#A78BFA' }, // Violet
]

const staffColorMap = new Map<string, typeof STAFF_COLORS[0]>()
let nextColorIdx = 0

function getStaffColor(identifier: string) {
  if (!identifier) return STAFF_COLORS[0]
  if (!staffColorMap.has(identifier)) {
    staffColorMap.set(identifier, STAFF_COLORS[nextColorIdx % STAFF_COLORS.length])
    nextColorIdx++
  }
  return staffColorMap.get(identifier)!
}

function getShortName(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'NV'
  if (parts.length === 1) return parts[0]
  return parts[parts.length - 1]
}

function getSlotStyle(assigned: number, max: number) {
  const ratio = assigned / max
  if (ratio >= 1) return {
    cardBg: '#EAF3DE', cardBorder: '#97C459',
    badgeBg: '#C0DD97', badgeColor: '#27500A', label: 'Đủ slot'
  }
  if (ratio >= 0.6) return {
    cardBg: '#FAEEDA', cardBorder: '#EF9F27',
    badgeBg: '#FAC775', badgeColor: '#633806', label: 'Còn chỗ'
  }
  return {
    cardBg: '#FCEBEB', cardBorder: '#F09595',
    badgeBg: '#F7C1C1', badgeColor: '#791F1F', label: 'Thiếu'
  }
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

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false)
  const [selectedScheduleForAdd, setSelectedScheduleForAdd] = useState<Schedule | null>(null)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string>('')
  const [isAddingStaff, setIsAddingStaff] = useState(false)

  const handleOpenAddStaffModal = async (schedule: Schedule) => {
    setSelectedScheduleForAdd(schedule)
    setSelectedStaffToAdd('')
    setIsAddStaffModalOpen(true)
    try {
      const params: any = { limit: 100 }
      if (user?.role !== 'boss' && user?.branch_id) {
        const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id
        if (userBranchId) params.branch_id = userBranchId
      }
      const data = await staffManagerService.getAllStaff(params)
      if (data && Array.isArray(data.items)) {
        const currentStaffIds = schedule.assigned_staff.map((s: any) => s._id || s)
        setAvailableStaff(data.items.filter((staff: any) => !currentStaffIds.includes(staff._id)))
      }
    } catch (error) {
      console.error('Failed to load staff list', error)
    }
  }

  const handleAddStaffConfirm = async () => {
    if (!selectedScheduleForAdd || !selectedStaffToAdd) return
    setIsAddingStaff(true)
    try {
      await scheduleService.addStaffToSchedule(selectedScheduleForAdd._id, selectedStaffToAdd)
      showSuccess('Đã thêm nhân viên vào ca thành công!')
      setIsAddStaffModalOpen(false)
      setSelectedScheduleForAdd(null)
      setSelectedStaffToAdd('')
      await fetchSchedules()
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm nhân viên')
    } finally {
      setIsAddingStaff(false)
    }
  }

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getStartOfWeek(today)
  })
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => { fetchSchedules() }, [])

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
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#C0DD97', display: 'inline-block' }} />
                Đủ slot
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#FAC775', display: 'inline-block' }} />
                Còn chỗ
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#F7C1C1', display: 'inline-block' }} />
                Thiếu
              </span>
            </div>
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

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {weekDays.map((date, index) => {
            const isToday = new Date().toDateString() === date.toDateString()
            const daySchedules = getSchedulesForDate(date)

            return (
              <div key={date.toISOString()} style={{ borderRight: index < 6 ? '1px solid #e2e8f0' : 'none' }}>
                {/* Column Header */}
                <div style={{
                  padding: '0.75rem 0.25rem',
                  textAlign: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  background: isToday ? '#E1F5EE' : '#f8fafc'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? '#0F6E56' : '#64748b' }}>
                    {dayNames[index]}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isToday ? '#085041' : '#334155', marginTop: '0.125rem' }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Column Body */}
                <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px', background: isToday ? '#f7fdfb' : 'transparent' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem', padding: '1rem' }}>...</div>
                  ) : daySchedules.length > 0 ? (
                    daySchedules.map(shift => {
                      const isFull = shift.assigned_staff.length >= shift.max_staff
                      const slot = getSlotStyle(shift.assigned_staff.length, shift.max_staff)

                      return (
                        <div
                          key={shift._id}
                          style={{
                            height: '155px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: slot.cardBg,
                            border: `1px solid ${slot.cardBorder}`,
                            borderRadius: '8px',
                            padding: '7px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          {/* Time */}
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '5px' }}>
                            <Clock size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                            {shift.start_time} – {shift.end_time}
                          </div>

                          {/* Slot badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                              fontSize: '0.6875rem', fontWeight: 600,
                              padding: '2px 7px', borderRadius: '10px',
                              background: slot.badgeBg, color: slot.badgeColor
                            }}>
                              <Users size={11} />
                              {shift.assigned_staff.length}/{shift.max_staff}
                            </span>
                            <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                              {shift.shift_status}
                            </span>
                          </div>

                          {/* Staff Blocks */}
                          {shift.assigned_staff.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {shift.assigned_staff.map((staff: any, idx: number) => {
                                const name = staff.full_name || staff.user_id?.full_name || staff.email || 'NV'
                                const staffId = staff._id || staff.user_id?._id || String(idx)
                                const c = getStaffColor(staffId)
                                return (
                                  <div
                                    key={staffId}
                                    title={name}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: c.bg,
                                      color: c.color,
                                      border: `1px solid ${c.border}`,
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '100%',
                                      display: 'inline-block',
                                      cursor: 'default',
                                    }}
                                  >
                                    {getShortName(name)}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Add staff button */}
                          {isManager && !isFull && (
                            <button
                              onClick={() => handleOpenAddStaffModal(shift)}
                              style={{
                                width: '100%', marginTop: 'auto', padding: '4px',
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px', color: '#64748b',
                                fontSize: '0.6875rem', fontWeight: 600,
                                cursor: 'pointer', display: 'flex',
                                justifyContent: 'center', alignItems: 'center', gap: '3px'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4f46e5' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#64748b' }}
                            >
                              <Plus size={12} /> Thêm nhân viên
                            </button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.8125rem', padding: '2rem 0' }}>
                      Trống
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && selectedScheduleForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Plus className="text-indigo-600" size={20} />
                Thêm nhân viên vào ca
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-medium">Ca làm việc:</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold mb-1">
                    <CalendarIcon size={14} className="text-slate-500" />
                    {new Date(selectedScheduleForAdd.shift_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                    <Clock size={14} className="text-slate-500" />
                    {selectedScheduleForAdd.start_time} - {selectedScheduleForAdd.end_time}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Chọn nhân viên</label>
                <select className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedStaffToAdd} onChange={e => setSelectedStaffToAdd(e.target.value)}>
                  <option value="">-- Chọn nhân viên --</option>
                  {availableStaff.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.user_id?.full_name || staff.user_id?.email || 'Chưa cập nhật'} - {staff.staff_code}
                    </option>
                  ))}
                </select>
                {availableStaff.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Đang tải danh sách nhân viên hoặc không còn nhân viên khả dụng.</p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-800">Hành động này sẽ cập nhật trực tiếp vào cơ sở dữ liệu và gửi Email thông báo cho nhân viên.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsAddStaffModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors" disabled={isAddingStaff}>
                Hủy bỏ
              </button>
              <button onClick={handleAddStaffConfirm} disabled={!selectedStaffToAdd || isAddingStaff} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isAddingStaff && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}