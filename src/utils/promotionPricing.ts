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
  promotion: Pick<Promotion, 'type' | 'discount_percentage' | 'discount_amount' | 'min_order_amount'>,
): number {
  if (basePrice <= 0) return 0
  if (basePrice < (promotion.min_order_amount || 0)) return 0

  if (promotion.type === 'bonus_service') return 0

  const raw = basePrice * ((promotion.discount_percentage || 0) / 100)
  const maxDiscount = promotion.discount_amount || Infinity

  return Math.min(raw, maxDiscount)
}

export function estimateBookingPrice(
  basePrice: number,
  promotion?: Pick<Promotion, 'type' | 'discount_percentage' | 'discount_amount' | 'min_order_amount'> | null,
  tierDiscountPercentage: number = 0
): PriceEstimate {
  const tierDiscount = Math.round(basePrice * (tierDiscountPercentage / 100));
  const priceAfterTier = Math.max(0, basePrice - tierDiscount);

  const promoDiscount = promotion ? computePromotionDiscount(priceAfterTier, promotion) : 0;
  return {
    basePrice,
    discount: tierDiscount + promoDiscount,
    finalPrice: Math.max(0, priceAfterTier - promoDiscount),
  }
}

export function formatPromotionLabel(
  promotion: Pick<Promotion, 'code' | 'type' | 'discount_percentage' | 'discount_amount'>,
): string {
  if (promotion.type === 'bonus_service') {
    return `${promotion.code} (Tặng thêm dịch vụ)`
  }
  return `${promotion.code} (−${promotion.discount_percentage}%, tối đa ${new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(promotion.discount_amount)})`
}
