import { useState, useEffect } from 'react'
import { toastManager } from './useToast'
import { Toast } from './Toast'

export function Toaster() {
  const [toasts, setToasts] = useState(toastManager.getToasts())
  
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(() => {
      setToasts(toastManager.getToasts())
    })
    
    return unsubscribe
  }, [])
  
  if (toasts.length === 0) {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            toast={toast}
            onDismiss={(id) => toastManager.removeToast(id)}
          />
        </div>
      ))}
    </div>
  )
}

