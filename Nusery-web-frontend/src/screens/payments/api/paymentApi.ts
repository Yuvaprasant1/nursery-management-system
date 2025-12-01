import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { Payment, PaymentRequest } from '../models/types'
import { PaymentType } from '@/enums'

// Backend response type
interface PaymentResponse {
  id: string
  transactionId: string
  nurseryId: string
  breedId: string
  type: string
  amount: number | string | null | undefined  // Handle various backend formats
  description?: string | null
  userPhone?: string | null
  isDeleted?: boolean | null
  createdAt: string
  updatedAt: string
}

// Transform backend response to frontend type
const transformPayment = (payment: PaymentResponse): Payment => {
  // Ensure amount is properly converted to number
  const amount = typeof payment.amount === 'string' 
    ? parseFloat(payment.amount) 
    : (payment.amount ?? 0)
  
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    nurseryId: payment.nurseryId,
    breedId: payment.breedId,
    type: payment.type as PaymentType,
    amount: isNaN(amount) ? 0 : amount,
    description: payment.description ?? undefined,
    userPhone: payment.userPhone ?? undefined,
    isDeleted: payment.isDeleted ?? undefined,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

export const paymentApi = {
  createPayment: async (transactionId: string, data: PaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<PaymentResponse>>(
      `/payments/transaction/${transactionId}`,
      data
    )
    return transformPayment(response.data.data)
  },

  updatePayment: async (id: string, data: PaymentRequest): Promise<Payment> => {
    const response = await apiClient.put<ApiResponse<PaymentResponse>>(`/payments/${id}`, data)
    return transformPayment(response.data.data)
  },

  getPaymentsByTransaction: async (transactionId: string): Promise<Payment[]> => {
    const response = await apiClient.get<ApiResponse<PaymentResponse[]>>(
      `/payments/transaction/${transactionId}`
    )
    return response.data.data.map(transformPayment)
  },

  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<ApiResponse<PaymentResponse>>(`/payments/${id}`)
    return transformPayment(response.data.data)
  },

  deletePayment: async (id: string): Promise<void> => {
    await apiClient.post(`/payments/${id}/soft-delete`)
  },
}

