import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { LoginRequest, User } from '../models/types'

export const authApi = {
  login: async (credentials: LoginRequest): Promise<{ token: string; user: User }> => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials)
    return response.data.data
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },
}

