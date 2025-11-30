'use client'

import { useParams, useRouter } from 'next/navigation'
import { transactionApi } from './api/transactionApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { ROUTES } from '@/constants'
import { useNursery } from '@/contexts/NurseryContext'
import { TransactionType } from '@/enums'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/timeUtils'
import { getErrorMessage } from '@/utils/errors'
import { useState, useEffect, useCallback } from 'react'
import { Transaction } from './models/types'

export default function TransactionDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { nursery } = useNursery()
  
  // State for transaction API data
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for breeds API data
  const [breedsData, setBreedsData] = useState<any>(null)
  
  // Fetch transaction function (for manual refetch)
  const fetchTransaction = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await transactionApi.getTransaction(id)
      setTransaction(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load transaction')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [id])
  
  // Fetch breeds function (for manual refetch)
  const fetchBreeds = useCallback(async () => {
    if (!nursery?.id || !transaction?.breedId) return
    
    try {
      const data = await breedApi.getBreeds(nursery.id)
      setBreedsData(data)
    } catch (err) {
      console.error('Failed to load breeds:', err)
    }
  }, [nursery?.id, transaction?.breedId])
  
  // Fetch data when dependencies change - use direct dependencies
  useEffect(() => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    transactionApi.getTransaction(id)
      .then(data => setTransaction(data))
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to load transaction')
        setError(error)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Direct dependencies
  
  useEffect(() => {
    if (!nursery?.id || !transaction?.breedId) return
    
    breedApi.getBreeds(nursery.id)
      .then(data => setBreedsData(data))
      .catch(err => console.error('Failed to load breeds:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, transaction?.breedId]) // Direct dependencies
  
  const breedName = transaction?.breedName || 
    (breedsData && Array.isArray(breedsData) 
      ? breedsData.find(b => b.id === transaction?.breedId)?.name 
      : (breedsData as any)?.content?.find((b: any) => b.id === transaction?.breedId)?.name) ||
    'Unknown'
  
  if (isLoading) {
    return <LoadingState message="Loading transaction details..." />
  }
  
  if (error || !transaction) {
    return (
      <ErrorState
        title="Failed to load transaction"
        message={error ? getErrorMessage(error) : 'Transaction not found'}
        onRetry={fetchTransaction}
      />
    )
  }

  const isPositive = transaction.delta > 0
  const isSell = transaction.type === TransactionType.SELL

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(ROUTES.TRANSACTIONS)}>
          ← Back to Transactions
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Transaction Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Breed</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{breedName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="mt-1">
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                  isSell
                    ? 'bg-red-100 text-red-800'
                    : transaction.type === TransactionType.RECEIVE || transaction.type === TransactionType.PLANTED
                    ? 'bg-green-100 text-green-800'
                    : transaction.type === TransactionType.ADJUST
                    ? 'bg-yellow-100 text-yellow-800'
                    : transaction.type === TransactionType.COMPENSATION
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {String(transaction.type)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Quantity Delta</label>
              <p className={cn(
                'text-2xl font-bold mt-1',
                isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? '+' : ''}{transaction.delta}
              </p>
            </div>
            {transaction.reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-gray-900 mt-1">{transaction.reason}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Additional Information">
          <div className="space-y-4">
            {transaction.userPhone && (
              <div>
                <label className="text-sm font-medium text-gray-500">User Phone</label>
                <p className="text-gray-900 mt-1">{transaction.userPhone}</p>
              </div>
            )}
            {transaction.reversedByTxnId && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reversed By Transaction</label>
                <p className="text-gray-900 mt-1">{transaction.reversedByTxnId}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-gray-900 mt-1">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900 mt-1">
                {formatDateTime(transaction.updatedAt)}
              </p>
            </div>
            {transaction.isUndo && (
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900 mt-1">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    Undone
                  </span>
                </p>
              </div>
            )}
            {transaction.isDeleted && (
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900 mt-1">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    Deleted
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
