import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { Theme, ThemeRequest } from '../models/types'

export const themeApi = {
  getTheme: async (nurseryId: string): Promise<Theme> => {
    const response = await apiClient.get<ApiResponse<Theme>>(`/theme/nursery/${nurseryId}`)
    return response.data.data
  },
  
  updateTheme: async (nurseryId: string, data: ThemeRequest): Promise<Theme> => {
    const response = await apiClient.post<ApiResponse<Theme>>(`/theme/nursery/${nurseryId}`, data)
    return response.data.data
  },
  
  getDefaultTheme: async (): Promise<Theme> => {
    const response = await apiClient.get<ApiResponse<Theme>>('/theme/default')
    return response.data.data
  },
}

