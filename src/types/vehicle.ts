export enum VehicleType {
  MOTORBIKE = 'motorbike',
  CAR = 'car',
}

export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: VehicleType.MOTORBIKE, label: 'Xe máy' },
  { value: VehicleType.CAR, label: 'Ô tô' },
]

export function getVehicleTypeLabel(type: string): string {
  return VEHICLE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Ô tô'
}

export function normalizeVehicleType(type: string): VehicleType {
  return type === VehicleType.MOTORBIKE ? VehicleType.MOTORBIKE : VehicleType.CAR
}

export interface Vehicle {
  _id?: string
  id?: string
  customer_id?: string
  plate_number: string
  vehicle_type: VehicleType
  brand: string
  vehicle_model: string
  created_at?: string
  updated_at?: string
}

export interface CreateVehicleInput {
  customer_id: string
  plate_number: string
  vehicle_type: VehicleType
  brand: string
  vehicle_model: string
}

export interface UpdateVehicleInput {
  plate_number?: string
  vehicle_type?: VehicleType
  brand?: string
  vehicle_model?: string
}
