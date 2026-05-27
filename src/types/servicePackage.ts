import type { VehicleType } from './vehicle'

export interface ServicePackage {
  _id?: string
  id?: string
  service_name: string
  description?: string
  vehicle_type: VehicleType
  service_price: number
  duration_minutes: number
  is_active?: boolean
}

export interface CreateServicePackageInput {
  service_name: string
  description?: string
  vehicle_type: VehicleType
  service_price: number
  duration_minutes: number
  is_active?: boolean
}

export type UpdateServicePackageInput = Partial<CreateServicePackageInput>
