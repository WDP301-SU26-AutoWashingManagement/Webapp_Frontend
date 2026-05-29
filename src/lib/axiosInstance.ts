import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '../config/env'
import type { ApiErrorPayload } from '../types/api'
import {
  clearSession,
  getAccessToken,
  isAuthPublicRequest,
  redirectToLogin,
  refreshAccessToken,
} from './authSession'

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processRefreshQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error ?? new Error('Phiên đăng nhập đã hết hạn'))
    } else {
      resolve(token)
    }
  })
  refreshQueue = []
}

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return false
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now() + 10000
  } catch {
    return false
  }
}

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    let token = getAccessToken()
    const requestUrl = config.url ?? ''

    if (!isAuthPublicRequest(requestUrl) && token && isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const newToken = await refreshAccessToken()
          if (!newToken) throw new Error('Không thể làm mới phiên đăng nhập')
          processRefreshQueue(null, newToken)
          token = newToken
        } catch (error) {
          processRefreshQueue(error, null)
          clearSession()
          redirectToLogin(window.location.pathname)
          return Promise.reject(error)
        } finally {
          isRefreshing = false
          refreshQueue = []
        }
      } else {
        try {
          token = await new Promise<string>((resolve, reject) => {
            refreshQueue.push({ resolve, reject })
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as RetryConfig | undefined
    const status = error.response?.status

    if (status === 403) {
      return Promise.reject(error)
    }

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url ?? ''
    if (isAuthPublicRequest(requestUrl)) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return axiosInstance(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      if (!newToken) {
        throw new Error('Không thể làm mới phiên đăng nhập')
      }

      processRefreshQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processRefreshQueue(refreshError, null)
      clearSession()
      redirectToLogin(window.location.pathname)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
      refreshQueue = []
    }
  },
)

export default axiosInstance