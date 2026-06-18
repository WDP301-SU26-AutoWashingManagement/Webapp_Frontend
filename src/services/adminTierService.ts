import apiClient from './apiClient';
import type { Tier, CreateTierInput, UpdateTierInput } from '../types/tier';
import { normalizeMongoId } from '../utils/mongoId';
import type { PaginatedResult } from './adminServicePackageService';

export interface TierListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface TierListEnvelope {
  success?: boolean;
  data?: Record<string, unknown>[];
  pagination?: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

function normalizeTier(raw: Record<string, unknown>): Tier {
  const id = normalizeMongoId(raw._id ?? raw.id);
  return {
    _id: id || undefined,
    id: id || undefined,
    tier_name: String(raw.tier_name ?? 'member') as Tier['tier_name'],
    min_membership_points: Number(raw.min_membership_points ?? 0),
    max_membership_points: Number(raw.max_membership_points ?? 10000000),
    booking_window_days: Number(raw.booking_window_days ?? 0),
    discount_percentage: Number(raw.discount_percentage ?? 0),
    free_features: Array.isArray(raw.free_features) ? raw.free_features.map(String) : undefined,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
  };
}

function unwrapTierEntity(body: {
  success?: boolean;
  data?: Record<string, unknown>;
}): Tier {
  const raw = body.data;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Phản hồi API không hợp lệ');
  }
  return normalizeTier(raw);
}

export const adminTierService = {
  async list(params: TierListParams = {}): Promise<PaginatedResult<Tier>> {
    const query: Record<string, string | number> = {};
    if (params.page !== undefined) query.page = params.page;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.search) query.search = params.search;

    const body = await apiClient.get<TierListEnvelope>('/tiers', { params: query });
    const docs = Array.isArray(body.data) ? body.data : [];
    const items = docs.map(normalizeTier);

    const pagination = body.pagination;
    const total = pagination?.totalDocs ?? items.length;
    const page = pagination?.page ?? params.page ?? 1;
    const limit = pagination?.limit ?? params.limit ?? 10;
    const totalPages = pagination?.totalPages ?? (Math.ceil(total / limit) || 1);

    return { items, total, page, limit, totalPages };
  },

  async getById(id: string): Promise<Tier> {
    const body = await apiClient.get<{
      success?: boolean;
      data?: Record<string, unknown>;
    }>(`/tiers/${id}`);
    return unwrapTierEntity(body);
  },

  async create(data: CreateTierInput): Promise<Tier> {
    const body = await apiClient.post<{
      success?: boolean;
      data?: Record<string, unknown>;
    }>('/tiers', data);
    return unwrapTierEntity(body);
  },

  async update(id: string, data: UpdateTierInput): Promise<Tier> {
    const body = await apiClient.patch<{
      success?: boolean;
      data?: Record<string, unknown>;
    }>(`/tiers/${id}`, data);
    return unwrapTierEntity(body);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tiers/${id}`);
  },
};
