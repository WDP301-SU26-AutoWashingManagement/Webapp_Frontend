export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface WashBooking {
  _id?: string
  id?: string
  customer_id?: string
  vehicle_id: string
  service_package_id?: string
  booking_status: BookingStatus
  scheduled_at: string
  base_price?: number
  discount_amount?: number
  final_price?: number
  vehicle?: { plate_number?: string; brand?: string; vehicle_model?: string }
  service_package?: { name?: string; service_name?: string }
  created_at?: string
}

export interface CreateBookingInput {
  vehicle_id: string
  service_package_id: string
  scheduled_at: string
  promotion_id?: string
  booking_source?: 'web' | 'app' | 'admin'
}

export interface BookingListParams {
  page?: number
  limit?: number
  booking_status?: BookingStatus
}
