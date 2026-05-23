import type { BookingStatus, WashBooking } from '../types/booking'
import { normalizeMongoId } from './mongoId'

const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
]

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && BOOKING_STATUSES.includes(value as BookingStatus)
}

/** Chuẩn hóa booking từ API (vehicle_id / service_package_id có thể là object sau populate). */
export function normalizeWashBooking(raw: Record<string, unknown>): WashBooking {
  const vehicleRef = raw.vehicle_id
  let vehicle_id = ''
  let vehicle: WashBooking['vehicle']

  if (vehicleRef != null && typeof vehicleRef === 'object') {
    const v = vehicleRef as Record<string, unknown>
    vehicle_id = normalizeMongoId(v)
    vehicle = {
      plate_number: v.plate_number != null ? String(v.plate_number) : undefined,
      brand: v.brand != null ? String(v.brand) : undefined,
      vehicle_model:
        v.vehicle_model != null
          ? String(v.vehicle_model)
          : v.model != null
            ? String(v.model)
            : undefined,
    }
  } else {
    vehicle_id = normalizeMongoId(vehicleRef)
  }

  const pkgRef = raw.service_package_id
  let service_package_id = ''
  let service_package: WashBooking['service_package']

  if (pkgRef != null && typeof pkgRef === 'object') {
    const p = pkgRef as Record<string, unknown>
    service_package_id = normalizeMongoId(p)
    const name =
      p.service_name != null
        ? String(p.service_name)
        : p.package_name != null
          ? String(p.package_name)
          : p.name != null
            ? String(p.name)
            : undefined
    service_package = name ? { name, service_name: name } : undefined
  } else {
    service_package_id = normalizeMongoId(pkgRef)
  }

  const status = raw.booking_status
  const booking_status: BookingStatus = isBookingStatus(status) ? status : 'pending'

  return {
    _id: normalizeMongoId(raw._id) || undefined,
    id: normalizeMongoId(raw.id) || undefined,
    customer_id: normalizeMongoId(raw.customer_id) || undefined,
    vehicle_id,
    service_package_id: service_package_id || undefined,
    booking_status,
    scheduled_at: String(raw.scheduled_at ?? ''),
    base_price: typeof raw.base_price === 'number' ? raw.base_price : undefined,
    discount_amount: typeof raw.discount_amount === 'number' ? raw.discount_amount : undefined,
    final_price: typeof raw.final_price === 'number' ? raw.final_price : undefined,
    vehicle,
    service_package,
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
  }
}

export function normalizeWashBookingList(items: unknown[]): WashBooking[] {
  return items
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => normalizeWashBooking(item))
}
