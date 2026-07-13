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
  type?: CreatePromotionInput['type']
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

function normalizePromotion(raw: Record<string, unknown>): Promotion {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    boss_id: normalizeMongoId(raw.boss_id) || undefined,
    promotion_name: String(raw.promotion_name ?? ''),
    description: String(raw.description ?? ''),
    code: String(raw.code ?? ''),
    type: raw.type === 'bonus_service' ? 'bonus_service' : 'discount',
    service_ids: Array.isArray(raw.service_ids) ? raw.service_ids.map(s => normalizeMongoId(s)).filter(Boolean) as string[] : [],
    discount_percentage: Number(raw.discount_percentage ?? 0),
    discount_amount: Number(raw.discount_amount ?? 0),
    min_order_amount: Number(raw.min_order_amount ?? 0),
    start_date: raw.start_date != null ? String(raw.start_date) : new Date().toISOString(),
    end_date: raw.end_date != null ? String(raw.end_date) : new Date().toISOString(),
    is_active: raw.is_active !== false,
  }
}

function buildCreateBody(data: CreatePromotionInput): Record<string, unknown> {
  const { start_at, end_at } = promotionDateToIsoRange(data.start_date, data.end_date)
  const body: Record<string, unknown> = {
    promotion_name: data.promotion_name,
    description: data.description,
    code: data.code.trim().toUpperCase(),
    type: data.type,
    min_order_amount: data.min_order_amount,
    start_date: start_at,
    end_date: end_at,
    is_active: data.is_active,
    service_ids: data.type === 'bonus_service' ? data.service_ids : undefined,
    discount_percentage: data.type === 'discount' ? (data.discount_percentage ?? 0) : undefined,
    discount_amount: data.type === 'discount' ? (data.discount_amount ?? 0) : undefined,
  }
  return body
}

function buildUpdateBody(data: UpdatePromotionInput): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (data.promotion_name !== undefined) body.promotion_name = data.promotion_name
  if (data.description !== undefined) body.description = data.description
  if (data.code !== undefined) body.code = data.code.trim().toUpperCase()
  if (data.type !== undefined) {
    body.type = data.type
    if (data.type === 'bonus_service') {
      body.service_ids = data.service_ids
    }
  }
  if (data.min_order_amount !== undefined) body.min_order_amount = data.min_order_amount
  if (data.is_active !== undefined) body.is_active = data.is_active
  if (data.service_ids !== undefined) body.service_ids = data.service_ids
  if (data.discount_percentage !== undefined) body.discount_percentage = data.discount_percentage
  if (data.discount_amount !== undefined) body.discount_amount = data.discount_amount
  
  if (data.start_date && data.end_date) {
    const range = promotionDateToIsoRange(data.start_date, data.end_date)
    body.start_date = range.start_at
    body.end_date = range.end_at
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
  if (params.type) query.type = params.type
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
    }>(`/promotions/${id}`, { is_active })
    return unwrapPromotionEntity(body)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/promotions/${id}`)
  },
}
