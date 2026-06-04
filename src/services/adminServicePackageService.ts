import apiClient from './apiClient'
import type {
  CreateServicePackageInput,
  ServicePackage,
  UpdateServicePackageInput,
} from '../types/servicePackage'
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

interface PackageListEnvelope {
  success?: boolean
  data?: {
    docs: Record<string, unknown>[]
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
    service_group_id: normalizeMongoId(raw.service_group_id) || '',
    package_name: String(raw.package_name ?? ''),
    package_code: raw.package_code != null ? String(raw.package_code) : undefined,
    description: String(raw.description ?? ''),
    package_discount_percentage: Number(raw.package_discount_percentage ?? 1),
    is_active: raw.is_active !== false,
  }
}

export const adminServicePackageService = {
  async list(params: ServicePackageListParams = {}): Promise<PaginatedResult<ServicePackage>> {
    const query: Record<string, string | number | boolean> = {}
    if (params.page) query.page = params.page
    if (params.limit) query.limit = params.limit
    if (params.is_active !== undefined) query.is_active = params.is_active
    if (params.search) query.search = params.search

    const body = await apiClient.get<PackageListEnvelope>('/service-packages', { params: query })
    const data = body.data || (body as any).docs // Fallback in case of pagination object
    const docs = Array.isArray(data) ? data : (data?.docs || [])
    
    if (!docs.length) {
      return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 }
    }

    const items = docs.map(normalizeServicePackage)
    return { 
      items, 
      total: body.data?.totalDocs || (body as any).pagination?.totalDocs || 0, 
      page: body.data?.page || (body as any).pagination?.page || 1, 
      limit: body.data?.limit || (body as any).pagination?.limit || 10, 
      totalPages: body.data?.totalPages || (body as any).pagination?.totalPages || 1 
    }
  },

  async create(data: CreateServicePackageInput): Promise<ServicePackage> {
    const body = await apiClient.post<{ success?: boolean; data?: Record<string, unknown> }>('/service-packages', data)
    if (!body.data) throw new Error('Invalid response')
    return normalizeServicePackage(body.data)
  },

  async update(id: string, data: UpdateServicePackageInput): Promise<ServicePackage> {
    const body = await apiClient.patch<{ success?: boolean; data?: Record<string, unknown> }>(`/service-packages/${id}`, data)
    if (!body.data) throw new Error('Invalid response')
    return normalizeServicePackage(body.data)
  },

  async toggleActive(id: string, is_active: boolean): Promise<ServicePackage> {
    const body = await apiClient.patch<{ success?: boolean; data?: Record<string, unknown> }>(`/service-packages/${id}/toggle-active`, { is_active })
    if (!body.data) throw new Error('Invalid response')
    return normalizeServicePackage(body.data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/service-packages/${id}`)
  },

  async listServicesByPackage(id: string): Promise<string[]> {
    const body = await apiClient.get<{ success?: boolean; data?: any[] }>(`/service-packages/${id}/services`)
    const data = body.data || []
    if (Array.isArray(data)) {
      return data.map(item => (typeof item === 'object' && item !== null) ? (item._id || item.id || item) : item)
    }
    return []
  },

  async listDetailedServicesByPackage(id: string): Promise<any[]> {
    const body = await apiClient.get<{ success?: boolean; data?: any[] }>(`/service-packages/${id}/services`)
    const data = body.data || []
    if (Array.isArray(data)) {
      return data
    }
    return []
  }
}

