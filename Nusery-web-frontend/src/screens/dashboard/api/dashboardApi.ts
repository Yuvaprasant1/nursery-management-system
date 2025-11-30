import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { DashboardSummary, RecentTransaction } from '../models/types'
import { deduplicateRequest, generateRequestKey } from '@/utils/requestDeduplicator'

export const dashboardApi = {
  getSummary: async (nurseryId: string): Promise<DashboardSummary> => {
    const url = `/dashboard/summary?nurseryId=${nurseryId}`
    const key = generateRequestKey('GET', url, { nurseryId })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<DashboardSummary>>(url)
      return response.data.data
    })
  },
  
  getRecentTransactions: async (nurseryId: string): Promise<RecentTransaction[]> => {
    const url = `/dashboard/recent-transactions?nurseryId=${nurseryId}`
    const key = generateRequestKey('GET', url, { nurseryId })
    
    return deduplicateRequest(key, async () => {
      const response = await apiClient.get<ApiResponse<RecentTransaction[]>>(url)
      return response.data.data
    })
  },
}

