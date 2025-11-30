'use client'

import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { useNursery } from '@/contexts/NurseryContext'
import { themeApi } from './api/themeApi'
import { ThemeRequest } from './models/types'
import { useToast } from '@/components/Toaster/useToast'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'

export default function ThemeSettingsScreen() {
  const { theme, updateTheme } = useTheme()
  const { nursery } = useNursery()
  const toast = useToast()
  const { register, handleSubmit, watch } = useForm<ThemeRequest>({
    defaultValues: {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      fontFamily: theme.fontFamily,
      fontSizeBase: theme.fontSizeBase,
      borderRadius: theme.borderRadius,
      spacingUnit: theme.spacingUnit,
      themeMode: theme.themeMode,
    },
  })
  
  const updateMutation = useMutation({
    mutationFn: (data: ThemeRequest) => {
      if (!nursery?.id) {
        throw new Error('Nursery not found. Please configure your nursery first.')
      }
      return themeApi.updateTheme(nursery.id, data)
    },
    onSuccess: (updatedTheme) => {
      if (!nursery?.id) {
        toast.error('Nursery not found')
        return
      }
      updateTheme(nursery.id, updatedTheme)
      toast.success('Theme updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update theme')
    },
  })
  
  const onSubmit = (data: ThemeRequest) => {
    if (!nursery?.id) {
      toast.error('Nursery not found. Please configure your nursery first.')
      return
    }
    updateMutation.mutate(data)
  }

  if (!nursery) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  const previewTheme = watch()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
      
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Primary Color"
              type="color"
              {...register('primaryColor')}
            />
            <Input
              label="Secondary Color"
              type="color"
              {...register('secondaryColor')}
            />
            <Input
              label="Accent Color"
              type="color"
              {...register('accentColor')}
            />
            <Input
              label="Font Family"
              {...register('fontFamily')}
            />
            <Input
              label="Font Size Base"
              {...register('fontSizeBase')}
            />
            <Input
              label="Border Radius"
              {...register('borderRadius')}
            />
            <Input
              label="Spacing Unit"
              {...register('spacingUnit')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Mode</label>
              <select
                {...register('themeMode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Theme'}
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Preview */}
      <Card title="Preview">
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: previewTheme.primaryColor || theme.primaryColor,
            color: 'white',
            fontFamily: previewTheme.fontFamily || theme.fontFamily,
          }}
        >
          <h3 className="text-xl font-bold mb-2">Preview Card</h3>
          <p>This is how your theme will look with the current settings.</p>
        </div>
      </Card>
    </div>
  )
}

