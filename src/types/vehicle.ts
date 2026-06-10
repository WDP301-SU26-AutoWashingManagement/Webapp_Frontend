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

export interface VehicleClass {
  _id?: string
  id?: string
  class_code: string
  class_name: string
}

export interface VehicleMake {
  _id?: string
  id?: string
  make_name: string
}

export interface VehicleModelData {
  _id?: string
  id?: string
  make_id: string
  model_name: string
}

export interface Vehicle {
  _id?: string
  id?: string
  customer_id?: string
  vehicle_class_id?: string
  model_id?: string
  license_plate: string
  fuel_type: string
  color: string
  vehicle_model?: string
  created_at?: string
  updated_at?: string
}

export interface CreateVehicleInput {
  customer_id: string
  vehicle_class_id: string
  model_id: string
  make_name?: string
  model_name?: string
  license_plate: string
  fuel_type: string
  color: string
  vehicle_model: string
}

export interface UpdateVehicleInput {
  vehicle_class_id?: string
  model_id?: string
  make_name?: string
  model_name?: string
  license_plate?: string
  fuel_type?: string
  color?: string
  vehicle_model?: string
}

