import { AxiosError } from 'axios'
import axiosInstance from '../lib/axiosInstance'
import type { ApiErrorPayload } from '../types/api'
import { ApiError, getApiErrorMessage } from '../utils/errors'

type RequestConfig = {
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  async get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.get<T>(endpoint, config)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const config =
        data instanceof FormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : undefined
      const response = await axiosInstance.post<T>(endpoint, data, config)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const config =
        data instanceof FormData
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : undefined
      const response = await axiosInstance.put<T>(endpoint, data, config)
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

  async delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await axiosInstance.delete<T>(endpoint, config)
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  private handleError(error: unknown): never {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const status = axiosError.response?.status
    const message = getApiErrorMessage(error)
    throw new ApiError(message, status, axiosError.response?.data)
  }
}

export default new ApiClient()
