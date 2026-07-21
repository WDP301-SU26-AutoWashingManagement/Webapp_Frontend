export interface ApiErrorPayload {
  message?: string | string[]
  errors?: Record<string, string[]>
}

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
}

export interface PaginatedResponse<T = unknown> {
  items: T[]
  total: number
  page?: number
  limit?: number
  totalPages?: number
}
