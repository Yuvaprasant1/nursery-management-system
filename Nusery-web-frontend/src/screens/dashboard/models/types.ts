import { TransactionType } from '@/enums'

export interface DashboardSummary {
  totalSaplingCount: number
  totalInventoryQuantity: number
  salesLast48Hours: number
  salesLastMonth: number
  salesLastYear: number
  salesAllTime: number
}

export interface RecentTransaction {
  id: string
  breedId: string
  breedName: string
  type: TransactionType
  delta: number
  reason?: string
  userPhone?: string
  isDeleted?: boolean
  createdAt: string
}

