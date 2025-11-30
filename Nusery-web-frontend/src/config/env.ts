/**
 * Environment configuration and validation
 * Supports both development and production profiles
 */

interface EnvConfig {
  API_BASE_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
  APP_NAME: string
  APP_ENV: string
  ENABLE_DEBUG: boolean
  ENABLE_LOGGING: boolean
  API_TIMEOUT: number
}

function getEnvVar(key: string, defaultValue?: string): string {
  // In Next.js, environment variables prefixed with NEXT_PUBLIC_ are available on client-side
  // Server-side can access all environment variables
  const isClient = typeof window !== 'undefined'
  const publicKey = `NEXT_PUBLIC_${key}`
  
  // Priority: NEXT_PUBLIC_* (client), then direct key (server), then default
  const value = isClient
    ? (process.env[publicKey] || process.env[key] || defaultValue)
    : (process.env[publicKey] || process.env[key] || defaultValue)
  
  if (!value && !defaultValue) {
    // Environment variable not set
  }
  return value || ''
}

function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, String(defaultValue))
  return value === 'true' || value === '1'
}

function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key, String(defaultValue))
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

const isProduction = process.env.NODE_ENV === 'production'

export const env: EnvConfig = {
  API_BASE_URL: getEnvVar('API_BASE_URL', isProduction ? 'https://api.your-production-domain.com' : 'http://localhost:8080'),
  NODE_ENV: (isProduction ? 'production' : 'development') as EnvConfig['NODE_ENV'],
  APP_NAME: getEnvVar('APP_NAME', 'Nursery Management System'),
  APP_ENV: getEnvVar('APP_ENV', isProduction ? 'production' : 'development'),
  ENABLE_DEBUG: getBooleanEnvVar('ENABLE_DEBUG', !isProduction),
  ENABLE_LOGGING: getBooleanEnvVar('ENABLE_LOGGING', !isProduction),
  API_TIMEOUT: getNumberEnvVar('API_TIMEOUT', 30000),
}

// Validate critical environment variables
if (!env.API_BASE_URL) {
  // API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) is required but not set
}

export default env

