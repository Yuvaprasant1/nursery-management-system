'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ResponsiveDetailSectionProps {
  label: string
  value: ReactNode
  className?: string
}

export function ResponsiveDetailSection({ label, value, className }: ResponsiveDetailSectionProps) {
  return (
    <div className={cn('space-y-0.5 sm:space-y-1', className)}>
      <label className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-500 block leading-tight">
        {label}
      </label>
      <div className="text-[11px] sm:text-sm md:text-base text-gray-900 leading-tight">
        {value || '—'}
      </div>
    </div>
  )
}
