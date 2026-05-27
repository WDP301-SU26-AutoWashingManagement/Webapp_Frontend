export type PromotionDiscountType = 'percentage' | 'fixed'

export interface PromotionObjects {
  tiers?: string[]
  vehicle_types?: string[]
  services?: string[]
}

export interface Promotion {
  _id?: string
  id?: string
  promotion_code: string
  discount_type: PromotionDiscountType
  discount_value: number
  promotion_objects?: PromotionObjects
  bonus_reward_point?: number
  auto_notification?: boolean
  start_at?: string
  end_at?: string
  is_active?: boolean
}

export interface CreatePromotionInput {
  promotion_code: string
  discount_type: PromotionDiscountType
  discount_value: number
  start_at: string
  end_at: string
  is_active?: boolean
  /** Khớp Joi BE: `auto_post` */
  auto_post?: boolean
  promotion_objects?: PromotionObjects
}

export type UpdatePromotionInput = {
  discount_type?: PromotionDiscountType
  start_at?: string
  end_at?: string
  is_active?: boolean
  auto_post?: boolean
  promotion_objects?: PromotionObjects
}

export interface ValidatePromotionResult {
  promotion: Promotion
  message?: string
}
