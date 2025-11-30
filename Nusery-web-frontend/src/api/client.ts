import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { STORAGE_KEYS, ROUTES } from '@/constants'
import { ApiError, NetworkError, UnauthorizedError, NotFoundError, ValidationError } from '@/utils/errors'
import { HttpStatusCode, ErrorMessage } from '@/enums'
import { ApiResponse } from '@/api/types'
import { env } from '@/config/env'

// Use environment configuration for API base URL
// In development, use full backend URL directly
// In production, use the configured production URL or '/api' for Next.js rewrites
const isDevelopment = env.NODE_ENV === 'development'
const API_BASE_URL = isDevelopment
  ? env.API_BASE_URL  // Direct connection to backend in development
  : (env.API_BASE_URL.startsWith('http') ? env.API_BASE_URL : '/api')  // Use configured URL or Next.js rewrites


export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: env.API_TIMEOUT, // Use configured timeout
  withCredentials: false, // Set to true if you need to send cookies
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  () => {
    return Promise.reject(new NetworkError(ErrorMessage.FAILED_TO_SEND_REQUEST))
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error (no response from server)
    if (!error.response) {
      return Promise.reject(
        new NetworkError(error.message || ErrorMessage.NETWORK_ERROR)
      )
    }

    const { status, data } = error.response

    // Handle specific status codes
    switch (status) {
      case HttpStatusCode.UNAUTHORIZED:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        // Dispatch a custom event for navigation (components can listen to this)
        if (typeof window !== 'undefined') {
          // Use custom event that components can listen to, or fallback to window.location
          window.dispatchEvent(new CustomEvent('navigate', { detail: { path: ROUTES.LOGIN, replace: true } }))
          // Fallback: navigate after a short delay to allow event listeners to handle it
          setTimeout(() => {
            if (window.location.pathname !== ROUTES.LOGIN) {
              window.location.href = ROUTES.LOGIN
            }
          }, 100)
        }
        // Extract message from ApiResponse structure
        const unauthorizedData = data as ApiResponse<unknown> | { message?: string }
        const unauthorizedMessage = 
          (unauthorizedData as ApiResponse<unknown>)?.message || 
          (unauthorizedData as { message?: string })?.message || 
          ErrorMessage.UNAUTHORIZED_ACTION
        return Promise.reject(new UnauthorizedError(unauthorizedMessage))

      case HttpStatusCode.FORBIDDEN:
        return Promise.reject(
          new UnauthorizedError(ErrorMessage.NO_PERMISSION)
        )

      case HttpStatusCode.NOT_FOUND:
        // Extract message from ApiResponse structure
        const notFoundData = data as ApiResponse<unknown> | { message?: string }
        const notFoundMessage = 
          (notFoundData as ApiResponse<unknown>)?.message || 
          (notFoundData as { message?: string })?.message || 
          ErrorMessage.RESOURCE_NOT_FOUND
        return Promise.reject(new NotFoundError(notFoundMessage))

      case HttpStatusCode.BAD_REQUEST:
      case HttpStatusCode.UNPROCESSABLE_ENTITY:
        // Validation errors - extract message from ApiResponse structure
        const errorData = data as ApiResponse<unknown> | { message?: string; errors?: Record<string, string[]> }
        // Handle both ApiResponse format and direct error format
        const errorMessage = 
          (errorData as ApiResponse<unknown>)?.message || 
          (errorData as { message?: string })?.message || 
          ErrorMessage.VALIDATION_FAILED
        const errorDetails = (errorData as { errors?: Record<string, string[]> })?.errors
        return Promise.reject(
          new ValidationError(errorMessage, errorDetails)
        )

      case HttpStatusCode.INTERNAL_SERVER_ERROR:
      case HttpStatusCode.BAD_GATEWAY:
      case HttpStatusCode.SERVICE_UNAVAILABLE:
      case HttpStatusCode.GATEWAY_TIMEOUT:
        // Extract message from ApiResponse structure
        const serverErrorData = data as ApiResponse<unknown> | { message?: string }
        const serverErrorMessage = 
          (serverErrorData as ApiResponse<unknown>)?.message || 
          (serverErrorData as { message?: string })?.message || 
          ErrorMessage.SERVER_ERROR
        return Promise.reject(
          new ApiError(serverErrorMessage, status, data)
        )

      default:
        // Extract message from ApiResponse structure
        const defaultErrorData = data as ApiResponse<unknown> | { message?: string }
        const defaultErrorMessage = 
          (defaultErrorData as ApiResponse<unknown>)?.message || 
          (defaultErrorData as { message?: string })?.message || 
          ErrorMessage.UNEXPECTED_ERROR
        return Promise.reject(
          new ApiError(defaultErrorMessage, status, data)
        )
    }
  }
)

export default apiClient

