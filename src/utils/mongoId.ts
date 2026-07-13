export function normalizeMongoId(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const record = value as { _id?: unknown; id?: unknown; toString?: () => string }
    if (record._id != null) return String(record._id)
    if (record.id != null) return String(record.id)
    if (typeof record.toString === 'function') return record.toString()
  }
  return String(value)
}
