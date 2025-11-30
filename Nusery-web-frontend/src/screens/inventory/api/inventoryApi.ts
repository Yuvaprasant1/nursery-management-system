import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Inventory, TransactionRequest } from '../models/types'
import { deduplicateRequest, generateRequestKey } from '@/utils/requestDeduplicator'

export const inventoryApi = {
  getInventory: async (
    nurseryId: string, 
    saplingId?: string | null,
    page?: number,
    size?: number,
    search?: string
  ): Promise<Inventory[] | PaginatedResponse<Inventory>> => {
    let url = `/inventory?nurseryId=${nurseryId}`
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
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Inventory>>>(url)
        return response.data.data
      }
      const response = await apiClient.get<ApiResponse<Inventory[]>>(url)
      return response.data.data
    })
  },
  
  getInventoryByBreed: async (breedId: string): Promise<Inventory> => {
    const url = `/inventory/breed/${breedId}`
    const key = generateRequestKey('GET', url, { breedId })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<Inventory>>(url)
      return response.data.data
    })
  },
  
  createTransaction: async (breedId: string, data: TransactionRequest): Promise<void> => {
    const url = `/inventory/${breedId}/transaction`
    const key = generateRequestKey('POST', url, { breedId }, data)
    
    return deduplicateRequest(key, async () => {
      // Map frontend format to backend format
      const backendRequest = {
        delta: data.quantity,
        type: data.transactionType,
        reason: data.notes || undefined,
      }
      await apiClient.post(url, backendRequest)
    }, false) // Don't cache POST requests
  },
}

