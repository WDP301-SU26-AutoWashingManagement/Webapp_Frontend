import apiClient from './apiClient'

export interface AdminCustomer {
  _id: string
  id: string
  user_id?: {
    _id: string
    full_name: string
    email: string
    phone: string
    avatar_url?: string
    is_active: boolean
    created_at: string
  }
  tier_id?: {
    _id: string
    tier_name: string
  }
  membership_points: number
  reward_points: number
  has_online_access: boolean
}

export interface CreateCustomerInput {
  email: string
  full_name: string
  phone?: string
  password?: string
  avatar_url?: string
  tier_id?: string
  membership_points?: number
  reward_points?: number
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  is_active?: boolean
}

export interface CustomerListParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CustomerListEnvelope {
  success?: boolean
  data?: Record<string, unknown>[]
  pagination?: {
    totalDocs: number
    limit: number
    page: number
    totalPages: number
  }
}

function normalizeCustomer(raw: Record<string, unknown>): AdminCustomer {
  return raw as unknown as AdminCustomer
}

export const adminCustomerService = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResult<AdminCustomer>> {
    const query: Record<string, string | number | undefined> = {}
    if (params.page !== undefined) query.page = params.page
    if (params.limit !== undefined) query.limit = params.limit
    if (params.search) query.search = params.search

    const body = await apiClient.get<CustomerListEnvelope>('/customers', {
      params: query,
    })
    const docs = Array.isArray(body.data) ? body.data : []
    const items = docs.map(normalizeCustomer)

    const pagination = body.pagination
    const total = pagination?.totalDocs ?? items.length
    const page = pagination?.page ?? params.page ?? 1
    const limit = pagination?.limit ?? params.limit ?? 10
    const totalPages = pagination?.totalPages ?? (Math.ceil(total / limit) || 1)

    return { items, total, page, limit, totalPages }
  },

  async create(data: CreateCustomerInput): Promise<AdminCustomer> {
    const body = await apiClient.post<{ data: Record<string, unknown> }>('/customers', data)
    return normalizeCustomer(body.data || {})
  },

  async update(id: string, data: UpdateCustomerInput): Promise<AdminCustomer> {
    const body = await apiClient.patch<{ data: Record<string, unknown> }>(`/customers/${id}`, data)
    return normalizeCustomer(body.data || {})
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`)
  }
}
