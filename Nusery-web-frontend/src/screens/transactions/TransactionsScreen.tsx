'use client'

import { useState, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionApi } from './api/transactionApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { inventoryApi } from '@/screens/inventory/api/inventoryApi'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { useNursery } from '@/contexts/NurseryContext'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Pagination } from '@/components/Pagination/Pagination'
import { PaginatedResponse } from '@/api/types'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { getErrorMessage } from '@/utils/errors'
import { ButtonAction, ConfirmationVariant, TransactionType } from '@/enums'
import { Transaction } from './models/types'
import { QUERY_KEYS } from '@/constants'
import { formatDateTime } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'

export default function TransactionsScreen() {
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, nursery?.id, currentPage, pageSize],
    queryFn: () => transactionApi.getTransactions(undefined, nursery?.id, currentPage, pageSize),
    enabled: !!nursery?.id,
  })
  
  // Fetch breeds to get breed names
  const { data: breedsData } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, nursery?.id],
    queryFn: () => breedApi.getBreeds(nursery?.id || ''),
    enabled: !!nursery?.id,
  })
  
  // Create breed name map
  const breedNameMap = useMemo(() => {
    if (!breedsData) return new Map<string, string>()
    const breeds = Array.isArray(breedsData) ? breedsData : (breedsData as any).content || []
    return new Map(breeds.map((breed: any) => [breed.id, breed.name]))
  }, [breedsData])
  
  // Check if response is paginated
  const isPaginated = transactionsData && 'content' in transactionsData
  const transactions = useMemo(() => {
    const txs = isPaginated 
      ? (transactionsData as PaginatedResponse<Transaction>).content 
      : (transactionsData as Transaction[] || [])
    
    // Add breed names to transactions
    return txs.map(tx => {
      const breedName = tx.breedName || breedNameMap.get(tx.breedId) || 'Unknown'
      return {
        ...tx,
        breedName: breedName,
      } as Transaction
    })
  }, [transactionsData, isPaginated, breedNameMap])
  
  const paginationData = isPaginated 
    ? (transactionsData as PaginatedResponse<Transaction>) 
    : null
  
  const deleteMutation = useMutation({
    mutationFn: transactionApi.softDeleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVENTORY] })
      toast.success('Transaction deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to delete transaction')
    },
  })
  
  const handleDelete = async (id: string) => {
    try {
      // Fetch transaction details
      const transaction = await transactionApi.getTransaction(id)
      
      // Fetch current inventory for the breed
      const inventory = await inventoryApi.getInventoryByBreed(transaction.breedId)
      
      // Calculate upcoming quantity (compensation reverses the transaction)
      const currentQuantity = inventory.quantity
      const upcomingQuantity = currentQuantity - transaction.delta
      
      // Get breed name
      const breedName = (transaction.breedName ?? breedNameMap.get(transaction.breedId) ?? 'Unknown') as string
      
      // Format transaction type and delta
      const transactionTypeLabel = String(transaction.type)
      const deltaLabel = transaction.delta > 0 ? `+${transaction.delta}` : `${transaction.delta}`
      
      // Create compact quantity preview component
      const quantityPreview: ReactNode = (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Quantity Impact:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Breed:</span>
                <span className="ml-1 font-medium text-gray-900">{breedName}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 font-medium text-gray-900">{transactionTypeLabel}</span>
              </div>
              <div>
                <span className="text-gray-500">Current:</span>
                <span className="ml-1 font-semibold text-gray-900">{currentQuantity}</span>
              </div>
              <div>
                <span className="text-gray-500">Upcoming:</span>
                <span className={cn(
                  'ml-1 font-semibold',
                  upcomingQuantity < 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {upcomingQuantity}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Transaction Delta: </span>
              <span className={cn(
                'text-xs font-semibold',
                transaction.delta > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {deltaLabel}
              </span>
            </div>
          </div>
        </div>
      )
      
      const confirmed = await showConfirmation({
        title: 'Delete Transaction?',
        message: '', // Empty since we're using customContent
        customContent: quantityPreview,
        confirmText: ButtonAction.DELETE,
        cancelText: ButtonAction.CANCEL,
        variant: ConfirmationVariant.DANGER,
      })
      
      if (confirmed) {
        deleteMutation.mutate(id)
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to load transaction details')
    }
  }

  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : transactions && transactions.length > 0 ? (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction: Transaction) => {
                    const isPositive = transaction.delta > 0
                    const isSell = transaction.type === TransactionType.SELL
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.breedName || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
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
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={cn(
                            'font-semibold',
                            isPositive ? 'text-green-600' : 'text-red-600'
                          )}>
                            {isPositive ? '+' : ''}{transaction.delta}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/transactions/${transaction.id}`)}
                            >
                              View
                            </Button>
                            {transaction.type !== TransactionType.COMPENSATION && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(transaction.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? ButtonAction.DELETING : ButtonAction.DELETE}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          
          {/* Pagination */}
          {isPaginated && paginationData && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationData.totalPages}
              totalElements={paginationData.totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(0)
              }}
            />
          )}
        </>
      ) : (
        <Card>
          <p className="text-gray-600 text-center py-8">No transactions found</p>
        </Card>
      )}
    </div>
  )
}

