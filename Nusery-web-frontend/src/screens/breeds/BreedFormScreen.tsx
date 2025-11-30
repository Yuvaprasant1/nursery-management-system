'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { breedApi } from './api/breedApi'
import { saplingApi } from '@/screens/saplings/api/saplingApi'
import { useNursery } from '@/contexts/NurseryContext'
import { useToast } from '@/components/Toaster/useToast'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Dropdown, DropdownOption } from '@/components/Dropdown'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { ErrorState } from '@/components/Error/ErrorState'
import { ROUTES } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { BreedRequest } from './models/types'
import { Breed } from './models/types'
import { Sapling } from '@/screens/saplings/models/types'
import { PaginatedResponse } from '@/api/types'

const breedSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  saplingId: z.string().min(1, 'Sapling is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type BreedForm = z.infer<typeof breedSchema>

export default function BreedFormScreen() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const { nursery } = useNursery()
  const toast = useToast()
  const isEditMode = !!params.id
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for breed API data
  const [breed, setBreed] = useState<Breed | null>(null)
  const [isLoadingBreed, setIsLoadingBreed] = useState(false)
  
  // State for hasTransactions check
  const [hasTransactions, setHasTransactions] = useState<boolean>(false)
  
  // State for saplings API data
  const [saplingsData, setSaplingsData] = useState<Sapling[] | PaginatedResponse<Sapling> | null>(null)
  const [isLoadingSaplings, setIsLoadingSaplings] = useState(false)
  
  // Fetch breed data for edit mode
  useEffect(() => {
    const fetchBreed = async () => {
      if (!isEditMode || !params.id) return
      
      setIsLoadingBreed(true)
      try {
        const data = await breedApi.getBreed(params.id)
        setBreed(data)
      } catch (err) {
        console.error('Failed to load breed:', err)
      } finally {
        setIsLoadingBreed(false)
      }
    }
    
    fetchBreed()
  }, [isEditMode, params.id])

  // Check if breed has transactions
  useEffect(() => {
    const checkTransactions = async () => {
      if (!isEditMode || !params.id) return
      
      try {
        const result = await breedApi.checkHasTransactions(params.id)
        setHasTransactions(result)
      } catch (err) {
        console.error('Failed to check transactions:', err)
      }
    }
    
    checkTransactions()
  }, [isEditMode, params.id])
  
  // Fetch saplings
  useEffect(() => {
    const fetchSaplings = async () => {
      if (!nursery?.id) return
      
      setIsLoadingSaplings(true)
      try {
        const data = await saplingApi.getAllSaplings(nursery.id)
        setSaplingsData(data)
      } catch (err) {
        console.error('Failed to load saplings:', err)
      } finally {
        setIsLoadingSaplings(false)
      }
    }
    
    fetchSaplings()
  }, [nursery?.id])
  
  // Extract saplings array from response
  const saplings: Sapling[] = useMemo(() => {
    if (!saplingsData) return []
    if (Array.isArray(saplingsData)) return saplingsData
    if ('content' in saplingsData) return saplingsData.content
    return []
  }, [saplingsData])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BreedForm>({
    resolver: zodResolver(breedSchema),
    defaultValues: {
      nurseryId: nursery?.id || '',
    },
  })

  const selectedSaplingId = watch('saplingId')
  
  // Load breed data for edit mode
  useEffect(() => {
    if (breed && isEditMode) {
      reset({
        name: breed.name,
        description: breed.description || '',
        saplingId: breed.saplingId,
        imageUrl: breed.imageUrl || '',
      })
    }
  }, [breed, isEditMode, reset])
  
  const handleCreate = async (data: BreedForm) => {
    if (!nursery?.id) {
      toast.error('Nursery not found.')
      return
    }

    setIsSubmitting(true)
    try {
      const breedData: BreedRequest = {
        name: data.name,
        description: data.description || undefined,
        saplingId: data.saplingId,
        nurseryId: nursery.id,
        mode: 'INDIVIDUAL',
        imageUrl: data.imageUrl || undefined,
      }
      
      await breedApi.createBreed(breedData)
      toast.success('Breed created successfully!')
      router.push(ROUTES.BREEDS)
    } catch (error) {
      // Error is handled by Axios interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (data: BreedForm) => {
    if (!nursery?.id || !params.id) {
      toast.error('Nursery not found.')
      return
    }

    setIsSubmitting(true)
    try {
      let breedData: BreedRequest
      
      // If editing and breed has transactions, only send editable fields
      if (hasTransactions && breed) {
        breedData = {
          name: data.name,
          description: data.description || undefined,
          saplingId: breed.saplingId, // Keep original
          nurseryId: nursery.id,
          mode: breed.mode || 'INDIVIDUAL', // Keep original
          itemsPerSlot: breed.itemsPerSlot, // Keep original
          imageUrl: data.imageUrl || undefined,
        }
      } else {
        breedData = {
          name: data.name,
          description: data.description || undefined,
          saplingId: data.saplingId,
          nurseryId: nursery.id,
          mode: 'INDIVIDUAL',
          imageUrl: data.imageUrl || undefined,
        }
      }
      
      await breedApi.updateBreed(params.id, breedData)
      toast.success('Breed updated successfully!')
      router.push(ROUTES.BREEDS)
    } catch (error) {
      // Error is handled by Axios interceptor
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const onSubmit = (data: BreedForm) => {
    if (isEditMode) {
      handleUpdate(data)
    } else {
      handleCreate(data)
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
        message="Nursery information is not available."
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
                  This breed has existing transactions. Sapling cannot be changed to maintain data integrity.
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
            <Dropdown
              label={
                <>
                  Sapling <span className="text-red-500">*</span>
                  {isEditMode && hasTransactions && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">(Cannot be changed)</span>
                  )}
                </>
              }
              options={saplings.map(sapling => ({
                value: sapling.id,
                label: sapling.name,
              })) as DropdownOption<string>[]}
              value={selectedSaplingId}
              onChange={(value) => setValue('saplingId', value, { shouldValidate: true })}
              placeholder="-- Select a sapling --"
              disabled={isEditMode && hasTransactions}
              error={errors.saplingId?.message}
            />
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
              onClick={() => router.push(ROUTES.BREEDS)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isEditMode ? 'Update Breed' : 'Create Breed'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
