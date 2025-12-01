import { PaymentType } from '@/enums'

export { PaymentType }

export interface Payment {
  id: string
  transactionId: string
  nurseryId: string
  breedId: string
  type: PaymentType
  amount: number
  description?: string
  userPhone?: string
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
}

export interface PaymentRequest {
  transactionId: string
  type: PaymentType
  amount: number
  description?: string
}

