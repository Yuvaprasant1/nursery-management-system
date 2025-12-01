'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ResponsiveFilterBarProps {
  children: ReactNode
  className?: string
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveFilterBar({
  children,
  className,
  gap = 'md',
}: ResponsiveFilterBarProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-2 sm:gap-3',
    lg: 'gap-3 sm:gap-4',
  }

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-stretch sm:items-center',
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}
