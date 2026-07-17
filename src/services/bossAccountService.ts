import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface CreateInternalAccountPayload {
  email: string
  full_name: string
  password?: string
  phone?: string
  role: 'admin' | 'staff'
  branch_id?: string
}

export const bossAccountService = {
  createAccount: async (payload: CreateInternalAccountPayload): Promise<ApiResponse<unknown>> => {
    return apiClient.post('/auth/register', payload)
  },
  getAdmins: async (branchId?: string): Promise<any> => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    const res = await apiClient.get<ApiResponse<any>>(`/admin${query}`);
    return res.data;
  },
  getAdminDetail: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/admin/${id}`);
  },
  updateAdmin: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.patch(`/admin/${id}`, data);
  },
  deleteAdmin: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.delete(`/admin/${id}`);
  },
  getAdminTrash: async (branchId?: string): Promise<any> => {
    const query = branchId ? `?branch_id=${branchId}` : '';
    const res = await apiClient.get<ApiResponse<any>>(`/admin/trash${query}`);
    return res.data;
  },
  restoreAdmin: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.put(`/admin/${id}/restore`, {});
  }
}
