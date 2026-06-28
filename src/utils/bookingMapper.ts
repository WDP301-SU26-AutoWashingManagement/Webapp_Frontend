import type { BookingStatus, WashBooking } from '../types/booking'
import { normalizeMongoId } from './mongoId'

const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'washed',
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
      plate_number: v.plate_number != null ? String(v.plate_number) : v.license_plate != null ? String(v.license_plate) : undefined,
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

  const custRef = raw.customer_id
  let customer_id = ''
  let customer: WashBooking['customer']

  if (custRef != null && typeof custRef === 'object') {
    const c = custRef as Record<string, unknown>
    customer_id = normalizeMongoId(c)
    
    let uName: string | undefined;
    let uPhone: string | undefined;
    
    if (c.user_id != null && typeof c.user_id === 'object') {
      const u = c.user_id as Record<string, unknown>;
      uName = u.full_name != null ? String(u.full_name) : u.fullname != null ? String(u.fullname) : undefined;
      uPhone = u.phone != null ? String(u.phone) : u.phone_number != null ? String(u.phone_number) : undefined;
    }
    
    let tier_id: { _id?: string; discount_percentage?: number; tier_name?: string } | undefined;
    if (c.tier_id != null) {
      if (typeof c.tier_id === 'object') {
        const t = c.tier_id as Record<string, unknown>;
        tier_id = {
          _id: typeof t._id === 'string' ? t._id : undefined,
          discount_percentage: typeof t.discount_percentage === 'number' ? t.discount_percentage : undefined,
          tier_name: typeof t.tier_name === 'string' ? t.tier_name : undefined,
        };
      } else if (typeof c.tier_id === 'string') {
        tier_id = { _id: c.tier_id };
      }
    }
    
    customer = {
      full_name: uName ?? (c.full_name != null ? String(c.full_name) : c.fullname != null ? String(c.fullname) : undefined),
      phone_number: uPhone ?? (c.phone_number != null ? String(c.phone_number) : c.phone != null ? String(c.phone) : undefined),
      tier_id,
    }
  } else {
    customer_id = normalizeMongoId(custRef)
  }

  const status = raw.booking_status
  const booking_status: BookingStatus = isBookingStatus(status) ? status : 'pending'

  return {
    _id: normalizeMongoId(raw._id) || undefined,
    id: normalizeMongoId(raw.id) || undefined,
    customer_id: customer_id || undefined,
    vehicle_id,
    service_package_id: service_package_id || undefined,
    booking_status,
    scheduled_at: String(raw.scheduled_at ?? ''),
    base_price: typeof raw.base_price === 'number' ? raw.base_price : undefined,
    discount_amount: typeof raw.discount_amount === 'number' ? raw.discount_amount : undefined,
    final_price: typeof raw.final_price === 'number' ? raw.final_price : undefined,
    vehicle,
    service_package,
    customer,
    branch_id: raw.branch_id,
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    services: Array.isArray(raw.services) ? (raw.services as any[]) : undefined,
  }
}

export function normalizeWashBookingList(items: unknown[]): WashBooking[] {
  return items
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map((item) => normalizeWashBooking(item))
}
