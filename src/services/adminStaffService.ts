import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface CreateStaffPayload {
  email: string
  full_name: string
  password?: string
  phone?: string
  role: 'staff'
  staff_type: 'technical' | 'manager'
  branch_id?: string
}

export const adminStaffService = {
  createStaff: async (payload: CreateStaffPayload): Promise<ApiResponse<unknown>> => {
    return apiClient.post('/auth/register', payload)
  },
  
  getStaffList: async (params?: any): Promise<ApiResponse<any>> => {
    return apiClient.get('/staff', { params })
  }
}
