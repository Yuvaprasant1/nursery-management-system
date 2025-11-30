'use client'

import { useEffect } from 'react'
import { ROUTES, STORAGE_KEYS } from '@/constants'

/**
 * 404 Not Found Page
 * Clears cache and redirects to login page when path is not found
 */
export default function NotFoundPage() {
  useEffect(() => {
    // Clear all cached data from localStorage
    const keysToClear = [
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.THEME,
      STORAGE_KEYS.NURSERY,
    ]

    keysToClear.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear sessionStorage as well
    sessionStorage.clear()

    // Clear all other localStorage items that might be cached
    // (excluding items we want to keep)
    const keysToKeep = new Set(keysToClear)
    const allKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !keysToKeep.has(key)) {
        allKeys.push(key)
      }
    }
    allKeys.forEach((key) => localStorage.removeItem(key))

    // Clear sidebar state
    localStorage.removeItem('sidebarCollapsed')

    // Do a hard redirect to login page with a full page reload
    // This ensures all caches (React Query, browser cache, etc.) are cleared
    window.location.href = ROUTES.LOGIN
  }, [])

  return null
}

