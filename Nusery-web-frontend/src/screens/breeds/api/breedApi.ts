import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Breed, BreedRequest } from '../models/types'
import { API_ENDPOINTS } from '@/constants'
import { deduplicateRequest, generateRequestKey } from '@/utils/requestDeduplicator'

// Backend response type
interface BreedResponse {
  id: string
  breedName: string
  description?: string
  saplingId: string
  nurseryId: string
  createdAt: string
  updatedAt: string
  mode?: string
  itemsPerSlot?: number
  imageUrl?: string
}

// Transform backend response to frontend type
const transformBreed = (breed: BreedResponse): Breed => ({
  id: breed.id,
  name: breed.breedName,
  description: breed.description,
  saplingId: breed.saplingId,
  nurseryId: breed.nurseryId,
  mode: breed.mode as 'INDIVIDUAL' | 'SLOT' | undefined,
  itemsPerSlot: breed.itemsPerSlot,
  imageUrl: breed.imageUrl,
  createdAt: breed.createdAt,
  updatedAt: breed.updatedAt,
})

export const breedApi = {
  getBreeds: async (
    nurseryId: string, 
    saplingId?: string | null,
    page?: number,
    size?: number,
    search?: string
  ): Promise<Breed[] | PaginatedResponse<Breed>> => {
    let url = `${API_ENDPOINTS.BREEDS}?nurseryId=${nurseryId}`
    if (saplingId) {
      url += `&saplingId=${saplingId}`
    }
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`
    }
    if (page !== undefined || size !== undefined) {
      url += `&page=${page ?? 0}&size=${size ?? 20}`
    }
    
    const params = { nurseryId, saplingId, page, size, search }
    const key = generateRequestKey('GET', url, params)
    
    return deduplicateRequest(key, async () => {
      if (page !== undefined || size !== undefined) {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<BreedResponse>>>(url)
        const paginatedData = response.data.data
        return {
          ...paginatedData,
          content: paginatedData.content.map(transformBreed),
        }
      }
      const response = await apiClient.get<ApiResponse<BreedResponse[]>>(url)
      return response.data.data.map(transformBreed)
    })
  },
  
  getBreed: async (id: string): Promise<Breed> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const url = `${API_ENDPOINTS.BREEDS}/${id}`
    const key = generateRequestKey('GET', url, { id })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<BreedResponse>>(url)
      return transformBreed(response.data.data)
    })
  },
  
  createBreed: async (data: BreedRequest): Promise<Breed> => {
    const url = API_ENDPOINTS.BREEDS
    const key = generateRequestKey('POST', url, undefined, data)
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.post<ApiResponse<BreedResponse>>(url, {
        breedName: data.name,
        description: data.description,
        saplingId: data.saplingId,
        nurseryId: data.nurseryId,
        mode: data.mode,
        itemsPerSlot: data.itemsPerSlot,
        imageUrl: data.imageUrl,
      })
      return transformBreed(response.data.data)
    }, false) // Don't cache POST requests
  },
  
  updateBreed: async (id: string, data: BreedRequest): Promise<Breed> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const url = `${API_ENDPOINTS.BREEDS}/${id}`
    const key = generateRequestKey('PUT', url, { id }, data)
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.put<ApiResponse<BreedResponse>>(url, {
        breedName: data.name,
        description: data.description,
        saplingId: data.saplingId,
        nurseryId: data.nurseryId,
        mode: data.mode,
        itemsPerSlot: data.itemsPerSlot,
        imageUrl: data.imageUrl,
      })
      return transformBreed(response.data.data)
    }, false) // Don't cache PUT requests
  },
  
  deleteBreed: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const url = `${API_ENDPOINTS.BREEDS}/${id}`
    const key = generateRequestKey('DELETE', url, { id })
    
    return deduplicateRequest(key, async () => {
      await apiClient.delete(url)
    }, false) // Don't cache DELETE requests
  },
  
  checkHasTransactions: async (id: string): Promise<boolean> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const url = `${API_ENDPOINTS.BREEDS}/${id}/has-transactions`
    const key = generateRequestKey('GET', url, { id })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<boolean>>(url)
      return response.data.data
    })
  },
}

