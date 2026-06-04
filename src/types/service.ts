export interface Service {
  _id?: string
  id?: string
  service_group_id: string
  service_name: string
  service_code?: string
  description?: string
  service_price: number
  duration_minutes: number
  is_active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateServiceInput = Omit<Service, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'is_active'> & {
  is_active?: boolean
}

export type UpdateServiceInput = Partial<CreateServiceInput> & {
  is_active?: boolean
}
