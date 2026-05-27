import apiClient from './apiClient'
import type {
  CreatePromotionInput,
  Promotion,
  UpdatePromotionInput,
} from '../types/promotion'
import { normalizeMongoId } from '../utils/mongoId'
import type { PaginatedResult } from './adminServicePackageService'

export interface PromotionListParams {
  page?: number
  limit?: number
  is_active?: boolean
  discount_type?: CreatePromotionInput['discount_type']
  search?: string
  start_from?: string
  start_to?: string
  end_from?: string
  end_to?: string
}

interface PromotionListEnvelope {
  success?: boolean
  data?: Record<string, unknown>[]
  pagination?: {
    totalDocs: number
    limit: number
    page: number
    totalPages: number
  }
}

/** Chuyển input type="date" → ISO đầu ngày / cuối ngày (BE yêu cầu end_at > start_at). */
export function promotionDateToIsoRange(startDate: string, endDate: string): {
  start_at: string
  end_at: string
} {
  const start_at = new Date(`${startDate}T00:00:00.000`).toISOString()
  const end_at = new Date(`${endDate}T23:59:59.999`).toISOString()
  return { start_at, end_at }
}

function normalizePromotionObjects(raw: unknown): Promotion['promotion_objects'] {
  if (raw == null || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  return {
    tiers: Array.isArray(o.tiers) ? o.tiers.map(String) : undefined,
    vehicle_types: Array.isArray(o.vehicle_types) ? o.vehicle_types.map(String) : undefined,
    services: Array.isArray(o.services) ? o.services.map(String) : undefined,
  }
}

function normalizePromotion(raw: Record<string, unknown>): Promotion {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    promotion_code: String(raw.promotion_code ?? ''),
    discount_type: raw.discount_type === 'fixed' ? 'fixed' : 'percentage',
    discount_value: Number(raw.discount_value ?? 0),
    promotion_objects: normalizePromotionObjects(raw.promotion_objects),
    bonus_reward_point:
      raw.bonus_reward_point != null ? Number(raw.bonus_reward_point) : undefined,
    auto_notification:
      raw.auto_notification === true || raw.auto_post === true,
    start_at: raw.start_at != null ? String(raw.start_at) : undefined,
    end_at: raw.end_at != null ? String(raw.end_at) : undefined,
    is_active: raw.is_active !== false,
  }
}

function buildCreateBody(data: CreatePromotionInput): Record<string, unknown> {
  const { start_at, end_at } = promotionDateToIsoRange(data.start_at, data.end_at)
  const body: Record<string, unknown> = {
    promotion_code: data.promotion_code.trim().toUpperCase(),
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    start_at,
    end_at,
  }
  if (data.is_active !== undefined) body.is_active = data.is_active
  if (data.auto_post !== undefined) body.auto_post = data.auto_post
  if (data.promotion_objects && Object.keys(data.promotion_objects).length > 0) {
    body.promotion_objects = data.promotion_objects
  }
  return body
}

/** BE từ chối mọi PATCH có `discount_value` — không gửi field đó khi update. */
function buildUpdateBody(data: UpdatePromotionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (data.discount_type !== undefined) body.discount_type = data.discount_type
  if (data.is_active !== undefined) body.is_active = data.is_active
  if (data.auto_post !== undefined) body.auto_post = data.auto_post
  if (data.promotion_objects !== undefined) body.promotion_objects = data.promotion_objects
  if (data.start_at && data.end_at) {
    const range = promotionDateToIsoRange(data.start_at, data.end_at)
    body.start_at = range.start_at
    body.end_at = range.end_at
  }
  return body
}

function unwrapPromotionEntity(body: {
  success?: boolean
  data?: Record<string, unknown>
}): Promotion {
  const raw = body.data
  if (!raw || typeof raw !== 'object') {
    throw new Error('Phản hồi API không hợp lệ')
  }
  return normalizePromotion(raw)
}

function toListQueryParams(
  params: PromotionListParams,
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {}
  if (params.page !== undefined) query.page = params.page
  if (params.limit !== undefined) query.limit = params.limit
  if (params.is_active !== undefined) query.is_active = params.is_active
  if (params.discount_type) query.discount_type = params.discount_type
  if (params.search) query.search = params.search
  if (params.start_from) query.start_from = params.start_from
  if (params.start_to) query.start_to = params.start_to
  if (params.end_from) query.end_from = params.end_from
  if (params.end_to) query.end_to = params.end_to
  return query
}

export const adminPromotionService = {
  async list(params: PromotionListParams = {}): Promise<PaginatedResult<Promotion>> {
    const body = await apiClient.get<PromotionListEnvelope>('/promotions', {
      params: toListQueryParams(params),
    })
    const docs = Array.isArray(body.data) ? body.data : []
    const items = docs.map(normalizePromotion)

    const pagination = body.pagination
    const total = pagination?.totalDocs ?? items.length
    const page = pagination?.page ?? params.page ?? 1
    const limit = pagination?.limit ?? params.limit ?? 10
    const totalPages = pagination?.totalPages ?? (Math.ceil(total / limit) || 1)

    return { items, total, page, limit, totalPages }
  },

  async create(data: CreatePromotionInput): Promise<Promotion> {
    const body = await apiClient.post<{
      success?: boolean
      data?: Record<string, unknown>
    }>('/promotions', buildCreateBody(data))
    return unwrapPromotionEntity(body)
  },

  async update(id: string, data: UpdatePromotionInput): Promise<Promotion> {
    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/promotions/${id}`, buildUpdateBody(data))
    return unwrapPromotionEntity(body)
  },

  async toggleActive(id: string, is_active: boolean): Promise<Promotion> {
    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/promotions/${id}/toggle-active`, { is_active })
    return unwrapPromotionEntity(body)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/promotions/${id}`)
  },
}
