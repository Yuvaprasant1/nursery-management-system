/**
 * Custom error classes and error handling utilities
 */

import { ErrorMessage } from '@/enums'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export class NetworkError extends Error {
  constructor(message: string = ErrorMessage.NETWORK_ERROR) {
    super(message)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = ErrorMessage.UNAUTHORIZED_ACTION) {
    super(message)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class NotFoundError extends Error {
  constructor(message: string = ErrorMessage.RESOURCE_NOT_FOUND) {
    super(message)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Extracts user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof NetworkError) {
    return error.message
  }
  
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return ErrorMessage.UNEXPECTED_ERROR_RETRY
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || 
         (error instanceof ApiError && !error.statusCode)
}

/**
 * Checks if error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  return error instanceof ApiError && 
         error.statusCode !== undefined && 
         error.statusCode >= 400 && 
         error.statusCode < 500
}

/**
 * Checks if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && 
         error.statusCode !== undefined && 
         error.statusCode >= 500
}

