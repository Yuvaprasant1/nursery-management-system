import { useState, useEffect, useRef } from 'react'
import { confirmationManager } from './useConfirmationDialog'
import { ConfirmationVariant } from '@/enums'
import { ButtonAction } from '@/enums'

function ConfirmationDialog() {
  const [state, setState] = useState(confirmationManager.getState())
  
  useEffect(() => {
    const unsubscribe = confirmationManager.subscribe(() => {
      setState(confirmationManager.getState())
    })
    return unsubscribe
  }, [])
  
  const confirm = () => confirmationManager.confirm()
  const cancel = () => confirmationManager.cancel()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (state.isOpen) {
      // Focus cancel button by default
      cancelButtonRef.current?.focus()
      
      // Handle Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancel()
        }
      }
      
      // Handle Enter key on confirm button
      const handleEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && document.activeElement === confirmButtonRef.current) {
          confirm()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleEnter)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('keydown', handleEnter)
      }
    }
  }, [state.isOpen, confirm, cancel])
  
  if (!state.isOpen) {
    return null
  }
  
  const getVariantColors = (variant: ConfirmationVariant = ConfirmationVariant.INFO) => {
    switch (variant) {
      case ConfirmationVariant.DANGER:
        return {
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-600',
        }
      case ConfirmationVariant.WARNING:
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-600',
        }
      case ConfirmationVariant.INFO:
      default:
        return {
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'text-blue-600',
        }
    }
  }
  
  const colors = getVariantColors(state.variant)
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          cancel()
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
          {state.title}
        </h3>
        {state.customContent ? (
          <div id="dialog-description" className="mb-6">
            {state.customContent}
          </div>
        ) : (
          <p id="dialog-description" className="text-sm text-gray-600 mb-6">
            {state.message}
          </p>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={cancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {state.cancelText || ButtonAction.CANCEL}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={confirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${colors.button}`}
          >
            {state.confirmText || ButtonAction.CONFIRM}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog

