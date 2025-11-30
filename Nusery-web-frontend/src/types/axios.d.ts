/**
 * Type augmentation for axios to support custom metadata
 */
import 'axios'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      skipLoading?: boolean
      [key: string]: unknown
    }
  }
}

