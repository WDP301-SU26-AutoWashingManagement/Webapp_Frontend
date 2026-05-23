import { AxiosError } from 'axios'
import type { ApiErrorPayload } from '../types/api'

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

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

const STATUS_MESSAGES: Record<number, string> = {
  429: 'Vui lòng đợi vài phút rồi thử lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  404: 'Không tìm thấy dữ liệu.',
  500: 'Lỗi máy chủ. Vui lòng thử lại sau.',
}

const GENERIC_SERVER_MESSAGES = new Set([
  'internal server error',
  'request failed with status code 500',
])

export function getApiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra'): string {
  if (error instanceof ApiError) {
    const lower = error.message.toLowerCase()
    if (error.status === 500 && GENERIC_SERVER_MESSAGES.has(lower)) {
      return STATUS_MESSAGES[500]
    }
    return error.message
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status
    const statusFallback = status != null ? STATUS_MESSAGES[status] : undefined
    const fromBody = parseApiError(
      (error.response?.data as ApiErrorPayload | undefined) ?? null,
      statusFallback ?? fallback,
    )

    if (status === 429) {
      return STATUS_MESSAGES[429]
    }

    if (fromBody && fromBody !== 'Request failed with status code 429') {
      return fromBody
    }

    return statusFallback ?? error.message ?? fallback
  }

  return getErrorMessage(error, fallback)
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function getResponseMessage(data: unknown, fallback: string): string {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message
  }
  return fallback
}
