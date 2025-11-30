'use client'

import React from 'react'
import { useLoading } from '@/contexts/LoadingContext'
import { LoadingSpinner } from './LoadingSpinner'
import { cn } from '@/utils/cn'

interface LoadingOverlayProps {
  /**
   * Minimum delay before showing the loading overlay (in milliseconds)
   * Prevents flickering for very fast API calls
   * @default 200
   */
  minDelay?: number
  /**
   * Custom message to display
   */
  message?: string
  /**
   * Whether to show a backdrop blur effect
   * @default true
   */
  blur?: boolean
  /**
   * Custom z-index for the overlay
   * @default 50
   */
  zIndex?: number
}

export function LoadingOverlay({
  minDelay = 200,
  message,
  blur = true,
  zIndex = 50,
}: LoadingOverlayProps) {
  const { isLoading } = useLoading()
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isLoading) {
      // Delay showing the overlay to prevent flickering on fast requests
      timeoutId = setTimeout(() => {
        setShow(true)
      }, minDelay)
    } else {
      // Hide immediately when loading stops
      setShow(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoading, minDelay])

  if (!show) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center',
        'transition-opacity duration-300',
        blur && 'backdrop-blur-sm',
        'bg-black/10 dark:bg-black/30'
      )}
      style={{ zIndex }}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

