import apiClient from './apiClient'
import { resolveCustomerRoleId } from './customerService'
import type { ApiResponse } from '../types/api'
import type { CreateVehicleInput, UpdateVehicleInput, Vehicle, VehicleClass, VehicleMake, VehicleModelData } from '../types/vehicle'
import { normalizeMongoId } from '../utils/mongoId'
import { dedupeRequest } from '../utils/dedupeRequest'
import { unwrapApiData } from '../utils/apiResponse'

function normalizeVehicle(raw: Record<string, unknown>): Vehicle {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id || undefined,
    id: id || undefined,
    customer_id: normalizeMongoId(raw.customer_id) || undefined,
    vehicle_class_id: normalizeMongoId(raw.vehicle_class_id) || '',
    model_id: normalizeMongoId(raw.model_id) || '',
    license_plate: String(raw.license_plate ?? ''),
    fuel_type: String(raw.fuel_type ?? ''),
    color: String(raw.color ?? ''),
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
  }
}

function normalizeVehicleList(items: unknown[]): Vehicle[] {
  return items
    .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
    .map(normalizeVehicle)
}

function normalizeClass(raw: Record<string, unknown>): VehicleClass {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id,
    id: id,
    class_code: String(raw.class_code ?? ''),
    class_name: String(raw.class_name ?? ''),
  }
}

function normalizeMake(raw: Record<string, unknown>): VehicleMake {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id,
    id: id,
    make_name: String(raw.make_name ?? ''),
  }
}

function normalizeModel(raw: Record<string, unknown>): VehicleModelData {
  const id = normalizeMongoId(raw._id ?? raw.id)
  return {
    _id: id,
    id: id,
    make_id: normalizeMongoId(raw.make_id) || '',
    model_name: String(raw.model_name ?? ''),
  }
}

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
      vehicle_class_id: payload.vehicle_class_id,
      model_id: payload.model_id,
      license_plate: payload.license_plate,
      fuel_type: payload.fuel_type,
      color: payload.color,
      vehicle_model: "unknown", // Required by Backend
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

  async listClasses(): Promise<VehicleClass[]> {
    return dedupeRequest('vehicles:classes', async () => {
      const body = await apiClient.get<ApiResponse<unknown[]>>('/vehicle-classes')
      const data = unwrapApiData<unknown[]>(body)
      return Array.isArray(data) ? data.map(item => normalizeClass(item as Record<string, unknown>)) : []
    })
  },

  async listMakes(): Promise<VehicleMake[]> {
    return dedupeRequest('vehicles:makes', async () => {
      const body = await apiClient.get<ApiResponse<unknown[]>>('/makes')
      const data = unwrapApiData<unknown[]>(body)
      return Array.isArray(data) ? data.map(item => normalizeMake(item as Record<string, unknown>)) : []
    })
  },

  async listModels(): Promise<VehicleModelData[]> {
    return dedupeRequest('vehicles:models', async () => {
      const body = await apiClient.get<ApiResponse<unknown[]>>('/vehicle-models')
      const data = unwrapApiData<unknown[]>(body)
      return Array.isArray(data) ? data.map(item => normalizeModel(item as Record<string, unknown>)) : []
    })
  }
}
