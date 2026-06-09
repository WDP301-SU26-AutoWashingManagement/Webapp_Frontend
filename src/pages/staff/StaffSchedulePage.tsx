import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Users, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { scheduleService, type Schedule } from '../../services/scheduleService'

// Hàm lấy ngày đầu tuần (Thứ 2)
function getStartOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

export default function StaffSchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getStartOfWeek(today)
  })

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true)
      try {
        const data = await scheduleService.getAllSchedules()
        setSchedules(data)
      } catch (error) {
        console.error("Failed to load schedules", error)
      } finally {
        setLoading(false)
      }
    }
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
    </div>
  )
}
