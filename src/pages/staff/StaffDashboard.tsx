import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { TerminalCronMonitor } from '../../components/manager/TerminalCronMonitor'
import { scheduleService, type Schedule } from '../../services/scheduleService'
import { attendanceService, type AttendanceRecord } from '../../services/attendanceService'
import { showSuccess, showError } from '../../utils/toast'
import { Clock, MapPin, CheckCircle, LogOut } from 'lucide-react'

export default function StaffDashboard() {
    const { user } = useAuth()

    const isManager = user?.role === 'admin' || user?.role === 'boss' || user?.staff_type === 'manager'

    const [rawSchedules, setRawSchedules] = useState<Schedule[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
    const [attendances, setAttendances] = useState<Record<string, AttendanceRecord>>({})
    const [loading, setLoading] = useState(false)

    const fetchDashboardData = async () => {
        if (!user || isManager) return
        setLoading(true)
        try {
            const allSchedules = await scheduleService.getAllSchedules()
            setRawSchedules(allSchedules)

            // Lấy dữ liệu điểm danh
            const myAttendance = await attendanceService.getMyAttendance()
            const attendanceMap: Record<string, AttendanceRecord> = {}
            myAttendance.forEach(a => {
                const schedIdStr = typeof a.schedule_id === 'object' ? (a.schedule_id as any)._id : a.schedule_id;
                attendanceMap[schedIdStr] = a
            })
            setAttendances(attendanceMap)

        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dashboard', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [user])

    const handleCheckIn = async (scheduleId: string) => {
        try {
            const res = await attendanceService.checkIn(scheduleId)
            showSuccess(res.message || 'Check-in thành công')
        } catch (error: any) {
            showError(error?.data?.error || error?.message || 'Check-in thất bại')
        } finally {
            fetchDashboardData()
        }
    }

    const handleCheckOut = async (scheduleId: string) => {
        try {
            const res = await attendanceService.checkOut(scheduleId)
            showSuccess(res.message || 'Check-out thành công')
        } catch (error: any) {
            showError(error?.data?.error || error?.message || 'Check-out thất bại')
        } finally {
            fetchDashboardData()
        }
    }

    const currentUserId = user?.user_id || (user as any)?._id || (user as any)?.id;
    const filteredSchedules = React.useMemo(() => {
        if (!rawSchedules) return []
        const [year, month, day] = selectedDate.split('-').map(Number)
        return rawSchedules.filter(s => {
            const shiftDate = new Date(s.shift_date)
            const isMatchDate = shiftDate.getFullYear() === year &&
                shiftDate.getMonth() + 1 === month &&
                shiftDate.getDate() === day

            const isAssigned = s.assigned_staff.some((st: any) => {
                if (!st) return false;
                const staffId = typeof st === 'object' ? st._id : st;
                const stUserId = typeof st === 'object' ? (st.user_id?._id || st.user_id) : null;
                return staffId === currentUserId || stUserId === currentUserId;
            })
            return isMatchDate && isAssigned
        }).sort((a, b) => a.start_time.localeCompare(b.start_time))
    }, [rawSchedules, selectedDate, currentUserId])

    return (
        <div className="admin-page p-6 space-y-8 bg-slate-50 min-h-screen">
            <div className="admin-page__header">
                <div>
                    <h1 className="admin-page__title">Tổng quan {isManager ? 'Manager' : 'Staff'}</h1>
                    <p className="admin-page__subtitle">
                        {isManager ? 'Bảng điều khiển quản lý và phân ca làm việc.' : 'Bảng điều khiển dành cho nhân viên rửa xe.'}
                    </p>
                </div>
            </div>

            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Phần 1: Monitoring Panel (Chỉ Manager/Admin/Boss) */}
                {isManager && (
                    <section>
                        <h2 className="text-lg font-semibold text-slate-800 mb-3">Hệ thống Auto-Scheduling (Node-Cron)</h2>
                        <TerminalCronMonitor />
                    </section>
                )}

                {/* Phần 2: Bảng nhiệm vụ (cho Staff) */}
                {!isManager && (
                    <div className="admin-content-grid">
                        <div className="admin-card">
                            <div className="admin-card__header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="admin-card__title">Nhiệm vụ theo ngày</h2>
                                <input 
                                    type="date" 
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 transition-colors w-full sm:w-auto"
                                />
                            </div>

                            <div className="p-5 space-y-4">
                                {loading ? (
                                    <p className="text-center text-slate-400 py-4">Đang tải...</p>
                                ) : filteredSchedules.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        <p className="text-slate-500 font-medium">Bạn không có ca làm việc nào trong ngày {selectedDate.split('-').reverse().join('/')}.</p>
                                    </div>
                                ) : (
                                    filteredSchedules.map(schedule => {
                                        const attendance = attendances[schedule._id]
                                        const status = attendance?.status || 'pending'

                                        let statusColor = 'bg-slate-100 text-slate-600'
                                        let statusText = 'Chưa Check-in'
                                        if (status === 'checked_in') { statusColor = 'bg-teal-100 text-teal-700'; statusText = 'Đang làm việc (Đã Check-in)' }
                                        if (status === 'checked_out') { statusColor = 'bg-blue-100 text-blue-700'; statusText = 'Đã Check-out' }
                                        if (status === 'absent') { statusColor = 'bg-red-100 text-red-700'; statusText = 'Vắng mặt' }

                                        return (
                                            <div key={schedule._id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="text-indigo-500" size={20} />
                                                        <h3 className="font-bold text-lg text-slate-800">
                                                            {schedule.start_time} - {schedule.end_time}
                                                        </h3>
                                                    </div>
                                                    <span className={`w-max px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col">
                                                    {(status === 'pending' || status === 'not_checked' || !attendance) && (
                                                        <button
                                                            onClick={() => handleCheckIn(schedule._id)}
                                                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
                                                        >
                                                            <CheckCircle size={16} />
                                                            Check-in
                                                        </button>
                                                    )}
                                                    {status === 'checked_in' && (
                                                        <button
                                                            onClick={() => handleCheckOut(schedule._id)}
                                                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
                                                        >
                                                            <LogOut size={16} />
                                                            Check-out
                                                        </button>
                                                    )}
                                                    {(status === 'checked_out' || status === 'absent') && (
                                                        <button
                                                            disabled
                                                            className="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-semibold rounded-lg cursor-not-allowed"
                                                        >
                                                            Hoàn tất
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>


                    </div>
                )}
            </div>
        </div>
    )
}
