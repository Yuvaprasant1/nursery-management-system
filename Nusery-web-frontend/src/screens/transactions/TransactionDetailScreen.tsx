'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { transactionApi } from './api/transactionApi'
import { paymentApi } from '@/screens/payments/api/paymentApi'
import { breedApi } from '@/screens/breeds/api/breedApi'
import { inventoryApi } from '@/screens/inventory/api/inventoryApi'
import { ResponsiveDetailHeader } from '@/components/ResponsiveDetailCard'
import { ResponsiveDetailCard, ResponsiveDetailGrid } from '@/components/ResponsiveDetailCard'
import { Tabs } from '@/components/Tabs'
import { IconButton } from '@/components/IconButton'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal/Modal'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { ROUTES } from '@/constants'
import { useNursery } from '@/contexts/NurseryContext'
import { useToast } from '@/components/Toaster/useToast'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { TransactionType, PaymentType, ButtonAction, ConfirmationVariant } from '@/enums'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/timeUtils'
import { getErrorMessage } from '@/utils/errors'
import { useState, useEffect, useCallback } from 'react'
import { Transaction, TransactionRequest } from './models/types'
import { Payment, PaymentRequest } from '@/screens/payments/models/types'
import { useForm } from 'react-hook-form'
import { IntegerInput } from '@/components/IntegerInput'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'

export default function TransactionDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { nursery } = useNursery()
  const toast = useToast()
  const { showConfirmation } = useConfirmationDialog()
  
  // State for transaction API data
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for breeds API data
  const [breedsData, setBreedsData] = useState<any>(null)
  
  // State for payments
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  
  // State for inventory (for edit validation)
  const [currentInventory, setCurrentInventory] = useState<number | null>(null)
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingPayment, setIsDeletingPayment] = useState<string | null>(null)
  
  // Edit transaction form
  const { register: registerEdit, handleSubmit: handleEditSubmit, formState: { errors: editErrors }, watch: watchEdit, setValue: setEditValue, reset: resetEdit } = useForm<TransactionRequest>({
    defaultValues: {
      delta: 0,
      type: TransactionType.SELL,
    }
  })
  
  const editQuantity = watchEdit('delta')
  const editType = watchEdit('type')
  
  // Payment form - simplified to only Amount and Description
  const { register: registerPayment, handleSubmit: handlePaymentSubmit, formState: { errors: paymentErrors }, reset: resetPayment } = useForm<{ amount: string; description?: string }>({
    defaultValues: {
      amount: '0',
      description: '',
    }
  })
  
  // Fetch transaction function (for manual refetch)
  const fetchTransaction = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await transactionApi.getTransaction(id)
      setTransaction(data)
      
      // Reset edit form with transaction data
      resetEdit({
        delta: Math.abs(data.delta),
        type: data.type,
        reason: data.reason,
      })
      
      // Fetch inventory for validation
      try {
        const inventory = await inventoryApi.getInventoryByBreed(data.breedId)
        setCurrentInventory(inventory.quantity)
      } catch (err) {
        console.error('Failed to load inventory:', err)
        setCurrentInventory(null)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load transaction')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [id, resetEdit])
  
  // Fetch payments function
  const fetchPayments = useCallback(async () => {
    if (!id) return
    
    setIsLoadingPayments(true)
    try {
      const data = await paymentApi.getPaymentsByTransaction(id)
      setPayments(data)
    } catch (err) {
      console.error('Failed to load payments:', err)
      setPayments([])
    } finally {
      setIsLoadingPayments(false)
    }
  }, [id])
  
  // Fetch breeds function
  const fetchBreeds = useCallback(async () => {
    if (!nursery?.id || !transaction?.breedId) return
    
    try {
      const data = await breedApi.getBreeds(nursery.id)
      setBreedsData(data)
    } catch (err) {
      console.error('Failed to load breeds:', err)
    }
  }, [nursery?.id, transaction?.breedId])
  
  // Fetch data when dependencies change
  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])
  
  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])
  
  useEffect(() => {
    fetchBreeds()
  }, [fetchBreeds])
  
  // Calculate canEdit before early returns
  const canEdit = transaction?.type !== TransactionType.COMPENSATION
  
  // Auto-open edit modal if edit=true in query params
  useEffect(() => {
    const editParam = searchParams.get('edit')
    if (editParam === 'true' && transaction && canEdit) {
      setIsEditModalOpen(true)
    }
  }, [searchParams, transaction, canEdit])
  
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
  
  // Calculate upcoming quantity for edit preview
  const calculateUpcomingQuantity = () => {
    if (currentInventory === null || editQuantity === undefined) return null
    const currentDelta = transaction.delta
    const newDelta = editType === TransactionType.SELL 
      ? -Math.abs(editQuantity || 0)
      : editType === TransactionType.PLANTED
      ? Math.abs(editQuantity || 0)
      : editQuantity || 0
    const deltaChange = newDelta - currentDelta
    return currentInventory + deltaChange
  }
  
  const upcomingQuantity = calculateUpcomingQuantity()
  const isValidEdit = upcomingQuantity !== null && upcomingQuantity >= 0

  const handleBack = () => {
    const from = searchParams.get('from')
    const breedId = searchParams.get('breedId')

    if (from === 'inventory' && breedId) {
      router.push(`${ROUTES.INVENTORY}/${breedId}`)
    } else {
      router.push(ROUTES.TRANSACTIONS)
    }
  }
  
  // Handle edit transaction
  const onEditSubmit = async (data: TransactionRequest) => {
    if (!transaction || !id) return
    
    if (!isValidEdit) {
      toast.error('Edit would result in negative inventory')
      return
    }
    
    setIsSubmitting(true)
    try {
      await transactionApi.updateTransaction(id, data)
      toast.success('Transaction updated successfully')
      setIsEditModalOpen(false)
      fetchTransaction()
      fetchPayments()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to update transaction')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle payment submit - simplified form with only Amount and Description
  const onPaymentSubmit = async (data: { amount: string; description?: string }) => {
    if (!id) return
    
    const amount = parseFloat(data.amount) || 0
    
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    // Default to INCOME type for new payments, keep existing type for edits
    const paymentData: PaymentRequest = {
      transactionId: id,
      type: editingPayment?.type || PaymentType.INCOME,
      amount: amount,
      description: data.description || undefined,
    }
    
    setIsSubmitting(true)
    try {
      if (editingPayment) {
        await paymentApi.updatePayment(editingPayment.id, paymentData)
        toast.success('Payment updated successfully')
      } else {
        await paymentApi.createPayment(id, paymentData)
        toast.success('Payment created successfully')
      }
      setIsPaymentModalOpen(false)
      setEditingPayment(null)
      resetPayment({ amount: '0', description: '' })
      fetchPayments()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to save payment')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle delete payment
  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Payment?',
      message: 'Are you sure you want to delete this payment? This action cannot be undone.',
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      setIsDeletingPayment(paymentId)
      try {
        await paymentApi.deletePayment(paymentId)
        toast.success('Payment deleted successfully')
        fetchPayments()
      } catch (err) {
        toast.error(getErrorMessage(err) || 'Failed to delete payment')
      } finally {
        setIsDeletingPayment(null)
      }
    }
  }
  
  // Helper function to safely format currency amount
  const formatCurrency = (amount: number | null | undefined): string => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0))
    if (isNaN(numAmount)) return '₹0.00'
    return `₹${numAmount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }
  
  // Calculate total payment amount
  const totalPaymentAmount = payments.reduce((sum, p) => {
    const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount || 0))
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)

  // Transaction Details Tab Content
  const transactionDetailsContent = (
    <ResponsiveDetailGrid columns={{ mobile: 1, tablet: 1, desktop: 3 }}>
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        <ResponsiveDetailCard
          title="Transaction Information"
          sections={[
            { label: 'Breed', value: breedName },
            {
              label: 'Type',
              value: (
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
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
              ),
            },
            {
              label: 'Quantity Delta',
              value: (
                <span className={cn(
                  'text-xl sm:text-2xl font-bold',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {isPositive ? '+' : ''}{transaction.delta}
                </span>
              ),
            },
            ...(transaction.reason ? [{ label: 'Reason', value: transaction.reason }] : []),
          ]}
        />
      </div>

      <ResponsiveDetailCard
        title="Additional Information"
        sections={[
          ...(transaction.userPhone ? [{ label: 'User Phone', value: transaction.userPhone }] : []),
          ...(transaction.reversedByTxnId ? [{ label: 'Reversed By Transaction', value: transaction.reversedByTxnId }] : []),
          { label: 'Created At', value: formatDateTime(transaction.createdAt) },
          { label: 'Last Updated', value: formatDateTime(transaction.updatedAt) },
          ...(transaction.isUndo ? [{ label: 'Status', value: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Undone</span> }] : []),
          ...(transaction.isDeleted ? [{ label: 'Status', value: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Deleted</span> }] : []),
        ]}
      />
    </ResponsiveDetailGrid>
  )

  // Payment Details Tab Content
  const paymentDetailsContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Summary */}
      <Card>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(totalPaymentAmount)}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-600">Count</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Payment Button */}
      <div className="flex justify-end">
        <IconButton
          action="add"
          onClick={() => {
            setEditingPayment(null)
            resetPayment({ amount: '0', description: '' })
            setIsPaymentModalOpen(true)
          }}
          label="Add Payment"
          size="md"
        />
      </div>

      {/* Payments List */}
      {isLoadingPayments ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <p className="text-gray-600 text-center py-8">No payments found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      payment.type === PaymentType.INCOME
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}>
                      {payment.type}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  {payment.description && (
                    <p className="text-sm text-gray-600">{payment.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDateTime(payment.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <IconButton
                    action="edit"
                    onClick={() => {
                      setEditingPayment(payment)
                      resetPayment({
                        amount: String(payment.amount || 0),
                        description: payment.description || '',
                      })
                      setIsPaymentModalOpen(true)
                    }}
                    size="sm"
                    title="Edit Payment"
                  />
                  <IconButton
                    action="delete"
                    onClick={() => handleDeletePayment(payment.id)}
                    disabled={isDeletingPayment === payment.id}
                    isLoading={isDeletingPayment === payment.id}
                    size="sm"
                    title="Delete Payment"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <ResponsiveDetailHeader
        title="Transaction Details"
        backAction={{
          label: 'Back',
          onClick: handleBack,
        }}
        actions={
          canEdit
            ? [
                {
                  action: 'edit',
                  label: 'Edit Transaction',
                  onClick: () => setIsEditModalOpen(true),
                  variant: 'primary',
                },
              ]
            : undefined
        }
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'transaction',
            label: 'Transaction Details',
            content: transactionDetailsContent,
          },
          {
            id: 'payments',
            label: 'Payment Details',
            content: paymentDetailsContent,
          },
        ]}
        defaultTab="transaction"
      />

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Transaction"
        size="lg"
      >
        <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Breed <span className="text-gray-400">(Cannot be changed)</span>
            </label>
            <Input
              value={breedName}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <select
              {...registerEdit('type', { required: 'Transaction type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={TransactionType.SELL}>Sell</option>
              <option value={TransactionType.PLANTED}>Planted</option>
              <option value={TransactionType.ADJUST}>Adjust</option>
            </select>
            {editErrors.type && (
              <p className="mt-1 text-sm text-red-600">{editErrors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <IntegerInput
              {...registerEdit('delta', {
                required: 'Quantity is required',
                validate: (value) => {
                  const numValue = Number(value)
                  if (isNaN(numValue)) {
                    return 'Quantity must be a valid number'
                  }
                  if (editType === TransactionType.ADJUST) {
                    // Allow any integer for ADJUST type
                    return true
                  }
                  if (numValue <= 0) {
                    return 'Quantity must be greater than 0'
                  }
                  return true
                },
                valueAsNumber: true,
              })}
              min={editType === TransactionType.ADJUST ? undefined : 1}
              allowNegative={editType === TransactionType.ADJUST}
            />
            {editErrors.delta && (
              <p className="mt-1 text-sm text-red-600">{editErrors.delta.message}</p>
            )}
          </div>

          {upcomingQuantity !== null && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Inventory</p>
                  <p className="text-lg font-bold text-gray-900">{currentInventory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upcoming Inventory</p>
                  <p className={cn(
                    'text-lg font-bold',
                    isValidEdit ? 'text-green-600' : 'text-red-600'
                  )}>
                    {upcomingQuantity}
                  </p>
                </div>
              </div>
              {!isValidEdit && (
                <p className="mt-2 text-sm text-red-600">
                  This edit would result in negative inventory
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              {...registerEdit('reason')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this transaction..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <IconButton
              action="cancel"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
              label="Cancel"
              showLabel={true}
              variant="outline"
            />
            <IconButton
              action="save"
              type="submit"
              disabled={isSubmitting || !isValidEdit}
              isLoading={isSubmitting}
              label={isSubmitting ? 'Updating...' : 'Update Transaction'}
              showLabel={true}
              variant="primary"
            />
          </div>
        </form>
      </Modal>

      {/* Payment Modal - Simplified: Only Amount and Description */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setEditingPayment(null)
          resetPayment({ amount: '0', description: '' })
        }}
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
        size="md"
      >
        <form onSubmit={handlePaymentSubmit(onPaymentSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...registerPayment('amount', {
                required: 'Amount is required',
                validate: (value) => {
                  const numValue = parseFloat(value)
                  if (isNaN(numValue)) {
                    return 'Amount must be a valid number'
                  }
                  if (numValue <= 0) {
                    return 'Amount must be greater than 0'
                  }
                  return true
                },
              })}
              placeholder="0.00"
            />
            {paymentErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{paymentErrors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              {...registerPayment('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter payment description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <IconButton
              action="cancel"
              type="button"
              onClick={() => {
                setIsPaymentModalOpen(false)
                setEditingPayment(null)
                resetPayment({ amount: '0', description: '' })
              }}
              disabled={isSubmitting}
              label="Cancel"
              showLabel={true}
              variant="outline"
            />
            <IconButton
              action="save"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              label={isSubmitting ? 'Saving...' : editingPayment ? 'Update Payment' : 'Create Payment'}
              showLabel={true}
              variant="primary"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
