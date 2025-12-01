'use client'

import { ReactNode } from 'react'
import { IconButton } from '@/components/IconButton'
import { cn } from '@/utils/cn'

interface ResponsiveFormActionsProps {
  onSave?: () => void
  onCancel?: () => void
  onBack?: () => void
  saveLabel?: string
  cancelLabel?: string
  backLabel?: string
  isSubmitting?: boolean
  isDisabled?: boolean
  saveVariant?: 'primary' | 'secondary' | 'danger' | 'outline'
  className?: string
  children?: ReactNode
}

export function ResponsiveFormActions({
  onSave,
  onCancel,
  onBack,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  backLabel = 'Back',
  isSubmitting = false,
  isDisabled = false,
  saveVariant = 'primary',
  className,
  children,
}: ResponsiveFormActionsProps) {
  const hasActions = onSave || onCancel || onBack || children

  if (!hasActions) return null

  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-2 sm:gap-3',
      'pt-4 sm:pt-4 border-t border-gray-200',
      className
    )}>
      {/* Mobile: Stacked buttons, full width */}
      {/* Desktop: Horizontal button group */}
      
      {onBack && (
        <IconButton
          action="back"
          onClick={onBack}
          variant="outline"
          size="md"
          label={backLabel}
          disabled={isSubmitting || isDisabled}
          className="w-full sm:w-auto"
          title={backLabel}
        />
      )}

      {onCancel && (
        <IconButton
          action="cancel"
          onClick={onCancel}
          variant="outline"
          size="md"
          label={cancelLabel}
          disabled={isSubmitting || isDisabled}
          className="w-full sm:w-auto"
          title={cancelLabel}
        />
      )}

      {children}

      {onSave && (
        <IconButton
          action="save"
          onClick={onSave}
          variant={saveVariant}
          size="md"
          label={saveLabel}
          disabled={isSubmitting || isDisabled}
          isLoading={isSubmitting}
          className="w-full sm:w-auto sm:ml-auto"
          title={saveLabel}
        />
      )}
      {children}
    </div>
  )
}
