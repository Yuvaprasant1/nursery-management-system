export interface LoginRequest {
  phone: string
  password: string
}

export interface AuthResponse {
  token: string
  phone: string
  userId: string
  nurseryId?: string | null
}

export interface User {
  id: string
  phone: string
  name?: string
  nurseryId?: string | null
}

