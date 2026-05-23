import apiClient from './apiClient'
import { resolveCustomerRoleId } from './customerService'
import type { ApiResponse } from '../types/api'
import type { CreateVehicleInput, UpdateVehicleInput, Vehicle, VehicleType } from '../types/vehicle'
import { normalizeMongoId } from '../utils/mongoId'
import { dedupeRequest } from '../utils/dedupeRequest'
import { unwrapApiData } from '../utils/apiResponse'

function normalizeVehicle(raw: Record<string, unknown>): Vehicle {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    customer_id: normalizeMongoId(raw.customer_id) || undefined,
    plate_number: String(raw.plate_number ?? ''),
    vehicle_type: (raw.vehicle_type as VehicleType) ?? 'car',
    brand: String(raw.brand ?? ''),
    vehicle_model: String(raw.vehicle_model ?? ''),
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
  }
}

function normalizeVehicleList(items: unknown[]): Vehicle[] {
  return items
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(normalizeVehicle)
}

/** Customer vehicles — GET/POST/PUT/DELETE /vehicles */
export const vehicleService = {
  async list(): Promise<Vehicle[]> {
    const customer_id = await resolveCustomerRoleId()
    return dedupeRequest(`vehicles:list:${customer_id}`, async () => {
      const body = await apiClient.get<ApiResponse<unknown[]>>('/vehicles', {
        params: { customer_id, page: 1, limit: 100 },
      })
      const data = unwrapApiData<unknown[]>(body)
      return Array.isArray(data) ? normalizeVehicleList(data) : []
    })
  },

  async create(
    payload: Omit<CreateVehicleInput, 'customer_id'> & { customer_id?: string },
  ): Promise<Vehicle> {
    const body = await apiClient.post<ApiResponse<Record<string, unknown>>>('/vehicles', {
      customer_id: payload.customer_id ?? (await resolveCustomerRoleId()),
      plate_number: payload.plate_number,
      vehicle_type: payload.vehicle_type,
      brand: payload.brand,
      vehicle_model: payload.vehicle_model,
    })
    return normalizeVehicle(unwrapApiData<Record<string, unknown>>(body))
  },

  async update(id: string, payload: UpdateVehicleInput): Promise<Vehicle> {
    const body = await apiClient.put<ApiResponse<Record<string, unknown>>>(
      `/vehicles/${id}`,
      payload,
    )
    return normalizeVehicle(unwrapApiData<Record<string, unknown>>(body))
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`)
  },
}
