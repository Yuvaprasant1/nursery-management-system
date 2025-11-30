import { useState, useEffect, useCallback, ReactNode } from 'react'
import { ConfirmationVariant } from '@/enums'

export interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  customContent?: ReactNode
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

let confirmationState: ConfirmationState = {
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
}

let listeners: Array<() => void> = []

const notifyListeners = () => {
  listeners.forEach(listener => listener())
}

export const confirmationManager = {
  subscribe(listener: () => void) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },
  
  getState() {
    return { ...confirmationState }
  },
  
  show(options: ConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      confirmationState = {
        ...options,
        isOpen: true,
        resolve,
      }
      notifyListeners()
    })
  },
  
  confirm() {
    if (confirmationState.resolve) {
      confirmationState.resolve(true)
    }
    this.close()
  },
  
  cancel() {
    if (confirmationState.resolve) {
      confirmationState.resolve(false)
    }
    this.close()
  },
  
  close() {
    confirmationState = {
      ...confirmationState,
      isOpen: false,
      resolve: null,
    }
    notifyListeners()
  },
}

export function useConfirmationDialog() {
  const [state, setState] = useState(confirmationManager.getState())
  
  useEffect(() => {
    const unsubscribe = confirmationManager.subscribe(() => {
      setState(confirmationManager.getState())
    })
    
    return unsubscribe
  }, [])
  
  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return confirmationManager.show(options)
  }, [])
  
  return {
    state,
    showConfirmation,
    confirm: confirmationManager.confirm.bind(confirmationManager),
    cancel: confirmationManager.cancel.bind(confirmationManager),
  }
}

