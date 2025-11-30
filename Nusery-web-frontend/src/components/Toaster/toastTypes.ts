export { ToastType } from '@/enums'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ToastOptions {
  duration?: number
}

