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
  },

  getStaffDetail: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/staff/${id}`)
  },

  updateStaff: async (id: string, payload: any): Promise<ApiResponse<any>> => {
    return apiClient.put(`/staff/${id}`, payload)
  },

  deleteStaff: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.delete(`/staff/${id}`)
  },

  getStaffTrash: async (params?: any): Promise<ApiResponse<any>> => {
    return apiClient.get('/staff/trash', { params })
  },

  restoreStaff: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.put(`/staff/${id}/restore`, {})
  }
}
