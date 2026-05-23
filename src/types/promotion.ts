export type PromotionDiscountType = 'percentage' | 'fixed'

export interface Promotion {
  _id?: string
  id?: string
  promotion_code: string
  discount_type: PromotionDiscountType
  discount_value: number
  bonus_reward_point?: number
  start_at?: string
  end_at?: string
  is_active?: boolean
}

export interface ValidatePromotionResult {
  promotion: Promotion
  message?: string
}
