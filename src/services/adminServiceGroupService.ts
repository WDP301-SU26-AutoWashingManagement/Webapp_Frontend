import apiClient from './apiClient'
import type {
  CreateServiceGroupInput,
  ServiceGroup,
  UpdateServiceGroupInput,
} from '../types/serviceGroup'
import { normalizeMongoId } from '../utils/mongoId'

export interface ServiceGroupListParams {
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

interface ServiceGroupListEnvelope {
  success?: boolean
  data?: Record<string, unknown>[]
  pagination?: {
    totalDocs: number
    limit: number
    page: number
    totalPages: number
  }
}

function normalizeServiceGroup(raw: Record<string, unknown>): ServiceGroup {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    group_name: String(raw.group_name ?? ''),
    description: raw.description != null ? String(raw.description) : undefined,
    is_active: raw.is_active !== false,
  }
}

function toListQueryParams(
  params: ServiceGroupListParams,
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {}
  if (params.page !== undefined) query.page = params.page
  if (params.limit !== undefined) query.limit = params.limit
  if (params.is_active !== undefined) query.is_active = params.is_active
  if (params.search) query.search = params.search
  return query
}

export const adminServiceGroupService = {
  async list(params: ServiceGroupListParams = {}): Promise<PaginatedResult<ServiceGroup>> {
    const body = await apiClient.get<ServiceGroupListEnvelope>('/service-groups', {
      params: toListQueryParams(params),
    })
    const docs = Array.isArray(body.data) ? body.data : []
    const items = docs.map(normalizeServiceGroup)

    const pagination = body.pagination
    const total = pagination?.totalDocs ?? items.length
    const page = pagination?.page ?? params.page ?? 1
    const limit = pagination?.limit ?? params.limit ?? 10
    const totalPages = pagination?.totalPages ?? (Math.ceil(total / limit) || 1)

    return { items, total, page, limit, totalPages }
  },

  async create(data: CreateServiceGroupInput): Promise<ServiceGroup> {
    const body = await apiClient.post<{
      success?: boolean
      data?: Record<string, unknown>
    }>('/service-groups', {
      group_name: data.group_name.trim(),
      description: data.description?.trim() ?? '',
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    })
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServiceGroup(raw)
  },

  async update(id: string, data: UpdateServiceGroupInput): Promise<ServiceGroup> {
    const payload: Record<string, unknown> = {}
    if (data.group_name !== undefined) payload.group_name = data.group_name.trim()
    if (data.description !== undefined) payload.description = data.description.trim()
    if (data.is_active !== undefined) payload.is_active = data.is_active

    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/service-groups/${id}`, payload)
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServiceGroup(raw)
  },

  async toggleActive(id: string, is_active: boolean): Promise<ServiceGroup> {
    const body = await apiClient.patch<{
      success?: boolean
      data?: Record<string, unknown>
    }>(`/service-groups/${id}/toggle-active`, { is_active })
    const raw = body.data
    if (!raw || typeof raw !== 'object') {
      throw new Error('Phản hồi API không hợp lệ')
    }
    return normalizeServiceGroup(raw)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/service-groups/${id}`)
  },
}
