import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Sapling, SaplingRequest } from '../models/types'

export const saplingApi = {
  getAllSaplings: async (
    nurseryId: string, 
    search?: string,
    page?: number,
    size?: number
  ): Promise<Sapling[] | PaginatedResponse<Sapling>> => {
    let url = `/saplings?nurseryId=${nurseryId}`
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`
    }
    if (page !== undefined || size !== undefined) {
      url += `&page=${page ?? 0}&size=${size ?? 20}`
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Sapling>>>(url)
      return response.data.data
    }
    const response = await apiClient.get<ApiResponse<Sapling[]>>(url)
    return response.data.data
  },
  
  getSapling: async (id: string): Promise<Sapling> => {
    const response = await apiClient.get<ApiResponse<Sapling>>(`/saplings/${id}`)
    return response.data.data
  },
  
  createSapling: async (data: SaplingRequest): Promise<Sapling> => {
    const response = await apiClient.post<ApiResponse<Sapling>>('/saplings', data)
    return response.data.data
  },
  
  updateSapling: async (id: string, data: SaplingRequest): Promise<Sapling> => {
    if (!id) {
      throw new Error('Invalid sapling ID')
    }
    const response = await apiClient.put<ApiResponse<Sapling>>(`/saplings/${id}`, data)
    return response.data.data
  },
  
  deleteSapling: async (id: string): Promise<void> => {
    await apiClient.delete(`/saplings/${id}`)
  },
}

