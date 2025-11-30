export interface Nursery {
  id: string
  name: string
  location?: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

export interface NurseryRequest {
  name: string
  location?: string
  phone?: string
}

