'use client'

import { useState, useEffect,useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { inventoryApi } from './api/inventoryApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ErrorState } from '@/components/Error/ErrorState'
import { useToast } from '@/components/Toaster/useToast'
import { ROUTES, QUERY_KEYS } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { TransactionType, ErrorMessage, SuccessMessage, UIText, ButtonAction } from '@/enums'

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
    // SELL, RECEIVE, PLANTED must be positive
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
  const queryClient = useQueryClient()

  const { data: inventory, isLoading: isLoadingInventory, error, refetch, isError } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryApi.getInventoryByBreed(id!),
    enabled: !!id,
    retry: 1,
  })

  const { data: breed, isLoading: isLoadingBreed } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, id],
    queryFn: () => breedApi.getBreed(id!),
    enabled: !!id,
  })

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
      quantity: 0,
    },
  })

  const transactionType = watch('transactionType') as TransactionType | undefined
  const quantity = watch('quantity')

  // Update form when inventory loads
  useEffect(() => {
    if (inventory) {
      reset({
        quantity: 0,
      })
    }
  }, [inventory, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: { transactionType: TransactionType; quantity: number; notes?: string }) => {
      if (!id) throw new Error('Breed ID not found')
      await inventoryApi.createTransaction(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', id] })
      toast.success(SuccessMessage.TRANSACTION_CREATED)
      reset({
        quantity: 0,
      })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || ErrorMessage.FAILED_TO_CREATE_TRANSACTION)
    },
  })

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
    
    const qty = quantity || 0
    
    switch (transactionType) {
      case TransactionType.RECEIVE:
      case TransactionType.PLANTED:
        return currentQuantity + qty
      case TransactionType.SELL:
        return Math.max(0, currentQuantity - qty)
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError && !inventory) {
    return (
      <ErrorState
        title={ErrorMessage.FAILED_TO_LOAD_INVENTORY}
        message={getErrorMessage(error) || ErrorMessage.INVENTORY_NOT_FOUND}
        onRetry={() => refetch()}
      />
    )
  }

  const onSubmit = (data: QuantityUpdateForm) => {
    if (!breed) {
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

    updateMutation.mutate({
      transactionType: data.transactionType,
      quantity: data.quantity,
      notes: data.notes,
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <Button variant="outline" onClick={() => router.push(ROUTES.INVENTORY)}>
        {UIText.BACK_TO_INVENTORY}
      </Button>

      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{breedName}</h1>
            
            {/* Quantity Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">{UIText.CURRENT_QUANTITY}</div>
                <div className="text-3xl font-bold text-gray-900">
                  {currentQuantity.toLocaleString()}
                </div>
              </div>
              {quantity !== undefined && quantity !== 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  upcomingQuantity >= currentQuantity 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="text-sm font-medium text-gray-600 mb-1">{UIText.UPCOMING_QUANTITY}</div>
                  <div className={`text-3xl font-bold ${
                    upcomingQuantity >= currentQuantity ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {upcomingQuantity.toLocaleString()}
                  </div>
                  {upcomingQuantity !== currentQuantity && (
                    <div className="text-xs mt-1 text-gray-500">
                      {upcomingQuantity > currentQuantity ? '+' : ''}
                      {(upcomingQuantity - currentQuantity).toLocaleString()} {UIText.UNITS}
                    </div>
                  )}
                  {!isValidQuantity && (
                    <div className="text-xs mt-2 text-red-600 font-medium">
                      {UIText.WOULD_RESULT_IN_NEGATIVE_INVENTORY}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{UIText.CREATE_TRANSACTION}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {UIText.QUANTITY} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  min={transactionType === TransactionType.ADJUST ? undefined : '1'}
                  {...register('quantity', {
                    valueAsNumber: true,
                    onChange: (e) => {
                      // Reset transaction type when quantity changes
                      const newQuantity = parseFloat(e.target.value) || 0
                      if (newQuantity !== quantity) {
                        setValue('transactionType', undefined, { shouldValidate: false })
                      }
                    }
                  })}
                  error={errors.quantity?.message}
                  required
                  className="text-lg"
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
                      onClick={() => setValue('transactionType', TransactionType.RECEIVE)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        transactionType === TransactionType.RECEIVE
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">Receive</div>
                      <div className="text-xs text-gray-500 mt-1">Increase inventory</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.PLANTED)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        transactionType === TransactionType.PLANTED
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">Planted</div>
                      <div className="text-xs text-gray-500 mt-1">Increase inventory</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.SELL)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        transactionType === TransactionType.SELL
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">Sell</div>
                      <div className="text-xs text-gray-500 mt-1">Decrease inventory</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('transactionType', TransactionType.ADJUST)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        transactionType === TransactionType.ADJUST
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
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
                  disabled={updateMutation.isPending || !quantity || quantity === 0 || !isValidQuantity || !transactionType}
                  isLoading={updateMutation.isPending}
                >
                  {UIText.CREATE_TRANSACTION}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}

