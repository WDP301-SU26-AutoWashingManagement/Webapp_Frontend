import apiClient from './apiClient'
import type { ApiResponse } from '../types/api'
import type { ServicePackage } from '../types/servicePackage'
import { normalizeMongoId } from '../utils/mongoId'
import { dedupeRequest } from '../utils/dedupeRequest'
import { unwrapApiData } from '../utils/apiResponse'

function normalizeServicePackage(raw: Record<string, unknown>): ServicePackage {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    service_name: String(raw.service_name ?? ''),
    description: raw.description != null ? String(raw.description) : undefined,
    service_price: Number(raw.service_price ?? 0),
    duration_minutes: Number(raw.duration_minutes ?? 0),
    is_active: raw.is_active !== false,
  }
}

/** GET /services — public list (active packages for booking form). */
export const servicePackageService = {
  async listActive(): Promise<ServicePackage[]> {
    return dedupeRequest('services:active', async () => {
      const body = await apiClient.get<ApiResponse<unknown[]>>('/services', {
        params: { page: 1, limit: 100, is_active: true },
      })
      const data = unwrapApiData<unknown[]>(body)
      if (!Array.isArray(data)) return []
      return data
        .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
        .map(normalizeServicePackage)
        .filter((pkg) => pkg.service_name && pkg.is_active !== false)
    })
  },
}
