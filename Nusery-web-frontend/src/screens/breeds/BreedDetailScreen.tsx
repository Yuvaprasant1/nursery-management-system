'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { QUERY_KEYS, ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { ButtonAction, ConfirmationVariant } from '@/enums'

export default function BreedDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  
  const { 
    data: breed, 
    isLoading, 
    error,
    refetch,
    isError 
  } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, id],
    queryFn: () => breedApi.getBreed(id!),
    enabled: !!id,
    retry: 1,
  })

  const { data: sapling } = useQuery({
    queryKey: ['sapling', breed?.saplingId],
    queryFn: () => saplingApi.getSapling(breed!.saplingId),
    enabled: !!breed?.saplingId,
  })
  
  const deleteMutation = useMutation({
    mutationFn: async (breedId: string) => {
      // Check if breed has transactions before deleting
      const hasTransactions = await breedApi.checkHasTransactions(breedId)
      if (hasTransactions) {
        throw new Error('Cannot delete breed with existing transactions')
      }
      return breedApi.deleteBreed(breedId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREEDS] })
      toast.success('Breed deleted successfully')
      router.push(ROUTES.BREEDS)
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('transactions')) {
        toast.error('Cannot delete breed with existing transactions')
      } else {
        toast.error(errorMessage || 'Failed to delete breed')
      }
    },
  })
  
  const handleDelete = async () => {
    if (!breed) return
    
    const confirmed = await showConfirmation({
      title: 'Delete Breed?',
      message: `Are you sure you want to delete "${breed.name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      deleteMutation.mutate(breed.id)
    }
  }
  
  if (isLoading) {
    return <LoadingState message="Loading breed details..." />
  }
  
  if (isError) {
    return (
      <ErrorState
        title="Failed to load breed"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    )
  }
  
  if (!breed) {
    return (
      <ErrorState
        title="Breed not found"
        message="The breed you're looking for doesn't exist or has been removed."
        showRetry={false}
      />
    )
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={() => router.push(ROUTES.BREEDS)}
        className="mb-4"
        aria-label="Go back to breeds list"
      >
        ← Back to Breeds
      </Button>
      
      {/* Main Content Card */}
      <Card className="p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{breed.name}</h1>
            {breed.description && (
              <p className="text-gray-600 leading-relaxed text-lg">{breed.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`${ROUTES.BREEDS}/${breed.id}/edit`)}
              aria-label={`Edit ${breed.name}`}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              aria-label={`Delete ${breed.name}`}
            >
              {deleteMutation.isPending ? ButtonAction.DELETING : ButtonAction.DELETE}
            </Button>
          </div>
        </div>
        
        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Sapling</dt>
              <dd className="text-base text-gray-900 font-semibold">
                {sapling?.name || breed.saplingId}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Type / Mode</dt>
              <dd className="text-base text-gray-900">
                {breed.mode ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {breed.mode === 'INDIVIDUAL' ? 'Individual' : 'Slot'}
                  </span>
                ) : (
                  <span className="text-gray-400">Not specified</span>
                )}
              </dd>
            </div>
            {breed.mode === 'SLOT' && breed.itemsPerSlot && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Items Per Slot</dt>
                <dd className="text-base text-gray-900">{breed.itemsPerSlot}</dd>
              </div>
            )}
            {breed.imageUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Image</dt>
                <dd className="text-base text-gray-900">
                  <img 
                    src={breed.imageUrl} 
                    alt={breed.name}
                    className="max-w-full h-auto rounded-lg border border-gray-200 max-h-64 object-cover"
                  />
                </dd>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
              <dd className="text-base text-gray-900">
                {new Date(breed.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Last Updated</dt>
              <dd className="text-base text-gray-900">
                {new Date(breed.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Nursery ID</dt>
              <dd className="text-base text-gray-900 font-mono text-sm">{breed.nurseryId}</dd>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
