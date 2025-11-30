/**
 * Application-wide constants
 */

export const APP_NAME = 'Nursery Management System'

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  NURSERY: 'nursery',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    NURSERY: '/auth/nursery',
  },
  NURSERY: '/nursery',
  BREEDS: '/breeds',
  SAPLINGS: '/saplings',
  INVENTORY: '/inventory',
  TRANSACTIONS: '/transactions',
  DASHBOARD: '/dashboard',
  THEME: '/theme',
} as const

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard', // Dashboard route after login
  SAPLINGS: '/saplings',
  BREEDS: '/breeds',
  INVENTORY: '/inventory',
  TRANSACTIONS: '/transactions',
  THEME: '/theme',
  ADMIN: '/admin',
  ADMIN_NURSERY: '/admin/nursery',
  ADMIN_THEME: '/admin/theme',
} as const

export const QUERY_KEYS = {
  NURSERY: 'nursery',
  BREEDS: 'breeds',
  SAPLINGS: 'saplings',
  INVENTORY: 'inventory',
  TRANSACTIONS: 'transactions',
  DASHBOARD: 'dashboard',
  THEME: 'theme',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 0,
} as const

export const DEBOUNCE_DELAY = 500

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  FULL: 'MMMM dd, yyyy',
  TIME: 'hh:mm a',
  DATETIME: 'MMM dd, yyyy hh:mm a',
} as const

