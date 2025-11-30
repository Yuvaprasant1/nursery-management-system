'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { useNursery } from '@/contexts/NurseryContext'
import { useToast } from '@/components/Toaster/useToast'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ErrorState } from '@/components/Error/ErrorState'
import { QUERY_KEYS, ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'

const breedSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  saplingId: z.string().min(1, 'Sapling is required'),
  mode: z.enum(['INDIVIDUAL', 'SLOT'], { required_error: 'Mode is required' }),
  itemsPerSlot: z.number().min(1, 'Items per slot must be at least 1').optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type BreedForm = z.infer<typeof breedSchema>

export default function BreedFormScreen() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const { nursery } = useNursery()
  const toast = useToast()
  const queryClient = useQueryClient()
  const isEditMode = !!params.id
  
  const { data: breed, isLoading: isLoadingBreed } = useQuery({
    queryKey: [QUERY_KEYS.BREEDS, params.id],
    queryFn: () => breedApi.getBreed(params.id!),
    enabled: isEditMode && !!params.id,
  })

  const { data: hasTransactions } = useQuery({
    queryKey: ['breed-has-transactions', params.id],
    queryFn: () => breedApi.checkHasTransactions(params.id!),
    enabled: isEditMode && !!params.id,
  })
  
  const { data: saplings, isLoading: isLoadingSaplings } = useQuery({
    queryKey: ['saplings', nursery?.id],
    queryFn: () => saplingApi.getAllSaplings(nursery?.id || ''),
    enabled: !!nursery?.id,
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BreedForm>({
    resolver: zodResolver(breedSchema),
    defaultValues: {
      mode: 'INDIVIDUAL',
      itemsPerSlot: 1,
      nurseryId: nursery?.id || '',
    },
  })
  
  const mode = watch('mode')
  
  // Load breed data for edit mode
  useEffect(() => {
    if (breed && isEditMode) {
      reset({
        name: breed.name,
        description: breed.description || '',
        saplingId: breed.saplingId,
        mode: breed.mode || 'INDIVIDUAL',
        itemsPerSlot: breed.itemsPerSlot || 1,
        imageUrl: breed.imageUrl || '',
      })
    }
  }, [breed, isEditMode, reset])
  
  const createMutation = useMutation({
    mutationFn: breedApi.createBreed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREEDS] })
      toast.success('Breed created successfully!')
      router.push(ROUTES.BREEDS)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to create breed')
    },
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BreedRequest }) => 
      breedApi.updateBreed(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BREEDS] })
      toast.success('Breed updated successfully!')
      router.push(ROUTES.BREEDS)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Failed to update breed')
    },
  })
  
  const onSubmit = (data: BreedForm) => {
    if (!nursery?.id) {
      toast.error('Nursery not found. Please configure your nursery first.')
      return
    }
    
    // If editing and breed has transactions, only send editable fields
    if (isEditMode && hasTransactions && breed) {
      const breedData = {
        name: data.name,
        description: data.description || undefined,
        saplingId: breed.saplingId, // Keep original
        nurseryId: nursery.id,
        mode: breed.mode || 'INDIVIDUAL', // Keep original
        itemsPerSlot: breed.mode === 'SLOT' ? (breed.itemsPerSlot || 1) : undefined, // Keep original
        imageUrl: data.imageUrl || undefined,
      }
      updateMutation.mutate({ id: params.id!, data: breedData })
    } else {
      const breedData = {
        name: data.name,
        description: data.description || undefined,
        saplingId: data.saplingId,
        nurseryId: nursery.id,
        mode: data.mode,
        itemsPerSlot: data.mode === 'SLOT' ? (data.itemsPerSlot || 1) : undefined,
        imageUrl: data.imageUrl || undefined,
      }
      
      if (isEditMode && params.id) {
        updateMutation.mutate({ id: params.id, data: breedData })
      } else {
        createMutation.mutate(breedData)
      }
    }
  }
  
  if (isLoadingBreed || isLoadingSaplings) {
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
  
  if (isEditMode && !breed) {
    return (
      <ErrorState
        title="Breed not found"
        message="The breed you're trying to edit doesn't exist."
        showRetry={false}
      />
    )
  }
  
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(ROUTES.BREEDS)}>
          ← Back to Breeds
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Breed' : 'Add New Breed'}
        </h1>
      </div>

      <Card className="p-8">
        {isEditMode && hasTransactions && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Restricted Editing</h3>
                <p className="text-sm text-yellow-700">
                  This breed has existing transactions. Sapling, Mode, and Items Per Slot cannot be changed to maintain data integrity.
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Breed Name"
            placeholder="Enter breed name"
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
              placeholder="Enter breed description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sapling <span className="text-red-500">*</span>
              {isEditMode && hasTransactions && (
                <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
              )}
            </label>
            <select
              {...register('saplingId')}
              disabled={isEditMode && hasTransactions}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                isEditMode && hasTransactions ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="">-- Select a sapling --</option>
              {saplings?.map((sapling) => (
                <option key={sapling.id} value={sapling.id}>
                  {sapling.name}
                </option>
              ))}
            </select>
            {errors.saplingId && (
              <p className="mt-1 text-sm text-red-600">{errors.saplingId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode <span className="text-red-500">*</span>
              {isEditMode && hasTransactions && (
                <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>
              )}
            </label>
            <select
              {...register('mode')}
              disabled={isEditMode && hasTransactions}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                isEditMode && hasTransactions ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="SLOT">Slot</option>
            </select>
            {errors.mode && (
              <p className="mt-1 text-sm text-red-600">{errors.mode.message}</p>
            )}
          </div>

          {mode === 'SLOT' && (
            <Input
              label="Items Per Slot"
              type="number"
              min="1"
              step="1"
              {...register('itemsPerSlot', { valueAsNumber: true })}
              error={errors.itemsPerSlot?.message}
              required={mode === 'SLOT'}
              disabled={isEditMode && hasTransactions}
            />
          )}

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
              onClick={() => router.push(ROUTES.BREEDS)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditMode ? 'Update Breed' : 'Create Breed'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

