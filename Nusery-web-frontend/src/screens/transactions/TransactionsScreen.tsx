'use client'

import { useState, useMemo, ReactNode, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { ButtonAction, ConfirmationVariant, ErrorMessage, SuccessMessage, TransactionType, UIText } from '@/enums'
import { Transaction } from './models/types'
import { Sapling } from '@/screens/saplings/models/types'
import { Breed } from '@/screens/breeds/models/types'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { SaplingFilter } from '@/components/Filter/SaplingFilter'
import { BreedFilter } from '@/components/Filter/BreedFilter'
import { formatDateTime } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'
import { Eye, Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
export default function TransactionsScreen() {
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const router = useRouter()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const { nursery } = useNursery()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for transactions API data
  const [transactionsData, setTransactionsData] = useState<Transaction[] | PaginatedResponse<Transaction> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  
  // State for breeds API data
  const [breedsData, setBreedsData] = useState<any>(null)

  // State for saplings API data
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)

  // Filter state
  const [selectedSapling, setSelectedSapling] = useState<Sapling | null>(null)
  const [selectedBreed, setSelectedBreed] = useState<Breed | null>(null)
  
  
  // Fetch transactions function (single source of truth for data loading)
  const fetchTransactions = useCallback(async () => {
    if (!nursery?.id) return
    
    setIsLoading(true)
    try {
      const data = await transactionApi.getTransactions(
        selectedBreed?.id,
        nursery.id,
        currentPage,
        pageSize,
        selectedSapling?.id
      )
      setTransactionsData(data)
    } catch (err) {
      toast.error(getErrorMessage(err) || ErrorMessage.UNEXPECTED_ERROR_RETRY)
    } finally {
      setIsLoading(false)
    }
  }, [nursery?.id, currentPage, pageSize, selectedBreed?.id, selectedSapling?.id]) // Removed toast from dependencies - it's stable

  // Fetch breeds function
  const fetchBreeds = useCallback(async () => {
    if (!nursery?.id) return
    
    try {
      const data = await breedApi.getBreeds(nursery.id)
      setBreedsData(data)
    } catch (err) {
      console.error('Failed to load breeds:', err)
    }
  }, [nursery?.id])

  // Fetch saplings function
  const fetchSaplings = useCallback(async () => {
    if (!nursery?.id) return

    try {
      const data = await saplingApi.getAllSaplings(nursery.id)
      setSaplingsData(data)
    } catch (err) {
      console.error('Failed to load saplings:', err)
    }
  }, [nursery?.id])
  
  // Fetch data when dependencies change - delegate to fetch functions to avoid duplication
  useEffect(() => {
    if (!nursery?.id) return

    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id, currentPage, pageSize, selectedBreed?.id, selectedSapling?.id]) // Direct dependencies, toast is stable and doesn't need to be in deps
  
  useEffect(() => {
    if (!nursery?.id) return

    fetchBreeds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id]) // Direct dependencies

  // Fetch saplings on mount
  useEffect(() => {
    if (!nursery?.id) return

    fetchSaplings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nursery?.id])

  // All filtering is now purely driven by in-memory state (no URL sync)

  // Create breed name map
  const breedNameMap = useMemo(() => {
    if (!breedsData) return new Map<string, string>()
    const breeds = Array.isArray(breedsData) ? breedsData : (breedsData as any).content || []
    return new Map(breeds.map((breed: any) => [breed.id, breed.name]))
  }, [breedsData])

  const breeds: Breed[] = useMemo(() => {
    if (!breedsData) return []
    if (Array.isArray(breedsData)) return breedsData as Breed[]
    if ('content' in breedsData) return (breedsData as PaginatedResponse<Breed>).content
    return []
  }, [breedsData])

  const saplings: Sapling[] = useMemo(() => {
    if (!saplingsData) return []
    if (Array.isArray(saplingsData)) return saplingsData as Sapling[]
    if ('content' in saplingsData) return (saplingsData as PaginatedResponse<Sapling>).content
    return []
  }, [saplingsData])
  
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

  const handleSaplingSelect = (sapling: Sapling | null) => {
    setSelectedSapling(sapling)
    // Reset breed if it no longer matches the selected sapling
    if (sapling && selectedBreed && selectedBreed.saplingId !== sapling.id) {
      setSelectedBreed(null)
    }
    setCurrentPage(0)
  }

  const handleBreedSelect = (breed: Breed | null) => {
    setSelectedBreed(breed)
    // If a breed is chosen, align the sapling filter with that breed
    if (breed) {
      const matchingSapling = saplings.find((s) => s.id === breed.saplingId) || null
      setSelectedSapling(matchingSapling)
    }
    setCurrentPage(0)
  }
  
  
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
        setIsDeleting(true)
        try {
          await transactionApi.softDeleteTransaction(id)
          toast.success(SuccessMessage.TRANSACTION_DELETED)
          fetchTransactions() // Refresh the list
        } catch (error) {
          // Error is handled by Axios interceptor
        } finally {
          setIsDeleting(false)
        }
      }
    } catch (error) {
      // Error is handled by Axios interceptor
    }
  }

  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h1>

      {/* Modern Filters */}
      <Card className="p-3 border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Filters
            </p>
            <p className="text-[11px] text-gray-500">
              Narrow down transactions by sapling and breed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaplingFilter
              selectedSapling={selectedSapling}
              onSelect={handleSaplingSelect}
              saplings={saplings}
            />
            <BreedFilter
              breeds={breeds}
              selectedBreed={selectedBreed}
              onSelect={handleBreedSelect}
            />
            {(selectedSapling || selectedBreed) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSapling(null)
                  setSelectedBreed(null)
                  setCurrentPage(0)
                }}
                className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

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
                              : transaction.type === TransactionType.PLANTED
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
                            <Tooltip content="View transaction" position="top">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/transactions/${transaction.id}`)}
                                className="p-2"
                                aria-label="View transaction"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                            {transaction.type !== TransactionType.COMPENSATION && (
                              <>
                                <Tooltip content={isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE} position="top">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(transaction.id)}
                                    disabled={isDeleting}
                                    className="p-2"
                                    aria-label="Delete transaction"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </Tooltip>
                              </>
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
          <p className="text-gray-600 text-center py-8">{UIText.NO_TRANSACTIONS_FOUND}</p>
        </Card>
      )}

    </div>
  )
}
