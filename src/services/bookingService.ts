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

export interface AvailableSlot {
  scheduled_at: string
  available_bays: number
}

async function resolveTiersForBookings(items: WashBooking[]): Promise<void> {
  // Cache locally to avoid repeated requests
  if (!(window as any).__tierCache) (window as any).__tierCache = new Map();
  const tierMap: Map<string, any> = (window as any).__tierCache;

  try {
    const needsTier = items.some(b => b.customer?.tier_id?._id && b.customer.tier_id.discount_percentage === undefined && !tierMap.has(b.customer.tier_id._id));
    if (needsTier) {
      // Staff không có quyền gọi /tiers, nhưng có quyền gọi /customers.
      // API /customers có populate sẵn tier_id nên ta có thể 'mượn' để trích xuất danh sách các hạng.
      const customersBody = await apiClient.get<any>('/customers', { params: { limit: 50 } });
      const customersData = Array.isArray(customersBody.data) ? customersBody.data : [];

      customersData.forEach((c: any) => {
        if (c.tier_id && typeof c.tier_id === 'object' && c.tier_id._id) {
          tierMap.set(String(c.tier_id._id), c.tier_id);
        }
      });

      // Nếu vẫn còn thiếu tier nào, fetch đích danh customer đó (trường hợp hiếm)
      for (const b of items) {
        if (b.customer?.tier_id?._id && !tierMap.has(b.customer.tier_id._id) && b.customer_id) {
          try {
            const singleCustomer = await apiClient.get<any>(`/customers/${b.customer_id}`);
            const cData = singleCustomer.data || singleCustomer;
            if (cData?.tier_id && typeof cData.tier_id === 'object' && cData.tier_id._id) {
              tierMap.set(String(cData.tier_id._id), cData.tier_id);
            }
          } catch (err) { }
        }
      }
    }

    // Apply tiers
    items.forEach(b => {
      if (b.customer?.tier_id?._id && b.customer.tier_id.discount_percentage === undefined) {
        const matched = tierMap.get(b.customer.tier_id._id);
        if (matched && b.customer.tier_id) {
          b.customer.tier_id.discount_percentage = Number(matched.discount_percentage || 0);
          b.customer.tier_id.tier_name = String(matched.tier_name || '');
        }
      }
    });
  } catch (e) {
    console.error('Lỗi khi lấy tiers qua customers:', e);
  }
}

/** Customer bookings — GET/POST /bookings (authenticate) */
export const bookingService = {
  async list(params?: BookingListParams): Promise<BookingListResult> {
    const page = params?.page ?? 1
    const limit = params?.limit ?? 50
    const status = params?.booking_status ?? ''
    const cacheKey = `bookings:list:${page}:${limit}:${status}:${params?.from_date || ''}:${params?.to_date || ''}:${params?.time_slot || ''}`

    return dedupeRequest(cacheKey, async () => {
      const body = (await apiClient.get<PaginatedEnvelope>('/bookings', {
        params: {
          page,
          limit,
          ...(params?.booking_status ? { booking_status: params.booking_status } : {}),
          ...(params?.from_date ? { from_date: params.from_date } : {}),
          ...(params?.to_date ? { to_date: params.to_date } : {}),
          ...(params?.time_slot ? { time_slot: params.time_slot } : {}),
        },
      })) as PaginatedEnvelope

      const raw = unwrapApiData<unknown[]>(body)
      const items = Array.isArray(raw) ? normalizeWashBookingList(raw) : []

      await resolveTiersForBookings(items);

      return {
        items,
        total: body.pagination?.totalDocs,
        page: body.pagination?.page,
        limit: body.pagination?.limit,
      }
    })
  },

  async getWashingBooking(params?: BookingListParams): Promise<BookingListResult> {
    const body = await apiClient.get<PaginatedEnvelope>(`/bookings/washing-bookings`,
      {
        params: {
          ...(params?.from_date ? { from_date: params.from_date } : {}),
          ...(params?.to_date ? { to_date: params.to_date } : {}),
        }
      }
    );

    const raw = unwrapApiData<unknown[]>(body)
    const items = Array.isArray(raw) ? normalizeWashBookingList(raw) : []

    return {
      items,
      total: body.pagination?.totalDocs,
      page: body.pagination?.page,
      limit: body.pagination?.limit,
    };
  },

  async getAvailableSlots(branchId: string, date: string): Promise<AvailableSlot[]> {
    const body = await apiClient.get<ApiResponse<AvailableSlot[]>>(`/bookings/branches/${branchId}/available-slots`, {
      params: { date }
    });
    // @ts-ignore
    return (body.data ?? body) as AvailableSlot[];
  },

  async getRecommendation(vehicleId: string, branchId?: string): Promise<import('../types/booking').IBookingRecommendation> {
    const params: Record<string, string> = { vehicle_id: vehicleId }
    if (branchId) params.branch_id = branchId

    const body = await apiClient.get<ApiResponse<import('../types/booking').IBookingRecommendation>>('/bookings/recommendation', { params })
    return unwrapApiData<import('../types/booking').IBookingRecommendation>(body)
  },

  async clearRecommendationCache(vehicleId: string, branchId?: string): Promise<void> {
    const params: Record<string, string> = { vehicle_id: vehicleId }
    if (branchId) params.branch_id = branchId

    await apiClient.delete('/bookings/recommendation/cache', { params })
  },

  async getById(id: string): Promise<WashBooking> {
    const body = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/bookings/${id}`)
    const rawData = unwrapApiData<Record<string, unknown>>(body)

    // Backend getBookingById returns { appointment, services } instead of a flat object
    const flatData = rawData.appointment
      ? { ...(rawData.appointment as Record<string, unknown>), services: rawData.services }
      : rawData

    const booking = normalizeWashBooking(flatData)

    await resolveTiersForBookings([booking]);

    return booking;
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

  async washed(id: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${id}/washed`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async complete(id: string): Promise<WashBooking> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${id}/complete`)
    return normalizeWashBooking(unwrapApiData<Record<string, unknown>>(body))
  },

  async checkinWithCamera(file: File): Promise<{
    success: boolean
    message: string
    appointment_id?: string
    license_plate?: string
  }> {
    const formData = new FormData()
    formData.append('file', file)
    const body = await apiClient.post<any>('/checkin/camera', formData)
    return body
  },

  async activateWaterPump(plate: string): Promise<any> {
    const body = await apiClient.post<any>('/wash/manual', { plate })
    return body
  },

  async toggleService(bookingId: string, itemId: string): Promise<any> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/bookings/${bookingId}/items/${itemId}/toggle`);
    return body;
  },
}
