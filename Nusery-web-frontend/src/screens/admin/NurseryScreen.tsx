'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNursery } from '@/contexts/NurseryContext'
import { nurseryApi } from '@/services/nurseryService'
import { NurseryRequest } from '@/types/nursery'
import { useToast } from '@/components/Toaster/useToast'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'

export default function NurseryScreen() {
  const { nursery, setNursery } = useNursery()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NurseryRequest>({
    defaultValues: {
      name: '',
      location: '',
      phone: '',
    },
  })

  // Load nursery data into form when nursery is available
  useEffect(() => {
    if (nursery) {
      reset({
        name: nursery.name || '',
        location: nursery.location || '',
        phone: nursery.phone || '',
      })
    }
  }, [nursery, reset])

  const onSubmit = async (data: NurseryRequest) => {
    if (!nursery?.id) {
      toast.error('Nursery not found.')
      return
    }

    setIsSubmitting(true)
    try {
      const updatedNursery = await nurseryApi.updateNursery(nursery.id, data)
      setNursery(updatedNursery)
      toast.success('Nursery updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update nursery')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!nursery) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Nursery information is not available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h1 className="text-3xl font-bold text-gray-900">Nursery Settings</h1>

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nursery Name */}
          <Input
            label="Nursery Name"
            {...register('name', {
              required: 'Nursery name is required',
              maxLength: {
                value: 255,
                message: 'Nursery name must not exceed 255 characters',
              },
            })}
            error={errors.name?.message}
            disabled={isSubmitting}
          />

          {/* Location */}
          <Input
            label="Location"
            {...register('location', {
              maxLength: {
                value: 500,
                message: 'Location must not exceed 500 characters',
              },
            })}
            error={errors.location?.message}
            disabled={isSubmitting}
          />

          {/* Phone */}
          <Input
            label="Phone"
            type="tel"
            {...register('phone', {
              maxLength: {
                value: 20,
                message: 'Phone must not exceed 20 characters',
              },
            })}
            error={errors.phone?.message}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Update Nursery
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

