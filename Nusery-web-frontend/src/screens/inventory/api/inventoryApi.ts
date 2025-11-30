import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Inventory, TransactionRequest } from '../models/types'

export const inventoryApi = {
  getInventory: async (
    nurseryId: string, 
    saplingId?: string | null,
    page?: number,
    size?: number
  ): Promise<Inventory[] | PaginatedResponse<Inventory>> => {
    let url = `/inventory?nurseryId=${nurseryId}`
    if (saplingId) {
      url += `&saplingId=${saplingId}`
    }
    if (page !== undefined || size !== undefined) {
      url += `&page=${page ?? 0}&size=${size ?? 20}`
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Inventory>>>(url)
      return response.data.data
    }
    const response = await apiClient.get<ApiResponse<Inventory[]>>(url)
    return response.data.data
  },
  
  getInventoryByBreed: async (breedId: string): Promise<Inventory> => {
    const response = await apiClient.get<ApiResponse<Inventory>>(`/inventory/breed/${breedId}`)
    return response.data.data
  },
  
  createTransaction: async (breedId: string, data: TransactionRequest): Promise<void> => {
    // Map frontend format to backend format
    const backendRequest = {
      delta: data.quantity,
      type: data.transactionType,
      reason: data.notes || undefined,
    }
    await apiClient.post(`/inventory/${breedId}/transaction`, backendRequest)
  },
}

