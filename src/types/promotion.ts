export type PromotionType = 'discount' | 'bonus_service'

export interface Promotion {
  _id?: string
  id?: string
  boss_id?: string
  promotion_name: string
  description: string
  code: string
  type: PromotionType
  service_ids: string[]
  discount_percentage: number
  discount_amount: number
  min_order_amount: number
  start_date: string
  end_date: string
  is_active: boolean
}

export interface CreatePromotionInput {
  promotion_name: string
  description: string
  code: string
  type: PromotionType
  service_ids?: string[]
  discount_percentage?: number
  discount_amount?: number
  min_order_amount: number
  start_date: string
  end_date: string
  is_active: boolean
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>

export interface ValidatePromotionResult {
  promotion: Promotion
  message?: string
}
