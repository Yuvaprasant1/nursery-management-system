'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { ResponsiveDetailHeader, ResponsiveDetailCard, ResponsiveDetailGrid } from '@/components/ResponsiveDetailCard'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { ButtonAction, ConfirmationVariant } from '@/enums'
import { Breed } from './models/types'
import { Sapling } from '@/screens/saplings/models/types'

export default function BreedDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for breed API data
  const [breed, setBreed] = useState<Breed | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for sapling API data
  const [sapling, setSapling] = useState<Sapling | null>(null)
  
  // Fetch breed function (for manual refetch)
  const fetchBreed = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await breedApi.getBreed(id)
      setBreed(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load breed')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // Fetch sapling function (for manual refetch)
  const fetchSapling = useCallback(async (saplingId: string) => {
    try {
      const data = await saplingApi.getSapling(saplingId)
      setSapling(data)
    } catch (err) {
      console.error('Failed to load sapling:', err)
    }
  }, [])
  
  // Fetch breed when component mounts or id changes - use direct dependencies
  useEffect(() => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    breedApi.getBreed(id)
      .then(data => setBreed(data))
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to load breed')
        setError(error)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Direct dependencies
  
  // Fetch sapling when breed is loaded - use direct dependencies
  useEffect(() => {
    if (!breed?.saplingId) return
    
    saplingApi.getSapling(breed.saplingId)
      .then(data => setSapling(data))
      .catch(err => console.error('Failed to load sapling:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breed?.saplingId]) // Direct dependencies
  
  const handleDelete = async () => {
    if (!breed || !id) return
    
    const confirmed = await showConfirmation({
      title: 'Delete Breed?',
      message: `Are you sure you want to delete "${breed.name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        // Check if breed has transactions before deleting
        const hasTransactions = await breedApi.checkHasTransactions(id)
        if (hasTransactions) {
          toast.error('Cannot delete breed with existing transactions')
          return
        }
        await breedApi.deleteBreed(id)
        toast.success('Breed deleted successfully')
        router.push(ROUTES.BREEDS)
      } catch (error) {
        // Error is handled by Axios interceptor
        // Special case: check for transaction-related errors
        const errorMessage = getErrorMessage(error)
        if (errorMessage.includes('transactions')) {
          toast.error('Cannot delete breed with existing transactions')
        }
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading breed details..." />
  }

  if (error || !breed) {
    return (
      <ErrorState
        title="Failed to load breed"
        message={error ? getErrorMessage(error) : 'Breed not found'}
        onRetry={fetchBreed}
      />
    )
  }

  const handleBack = () => {
    const from = searchParams.get('from')
    const inventoryBreedId = searchParams.get('inventoryBreedId')

    if (from === 'inventory' && inventoryBreedId) {
      router.push(`${ROUTES.INVENTORY}/${inventoryBreedId}`)
    } else {
      router.push(ROUTES.BREEDS)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <ResponsiveDetailHeader
        title={breed.name}
        backAction={{
          label: 'Back',
          onClick: handleBack,
        }}
        actions={[
          {
            action: 'edit',
            label: 'Edit',
            onClick: () => router.push(`${ROUTES.BREEDS}/${breed.id}/edit`),
            variant: 'outline',
          },
          {
            action: 'delete',
            label: isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE,
            onClick: handleDelete,
            variant: 'danger',
            disabled: isDeleting,
          },
        ]}
      />

      <ResponsiveDetailGrid columns={{ mobile: 1, tablet: 1, desktop: 2 }}>
        <ResponsiveDetailCard
          title="Basic Information"
          sections={[
            { label: 'Name', value: breed.name },
            ...(breed.description ? [{ label: 'Description', value: breed.description }] : []),
            { label: 'Sapling', value: sapling?.name || 'Loading...' },
            { label: 'Mode', value: breed.mode || 'INDIVIDUAL' },
            ...(breed.mode === 'SLOT' && breed.itemsPerSlot 
              ? [{ label: 'Items Per Slot', value: breed.itemsPerSlot.toString() }] 
              : []),
          ]}
        />

        <ResponsiveDetailCard
          title="Additional Information"
          sections={[
            { label: 'Created At', value: new Date(breed.createdAt).toLocaleString() },
            { label: 'Last Updated', value: new Date(breed.updatedAt).toLocaleString() },
          ]}
        >
          {breed.imageUrl && (
            <div className="mt-4">
              <label className="text-xs sm:text-sm font-medium text-gray-500 block mb-2">Image</label>
              <img
                src={breed.imageUrl}
                alt={breed.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </ResponsiveDetailCard>
      </ResponsiveDetailGrid>
    </div>
  )
}
