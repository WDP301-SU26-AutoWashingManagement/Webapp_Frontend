import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Users, Clock, Calendar as CalendarIcon, RefreshCcw, AlertTriangle, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { scheduleService, type Schedule } from '../../services/scheduleService'
import { staffManagerService } from '../../services/staffManagerService'
import { showSuccess, showError } from '../../utils/toast'

// Hàm lấy ngày đầu tuần (Thứ 2)
function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

export default function StaffSchedulePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager'

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedDateA, setSelectedDateA] = useState<string>('');
  const [selectedShiftA, setSelectedShiftA] = useState<string>('');
  const [selectedStaffA, setSelectedStaffA] = useState<string>('');
  const [selectedDateB, setSelectedDateB] = useState<string>('');
  const [selectedShiftB, setSelectedShiftB] = useState<string>('');
  const [selectedStaffB, setSelectedStaffB] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwapConfirm = async () => {
    if (!selectedStaffA || !selectedStaffB) return;
    
    const [schedule_id_1, staff_id_1] = selectedStaffA.split('_');
    const [schedule_id_2, staff_id_2] = selectedStaffB.split('_');

    setIsSwapping(true);
    try {
      await scheduleService.switchStaff(schedule_id_1, staff_id_1, schedule_id_2, staff_id_2);
      showSuccess('Đã hoán đổi thành công! Email thông báo đã được gửi.');
      setIsSwapModalOpen(false);
      setSelectedDateA('');
      setSelectedShiftA('');
      setSelectedStaffA('');
      setSelectedDateB('');
      setSelectedShiftB('');
      setSelectedStaffB('');
      
      // Reload schedules
      await fetchSchedules();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi hoán đổi ca');
    } finally {
      setIsSwapping(false);
    }
  };

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [selectedScheduleForAdd, setSelectedScheduleForAdd] = useState<Schedule | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState<string>('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const handleOpenAddStaffModal = async (schedule: Schedule) => {
    setSelectedScheduleForAdd(schedule);
    setSelectedStaffToAdd('');
    setIsAddStaffModalOpen(true);
    
    try {
      const params: any = { limit: 100 }
      if (user?.role !== 'boss' && user?.branch_id) {
        const userBranchId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id
        if (userBranchId) {
          params.branch_id = userBranchId
        }
      }

      const data = await staffManagerService.getAllStaff(params);
      if (data && Array.isArray(data.items)) {
        // Filter out staff who are already in this schedule
        const currentStaffIds = schedule.assigned_staff.map((s: any) => s._id || s);
        const available = data.items.filter((staff: any) => !currentStaffIds.includes(staff._id));
        setAvailableStaff(available);
      }
    } catch (error) {
      console.error("Failed to load staff list", error);
    }
  };

  const handleAddStaffConfirm = async () => {
    if (!selectedScheduleForAdd || !selectedStaffToAdd) return;
    
    setIsAddingStaff(true);
    try {
      await scheduleService.addStaffToSchedule(selectedScheduleForAdd._id, selectedStaffToAdd);
      showSuccess('Đã thêm nhân viên vào ca thành công!');
      setIsAddStaffModalOpen(false);
      setSelectedScheduleForAdd(null);
      setSelectedStaffToAdd('');
      
      // Reload schedules
      await fetchSchedules();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Có lỗi xảy ra khi thêm nhân viên');
    } finally {
      setIsAddingStaff(false);
    }
  };

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
            const bId = typeof s.branch_id === 'object' ? (s.branch_id as any)._id : s.branch_id;
            const uBId = typeof user.branch_id === 'object' ? (user.branch_id as any)._id : user.branch_id;
            return bId === uBId;
          })
        : data;
      setSchedules(filtered)
    } catch (error) {
      console.error("Failed to load schedules", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  // Tạo mảng 7 ngày cho tuần hiện tại
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() + i)
    return d
  })

  const goPrevWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  }

  const goNextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })
  }

  // Filter & Group schedules for the current week
  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => {
      const shiftDate = new Date(s.shift_date)
      return shiftDate.getDate() === date.getDate() &&
             shiftDate.getMonth() === date.getMonth() &&
             shiftDate.getFullYear() === date.getFullYear()
    }).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

  let swapError: string | null = null;
  if (selectedStaffA && selectedStaffB) {
    const [schedule_id_1, staff_id_1] = selectedStaffA.split('_');
    const [schedule_id_2, staff_id_2] = selectedStaffB.split('_');

    if (selectedStaffA === selectedStaffB) {
      swapError = 'Không thể đổi ca với chính phân công này.';
    } else if (schedule_id_1 === schedule_id_2) {
      swapError = 'Hai nhân viên đang ở cùng một ca, không thể hoán đổi.';
    } else {
      const s1 = schedules.find(s => s._id === schedule_id_1);
      const s2 = schedules.find(s => s._id === schedule_id_2);

      if (s1 && s2) {
        const staff2InS1 = s1.assigned_staff.some((st: any) => (st._id || st) === staff_id_2);
        const staff1InS2 = s2.assigned_staff.some((st: any) => (st._id || st) === staff_id_1);

        if (staff2InS1 && staff1InS2) {
          swapError = 'Cả hai nhân viên đều đã có mặt trong ca của nhau.';
        } else if (staff2InS1) {
          swapError = 'Nhân viên thay thế đã có mặt trong ca gốc.';
        } else if (staff1InS2) {
          swapError = 'Nhân viên gốc đã có mặt trong ca thay thế.';
        }
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="admin-btn admin-btn--ghost" onClick={goPrevWeek} style={{ padding: '0.5rem' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} className="text-teal-600" />
              Tuần {weekDays[0].toLocaleDateString('vi-VN')} - {weekDays[6].toLocaleDateString('vi-VN')}
            </div>
            <button className="admin-btn admin-btn--ghost" onClick={goNextWeek} style={{ padding: '0.5rem' }}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div>
            <button className="admin-btn admin-btn--ghost" onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}>
              Về tuần này
            </button>
            {isManager && (
              <button 
                onClick={() => {
                  setSelectedDateA('');
                  setSelectedShiftA('');
                  setSelectedStaffA('');
                  setSelectedDateB('');
                  setSelectedShiftB('');
                  setSelectedStaffB('');
                  setIsSwapModalOpen(true);
                }}
                style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '0.375rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <RefreshCcw size={16} /> Hoán đổi ca
              </button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '600px' }}>
          {weekDays.map((date, index) => {
            const isToday = new Date().toDateString() === date.toDateString()
            const daySchedules = getSchedulesForDate(date)

            return (
              <div key={date.toISOString()} style={{ borderRight: index < 6 ? '1px solid #e2e8f0' : 'none' }}>
                {/* Column Header */}
                <div style={{ 
                  padding: '1rem 0', 
                  textAlign: 'center', 
                  borderBottom: '1px solid #e2e8f0',
                  background: isToday ? '#f0fdfa' : '#f8fafc'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isToday ? '#0d9488' : '#64748b' }}>
                    {dayNames[index]}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isToday ? '#0f766e' : '#334155', marginTop: '0.25rem' }}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Column Body - Shifts */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: isToday ? '#f0fdfa' : 'transparent', height: '100%' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '1rem' }}>...</div>
                  ) : daySchedules.length > 0 ? (
                    daySchedules.map(shift => {
                      const isFull = shift.assigned_staff.length >= shift.max_staff
                      return (
                        <div key={shift._id} style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          cursor: 'pointer',
                          borderLeft: `4px solid ${isFull ? '#10b981' : '#f59e0b'}`
                        }}
                        >
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                            <Clock size={14} className="text-slate-400" />
                            {shift.start_time} - {shift.end_time}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: isFull ? '#10b981' : '#d97706', background: isFull ? '#d1fae5' : '#fef3c7', padding: '0.125rem 0.5rem', borderRadius: '1rem', fontWeight: 500 }}>
                              <Users size={12} />
                              {shift.assigned_staff.length}/{shift.max_staff}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                              {shift.shift_status}
                            </div>
                          </div>
                          
                          {/* Staff Names List */}
                          {shift.assigned_staff.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {shift.assigned_staff.map((staff: any, idx: number) => {
                                const staffName = staff.full_name || staff.email || staff.user_id?.full_name || 'Chưa cập nhật';
                                return (
                                  <div key={staff._id || idx} style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staffName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {isManager && !isFull && (
                            <button 
                              onClick={() => handleOpenAddStaffModal(shift)}
                              style={{ width: '100%', marginTop: '0.75rem', padding: '0.375rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '0.25rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#4f46e5' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
                            >
                              <Plus size={14} /> Thêm nhân viên
                            </button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', padding: '2rem 0' }}>
                      Trống
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Switch Shift Modal */}
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
                    const date = new Date(d);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  };

                  const availableSchedulesA = schedules.filter(s => getFormattedDate(s.shift_date) === selectedDateA);
                  
                  const staffForShiftA = selectedShiftA 
                    ? availableSchedulesA.find(s => s._id === selectedShiftA)?.assigned_staff.map(staff => ({
                        id: `${selectedShiftA}_${(staff as any)._id || staff}`,
                        label: (staff as any).full_name || (staff as any).user_id?.full_name || (staff as any).email || 'Chưa cập nhật'
                    })) || []
                    : [];

                  const availableSchedulesB = schedules.filter(s => getFormattedDate(s.shift_date) === selectedDateB);

                  let staffForShiftB = selectedShiftB
                    ? availableSchedulesB.find(s => s._id === selectedShiftB)?.assigned_staff.map(staff => {
                         const st_2 = (staff as any)._id || staff;
                         return {
                           id: `${selectedShiftB}_${st_2}`,
                           label: (staff as any).full_name || (staff as any).user_id?.full_name || (staff as any).email || 'Chưa cập nhật',
                           rawStaffId: st_2
                         };
                      }) || []
                    : [];

                  if (selectedStaffA && selectedShiftB) {
                      const [sched_1, st_1] = selectedStaffA.split('_');
                      const s1 = schedules.find(s => s._id === sched_1);
                      const s2 = schedules.find(s => s._id === selectedShiftB);
                      
                      staffForShiftB = staffForShiftB.filter(b => {
                          const sched_2 = selectedShiftB;
                          const st_2 = b.rawStaffId;
                          
                          if (sched_1 === sched_2) return false;
                          if (s2 && s2.assigned_staff.some((s: any) => (s._id || s) === st_1)) return false;
                          if (s1 && s1.assigned_staff.some((s: any) => (s._id || s) === st_2)) return false;
                          
                          return true;
                      });
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                      {/* Ca gốc */}
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">1</div>
                          <h4 className="font-semibold text-slate-700 text-lg">Ca hiện tại (Ca gốc)</h4>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày làm việc</label>
                          <input 
                            type="date"
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            value={selectedDateA}
                            onChange={(e) => {
                                setSelectedDateA(e.target.value);
                                setSelectedShiftA('');
                                setSelectedStaffA('');
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Khung giờ</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm"
                            value={selectedShiftA}
                            onChange={(e) => {
                                setSelectedShiftA(e.target.value);
                                setSelectedStaffA('');
                            }}
                            disabled={!selectedDateA}
                          >
                            <option value="">-- Chọn khung giờ --</option>
                            {availableSchedulesA.length === 0 && selectedDateA ? (
                              <option value="" disabled>Không có ca làm việc nào</option>
                            ) : (
                              availableSchedulesA.map(s => (
                                <option key={s._id} value={s._id}>{s.start_time} - {s.end_time}</option>
                              ))
                            )}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Nhân viên cần đổi ca</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm"
                            value={selectedStaffA}
                            onChange={(e) => setSelectedStaffA(e.target.value)}
                            disabled={!selectedShiftA}
                          >
                            <option value="">-- Chọn nhân viên --</option>
                            {staffForShiftA.length === 0 && selectedShiftA ? (
                              <option value="" disabled>Chưa có nhân viên trong ca này</option>
                            ) : (
                              staffForShiftA.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                      
                      {/* Icon hoán đổi ở giữa (với màn hình to) */}
                      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-3 rounded-full border-4 border-white shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                        <RefreshCcw size={24} className="text-indigo-500" />
                      </div>

                      {/* Ca thay thế */}
                      <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-xl space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-indigo-100">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">2</div>
                          <h4 className="font-semibold text-indigo-700 text-lg">Ca thay thế (Đổi với ai)</h4>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày làm việc</label>
                          <input 
                            type="date"
                            className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                            value={selectedDateB}
                            onChange={(e) => {
                                setSelectedDateB(e.target.value);
                                setSelectedShiftB('');
                                setSelectedStaffB('');
                            }}
                            disabled={!selectedStaffA}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Khung giờ</label>
                          <select 
                            className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                            value={selectedShiftB}
                            onChange={(e) => {
                                setSelectedShiftB(e.target.value);
                                setSelectedStaffB('');
                            }}
                            disabled={!selectedDateB}
                          >
                            <option value="">-- Chọn khung giờ --</option>
                            {availableSchedulesB.length === 0 && selectedDateB ? (
                              <option value="" disabled>Không có ca làm việc nào</option>
                            ) : (
                              availableSchedulesB.map(s => (
                                <option key={s._id} value={s._id}>{s.start_time} - {s.end_time}</option>
                              ))
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Nhân viên thay thế</label>
                          <select 
                            className="w-full border border-indigo-200 bg-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                            value={selectedStaffB}
                            onChange={(e) => setSelectedStaffB(e.target.value)}
                            disabled={!selectedShiftB}
                          >
                            <option value="">-- Chọn nhân viên --</option>
                            {staffForShiftB.length === 0 && selectedShiftB ? (
                              <option value="" disabled>Không có NV khả dụng</option>
                            ) : (
                              staffForShiftB.map(a => (
                                <option key={a.id} value={a.id}>{a.label}</option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
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
              <button 
                onClick={() => setIsSwapModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSwapConfirm}
                disabled={!selectedStaffA || !selectedStaffB || !!swapError || isSwapping}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSwapping && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
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
                <select 
                  className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedStaffToAdd}
                  onChange={(e) => setSelectedStaffToAdd(e.target.value)}
                >
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
                <p className="text-xs text-blue-800">
                  Hành động này sẽ cập nhật trực tiếp vào cơ sở dữ liệu và gửi Email thông báo cho nhân viên.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsAddStaffModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                disabled={isAddingStaff}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddStaffConfirm}
                disabled={!selectedStaffToAdd || isAddingStaff}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAddingStaff && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Xác nhận thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
