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
    promotion_code: String(raw.promotion_code ?? ''),
    discount_type: raw.discount_type === 'fixed' ? 'fixed' : 'percentage',
    discount_value: Number(raw.discount_value ?? 0),
    bonus_reward_point:
      raw.bonus_reward_point != null ? Number(raw.bonus_reward_point) : undefined,
    start_at: raw.start_at != null ? String(raw.start_at) : undefined,
    end_at: raw.end_at != null ? String(raw.end_at) : undefined,
    auto_notification:
      raw.auto_notification === true || raw.auto_post === true,
    is_active: raw.is_active !== false,
  }
}

/** GET /promotions/validate/:code — public, không cần token. */
export const promotionService = {
  async validateCode(code: string): Promise<ValidatePromotionResult> {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      throw new Error('Vui lòng nhập mã khuyến mãi')
    }

    const body = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      `/promotions/validate/${encodeURIComponent(trimmed)}`,
    )

    const data = unwrapApiData<Record<string, unknown>>(body)

    return {
      promotion: normalizePromotion(data),
      message:
        typeof body === 'object' && body != null && 'message' in body
          ? String((body as ApiResponse).message ?? '')
          : undefined,
    }
  },
}
