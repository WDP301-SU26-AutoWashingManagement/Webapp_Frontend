import type { ApiResponse } from '../types/api'

/** Extract `data` from backend envelope `{ success, message, data }`. */
export function unwrapApiData<T>(body: unknown): T {
  if (body == null || typeof body !== 'object') {
    throw new Error('Phản hồi API không hợp lệ')
  }

  const record = body as ApiResponse<T> & Record<string, unknown>

  if (record.data != null) {
    return record.data as T
  }

  return body as T
}
