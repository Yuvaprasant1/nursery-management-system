import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { UIText, ButtonAction } from '@/enums'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  showRetry?: boolean
}

export function ErrorState({
  title = UIText.SOMETHING_WENT_WRONG,
  message = UIText.ERROR_OCCURRED,
  onRetry,
  retryLabel = ButtonAction.TRY_AGAIN,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="text-center py-12">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry}>{retryLabel}</Button>
      )}
    </Card>
  )
}

