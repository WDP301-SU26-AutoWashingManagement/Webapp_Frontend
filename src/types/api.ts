export interface ApiErrorPayload {
  message?: string | string[]
  errors?: Record<string, string[]>
}

export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
}
