export interface ServicePackage {
  _id?: string
  id?: string
  service_group_id: string
  package_name: string
  package_code?: string
  description: string
  package_discount_percentage: number
  is_active: boolean
}

export interface CreateServicePackageInput {
  service_group_id: string
  package_name: string
  description: string
  package_discount_percentage: number
  service_ids: string[]
}

export type UpdateServicePackageInput = Partial<CreateServicePackageInput> & { is_active?: boolean }
