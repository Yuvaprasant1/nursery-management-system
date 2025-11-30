import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { DashboardSummary, RecentTransaction } from '../models/types'

export const dashboardApi = {
  getSummary: async (nurseryId: string): Promise<DashboardSummary> => {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>(`/dashboard/summary?nurseryId=${nurseryId}`)
    return response.data.data
  },
  
  getRecentTransactions: async (nurseryId: string): Promise<RecentTransaction[]> => {
    const response = await apiClient.get<ApiResponse<RecentTransaction[]>>(`/dashboard/recent-transactions?nurseryId=${nurseryId}`)
    return response.data.data
  },
}

