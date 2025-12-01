'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { saplingApi } from './api/saplingApi'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/Loading/LoadingState'
import { ErrorState } from '@/components/Error/ErrorState'
import { useConfirmationDialog } from '@/components/ConfirmationDialog/useConfirmationDialog'
import { useToast } from '@/components/Toaster/useToast'
import { ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { ButtonAction, ConfirmationVariant } from '@/enums'
import { Sapling } from './models/types'
import { Tooltip } from '@/components/Tooltip'

export default function SaplingDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { showConfirmation } = useConfirmationDialog()
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State for sapling API data
  const [sapling, setSapling] = useState<Sapling | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Fetch sapling function (for manual refetch)
  const fetchSapling = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await saplingApi.getSapling(id)
      setSapling(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load sapling')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [id])
  
  // Fetch data when component mounts or id changes - use direct dependencies
  useEffect(() => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    saplingApi.getSapling(id)
      .then(data => setSapling(data))
      .catch(err => {
        const error = err instanceof Error ? err : new Error('Failed to load sapling')
        setError(error)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // Direct dependencies
  
  const handleDelete = async () => {
    if (!sapling || !id) return
    
    const confirmed = await showConfirmation({
      title: 'Delete Sapling?',
      message: `Are you sure you want to delete "${sapling.name}"? This action cannot be undone.`,
      confirmText: ButtonAction.DELETE,
      cancelText: ButtonAction.CANCEL,
      variant: ConfirmationVariant.DANGER,
    })
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        await saplingApi.deleteSapling(id)
        toast.success('Sapling deleted successfully')
        router.push(ROUTES.SAPLINGS)
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        if (errorMessage.includes('breeds')) {
          toast.error('Cannot delete sapling with active breeds')
        } else {
          toast.error(errorMessage || 'Failed to delete sapling')
        }
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading sapling details..." />
  }

  if (error || !sapling) {
    return (
      <ErrorState
        title="Failed to load sapling"
        message={error ? getErrorMessage(error) : 'Sapling not found'}
        onRetry={fetchSapling}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip content="Back to Saplings" position="bottom">
            <Button variant="outline" onClick={() => router.push(ROUTES.SAPLINGS)} className="p-2" aria-label="Go back to saplings">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Tooltip>
          <h1 className="text-3xl font-bold text-gray-900">{sapling.name}</h1>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Edit sapling" position="bottom">
            <Button
              variant="outline"
              onClick={() => router.push(`${ROUTES.SAPLINGS}/${sapling.id}/edit`)}
              className="p-2"
              aria-label="Edit sapling"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content={isDeleting ? ButtonAction.DELETING : ButtonAction.DELETE} position="bottom">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2"
              aria-label="Delete sapling"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{sapling.name}</p>
            </div>
            {sapling.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900 mt-1">{sapling.description}</p>
              </div>
            )}
          </div>
          {sapling.imageUrl && (
            <div>
              <label className="text-sm font-medium text-gray-500">Image</label>
              <div className="mt-2">
                <img
                  src={sapling.imageUrl}
                  alt={sapling.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            </div>
          )}
        </Card>

        <Card title="Additional Information">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-gray-900 mt-1">
                {new Date(sapling.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900 mt-1">
                {new Date(sapling.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
