import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { Nursery, NurseryRequest } from '@/types/nursery'
import { API_ENDPOINTS } from '@/constants'

export const nurseryApi = {
  /**
   * Get all nurseries
   */
  getAllNurseries: async (): Promise<Nursery[]> => {
    const response = await apiClient.get<ApiResponse<Nursery[]>>(API_ENDPOINTS.NURSERY)
    return response.data.data
  },

  /**
   * Get nursery by ID
   */
  getNurseryById: async (id: string): Promise<Nursery> => {
    const response = await apiClient.get<ApiResponse<Nursery>>(`${API_ENDPOINTS.NURSERY}/${id}`)
    return response.data.data
  },

  /**
   * Update nursery details
   */
  updateNursery: async (id: string, data: NurseryRequest): Promise<Nursery> => {
    const response = await apiClient.put<ApiResponse<Nursery>>(`${API_ENDPOINTS.NURSERY}/${id}`, data)
    return response.data.data
  },

  /**
   * Update user's nursery assignment
   * Note: Backend endpoint may need to be created: PUT /auth/nursery
   * For now, this is handled on the frontend by updating user context
   */
  updateUserNursery: async (nurseryId: string): Promise<void> => {
    try {
      // Try to call backend endpoint if it exists
      await apiClient.put<ApiResponse<void>>(`${API_ENDPOINTS.AUTH.NURSERY}`, { nurseryId })
    } catch (error) {
      // If endpoint doesn't exist, we'll handle it on the frontend
      // The nursery will be stored in context and localStorage
      console.warn('Backend endpoint for updating user nursery may not exist yet')
      // Don't throw - let the frontend handle it
    }
  },
}

