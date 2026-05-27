import apiClient from './apiClient'
import type {
  CreateServicePackageInput,
  ServicePackage,
  UpdateServicePackageInput,
} from '../types/servicePackage'
import { normalizeVehicleType, type VehicleType } from '../types/vehicle'
import { normalizeMongoId } from '../utils/mongoId'

export interface ServicePackageListParams {
  page?: number
  limit?: number
  is_active?: boolean
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ServiceListEnvelope {
  success?: boolean
  data?: Record<string, unknown>[]
  pagination?: {
    totalDocs: number
    limit: number
    page: number
    totalPages: number
  }
}

function normalizeServicePackage(raw: Record<string, unknown>): ServicePackage {
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

function toListQueryParams(
  params: ServicePackageListParams,
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {}
  if (params.page !== undefined) query.page = params.page
  if (params.limit !== undefined) query.limit = params.limit
  if (params.is_active !== undefined) query.is_active = params.is_active
  if (params.search) query.search = params.search
  return query
}

export const adminServicePackageService = {
  async list(params: ServicePackageListParams = {}): Promise<PaginatedResult<ServicePackage>> {
    const body = await apiClient.get<ServiceListEnvelope>('/services', {
      params: toListQueryParams(params),
    })
    const docs = Array.isArray(body.data) ? body.data : []
    const items = docs.map(normalizeServicePackage)

    const pagination = body.pagination
    const total = pagination?.totalDocs ?? items.length
    const page = pagination?.page ?? params.page ?? 1
    const limit = pagination?.limit ?? params.limit ?? 10
    const totalPages = pagination?.totalPages ?? (Math.ceil(total / limit) || 1)

    return { items, total, page, limit, totalPages }
  },

  async create(data: CreateServicePackageInput): Promise<ServicePackage> {
    const body = await apiClient.post<{
      success?: boolean
      data?: Record<string, unknown>
    }>('/services', {
      service_name: data.service_name.trim(),
      description: data.description?.trim() ?? '',
      vehicle_type: data.vehicle_type,
      service_price: data.service_price,
      duration_minutes: Math.floor(data.duration_minutes),
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    })
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServicePackage(raw)
  },

  async update(id: string, data: UpdateServicePackageInput): Promise<ServicePackage> {
    const payload: Record<string, unknown> = {}
    if (data.service_name !== undefined) payload.service_name = data.service_name.trim()
    if (data.description !== undefined) payload.description = data.description.trim()
    if (data.vehicle_type !== undefined) payload.vehicle_type = data.vehicle_type as VehicleType
    if (data.service_price !== undefined) payload.service_price = data.service_price
    if (data.duration_minutes !== undefined) payload.duration_minutes = data.duration_minutes
    if (data.is_active !== undefined) payload.is_active = data.is_active

    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/services/${id}`, payload)
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServicePackage(raw)
  },

  async toggleActive(id: string, is_active: boolean): Promise<ServicePackage> {
    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/services/${id}/toggle-active`, { is_active })
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServicePackage(raw)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`)
  },
}
