import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const borderWidthClasses = {
    sm: 'border',
    md: 'border-2',
    lg: 'border-[3px]',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative" role="status" aria-label="Loading">
        {/* Outer spinning ring with gradient */}
        <div
          className={cn(
            'animate-spin rounded-full',
            'border-solid border-transparent',
            'bg-gradient-to-r from-primary via-secondary to-accent',
            'bg-clip-border',
            sizeClasses[size],
            borderWidthClasses[size]
          )}
          style={{
            background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, var(--primary-color), var(--secondary-color), var(--accent-color)) border-box',
            border: `${size === 'sm' ? '2px' : size === 'md' ? '3px' : '4px'} solid transparent`,
            animation: 'spin 1s linear infinite',
          }}
        >
          <div className="absolute inset-0 rounded-full border-solid border-gray-200 opacity-30" />
        </div>
        
        {/* Inner pulsing dot */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'animate-pulse'
          )}
        >
          <div
            className={cn(
              'rounded-full bg-primary',
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
            )}
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

