'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
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

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(ROUTES.BREEDS)}>
            ← Back to Breeds
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{breed.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{breed.name}</p>
            </div>
            {breed.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{breed.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Sapling</label>
              <p className="text-gray-900 mt-1">{sapling?.name || 'Loading...'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Mode</label>
              <p className="text-gray-900 mt-1">{breed.mode || 'INDIVIDUAL'}</p>
            </div>
            {breed.mode === 'SLOT' && breed.itemsPerSlot && (
              <div>
                <label className="text-sm font-medium text-gray-500">Items Per Slot</label>
                <p className="text-gray-900 mt-1">{breed.itemsPerSlot}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Additional Information">
          <div className="space-y-4">
            {breed.imageUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Image</label>
                <div className="mt-2">
                  <img
                    src={breed.imageUrl}
                    alt={breed.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-gray-900 mt-1">
                {new Date(breed.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900 mt-1">
                {new Date(breed.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
