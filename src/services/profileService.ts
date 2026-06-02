import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'

export interface ProfileData {
  _id?: string
  id?: string
  email: string
  full_name: string
  phone?: string | null
  avatar_url?: string | null
  is_active?: boolean
  auth_provider?: 'google' | 'local' | string
  role_data?: Record<string, unknown> | null
}

export interface UpdateProfilePayload {
  full_name?: string
  phone?: string
  avatar?: File
}

export const profileService = {
  async getProfile(): Promise<ProfileData> {
    const response = await apiClient.get<ApiResponse<ProfileData>>('/profile')
    return response.data as ProfileData
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileData> {
    const { avatar, ...fields } = payload
    let requestBody: FormData | Record<string, unknown>

    if (avatar) {
      const form = new FormData()
      if (fields.full_name !== undefined) form.append('full_name', fields.full_name)
      if (fields.phone !== undefined) form.append('phone', fields.phone)
      form.append('avatar', avatar)
      requestBody = form
    } else {
      requestBody = { ...fields }
    }

    const response = await apiClient.put<ApiResponse<ProfileData>>('/profile', requestBody)
    return response.data as ProfileData
  },

  async changePassword(input: Record<string, string>): Promise<string> {
    const response = await apiClient.patch<ApiResponse<{ message?: string }>>('/profile/password', input)
    return response.message ?? 'Đổi mật khẩu thành công'
  },
}
