import type { BookingStatus } from '../types/booking'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  arrived: 'Xe đã tới',
  checked_in: 'Đã nhận xe',
  in_progress: 'Đang rửa',
  washed: 'Rửa xong',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  arrived: 'bg-blue-50 text-blue-800 ring-blue-200',
  checked_in: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  in_progress: 'bg-violet-50 text-violet-800 ring-violet-200',
  washed: 'bg-teal-50 text-teal-800 ring-teal-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function formatScheduledAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatPrice(amount?: number): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function getBookingPlate(booking: {
  vehicle?: { plate_number?: string }
  vehicle_id?: string
}): string {
  if (booking.vehicle?.plate_number) return booking.vehicle.plate_number
  if (booking.vehicle_id && /^[a-f\d]{24}$/i.test(booking.vehicle_id)) {
    return `Xe #${booking.vehicle_id.slice(-6)}`
  }
  return '—'
}

export function getBookingServiceName(booking: {
  service_package?: { name?: string; service_name?: string }
}): string {
  return (
    booking.service_package?.service_name ??
    booking.service_package?.name ??
    ''
  )
}
