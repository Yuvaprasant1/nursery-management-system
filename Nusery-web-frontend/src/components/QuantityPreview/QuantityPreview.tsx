'use client'

import { cn } from '@/utils/cn'
import { UIText } from '@/enums'

interface QuantityPreviewProps {
  currentQuantity: number
  upcomingQuantity: number | null
  isValid: boolean
  showDelta?: boolean
  className?: string
}

/**
 * Reusable component to display current and upcoming inventory quantities
 * with visual indicators for validity
 */
export function QuantityPreview({
  currentQuantity,
  upcomingQuantity,
  isValid,
  showDelta = true,
  className,
}: QuantityPreviewProps) {
  const hasUpcoming = upcomingQuantity !== null && upcomingQuantity !== currentQuantity

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {/* Current Quantity */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-600 mb-2">{UIText.CURRENT_QUANTITY}</div>
        <div className={cn(
          'text-4xl font-bold',
          currentQuantity < 0 ? 'text-red-600' : 'text-gray-900'
        )}>
          {currentQuantity.toLocaleString()}
        </div>
        {currentQuantity < 0 && (
          <div className="text-xs mt-2 text-red-600 font-medium">
            Negative inventory detected
          </div>
        )}
      </div>

      {/* Upcoming Quantity */}
      {hasUpcoming && (
        <div className={cn(
          'p-6 rounded-lg border-2 transition-all',
          !isValid || (upcomingQuantity !== null && upcomingQuantity < 0)
            ? 'bg-red-50 border-red-300' 
            : 'bg-green-50 border-green-300'
        )}>
          <div className="text-sm font-medium text-gray-600 mb-2">{UIText.UPCOMING_QUANTITY}</div>
          <div className={cn(
            'text-4xl font-bold',
            !isValid || (upcomingQuantity !== null && upcomingQuantity < 0) 
              ? 'text-red-700' 
              : 'text-green-700'
          )}>
            {upcomingQuantity !== null ? upcomingQuantity.toLocaleString() : '—'}
          </div>
          {showDelta && upcomingQuantity !== null && upcomingQuantity !== currentQuantity && (
            <div className="text-xs mt-2 text-gray-600">
              {upcomingQuantity > currentQuantity ? '+' : ''}
              {(upcomingQuantity - currentQuantity).toLocaleString()} {UIText.UNITS}
            </div>
          )}
          {!isValid && (
            <div className="text-xs mt-2 text-red-600 font-medium">
              ⚠️ This would result in negative inventory
            </div>
          )}
        </div>
      )}

      {/* Compact version when no change */}
      {!hasUpcoming && upcomingQuantity !== null && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">{UIText.UPCOMING_QUANTITY}</div>
          <div className="text-4xl font-bold text-gray-900">
            {upcomingQuantity.toLocaleString()}
          </div>
          <div className="text-xs mt-2 text-gray-500">No change</div>
        </div>
      )}
    </div>
  )
}

