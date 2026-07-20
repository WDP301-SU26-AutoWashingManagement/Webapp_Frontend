export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'checked_in'
  | 'in_progress'
  | 'washed'
  | 'completed'
  | 'cancelled'

export interface WashBooking {
  _id?: string
  id?: string
  appointment_code?: string
  customer_id?: string
  vehicle_id: string
  service_package_id?: string
  booking_status: BookingStatus
  scheduled_at: string
  base_price?: number
  discount_amount?: number
  applied_tier_discount?: number
  applied_promotion_discount?: number
  final_price?: number
  payment_method?: string
  vehicle?: { plate_number?: string; brand?: string; vehicle_model?: string }
  service_package?: { name?: string; service_name?: string }
  customer?: { full_name?: string; phone_number?: string; tier_id?: { _id?: string; discount_percentage?: number; tier_name?: string } }
  created_at?: string
  branch_id?: any
  services?: Array<{
    _id: string
    service_id: {
      _id: string
      service_name: string
      service_price: number
      is_automated?: boolean
    }
    service_package_id?: {
      _id: string
      package_name: string
    } | null
    price_snapshot: number
    is_completed?: boolean
  }>
}

export interface CreateBookingInput {
  branch_id: string
  vehicle_id: string
  scheduled_at: string
  services: Array<{
    service_id: string
    service_package_id?: string
  }>
  promotion_id?: string
  booking_source?: 'web' | 'app' | 'admin'
  vat_requested?: boolean
  tax_code?: string
  payment_method?: string
}

export interface BookingListParams {
  page?: number
  limit?: number
  booking_status?: BookingStatus | string
  from_date?: string
  to_date?: string
  time_slot?: string
}

export interface WashingBookingParams {
  from_date?: string
  to_date?: string
}

export interface IRecommendedItem {
  service_id: string;
  service_package_id: string | null;
  name: string;
  price: number;
  duration_minutes: number;
}

export interface IApplicablePromotion {
  id: string;
  promotion_name: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  discount_percentage?: number;
  discount_amount?: number;
  min_order_amount?: number;
}

export interface ISuggestedCombo {
  package_id: string;
  package_name: string;
  discount_percentage: number;
  matched_service_ids: string[];
  original_price: number;
  discounted_price: number;
}

export interface IBookingRecommendation {
  vehicle_id: string;
  branch_id: string | null;
  recommended_items: IRecommendedItem[];
  reason: string;
  applicable_promotion_id: string | null;
  applicable_promotion: IApplicablePromotion | null;
  suggested_combo?: ISuggestedCombo | null;
  estimated_total: number;
  suggested_scheduled_at: string | null;
  source: 'ai' | 'fallback' | 'algorithm';
  generated_at: string;
}
