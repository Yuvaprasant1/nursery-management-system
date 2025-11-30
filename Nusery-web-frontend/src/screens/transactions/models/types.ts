import { TransactionType } from '@/enums'

export { TransactionType }

export interface Transaction {
  id: string
  nurseryId: string
  breedId: string
  breedName?: string // May not be present in backend response, will need to fetch
  type: TransactionType
  delta: number
  reason?: string
  userPhone?: string
  reversedByTxnId?: string
  isUndo?: boolean
  isDeleted?: boolean
  createdAt: string
  updatedAt: string
}

