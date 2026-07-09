import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface Branch {
  _id?: string
  id?: string
  branch_address?: {
    street: string
    ward: string
    district: string
    city: string
  }
  branch_phone?: string
  operating_time?: {
    default_open: string
    default_close: string
    weekend_open?: string
    weekend_close?: string
  }
  is_active?: boolean
  bay_counts?: number
  geo?: {
    latitude: number
    longitude: number
  }
}

export type CreateBranchPayload = Omit<Branch, '_id' | 'id'>
export type UpdateBranchPayload = Partial<CreateBranchPayload>

export const branchService = {
  async list(): Promise<Branch[]> {
    const response = await apiClient.get<ApiResponse<Branch[]>>('/branches')
    return response.data as Branch[]
  },

  async create(payload: CreateBranchPayload): Promise<Branch> {
    const response = await apiClient.post<ApiResponse<Branch>>('/branches', payload)
    return response.data as Branch
  },

  async update(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const response = await apiClient.patch<ApiResponse<Branch>>(`/branches/${id}`, payload)
    return response.data as Branch
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/branches/${id}`)
  },

  async toggleActive(id: string): Promise<Branch> {
    const response = await apiClient.patch<ApiResponse<Branch>>(`/branches/${id}/activate`)
    return response.data as Branch
  },

  async getPublicStats(): Promise<{ customers: number; bookings: number; branches: number }> {
    const response = await apiClient.get<ApiResponse<{ customers: number; bookings: number; branches: number }>>('/branches/public-stats')
    return response.data as { customers: number; bookings: number; branches: number }
  }
}
