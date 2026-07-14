import apiClient from './apiClient'

export interface AttendanceRecord {
    _id: string
    schedule_id: string
    staff_id: string
    branch_id: string
    status: 'pending' | 'not_checked' | 'checked_in' | 'checked_out' | 'absent'
    check_in_time?: string
    check_out_time?: string
}

export const attendanceService = {
    checkIn: async (scheduleId: string) => {
        const response = await apiClient.post<any>('/attendance/check-in', { schedule_id: scheduleId })
        return response
    },

    checkOut: async (scheduleId: string) => {
        const response = await apiClient.post<any>('/attendance/check-out', { schedule_id: scheduleId })
        return response
    },

    getMyAttendance: async (): Promise<AttendanceRecord[]> => {
        const response = await apiClient.get<any>('/attendance/me')
        return response?.data || []
    },

    getByBranch: async (branchId: string): Promise<any[]> => {
        const response = await apiClient.get<any>(`/attendance/branch/${branchId}`)
        return response?.data || []
    }
}
