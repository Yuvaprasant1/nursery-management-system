import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Breed, BreedRequest } from '../models/types'
import { API_ENDPOINTS } from '@/constants'

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
    size?: number
  ): Promise<Breed[] | PaginatedResponse<Breed>> => {
    let url = `${API_ENDPOINTS.BREEDS}?nurseryId=${nurseryId}`
    if (saplingId) {
      url += `&saplingId=${saplingId}`
    }
    if (page !== undefined || size !== undefined) {
      url += `&page=${page ?? 0}&size=${size ?? 20}`
      const response = await apiClient.get<ApiResponse<PaginatedResponse<BreedResponse>>>(url)
      const paginatedData = response.data.data
      return {
        ...paginatedData,
        content: paginatedData.content.map(transformBreed),
      }
    }
    const response = await apiClient.get<ApiResponse<BreedResponse[]>>(url)
    return response.data.data.map(transformBreed)
  },
  
  getBreed: async (id: string): Promise<Breed> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const response = await apiClient.get<ApiResponse<BreedResponse>>(`${API_ENDPOINTS.BREEDS}/${id}`)
    return transformBreed(response.data.data)
  },
  
  createBreed: async (data: BreedRequest): Promise<Breed> => {
    const response = await apiClient.post<ApiResponse<BreedResponse>>(API_ENDPOINTS.BREEDS, {
      breedName: data.name,
      description: data.description,
      saplingId: data.saplingId,
      nurseryId: data.nurseryId,
      mode: data.mode,
      itemsPerSlot: data.itemsPerSlot,
      imageUrl: data.imageUrl,
    })
    return transformBreed(response.data.data)
  },
  
  updateBreed: async (id: string, data: BreedRequest): Promise<Breed> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const response = await apiClient.put<ApiResponse<BreedResponse>>(`${API_ENDPOINTS.BREEDS}/${id}`, {
      breedName: data.name,
      description: data.description,
      saplingId: data.saplingId,
      nurseryId: data.nurseryId,
      mode: data.mode,
      itemsPerSlot: data.itemsPerSlot,
      imageUrl: data.imageUrl,
    })
    return transformBreed(response.data.data)
  },
  
  deleteBreed: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    await apiClient.delete(`${API_ENDPOINTS.BREEDS}/${id}`)
  },
  
  checkHasTransactions: async (id: string): Promise<boolean> => {
    if (!id) {
      throw new Error('Invalid breed ID')
    }
    const response = await apiClient.get<ApiResponse<boolean>>(`${API_ENDPOINTS.BREEDS}/${id}/has-transactions`)
    return response.data.data
  },
}

