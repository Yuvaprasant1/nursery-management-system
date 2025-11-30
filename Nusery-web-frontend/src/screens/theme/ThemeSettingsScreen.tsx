'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTheme } from '@/contexts/ThemeContext'
import { useNursery } from '@/contexts/NurseryContext'
import { themeApi } from './api/themeApi'
import { ThemeRequest } from './models/types'
import { useToast } from '@/components/Toaster/useToast'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Dropdown, DropdownOption } from '@/components/Dropdown'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'

export default function ThemeSettingsScreen() {
  const { theme, updateTheme } = useTheme()
  const { nursery } = useNursery()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, watch, setValue } = useForm<ThemeRequest>({
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

  const themeMode = watch('themeMode')

  const themeModeOptions: DropdownOption<string>[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]
  
  const onSubmit = async (data: ThemeRequest) => {
    if (!nursery?.id) {
      toast.error('Nursery not found.')
      return
    }

    setIsSubmitting(true)
    try {
      const updatedTheme = await themeApi.updateTheme(nursery.id, data)
      updateTheme(nursery.id, updatedTheme)
      toast.success('Theme updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update theme')
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

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h1 className="text-3xl font-bold text-gray-900">Theme Settings</h1>

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Color Preview */}
          <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Color Preview</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg mb-2"
                  style={{ backgroundColor: primaryColor }}
                />
                <p className="text-xs text-gray-600 text-center">Primary</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg mb-2"
                  style={{ backgroundColor: secondaryColor }}
                />
                <p className="text-xs text-gray-600 text-center">Secondary</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-16 rounded-lg mb-2"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-xs text-gray-600 text-center">Accent</p>
              </div>
            </div>
          </div>

          {/* Color Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Typography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Font Family"
              {...register('fontFamily')}
            />
            <Input
              label="Font Size Base"
              type="text"
              {...register('fontSizeBase')}
            />
          </div>

          {/* Spacing & Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Border Radius"
              type="text"
              {...register('borderRadius')}
            />
            <Input
              label="Spacing Unit"
              type="text"
              {...register('spacingUnit')}
            />
          </div>

          {/* Theme Mode */}
          <Dropdown
            label="Theme Mode"
            options={themeModeOptions}
            value={themeMode}
            onChange={(value) => setValue('themeMode', value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Save Theme
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
