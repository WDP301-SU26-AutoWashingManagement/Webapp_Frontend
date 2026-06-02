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
  }
}
