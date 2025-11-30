import { TransactionType } from '@/enums'

export interface Inventory {
  id: string
  breedId: string
  breedName: string
  quantity: number
  nurseryId: string
}

export interface TransactionRequest {
  transactionType: TransactionType
  quantity: number
  notes?: string
}

