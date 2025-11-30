'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './api/dashboardApi'
import { Card } from '@/components/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { TransactionType } from '@/enums'
import { formatRelativeTime } from '@/utils/timeUtils'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { nursery } = useNursery()
  
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', nursery?.id],
    queryFn: () => dashboardApi.getSummary(nursery!.id),
    enabled: !!nursery?.id,
  })
  
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['dashboard-recent-transactions', nursery?.id],
    queryFn: () => dashboardApi.getRecentTransactions(nursery!.id),
    enabled: !!nursery?.id,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 gradient-text">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.phone}</p>
        </div>
        {nursery?.name && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-700">{nursery.name}</span>
          </div>
        )}
      </div>
      
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Saplings */}
        <Card className="card-hover bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Saplings</p>
              <p className="text-5xl font-bold text-blue-900 mt-2">
                {summaryLoading ? '...' : summary?.totalSaplingCount?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-blue-600 mt-2">No. of saplings available</p>
            </div>
            <div className="text-6xl opacity-30">🌱</div>
          </div>
        </Card>
        
        {/* Total Sales - Compact breakdown */}
        <Card className="card-hover bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-green-200 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-1">Total Sales</p>
              <p className="text-5xl font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesAllTime?.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-6xl opacity-30">💰</div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200">
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-xs text-green-600 font-medium mb-1">Last 48hrs</p>
              <p className="text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLast48Hours?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-xs text-green-600 font-medium mb-1">Last Month</p>
              <p className="text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLastMonth?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-xs text-green-600 font-medium mb-1">Last Year</p>
              <p className="text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLastYear?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-2.5">
              <p className="text-xs text-green-600 font-medium mb-1">All Time</p>
              <p className="text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesAllTime?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Total Inventory */}
        <Card className="card-hover bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 border-purple-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-1">Total Inventory</p>
              <p className="text-5xl font-bold text-purple-900 mt-2">
                {summaryLoading ? '...' : summary?.totalInventoryQuantity?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-purple-600 mt-2">Quantity count (delta)</p>
            </div>
            <div className="text-6xl opacity-30">📦</div>
          </div>
        </Card>
      </div>
      
      {/* Recent Transactions */}
      <Card title="Recent Transactions (Last 48 Hours)" className="card-hover shadow-lg">
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentTransactions && recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Breed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.breedName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === TransactionType.SELL 
                          ? 'bg-green-100 text-green-800' 
                          : transaction.type === TransactionType.RECEIVE || transaction.type === TransactionType.PLANTED
                          ? 'bg-blue-100 text-blue-800'
                          : transaction.type === TransactionType.ADJUST
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {transaction.delta != null ? Math.abs(transaction.delta).toLocaleString() : 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {transaction.createdAt ? formatRelativeTime(transaction.createdAt) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No recent transactions in the last 48 hours</p>
          </div>
        )}
      </Card>
    </div>
  )
}

