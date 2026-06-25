/** Mirrors Backend `src/common/constants` + `booking-window.middleware` rules. */
export const BUSINESS_HOURS = { open: 7, close: 19 } as const
export const MIN_ADVANCE_MINUTES = 60
export const SLOT_DURATION_MINUTES = 30
export const DEFAULT_BOOKING_WINDOW_DAYS = 1

const MS_PER_MINUTE = 60_000

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** `datetime-local` value: YYYY-MM-DDTHH:mm (local time). */
export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function parseDatetimeLocalValue(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Round up to the next slot boundary (30 minutes). */
export function roundUpToSlot(date: Date, slotMinutes = SLOT_DURATION_MINUTES): Date {
  const slotMs = slotMinutes * MS_PER_MINUTE
  return new Date(Math.ceil(date.getTime() / slotMs) * slotMs)
}

/** Snap minutes to :00 or :30 (round up). */
export function snapMinutesToSlot(date: Date): Date {
  const d = new Date(date)
  const minutes = d.getMinutes()
  if (minutes === 0 || minutes === 30) return d

  if (minutes < 30) {
    d.setMinutes(30, 0, 0)
  } else {
    d.setHours(d.getHours() + 1, 0, 0, 0)
  }
  return d
}

function isWithinBusinessHours(date: Date): boolean {
  const hour = date.getHours()
  const minutes = date.getMinutes()
  if (hour < BUSINESS_HOURS.open) return false
  if (hour > BUSINESS_HOURS.close - 1) return false
  if (hour === BUSINESS_HOURS.close - 1 && minutes > 30) return false
  return minutes === 0 || minutes === 30
}

/** Move forward to the next bookable slot (07:00–18:30, step 30 phút). */
export function advanceToNextBookableSlot(date: Date): Date {
  let d = snapMinutesToSlot(roundUpToSlot(date))

  for (let i = 0; i < 96; i += 1) {
    if (isWithinBusinessHours(d)) return d
    const hour = d.getHours()
    const minutes = d.getMinutes()

    if (hour < BUSINESS_HOURS.open) {
      d.setHours(BUSINESS_HOURS.open, 0, 0, 0)
      continue
    }

    if (hour >= BUSINESS_HOURS.close - 1 && (hour > BUSINESS_HOURS.close - 1 || minutes >= 30)) {
      d.setDate(d.getDate() + 1)
      d.setHours(BUSINESS_HOURS.open, 0, 0, 0)
      continue
    }

    d = new Date(d.getTime() + SLOT_DURATION_MINUTES * MS_PER_MINUTE)
  }

  return d
}

/** Move backward to the latest bookable slot at or before `date`. */
export function retreatToLatestBookableSlot(date: Date): Date {
  let d = snapMinutesToSlot(new Date(date))

  for (let i = 0; i < 96; i += 1) {
    if (isWithinBusinessHours(d)) return d
    d = new Date(d.getTime() - SLOT_DURATION_MINUTES * MS_PER_MINUTE)
  }

  return d
}

/** Earliest allowed time: now + 60 phút, làm tròn slot, trong giờ mở cửa. */
export function getEarliestBookableTime(now = new Date()): Date {
  const afterAdvance = new Date(now.getTime() + MIN_ADVANCE_MINUTES * MS_PER_MINUTE)
  return advanceToNextBookableSlot(afterAdvance)
}

/** Latest allowed time: tối đa `windowDays` × 24h từ hiện tại (giống BE). */
export function getLatestBookableTime(
  windowDays = DEFAULT_BOOKING_WINDOW_DAYS,
  now = new Date(),
): Date {
  const cap = new Date(now.getTime() + windowDays * 24 * 60 * MS_PER_MINUTE)
  return retreatToLatestBookableSlot(cap)
}

export function snapDatetimeLocalValue(value: string): string {
  const parsed = parseDatetimeLocalValue(value)
  if (!parsed) return value
  return toDatetimeLocalValue(advanceToNextBookableSlot(parsed))
}

export interface ScheduledAtValidationResult {
  valid: boolean
  message?: string
}

/** Client-side checks aligned with Backend `validateScheduledAt`. */
export function validateScheduledAt(
  scheduledAt: Date,
  windowDays = DEFAULT_BOOKING_WINDOW_DAYS,
  now = new Date(),
): ScheduledAtValidationResult {
  if (scheduledAt <= now) {
    return { valid: false, message: 'Thời gian đặt lịch phải là thời điểm trong tương lai' }
  }

  const diffMinutes = (scheduledAt.getTime() - now.getTime()) / MS_PER_MINUTE
  if (diffMinutes < MIN_ADVANCE_MINUTES) {
    return {
      valid: false,
      message: `Vui lòng đặt lịch trước ít nhất ${MIN_ADVANCE_MINUTES} phút`,
    }
  }

  const maxAdvanceMinutes = windowDays * 24 * 60
  if (diffMinutes > maxAdvanceMinutes) {
    return {
      valid: false,
      message: `Bạn chỉ có thể đặt lịch trước tối đa ${windowDays} ngày`,
    }
  }

  const minutes = scheduledAt.getMinutes()
  if (minutes !== 0 && minutes !== 30) {
    return {
      valid: false,
      message: `Thời gian hẹn chỉ được chọn theo khung ${SLOT_DURATION_MINUTES} phút (ví dụ: 08:00, 08:30)`,
    }
  }

  const hour = scheduledAt.getHours()
  if (hour < BUSINESS_HOURS.open || hour >= BUSINESS_HOURS.close) {
    return {
      valid: false,
      message: `Giờ hoạt động từ ${BUSINESS_HOURS.open}:00 đến ${BUSINESS_HOURS.close}:00`,
    }
  }

  if (hour === BUSINESS_HOURS.close - 1 && minutes > 30) {
    return {
      valid: false,
      message: `Giờ hoạt động từ ${BUSINESS_HOURS.open}:00 đến ${BUSINESS_HOURS.close}:00`,
    }
  }

  return { valid: true }
}

export function getScheduleFieldHints(
  windowDays = DEFAULT_BOOKING_WINDOW_DAYS,
  branchOpenTime?: string,
  branchCloseTime?: string
): string {
  let openStr = `${BUSINESS_HOURS.open}:00`
  let closeStr = `${BUSINESS_HOURS.close - 1}:30`

  if (branchOpenTime && branchCloseTime) {
    openStr = branchOpenTime
    const closeParts = branchCloseTime.split(':')
    if (closeParts.length === 2) {
      let h = parseInt(closeParts[0], 10)
      let m = parseInt(closeParts[1], 10)
      if (m >= 30) {
        m -= 30
      } else {
        h -= 1
        m += 30
      }
      closeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    } else {
      closeStr = branchCloseTime
    }
  }

  return [
    `Chỉ đặt được thời gian trong tương lai (trước ít nhất ${MIN_ADVANCE_MINUTES} phút)`,
    `Khung giờ ${openStr}–${closeStr}, bước ${SLOT_DURATION_MINUTES} phút`,
    `Tối đa ${windowDays} ngày kể từ hiện tại`,
  ].join(' · ')
}

export function getAvailableTimeSlots(dateStr: string, minDatetime: string, maxDatetime: string): string[] {
  const minDateStr = minDatetime.split('T')[0]
  const maxDateStr = maxDatetime.split('T')[0]

  if (dateStr < minDateStr || dateStr > maxDateStr) return []

  const minTimeStr = dateStr === minDateStr ? minDatetime.split('T')[1] : "00:00"
  const maxTimeStr = dateStr === maxDateStr ? maxDatetime.split('T')[1] : "23:59"

  const slots: string[] = []
  for (let h = BUSINESS_HOURS.open; h < BUSINESS_HOURS.close; h++) {
    const hStr = pad2(h)
    const slot00 = `${hStr}:00`
    const slot30 = `${hStr}:30`

    if (slot00 >= minTimeStr && slot00 <= maxTimeStr) slots.push(slot00)
    if (slot30 >= minTimeStr && slot30 <= maxTimeStr) slots.push(slot30)
  }
  return slots
}
