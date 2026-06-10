import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'
import type {
  BookingListParams,
  CreateBookingInput,
  WashBooking,
} from '../types/booking'
import { normalizeWashBooking, normalizeWashBookingList } from '../utils/bookingMapper'
import { dedupeRequest } from '../utils/dedupeRequest'
import { unwrapApiData } from '../utils/apiResponse'

export interface BookingListResult {
  items: WashBooking[]
  total?: number
  page?: number
  limit?: number
}

type PaginatedEnvelope = ApiResponse<unknown[]> & {
  pagination?: {
    totalDocs?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

/** Customer bookings — GET/POST /bookings (authenticate) */
export const bookingService = {
  async list(params?: BookingListParams): Promise<BookingListResult> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 50
    const status = params?.booking_status ?? ''

    return dedupeRequest(`bookings:list:${page}:${limit}:${status}`, async () => {
      const body = (await apiClient.get<PaginatedEnvelope>('/bookings', {
        params: {
          page,
          limit,
          ...(params?.booking_status ? { booking_status: params.booking_status } : {}),
        },
      })) as PaginatedEnvelope

      const raw = unwrapApiData<unknown[]>(body)
      const items = Array.isArray(raw) ? normalizeWashBookingList(raw) : []

      return {
        items,
        total: body.pagination?.totalDocs,
        page: body.pagination?.page,
        limit: body.pagination?.limit,
      }
    })
  },

  async getById(id: string): Promise<WashBooking> {
    const body = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/bookings/${id}`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async create(payload: CreateBookingInput): Promise<WashBooking> {
    const body = await apiClient.post<ApiResponse<Record<string, unknown>>>('/bookings', {
      branch_id: payload.branch_id,
      vehicle_id: payload.vehicle_id,
      scheduled_at: payload.scheduled_at,
      services: payload.services,
      booking_source: payload.booking_source ?? 'web',
      ...(payload.promotion_id ? { promotion_id: payload.promotion_id } : {}),
    })
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async cancel(id: string, reason: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      `/bookings/${id}/cancel`,
      { cancellation_reason: reason },
    )
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async confirm(id: string, staff_id?: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(
      `/bookings/${id}/confirm`,
      staff_id ? { staff_id } : {},
    )
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async assignStaff(id: string, staff_id: string): Promise<WashBooking> {
    const body = await apiClient.post<ApiResponse<Record<string, unknown>>>(
      `/bookings/${id}/assign-staff`,
      { staff_id },
    )
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async checkin(id: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${id}/checkin`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async start(id: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${id}/start`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async complete(id: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${id}/complete`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },
}
