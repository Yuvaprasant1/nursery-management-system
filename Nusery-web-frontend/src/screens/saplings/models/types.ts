export interface Sapling {
  id: string
  name: string
  description?: string
  imageUrl?: string
  nurseryId: string
  createdAt: string
  updatedAt: string
}

export interface SaplingRequest {
  name: string
  description?: string
  imageUrl?: string
  nurseryId: string
}

