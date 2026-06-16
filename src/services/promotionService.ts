import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'
import type { Promotion, ValidatePromotionResult } from '../types/promotion'
import { normalizeMongoId } from '../utils/mongoId'
import { unwrapApiData } from '../utils/apiResponse'

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

/** GET /promotions/discount — public, không cần token. */
export const promotionService = {
  async validateCode(code: string): Promise<ValidatePromotionResult> {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      throw new Error('Vui lòng nhập mã khuyến mãi')
    }

    // Backend route is POST /promotions/discount
    const body = await apiClient.post<ApiResponse<Record<string, unknown>>>('/promotions/discount', {
      code: trimmed,
    })

    const raw = unwrapApiData<Record<string, unknown>>(body)
    return {
      promotion: normalizePromotion(raw),
      message: 'Áp dụng mã thành công',
    }
  },

  async list(params?: { page?: number; limit?: number }): Promise<Promotion[]> {
    const body = await apiClient.get<ApiResponse<unknown[]>>('/promotions', { params })
    const data = unwrapApiData<unknown[]>(body)
    return Array.isArray(data) ? data.map(i => normalizePromotion(i as Record<string, unknown>)) : []
  },

  async create(payload: import('../types/promotion').CreatePromotionInput): Promise<Promotion> {
    const body = await apiClient.post<ApiResponse<Record<string, unknown>>>('/promotions', payload)
    return normalizePromotion(unwrapApiData<Record<string, unknown>>(body))
  },

  async update(id: string, payload: import('../types/promotion').UpdatePromotionInput): Promise<Promotion> {
    const body = await apiClient.patch<ApiResponse<Record<string, unknown>>>(`/promotions/${id}`, payload)
    return normalizePromotion(unwrapApiData<Record<string, unknown>>(body))
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/promotions/${id}`)
  },
}
