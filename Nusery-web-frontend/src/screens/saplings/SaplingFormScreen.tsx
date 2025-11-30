'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { saplingApi } from './api/saplingApi'
import { SaplingRequest } from './models/types'
import { useNursery } from '@/contexts/NurseryContext'
import { useToast } from '@/components/Toaster/useToast'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ErrorState } from '@/components/Error/ErrorState'
import { QUERY_KEYS, ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'

const saplingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  nurseryId: z.string().min(1, 'Nursery ID is required'),
})

type SaplingForm = z.infer<typeof saplingSchema>

export default function SaplingFormScreen() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const { nursery } = useNursery()
  const toast = useToast()
  const queryClient = useQueryClient()
  const isEditMode = !!params.id
  
  const { data: sapling, isLoading: isLoadingSapling } = useQuery({
    queryKey: [QUERY_KEYS.SAPLINGS, params.id],
    queryFn: () => saplingApi.getSapling(params.id!),
    enabled: isEditMode && !!params.id,
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SaplingForm>({
    resolver: zodResolver(saplingSchema),
    defaultValues: {
      nurseryId: nursery?.id || '',
    },
  })

  // Load sapling data for edit mode
  useEffect(() => {
    if (sapling && isEditMode) {
      reset({
        name: sapling.name,
        description: sapling.description || '',
        imageUrl: sapling.imageUrl || '',
        nurseryId: sapling.nurseryId,
      })
    }
  }, [sapling, isEditMode, reset])

  const createMutation = useMutation({
    mutationFn: saplingApi.createSapling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAPLINGS] })
      toast.success('Sapling created successfully!')
      router.push(ROUTES.SAPLINGS)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to create sapling')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaplingRequest }) => 
      saplingApi.updateSapling(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAPLINGS] })
      toast.success('Sapling updated successfully!')
      router.push(ROUTES.SAPLINGS)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to update sapling')
    },
  })

  const onSubmit = (data: SaplingForm) => {
    if (!nursery?.id) {
      toast.error('Nursery not found. Please configure your nursery first.')
      return
    }
    
    const saplingData = {
      ...data,
      nurseryId: nursery.id,
      imageUrl: data.imageUrl || undefined,
      description: data.description || undefined,
    }
    
    if (isEditMode && params.id) {
      updateMutation.mutate({ id: params.id, data: saplingData })
    } else {
      createMutation.mutate(saplingData)
    }
  }

  if (isLoadingSapling) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!nursery) {
    return (
      <ErrorState
        title="Nursery not found"
        message="Please configure your nursery first."
        showRetry={false}
      />
    )
  }

  if (isEditMode && !sapling) {
    return (
      <ErrorState
        title="Sapling not found"
        message="The sapling you're trying to edit doesn't exist."
        showRetry={false}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(ROUTES.SAPLINGS)}>
          ← Back to Saplings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Sapling' : 'Add New Sapling'}
        </h1>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Name"
            placeholder="Enter sapling name"
            {...register('name')}
            error={errors.name?.message}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter sapling description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <Input
            label="Image URL"
            type="url"
            placeholder="https://example.com/image.jpg"
            {...register('imageUrl')}
            error={errors.imageUrl?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.SAPLINGS)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditMode ? 'Update Sapling' : 'Create Sapling'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

