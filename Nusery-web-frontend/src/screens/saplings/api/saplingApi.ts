import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Sapling, SaplingRequest } from '../models/types'
import { deduplicateRequest, generateRequestKey } from '@/utils/requestDeduplicator'

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
    }
    
    const params = { nurseryId, search: search?.trim(), page, size }
    const key = generateRequestKey('GET', url, params)
    
    return deduplicateRequest(key, async () => {
      if (page !== undefined || size !== undefined) {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Sapling>>>(url)
        return response.data.data
      }
      const response = await apiClient.get<ApiResponse<Sapling[]>>(url)
      return response.data.data
    })
  },
  
  getSapling: async (id: string): Promise<Sapling> => {
    const url = `/saplings/${id}`
    const key = generateRequestKey('GET', url, { id })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<Sapling>>(url)
      return response.data.data
    })
  },
  
  createSapling: async (data: SaplingRequest): Promise<Sapling> => {
    const url = '/saplings'
    const key = generateRequestKey('POST', url, undefined, data)
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.post<ApiResponse<Sapling>>(url, data)
      return response.data.data
    }, false) // Don't cache POST requests
  },
  
  updateSapling: async (id: string, data: SaplingRequest): Promise<Sapling> => {
    if (!id) {
      throw new Error('Invalid sapling ID')
    }
    const url = `/saplings/${id}`
    const key = generateRequestKey('PUT', url, { id }, data)
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.put<ApiResponse<Sapling>>(url, data)
      return response.data.data
    }, false) // Don't cache PUT requests
  },
  
  deleteSapling: async (id: string): Promise<void> => {
    const url = `/saplings/${id}`
    const key = generateRequestKey('DELETE', url, { id })
    
    return deduplicateRequest(key, async () => {
      await apiClient.delete(url)
    }, false) // Don't cache DELETE requests
  },
}

