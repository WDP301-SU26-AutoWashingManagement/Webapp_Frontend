import apiClient from './apiClient'
import type { ServicePackage } from '../types/servicePackage'
import { normalizeVehicleType } from '../types/vehicle'
import { normalizeMongoId } from '../utils/mongoId'
import { dedupeRequest } from '../utils/dedupeRequest'

interface ServiceListEnvelope {
  success?: boolean
  data?: Record<string, unknown>[]
}

function normalizeServicePackage(raw: Record<string, unknown>): any {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    service_name: String(raw.service_name ?? ''),
    description: raw.description != null ? String(raw.description) : undefined,
    vehicle_type: normalizeVehicleType(String(raw.vehicle_type ?? 'car')),
    service_price: Number(raw.service_price ?? 0),
    duration_minutes: Number(raw.duration_minutes ?? 0),
    is_active: raw.is_active !== false,
  }
}

/** GET /services — danh sách gói active (form đặt lịch, cần đăng nhập). */
export const servicePackageService = {
  async listActive(): Promise<ServicePackage[]> {
    return dedupeRequest('services:active', async () => {
      const body = await apiClient.get<ServiceListEnvelope>('/services', {
        params: { page: 1, limit: 100, is_active: true },
      })
      const data = Array.isArray(body.data) ? body.data : []
      return data
        .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
        .map(normalizeServicePackage)
        .filter((pkg: any) => (pkg.service_name || pkg.package_name) && pkg.is_active !== false)
    })
  },
}
