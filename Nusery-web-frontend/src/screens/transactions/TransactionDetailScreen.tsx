'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { transactionApi } from './api/transactionApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { ROUTES, QUERY_KEYS } from '@/constants'
import { useNursery } from '@/contexts/NurseryContext'
import { TransactionType } from '@/enums'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/timeUtils'

export default function TransactionDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { nursery } = useNursery()
  
  const { data: transaction, isLoading, error, refetch, isError } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, id],
    queryFn: () => transactionApi.getTransaction(id!),
    enabled: !!id,
    retry: 1,
  })
  
  // Fetch breed name if needed
  const { data: breedsData } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, nursery?.id],
    queryFn: () => breedApi.getBreeds(nursery?.id || ''),
    enabled: !!nursery?.id && !!transaction?.breedId,
  })
  
  const breedName = transaction?.breedName || 
    (breedsData && Array.isArray(breedsData) 
      ? breedsData.find(b => b.id === transaction?.breedId)?.name 
      : (breedsData as any)?.content?.find((b: any) => b.id === transaction?.breedId)?.name) ||
    'Unknown'
  
  if (isLoading) {
    return <LoadingState message="Loading transaction details..." />
  }
  
  if (isError) {
    return (
      <ErrorState
        title="Failed to load transaction"
        message={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={() => refetch()}
      />
    )
  }
  
  if (!transaction) {
    return (
      <ErrorState
        title="Transaction not found"
        message="The transaction you're looking for doesn't exist or has been removed."
        showRetry={false}
      />
    )
  }
  
  const isPositive = transaction.delta > 0
  const isSell = transaction.type === TransactionType.SELL
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <Button variant="outline" onClick={() => router.push(ROUTES.TRANSACTIONS)}>
        ← Back to Transactions
      </Button>
      
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaction Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Breed</dt>
              <dd className="text-base text-gray-900 font-semibold">{breedName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Transaction Type</dt>
              <dd className="text-base text-gray-900">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
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
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Delta</dt>
              <dd className="text-base text-gray-900">
                <span className={cn(
                  'font-semibold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {isPositive ? '+' : ''}{transaction.delta}
                </span>
              </dd>
            </div>
            {transaction.reason && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Reason</dt>
                <dd className="text-base text-gray-900">{transaction.reason}</dd>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {transaction.userPhone && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">User Phone</dt>
                <dd className="text-base text-gray-900 font-mono text-sm">{transaction.userPhone}</dd>
              </div>
            )}
            {transaction.reversedByTxnId && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Reversed By Transaction</dt>
                <dd className="text-base text-gray-900 font-mono text-sm">{transaction.reversedByTxnId}</dd>
              </div>
            )}
            {transaction.isUndo && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Is Undo</dt>
                <dd className="text-base text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Yes
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Created At</dt>
              <dd className="text-base text-gray-900">
                {formatDateTime(transaction.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Updated At</dt>
              <dd className="text-base text-gray-900">
                {formatDateTime(transaction.updatedAt)}
              </dd>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

