'use client'

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  ArrowLeft,
  Save,
  Search,
  Filter,
  MoreVertical,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Tooltip } from '@/components/Tooltip'

export type IconButtonAction = 
  | 'add' 
  | 'edit' 
  | 'delete' 
  | 'view' 
  | 'save' 
  | 'cancel' 
  | 'back'
  | 'search'
  | 'filter'
  | 'more'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  action?: IconButtonAction
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  icon?: LucideIcon
  isLoading?: boolean
  showLabel?: boolean // Force show label regardless of screen size
}

const actionConfig: Record<IconButtonAction, { icon: LucideIcon; label: string; defaultVariant: IconButtonProps['variant'] }> = {
  add: { icon: Plus, label: 'Add', defaultVariant: 'primary' },
  edit: { icon: Pencil, label: 'Edit', defaultVariant: 'outline' },
  delete: { icon: Trash2, label: 'Delete', defaultVariant: 'danger' },
  view: { icon: Eye, label: 'View', defaultVariant: 'outline' },
  save: { icon: Save, label: 'Save', defaultVariant: 'primary' },
  cancel: { icon: X, label: 'Cancel', defaultVariant: 'outline' },
  back: { icon: ArrowLeft, label: 'Back', defaultVariant: 'outline' },
  search: { icon: Search, label: 'Search', defaultVariant: 'outline' },
  filter: { icon: Filter, label: 'Filter', defaultVariant: 'outline' },
  more: { icon: MoreVertical, label: 'More', defaultVariant: 'outline' },
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    action,
    variant,
    size = 'md',
    label,
    icon: CustomIcon,
    className = '',
    disabled,
    isLoading = false,
    showLabel = false,
    title,
    ...props 
  }, ref) => {
    const config = action ? actionConfig[action] : null
    const Icon = CustomIcon || config?.icon || Plus
    const displayLabel = label || config?.label || ''
    const displayVariant = variant || config?.defaultVariant || 'primary'
    const displayTitle = title || displayLabel

    const baseClasses = 'font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center'
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
      secondary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 active:bg-purple-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100 bg-white',
    }
    
    // Responsive sizing: compact on mobile, standard on desktop
    const sizeClasses = {
      sm: 'p-1.5 sm:px-2 sm:py-1.5',
      md: 'p-2 sm:px-3 sm:py-2',
      lg: 'p-2.5 sm:px-4 sm:py-2.5',
    }

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }

    const buttonContent = (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[displayVariant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-label={displayTitle}
        {...props}
      >
        {isLoading ? (
          <svg
            className={cn('animate-spin', iconSizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {displayLabel && (showLabel || action) ? (
              <>
                {/* Mobile: Icon with label below, Desktop: Icon with label beside */}
                <div className="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-2">
                  <Icon className={cn(iconSizes[size], 'flex-shrink-0')} aria-hidden="true" />
                  <span className={cn(
                    'text-[10px] leading-tight',
                    'sm:text-sm sm:leading-normal',
                    size === 'sm' && 'text-[9px] sm:text-xs',
                    size === 'lg' && 'text-xs sm:text-base'
                  )}>
                    {displayLabel}
                  </span>
                </div>
              </>
            ) : (
              <Icon className={cn(iconSizes[size], 'flex-shrink-0')} aria-hidden="true" />
            )}
          </>
        )}
      </button>
    )

    // Determine if label is visible
    const isLabelVisible = displayLabel && (showLabel || action)
    
    // Wrap with tooltip if label is not shown (icon-only mode)
    if (!isLabelVisible && displayTitle) {
      return (
        <Tooltip content={displayTitle} position="top">
          {buttonContent}
        </Tooltip>
      )
    }

    return buttonContent
  }
)

IconButton.displayName = 'IconButton'
