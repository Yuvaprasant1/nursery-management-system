'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from './api/dashboardApi'
import { Card } from '@/components/Card'
import { ResponsiveGrid } from '@/components/ResponsiveGrid'
import { ResponsiveTable, TableColumn } from '@/components/ResponsiveTable'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { TransactionType } from '@/enums'
import { formatRelativeTime } from '@/utils/timeUtils'
import { DashboardSummary, RecentTransaction } from './models/types'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { Sprout, DollarSign, Package } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { nursery } = useNursery()
  
  // State for summary API data
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  
  // State for recent transactions API data
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[] | null>(null)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  
  // Fetch summary function (for manual refetch)
  const fetchSummary = useCallback(async () => {
    if (!nursery?.id) return
    
    setSummaryLoading(true)
    try {
      const data = await dashboardApi.getSummary(nursery.id)
      setSummary(data)
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)
    } finally {
      setSummaryLoading(false)
    }
  }, [nursery?.id])
  
  // Fetch recent transactions function (for manual refetch)
  const fetchRecentTransactions = useCallback(async () => {
    if (!nursery?.id) return
    
    setTransactionsLoading(true)
    try {
      const data = await dashboardApi.getRecentTransactions(nursery.id)
      setRecentTransactions(data)
    } catch (err) {
      console.error('Failed to load recent transactions:', err)
    } finally {
      setTransactionsLoading(false)
    }
  }, [nursery?.id])
  
  // Fetch data when component mounts or nursery changes - use direct dependencies
  useEffect(() => {
    if (!nursery?.id) return
    
    setSummaryLoading(true)
    dashboardApi.getSummary(nursery.id)
      .then(data => setSummary(data))
      .catch(err => console.error('Failed to load dashboard summary:', err))
      .finally(() => setSummaryLoading(false))
    
    setTransactionsLoading(true)
    dashboardApi.getRecentTransactions(nursery.id)
      .then(data => setRecentTransactions(data))
      .catch(err => console.error('Failed to load recent transactions:', err))
      .finally(() => setTransactionsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id]) // Direct dependencies

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 gradient-text">Dashboard</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1">Welcome back, {user?.phone}</p>
        </div>
        {nursery?.name && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-700">{nursery.name}</span>
          </div>
        )}
      </div>
      
      {/* Main Summary Cards */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
        {/* Total Saplings */}
        <Card className="card-hover bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-blue-700 uppercase tracking-wide mb-0.5 sm:mb-1">Total Saplings</p>
              <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900 mt-1 sm:mt-2">
                {summaryLoading ? '...' : summary?.totalSaplingCount?.toLocaleString() || 0}
              </p>
              <p className="text-[9px] sm:text-xs text-blue-600 mt-1 sm:mt-2">Saplings available</p>
            </div>
            <Tooltip content="Total Saplings" position="left">
              <div className="opacity-30">
                <Sprout className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-blue-700" />
              </div>
            </Tooltip>
          </div>
        </Card>
        
        {/* Total Sales - Compact breakdown */}
        <Card className="card-hover bg-gradient-to-br from-green-50 via-green-100 to-green-50 border-green-200 shadow-lg">
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div>
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-green-700 uppercase tracking-wide mb-0.5 sm:mb-1">Total Sales</p>
              <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesAllTime?.toLocaleString() || 0}
              </p>
            </div>
            <Tooltip content="Total Sales" position="left">
              <div className="opacity-30">
                <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-700" />
              </div>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 pt-2 sm:pt-3 border-t border-green-200">
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 md:p-2.5">
              <p className="text-[9px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">48hrs</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLast48Hours?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 md:p-2.5">
              <p className="text-[9px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">Month</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLastMonth?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 md:p-2.5">
              <p className="text-[9px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">Year</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesLastYear?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-1.5 sm:p-2 md:p-2.5">
              <p className="text-[9px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">All Time</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-green-900">
                {summaryLoading ? '...' : summary?.salesAllTime?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Total Inventory */}
        <Card className="card-hover bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 border-purple-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-purple-700 uppercase tracking-wide mb-0.5 sm:mb-1">Total Inventory</p>
              <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-purple-900 mt-1 sm:mt-2">
                {summaryLoading ? '...' : summary?.totalInventoryQuantity?.toLocaleString() || 0}
              </p>
              <p className="text-[9px] sm:text-xs text-purple-600 mt-1 sm:mt-2">Qty (delta)</p>
            </div>
            <Tooltip content="Total Inventory" position="left">
              <div className="opacity-30">
                <Package className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-purple-700" />
              </div>
            </Tooltip>
          </div>
        </Card>
      </ResponsiveGrid>
      
      {/* Recent Transactions */}
      <Card title="Recent Transactions (Last 48 Hours)" className="card-hover shadow-lg">
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : recentTransactions && recentTransactions.length > 0 ? (
          <ResponsiveTable
            columns={[
              {
                key: 'breedName',
                header: 'Breed',
                accessor: (tx) => tx.breedName || 'Unknown',
              },
              {
                key: 'type',
                header: 'Type',
                render: (_, tx) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    tx.type === TransactionType.SELL 
                      ? 'bg-green-100 text-green-800' 
                      : tx.type === TransactionType.PLANTED
                      ? 'bg-blue-100 text-blue-800'
                      : tx.type === TransactionType.ADJUST
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tx.type}
                  </span>
                ),
              },
              {
                key: 'delta',
                header: 'Quantity',
                render: (_, tx) => tx.delta != null ? Math.abs(tx.delta).toLocaleString() : 0,
                className: 'font-bold',
              },
              {
                key: 'createdAt',
                header: 'Time',
                render: (_, tx) => tx.createdAt ? formatRelativeTime(tx.createdAt) : 'N/A',
              },
            ] as TableColumn<RecentTransaction>[]}
            data={recentTransactions}
            emptyMessage="No recent transactions in the last 48 hours"
            loadingComponent={<div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No recent transactions in the last 48 hours</p>
          </div>
        )}
      </Card>
    </div>
  )
}
