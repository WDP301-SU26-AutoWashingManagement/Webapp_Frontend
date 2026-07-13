export interface ServiceGroup {
  _id?: string
  id?: string
  group_name: string
  description?: string
  is_active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateServiceGroupInput = Omit<ServiceGroup, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'is_active'> & {
  is_active?: boolean
}

export type UpdateServiceGroupInput = Partial<CreateServiceGroupInput> & {
  is_active?: boolean
}
