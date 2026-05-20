import { AxiosError } from 'axios'
import axiosInstance from '../lib/axiosInstance'
import { getAccessToken, setTokens, clearSession } from '../lib/authSession'
import type { ApiErrorPayload } from '../types/api'

export function parseApiError(payload: ApiErrorPayload | null, fallback = 'Có lỗi xảy ra'): string {
  if (!payload) return fallback
  const { message, errors } = payload
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  if (errors && typeof errors === 'object') {
    const details = Object.values(errors).flat().filter(Boolean)
    if (details.length) return details.join(', ')
  }
  return fallback
}

class ApiClient {
  getToken(): string | null {
    return getAccessToken()
  }

  setToken(token: string | null): void {
    if (token) {
      setTokens(token)
    } else {
      clearSession()
    }
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    try {
      const response = await axiosInstance.get<T>(endpoint)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await axiosInstance.post<T>(endpoint, data)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await axiosInstance.put<T>(endpoint, data)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const response = await axiosInstance.patch<T>(endpoint, data)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    try {
      const response = await axiosInstance.delete<T>(endpoint)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  private handleError(error: unknown): never {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const errorMessage = parseApiError(
      axiosError.response?.data || null,
      axiosError.message || 'Có lỗi xảy ra',
    )
    throw new Error(errorMessage)
  }
}

export default new ApiClient()
