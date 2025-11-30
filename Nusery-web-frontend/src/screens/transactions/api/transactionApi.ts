import apiClient from '@/api/client'
import { ApiResponse, PaginatedResponse } from '@/api/types'
import { Transaction } from '../models/types'
import { TransactionType } from '@/enums'

// Backend response type
interface TransactionResponse {
  id: string
  nurseryId: string
  breedId: string
  delta: number
  type: string
  reason?: string
  userPhone?: string
  reversedByTxnId?: string
  isUndo?: boolean
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
}

// Transform backend response to frontend type
const transformTransaction = (transaction: TransactionResponse): Transaction => {
  return {
    id: transaction.id,
    nurseryId: transaction.nurseryId,
    breedId: transaction.breedId,
    breedName: undefined, // Will be fetched separately if needed
    type: transaction.type as TransactionType,
    delta: transaction.delta,
    reason: transaction.reason,
    userPhone: transaction.userPhone,
    reversedByTxnId: transaction.reversedByTxnId,
    isUndo: transaction.isUndo,
    isDeleted: transaction.isDeleted,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  }
}

export const transactionApi = {
  getTransactions: async (
    breedId?: string,
    nurseryId?: string,
    page?: number,
    size?: number
  ): Promise<Transaction[] | PaginatedResponse<Transaction>> => {
    let url = '/transactions'
    const params = new URLSearchParams()
    if (breedId) {
      params.append('breedId', breedId)
    }
    if (nurseryId) {
      params.append('nurseryId', nurseryId)
    }
    if (page !== undefined || size !== undefined) {
      params.append('page', String(page ?? 0))
      params.append('size', String(size ?? 20))
    }
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    if (page !== undefined || size !== undefined) {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<TransactionResponse>>>(url)
      const paginatedData = response.data.data
      
      return {
        ...paginatedData,
        content: paginatedData.content.map(transformTransaction),
      }
    }
    const response = await apiClient.get<ApiResponse<TransactionResponse[]>>(url)
    return response.data.data.map(transformTransaction)
  },
  
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<ApiResponse<TransactionResponse>>(`/transactions/${id}`)
    return transformTransaction(response.data.data)
  },
  
  undoTransaction: async (id: string): Promise<void> => {
    await apiClient.post(`/transactions/${id}/undo`)
  },
  
  softDeleteTransaction: async (id: string): Promise<void> => {
    await apiClient.post(`/transactions/${id}/soft-delete`)
  },
}

