import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface StaffAbsentRequest {
  _id?: string
  id?: string
  staff_id: string
  from_date: string
  to_date: string
  reason: string
  request_status: 'pending' | 'approved' | 'rejected'
  reviewer_note?: string
}

export interface CreateStaffAbsentRequestPayload {
  from_date: string
  to_date: string
  reason: string
}

export const staffManagerService = {
  // Staff tạo đơn xin nghỉ
  async createRequest(payload: CreateStaffAbsentRequestPayload): Promise<StaffAbsentRequest> {
    const response = await apiClient.post<ApiResponse<StaffAbsentRequest>>('/staff-absent', payload)
    return response.data as StaffAbsentRequest
  },

  // Staff xem danh sách đơn của chính mình
  async getMyRequests(): Promise<StaffAbsentRequest[]> {
    const response = await apiClient.get<ApiResponse<StaffAbsentRequest[]>>('/staff-absent/me')
    return response.data as StaffAbsentRequest[]
  },

  // Quản lý xem các đơn đang chờ duyệt
  async getPendingRequests(): Promise<StaffAbsentRequest[]> {
    const response = await apiClient.get<ApiResponse<StaffAbsentRequest[]>>('/staff-absent/pending')
    return response.data as StaffAbsentRequest[]
  },

  // Quản lý phê duyệt hoặc từ chối đơn
  async reviewRequest(requestId: string, status: 'approved' | 'rejected', note?: string): Promise<StaffAbsentRequest> {
    const response = await apiClient.patch<ApiResponse<StaffAbsentRequest>>(`/staff-absent/${requestId}/review`, { status, note })
    return response.data as StaffAbsentRequest
  },

  // Lấy danh sách những nhân viên đang nghỉ phép
  async getStaffOff(from_date?: string, to_date?: string): Promise<StaffAbsentRequest[]> {
    const params: Record<string, string> = {}
    if (from_date) params.from_date = from_date
    if (to_date) params.to_date = to_date
    
    const response = await apiClient.get<ApiResponse<StaffAbsentRequest[]>>('/staff-absent/staff-off', { params })
    return response.data as StaffAbsentRequest[]
  }
}
