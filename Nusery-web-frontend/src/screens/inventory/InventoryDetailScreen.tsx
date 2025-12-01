'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Eye } from 'lucide-react'
import { inventoryApi } from './api/inventoryApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { transactionApi } from '@/screens/transactions/api/transactionApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { IntegerInput } from '@/components/IntegerInput'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { useToast } from '@/components/Toaster/useToast'
import { ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { TransactionType, ErrorMessage, SuccessMessage, UIText, ButtonAction, TransactionTypeLabels } from '@/enums'
import { Inventory } from './models/types'
import { Breed } from '@/screens/breeds/models/types'
import { Transaction } from '@/screens/transactions/models/types'
import { formatDateTime } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'
import { Tooltip } from '@/components/Tooltip'

const quantityUpdateSchema = z.object({
  transactionType: z.nativeEnum(TransactionType).optional(),
  quantity: z.number().int(ErrorMessage.QUANTITY_MUST_BE_WHOLE_NUMBER),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.transactionType) {
    // Transaction type will be validated manually in onSubmit
    return
  }
  
  if (data.transactionType === TransactionType.ADJUST) {
    // ADJUST can be positive or negative, but not 0
    if (data.quantity === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ErrorMessage.ADJUSTMENT_QUANTITY_CANNOT_BE_ZERO,
        path: ['quantity'],
      })
    }
  } else {
    // SELL, PLANTED must be positive
    if (data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ErrorMessage.QUANTITY_MUST_BE_GREATER_THAN_ZERO,
        path: ['quantity'],
      })
    }
  }
})

type QuantityUpdateForm = {
  transactionType?: TransactionType
  quantity: number
  notes?: string
}

export default function InventoryDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for inventory API data
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for breed API data
  const [breed, setBreed] = useState<Breed | null>(null)
  const [isLoadingBreed, setIsLoadingBreed] = useState(false)
  
  // State for transactions API data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  
  // Fetch inventory function (single source of truth for data loading)
  const fetchInventory = useCallback(async () => {
    if (!id) return
    
    setIsLoadingInventory(true)
    setError(null)
    
    try {
      const data = await inventoryApi.getInventoryByBreed(id)
      setInventory(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load inventory')
      setError(error)
    } finally {
      setIsLoadingInventory(false)
    }
  }, [id])
  
  // Fetch breed function (for manual refetch)
  const fetchBreed = useCallback(async () => {
    if (!id) return
    
    setIsLoadingBreed(true)
    try {
      const data = await breedApi.getBreed(id)
      setBreed(data)
    } catch (err) {
      console.error('Failed to load breed:', err)
    } finally {
      setIsLoadingBreed(false)
    }
  }, [id])
  
  // Fetch transactions function (for manual refetch)
  const fetchTransactions = useCallback(async () => {
    if (!id) return
    
    setIsLoadingTransactions(true)
    try {
      // Fetch unpaginated transactions for this breed
      const data = await transactionApi.getTransactions(id, undefined)
      // Ensure we have an array
      const transactionsArray = Array.isArray(data) ? data : []
      // Sort by createdAt descending and take only the last 5
      const sortedTransactions = transactionsArray
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setTransactions(sortedTransactions)
    } catch (err) {
      console.error('Failed to load transactions:', err)
      setTransactions([])
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [id])
  
  // Fetch data when component mounts or id changes - delegate to fetch functions
  useEffect(() => {
    if (!id) return

    fetchInventory()
    fetchBreed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Direct dependencies
  
  // Fetch transactions when component mounts
  useEffect(() => {
    if (!id) return

    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Direct dependencies

  const isLoading = isLoadingInventory || isLoadingBreed

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<QuantityUpdateForm>({
    resolver: zodResolver(quantityUpdateSchema),
    defaultValues: {
      transactionType: TransactionType.SELL,
      quantity: 0,
    },
  })

  const transactionType = watch('transactionType') as TransactionType | undefined
  const quantity = watch('quantity')

  // Calculate values before early returns (all hooks must be called before returns)
  const breedName = breed?.name || 'Loading...'
  
  // If inventory doesn't exist yet, create a default one for display
  const displayInventory = inventory || {
    id: '',
    breedId: id!,
    breedName: breedName,
    quantity: 0,
    nurseryId: breed?.nurseryId || '',
  }

  const currentQuantity = displayInventory?.quantity ?? 0

  // Calculate upcoming quantity based on transaction
  const upcomingQuantity = useMemo(() => {
    if (!displayInventory || quantity === undefined || quantity === null) return currentQuantity
    
    const qty = typeof quantity === 'number' && !Number.isNaN(quantity) ? quantity : 0
    
    switch (transactionType) {
      case TransactionType.PLANTED:
        return currentQuantity + qty
      case TransactionType.SELL:
        return currentQuantity - qty
      case TransactionType.ADJUST:
        return currentQuantity + qty // qty can be positive or negative
      default:
        return currentQuantity
    }
  }, [displayInventory, quantity, transactionType, currentQuantity])

  // Validate negative inventory
  const isValidQuantity = useMemo(() => {
    if (quantity === undefined || quantity === null) return false
    return upcomingQuantity >= 0
  }, [upcomingQuantity, quantity])

  if (isLoading) {
    return <LoadingState message="Loading inventory details..." />
  }

  if (error && !inventory) {
    return (
      <ErrorState
        title={ErrorMessage.FAILED_TO_LOAD_INVENTORY}
        message={getErrorMessage(error) || ErrorMessage.INVENTORY_NOT_FOUND}
        onRetry={fetchInventory}
      />
    )
  }

  const onSubmit = async (data: QuantityUpdateForm) => {
    if (!breed || !id) {
      toast.error(ErrorMessage.BREED_INFORMATION_NOT_LOADED)
      return
    }

    if (!data.transactionType) {
      toast.error('Please select a transaction type')
      return
    }

    // Frontend validation: Check if result would be negative
    if (!isValidQuantity) {
      toast.error(`${UIText.INSUFFICIENT_INVENTORY} ${currentQuantity}`)
      return
    }

    // For ADJUST, quantity can be positive or negative
    // For others, quantity is always positive
    if (data.transactionType === TransactionType.ADJUST && data.quantity === 0) {
      toast.error(ErrorMessage.ADJUSTMENT_QUANTITY_CANNOT_BE_ZERO)
      return
    }

    if (data.transactionType !== TransactionType.ADJUST && data.quantity <= 0) {
      toast.error(ErrorMessage.QUANTITY_MUST_BE_GREATER_THAN_ZERO)
      return
    }

    setIsSubmitting(true)
    try {
      await inventoryApi.createTransaction(id, {
        transactionType: data.transactionType,
        quantity: data.quantity,
        notes: data.notes,
      })
      toast.success(SuccessMessage.TRANSACTION_CREATED)
      reset({
        transactionType: TransactionType.SELL,
        quantity: 0,
      })
      fetchInventory() // Refresh inventory data
      fetchTransactions() // Refresh transactions
    } catch (error) {
      toast.error(getErrorMessage(error) || ErrorMessage.FAILED_TO_CREATE_TRANSACTION)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip content="Back to Inventory" position="bottom">
            <Button variant="outline" onClick={() => router.push(ROUTES.INVENTORY)} className="p-2" aria-label="Go back to inventory">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Tooltip>
          <h1 className="text-3xl font-bold text-gray-900">{breedName}</h1>
        </div>
        {breed && (
          <Tooltip content="View Breed Details" position="bottom">
            <Button
              variant="outline"
              onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}?from=inventory&inventoryBreedId=${id}`)}
              className="p-2"
              aria-label="View breed details"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inventory Info & Transaction Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Information */}
          <Card title="Inventory Information">
            <div className="space-y-6">
              {/* Quantity Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-2">{UIText.CURRENT_QUANTITY}</div>
                  <div className={cn(
                    'text-4xl font-bold',
                    currentQuantity < 0 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {currentQuantity.toLocaleString()}
                  </div>
                  {currentQuantity < 0 && (
                    <div className="text-xs mt-2 text-red-600 font-medium">
                      Negative inventory detected
                    </div>
                  )}
                </div>
                {quantity !== undefined && quantity !== 0 && (
                  <div className={cn(
                    'p-6 rounded-lg border-2 transition-all',
                    upcomingQuantity < 0
                      ? 'bg-red-50 border-red-300' 
                      : 'bg-green-50 border-green-300'
                  )}>
                    <div className="text-sm font-medium text-gray-600 mb-2">{UIText.UPCOMING_QUANTITY}</div>
                    <div className={cn(
                      'text-4xl font-bold',
                      upcomingQuantity < 0 ? 'text-red-700' : 'text-green-700'
                    )}>
                      {upcomingQuantity.toLocaleString()}
                    </div>
                    {upcomingQuantity !== currentQuantity && (
                      <div className="text-xs mt-2 text-gray-600">
                        {upcomingQuantity > currentQuantity ? '+' : ''}
                        {(upcomingQuantity - currentQuantity).toLocaleString()} {UIText.UNITS}
                      </div>
                    )}
                    {!isValidQuantity && (
                      <div className="text-xs mt-2 text-red-600 font-medium">
                        ⚠️ Adjustment needed - This would result in negative inventory
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
          {/* Create Transaction Form */}
          <Card title={UIText.CREATE_TRANSACTION}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {UIText.QUANTITY} <span className="text-red-500">*</span>
                </label>
                <IntegerInput
                  min={transactionType === TransactionType.ADJUST ? undefined : 1}
                  defaultValue={0}
                  allowNegative={transactionType === TransactionType.ADJUST}
                  {...register('quantity', {
                    valueAsNumber: true,
                  })}
                  required
                />
              </div>

              {quantity && quantity !== 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {UIText.TRANSACTION_TYPE} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.PLANTED)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left',
                        transactionType === TransactionType.PLANTED
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="text-sm font-semibold text-gray-900">Planted</div>
                      <div className="text-xs text-gray-500 mt-1">Increase inventory</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.SELL)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left',
                        transactionType === TransactionType.SELL
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="text-sm font-semibold text-gray-900">Sell</div>
                      <div className="text-xs text-gray-500 mt-1">Decrease inventory</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.ADJUST)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left',
                        transactionType === TransactionType.ADJUST
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="text-sm font-semibold text-gray-900">Adjust</div>
                      <div className="text-xs text-gray-500 mt-1">Increase or decrease</div>
                    </button>
                  </div>
                  {errors.transactionType && (
                    <p className="mt-2 text-sm text-red-600">{errors.transactionType.message}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {UIText.NOTES_OPTIONAL}
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Add any notes about this transaction..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(ROUTES.INVENTORY)}
                >
                  {ButtonAction.CANCEL}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !quantity || quantity === 0 || !isValidQuantity || !transactionType}
                  isLoading={isSubmitting}
                >
                  {UIText.CREATE_TRANSACTION}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column - Transaction History */}
        <div className="space-y-6">
          <Card title="Transaction History">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Showing recent transactions</span>
                  <button
                    type="button"
                    onClick={() => router.push(`${ROUTES.TRANSACTIONS}?breedId=${id}`)}
                    className="text-primary hover:underline font-medium"
                  >
                    View all for this breed
                  </button>
                </div>
                {transactions.map((transaction) => {
                  const isPositive = transaction.delta > 0
                  const isSell = transaction.type === TransactionType.SELL
                  
                  return (
                    <div
                      key={transaction.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/transactions/${transaction.id}?from=inventory&breedId=${id}`)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
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
                          {TransactionTypeLabels[transaction.type] || String(transaction.type)}
                        </span>
                        <span className={cn(
                          'text-sm font-semibold',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}>
                          {isPositive ? '+' : ''}{transaction.delta}
                        </span>
                      </div>
                      {transaction.reason && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{transaction.reason}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                      {transaction.isDeleted && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                          Deleted
                        </span>
                      )}
                      {transaction.isUndo && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                          Undone
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-gray-400 text-xs mt-1">Transactions will appear here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
