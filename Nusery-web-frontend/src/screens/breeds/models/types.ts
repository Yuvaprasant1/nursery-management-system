export interface Breed {
  id: string
  name: string
  description?: string
  saplingId: string
  nurseryId: string
  mode?: 'INDIVIDUAL' | 'SLOT'
  itemsPerSlot?: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface BreedRequest {
  name: string
  description?: string
  saplingId: string
  nurseryId: string
  mode: 'INDIVIDUAL' | 'SLOT'
  itemsPerSlot?: number
  imageUrl?: string
}

