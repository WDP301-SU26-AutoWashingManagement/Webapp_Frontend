import React, { useState, useEffect } from 'react'
import { attendanceService } from '../../services/attendanceService'
import { Calendar as CalendarIcon, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export function AttendanceReportTab({ branchId, schedules }: { branchId: string, schedules: any[] }) {
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    // Default to today
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
    })

    useEffect(() => {
        if (branchId) {
            fetchData()
        }
    }, [branchId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await attendanceService.getByBranch(branchId)
            setRecords(data)
        } catch (error) {
            console.error("Failed to fetch attendance records:", error)
        } finally {
            setLoading(false)
        }
    }

    // Lọc ra các ca làm việc của ngày đang chọn
    const getFormattedDate = (d: string | Date) => {
        const date = new Date(d)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const currentDaySchedules = schedules
        .filter(s => getFormattedDate(s.shift_date) === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))

    // Kết hợp dữ liệu (Schedules + Attendance Records)
    const combinedData = currentDaySchedules.map(schedule => {
        // Lọc trùng lặp nhân viên trong cùng một ca (phòng trường hợp Backend lưu trùng)
        const uniqueStaffMap = new Map()
        const rawStaffList = schedule.assigned_staff || []
        
        rawStaffList.forEach((staff: any) => {
            const id = staff._id || staff.user_id?._id || staff
            if (id && !uniqueStaffMap.has(id)) {
                uniqueStaffMap.set(id, staff)
            }
        })
        const assignedStaffList = Array.from(uniqueStaffMap.values())
        
        const mappedRecords = assignedStaffList.map((staff: any) => {
            const staffIdStr = staff._id || staff.user_id?._id || staff
            const staffName = staff.full_name || staff.user_id?.full_name || staff.email || 'Không xác định'
            const staffEmail = staff.email || staff.user_id?.email || ''

            // Tìm record tương ứng trong DB
            const foundRecord = records.find(r => 
                r.schedule_id?._id === schedule._id && 
                r.staff_id?._id === staffIdStr
            )

            if (foundRecord) {
                return {
                    _id: foundRecord._id,
                    name: foundRecord.staff_id?.user_id?.full_name || staffName,
                    email: foundRecord.staff_id?.user_id?.email || staffEmail,
                    check_in_time: foundRecord.check_in_time,
                    check_out_time: foundRecord.check_out_time,
                    status: foundRecord.status
                }
            }

            // Nếu chưa có record (chưa điểm danh và chưa đến hạn chạy cron)
            return {
                _id: `placeholder_${schedule._id}_${staffIdStr}`,
                name: staffName,
                email: staffEmail,
                check_in_time: undefined,
                check_out_time: undefined,
                status: 'not_checked'
            }
        })

        return {
            schedule,
            records: mappedRecords
        }
    })

    // Helper to format time
    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '--:--'
        const d = new Date(timeStr)
        if (isNaN(d.getTime())) return '--:--'
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'checked_in': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={12} /> Check-in</span>
            case 'checked_out': return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={12} /> Check-out</span>
            case 'absent': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={12} /> Vắng mặt</span>
            case 'pending':
            case 'not_checked':
            default: return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={12} /> Chưa điểm danh</span>
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu chấm công...</div>
    }

    return (
        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Filter size={18} className="text-teal-600" />
                    Báo cáo Điểm danh
                </h2>
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <CalendarIcon size={16} /> Lọc theo ngày:
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                </div>
            </div>

            <div className="p-4 bg-slate-50">
                {combinedData.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 italic bg-white rounded-lg border border-slate-200">
                        Không có ca làm việc nào trong ngày {selectedDate.split('-').reverse().join('/')}.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {combinedData.map(group => (
                            <div key={group.schedule._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex items-center gap-2">
                                    <Clock size={18} className="text-indigo-600" />
                                    <h3 className="font-bold text-indigo-900">
                                        Ca làm việc: {group.schedule.start_time} - {group.schedule.end_time}
                                    </h3>
                                    <span className="ml-auto text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                                        {group.records.length} nhân viên
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-500 text-xs uppercase bg-slate-50/50 border-b border-slate-100 flex w-full">
                                                <th className="px-5 py-3 font-semibold w-2/5">Nhân viên</th>
                                                <th className="px-5 py-3 font-semibold w-1/5">Giờ Check-in</th>
                                                <th className="px-5 py-3 font-semibold w-1/5">Giờ Check-out</th>
                                                <th className="px-5 py-3 font-semibold w-1/5">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 flex flex-col w-full">
                                            {group.records.length === 0 ? (
                                                <tr className="flex w-full">
                                                    <td className="px-5 py-4 w-full text-center text-slate-400 italic text-sm">
                                                        Chưa có nhân viên nào được phân công vào ca này
                                                    </td>
                                                </tr>
                                            ) : (
                                                group.records.map(record => (
                                                    <tr key={record._id} className="hover:bg-slate-50 transition-colors flex w-full items-center">
                                                        <td className="px-5 py-3 w-2/5">
                                                            <div className="font-semibold text-slate-800 text-sm">{record.name}</div>
                                                            <div className="text-xs text-slate-500">{record.email}</div>
                                                        </td>
                                                        <td className="px-5 py-3 font-medium text-slate-700 text-sm w-1/5">
                                                            {formatTime(record.check_in_time)}
                                                        </td>
                                                        <td className="px-5 py-3 font-medium text-slate-700 text-sm w-1/5">
                                                            {formatTime(record.check_out_time)}
                                                        </td>
                                                        <td className="px-5 py-3 w-1/5">
                                                            {getStatusBadge(record.status)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
