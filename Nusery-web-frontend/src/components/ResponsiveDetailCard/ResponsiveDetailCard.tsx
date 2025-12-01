'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/Card'
import { IconButton, IconButtonAction } from '@/components/IconButton'
import { ResponsiveDetailSection } from './ResponsiveDetailSection'
import { cn } from '@/utils/cn'

export interface DetailCardAction {
  action?: IconButtonAction
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  disabled?: boolean
  isLoading?: boolean
}

interface ResponsiveDetailCardProps {
  title: string
  children?: ReactNode
  sections?: Array<{
    label: string
    value: ReactNode
  }>
  actions?: DetailCardAction[]
  className?: string
}

export function ResponsiveDetailCard({
  title,
  children,
  sections,
  actions,
  className,
}: ResponsiveDetailCardProps) {
  return (
    <Card title={title} className={cn('p-2 sm:p-4 md:p-6', className)}>
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {sections?.map((section, idx) => (
          <ResponsiveDetailSection
            key={idx}
            label={section.label}
            value={section.value}
          />
        ))}
        {children}
      </div>
    </Card>
  )
}

interface ResponsiveDetailHeaderProps {
  title: string
  backAction?: {
    label?: string
    onClick: () => void
  }
  actions?: DetailCardAction[]
  className?: string
}

export function ResponsiveDetailHeader({
  title,
  backAction,
  actions,
  className,
}: ResponsiveDetailHeaderProps) {
  const hasActions = actions && actions.length > 0

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
      className
    )}>
      {/* Mobile: Stacked, Desktop: Horizontal */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {backAction && (
          <IconButton
            action="back"
            onClick={backAction.onClick}
            size="md"
            showLabel={false}
            title={backAction.label || 'Back'}
            className="flex-shrink-0"
          />
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
          {title}
        </h1>
      </div>

      {hasActions && (
        <div className={cn(
          'flex flex-wrap gap-2',
          'sm:flex-nowrap sm:flex-shrink-0'
        )}>
          {actions.map((action, idx) => (
            <IconButton
              key={idx}
              action={action.action}
              onClick={action.onClick}
              variant={action.variant}
              size="md"
              disabled={action.disabled}
              isLoading={action.isLoading}
              title={action.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ResponsiveDetailGridProps {
  children: ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  className?: string
}

export function ResponsiveDetailGrid({
  children,
  columns = { mobile: 1, tablet: 1, desktop: 2 },
  className,
}: ResponsiveDetailGridProps) {
  const gridClasses = cn(
    'grid gap-4 sm:gap-6',
    columns.mobile === 1 && 'grid-cols-1',
    columns.mobile === 2 && 'grid-cols-2',
    columns.tablet === 1 && 'sm:grid-cols-1',
    columns.tablet === 2 && 'sm:grid-cols-2',
    columns.desktop === 1 && 'md:grid-cols-1',
    columns.desktop === 2 && 'md:grid-cols-2',
    columns.desktop === 3 && 'md:grid-cols-3',
    className
  )

  return <div className={gridClasses}>{children}</div>
}

// Export all components
export { ResponsiveDetailSection }
