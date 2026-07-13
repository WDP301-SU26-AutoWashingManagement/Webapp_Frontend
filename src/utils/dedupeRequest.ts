const inflight = new Map<string, Promise<unknown>>()

/** Gộp các request đồng thời cùng key (tránh gọi API trùng khi Strict Mode / re-render). */
export function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fn().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}
