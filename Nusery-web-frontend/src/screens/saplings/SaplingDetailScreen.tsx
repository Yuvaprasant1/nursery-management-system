'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { saplingApi } from './api/saplingApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { QUERY_KEYS, ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { ButtonAction, ConfirmationVariant } from '@/enums'

export default function SaplingDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  
  const { 
    data: sapling, 
    isLoading, 
    error,
    refetch,
    isError 
  } = useQuery({
    queryKey: [QUERY_KEYS.SAPLINGS, id],
    queryFn: () => saplingApi.getSapling(id!),
    enabled: !!id,
    retry: 1,
  })
  
  const deleteMutation = useMutation({
    mutationFn: saplingApi.deleteSapling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAPLINGS] })
      toast.success('Sapling deleted successfully')
      router.push(ROUTES.SAPLINGS)
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('breeds')) {
        toast.error('Cannot delete sapling with active breeds')
      } else {
        toast.error(errorMessage || 'Failed to delete sapling')
      }
    },
  })
  
  const handleDelete = async () => {
    if (!sapling) return
    
    const confirmed = await showConfirmation({
      title: 'Delete Sapling?',
      message: `Are you sure you want to delete "${sapling.name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      deleteMutation.mutate(sapling.id)
    }
  }
  
  if (isLoading) {
    return <LoadingState message="Loading sapling details..." />
  }
  
  if (isError) {
    return (
      <ErrorState
        title="Failed to load sapling"
        message={getErrorMessage(error)}
        onRetry={() => refetch()}
      />
    )
  }
  
  if (!sapling) {
    return (
      <ErrorState
        title="Sapling not found"
        message="The sapling you're looking for doesn't exist or has been removed."
        showRetry={false}
      />
    )
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={() => router.push(ROUTES.SAPLINGS)}
        className="mb-4"
        aria-label="Go back to saplings list"
      >
        ← Back to Saplings
      </Button>
      
      {/* Main Content Card */}
      <Card className="p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{sapling.name}</h1>
            {sapling.description && (
              <p className="text-gray-600 leading-relaxed text-lg">{sapling.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`${ROUTES.SAPLINGS}/${sapling.id}/edit`)}
              aria-label={`Edit ${sapling.name}`}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              aria-label={`Delete ${sapling.name}`}
            >
              {deleteMutation.isPending ? ButtonAction.DELETING : ButtonAction.DELETE}
            </Button>
          </div>
        </div>
        
        {/* Image Section */}
        {sapling.imageUrl && (
          <div className="mb-6">
            <img 
              src={sapling.imageUrl} 
              alt={sapling.name}
              className="w-full h-auto rounded-lg border border-gray-200 max-h-96 object-cover"
            />
          </div>
        )}
        
        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Nursery ID</dt>
              <dd className="text-base text-gray-900 font-mono text-sm">{sapling.nurseryId}</dd>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
              <dd className="text-base text-gray-900">
                {new Date(sapling.createdAt).toLocaleDateString('en-US', {
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
                {new Date(sapling.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

