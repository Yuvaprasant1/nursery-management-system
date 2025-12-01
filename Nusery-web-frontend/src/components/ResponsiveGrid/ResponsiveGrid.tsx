'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    mobile?: 1 | 2
    tablet?: 1 | 2 | 3
    desktop?: 1 | 2 | 3 | 4
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-5',
    lg: 'gap-5 sm:gap-6',
  }

  // Mobile columns
  const mobileCols = cols.mobile || 1
  const mobileClass = mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2'

  // Tablet columns
  const tabletCols = cols.tablet || 2
  const tabletClass = 
    tabletCols === 1 ? 'sm:grid-cols-1' :
    tabletCols === 2 ? 'sm:grid-cols-2' :
    'sm:grid-cols-3'

  // Desktop columns
  const desktopCols = cols.desktop || 3
  const desktopClass = 
    desktopCols === 1 ? 'md:grid-cols-1' :
    desktopCols === 2 ? 'md:grid-cols-2' :
    desktopCols === 3 ? 'md:grid-cols-3' :
    'md:grid-cols-4'

  return (
    <div className={cn(
      'grid',
      mobileClass,
      tabletClass,
      desktopClass,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}
