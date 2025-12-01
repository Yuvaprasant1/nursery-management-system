'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/Card'
import { IconButton, IconButtonAction } from '@/components/IconButton'
import { cn } from '@/utils/cn'

export interface ListCardAction {
  action?: IconButtonAction
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  disabled?: boolean
  isLoading?: boolean
}

interface ResponsiveListCardProps {
  title: string
  description?: string
  metadata?: ReactNode
  actions?: ListCardAction[]
  className?: string
  onClick?: () => void
  children?: ReactNode
}

export function ResponsiveListCard({
  title,
  description,
  metadata,
  actions,
  className,
  onClick,
  children,
}: ResponsiveListCardProps) {
  const hasActions = actions && actions.length > 0
  const isClickable = !!onClick

  return (
    <Card 
      className={cn(
        'p-2 sm:p-3 md:p-4 hover:shadow-md transition-shadow',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Mobile: Vertical Layout */}
      <div className="flex flex-col sm:hidden space-y-1.5">
        <div className="flex-1 space-y-1">
          <h3 className="text-xs font-semibold text-gray-900 leading-tight">{title}</h3>
          {description && (
            <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{description}</p>
          )}
          {metadata && (
            <div className="text-[10px] text-gray-500 leading-tight">{metadata}</div>
          )}
          {children}
        </div>
        
        {hasActions && (
          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-gray-200">
            {actions.map((action, idx) => (
              <IconButton
                key={idx}
                action={action.action}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                }}
                variant={action.variant}
                size="sm"
                label={action.label}
                disabled={action.disabled}
                isLoading={action.isLoading}
                title={action.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{description}</p>
          )}
          {metadata && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">{metadata}</div>
          )}
          {children}
        </div>
        
        {hasActions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions.map((action, idx) => (
              <IconButton
                key={idx}
                action={action.action}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                }}
                variant={action.variant}
                size="sm"
                disabled={action.disabled}
                isLoading={action.isLoading}
                title={action.label}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
