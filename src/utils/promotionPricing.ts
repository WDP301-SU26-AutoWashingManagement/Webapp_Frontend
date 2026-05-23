import type { Promotion } from '../types/promotion'

/** Mirrors Backend `MAX_PRICE_DISCOUNT_PERCENTAGE`. */
export const MAX_PRICE_DISCOUNT_PERCENTAGE = 50

export interface PriceEstimate {
  basePrice: number
  discount: number
  finalPrice: number
}

export function computePromotionDiscount(
  basePrice: number,
  promotion: Pick<Promotion, 'discount_type' | 'discount_value'>,
): number {
  if (basePrice <= 0) return 0

  const raw =
    promotion.discount_type === 'percentage'
      ? basePrice * (promotion.discount_value / 100)
      : promotion.discount_value

  const maxDiscount = basePrice * (MAX_PRICE_DISCOUNT_PERCENTAGE / 100)
  return Math.min(Math.max(0, raw), maxDiscount)
}

export function estimateBookingPrice(
  basePrice: number,
  promotion?: Pick<Promotion, 'discount_type' | 'discount_value'> | null,
): PriceEstimate {
  const discount = promotion ? computePromotionDiscount(basePrice, promotion) : 0
  return {
    basePrice,
    discount,
    finalPrice: Math.max(0, basePrice - discount),
  }
}

export function formatPromotionLabel(
  promotion: Pick<Promotion, 'promotion_code' | 'discount_type' | 'discount_value'>,
): string {
  if (promotion.discount_type === 'percentage') {
    return `${promotion.promotion_code} (−${promotion.discount_value}%)`
  }
  return `${promotion.promotion_code} (−${new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(promotion.discount_value)})`
}
