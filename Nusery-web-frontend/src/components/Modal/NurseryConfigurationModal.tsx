'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Modal } from './Modal'
import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ErrorState } from '@/components/Error/ErrorState'
import { useNursery } from '@/contexts/NurseryContext'
import { useToast } from '@/components/Toaster/useToast'
import { nurseryApi } from '@/services/nurseryService'
import { QUERY_KEYS } from '@/constants'
import { getErrorMessage } from '@/utils/errors'

interface NurseryConfigurationModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export function NurseryConfigurationModal({
  isOpen,
  onSuccess,
}: NurseryConfigurationModalProps) {
  const [selectedNurseryId, setSelectedNurseryId] = useState<string>('')
  const { setNursery } = useNursery()
  const toast = useToast()

  // Fetch all nurseries
  const {
    data: nurseries,
    isLoading: isLoadingNurseries,
    error: nurseriesError,
  } = useQuery({
    queryKey: [QUERY_KEYS.NURSERY],
    queryFn: () => nurseryApi.getAllNurseries(),
    enabled: isOpen,
  })

  // Update user nursery mutation
  const updateNurseryMutation = useMutation({
    mutationFn: async (nurseryId: string) => {
      // Try to update on backend (may not exist yet)
      await nurseryApi.updateUserNursery(nurseryId)
      // Return the selected nursery for frontend handling
      const selectedNursery = nurseries?.find((n) => n.id === nurseryId)
      if (!selectedNursery) {
        throw new Error('Selected nursery not found')
      }
      return selectedNursery
    },
    onSuccess: async (selectedNursery) => {
      // Set nursery in context and update user's nurseryId
      setNursery(selectedNursery)
      
      // Update user in localStorage with nurseryId
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          user.nurseryId = selectedNursery.id
          localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {
          console.error('Failed to update user nurseryId:', e)
        }
      }
      
      toast.success('Nursery configured successfully!')
      onSuccess()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to configure nursery')
    },
  })

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedNurseryId('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNurseryId) {
      toast.error('Please select a nursery')
      return
    }
    updateNurseryMutation.mutate(selectedNurseryId)
  }

  const selectedNursery = nurseries?.find((n) => n.id === selectedNurseryId)

  return (
    <Modal
      isOpen={isOpen}
      title="Configure Nursery"
      size="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isLoadingNurseries ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : nurseriesError ? (
          <ErrorState
            title="Failed to load nurseries"
            message={getErrorMessage(nurseriesError)}
            showRetry={false}
          />
        ) : !nurseries || nurseries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No nurseries available.</p>
            <p className="text-sm text-gray-500">
              Please contact your administrator to create a nursery.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="nursery-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Nursery
              </label>
              <select
                id="nursery-select"
                value={selectedNurseryId}
                onChange={(e) => setSelectedNurseryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select a nursery --</option>
                {nurseries.map((nursery) => (
                  <option key={nursery.id} value={nursery.id}>
                    {nursery.name}
                    {nursery.location && ` - ${nursery.location}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedNursery && (
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Nursery Details:</p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Name:</span> {selectedNursery.name}
                </p>
                {selectedNursery.location && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {selectedNursery.location}
                  </p>
                )}
                {selectedNursery.phone && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {selectedNursery.phone}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={!selectedNurseryId || updateNurseryMutation.isPending}
                isLoading={updateNurseryMutation.isPending}
              >
                Save Configuration
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}

