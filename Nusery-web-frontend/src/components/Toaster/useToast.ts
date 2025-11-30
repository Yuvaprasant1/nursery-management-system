import { useCallback } from 'react'
import { ToastType } from '@/enums'

let toastIdCounter = 0
let toasts: Array<{ id: string; message: string; type: ToastType; duration?: number }> = []
let listeners: Array<() => void> = []

const notifyListeners = () => {
  listeners.forEach(listener => listener())
}

export const toastManager = {
  subscribe(listener: () => void) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },
  
  getToasts() {
    return [...toasts]
  },
  
  addToast(message: string, type: ToastType, duration = 5000) {
    const id = `toast-${++toastIdCounter}`
    const toast = { id, message, type, duration }
    toasts.push(toast)
    notifyListeners()
    
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    }
    
    return id
  },
  
  removeToast(id: string) {
    toasts = toasts.filter(t => t.id !== id)
    notifyListeners()
  },
  
  clear() {
    toasts = []
    notifyListeners()
  },
}

export function useToast() {
  const success = useCallback((message: string, options?: { duration?: number }) => {
    return toastManager.addToast(message, ToastType.SUCCESS, options?.duration)
  }, [])
  
  const error = useCallback((message: string, options?: { duration?: number }) => {
    return toastManager.addToast(message, ToastType.ERROR, options?.duration || 7000)
  }, [])
  
  const info = useCallback((message: string, options?: { duration?: number }) => {
    return toastManager.addToast(message, ToastType.INFO, options?.duration)
  }, [])
  
  return { success, error, info }
}

