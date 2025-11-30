/**
 * Utility functions for parallel data loading
 */

import { nurseryApi } from '@/services/nurseryService'
import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { Nursery } from '@/types/nursery'
import { STORAGE_KEYS } from '@/constants'

export interface Theme {
  id?: string
  nurseryId?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  fontSizeBase: string
  logoUrl?: string
  faviconUrl?: string
  borderRadius: string
  spacingUnit: string
  themeMode: string
}

const defaultTheme: Theme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  accentColor: '#10B981',
  fontFamily: 'Inter',
  fontSizeBase: '16px',
  borderRadius: '8px',
  spacingUnit: '8px',
  themeMode: 'light',
}

/**
 * Fetches theme from API
 */
async function fetchTheme(nurseryId: string): Promise<Theme> {
  try {
    const response = await apiClient.get<ApiResponse<Theme>>(
      `/theme/nursery/${nurseryId}`
    )
    return response.data.data
  } catch {
    return defaultTheme
  }
}

/**
 * Loads nursery and theme in parallel
 * Returns cached data immediately if available, then fetches fresh data
 */
export async function loadNurseryAndThemeParallel(
  nurseryId: string
): Promise<{ nursery: Nursery | null; theme: Theme }> {
  // Try to get cached data first for instant response
  let cachedNursery: Nursery | null = null
  try {
    const savedNursery = localStorage.getItem(STORAGE_KEYS.NURSERY)
    if (savedNursery) {
      const parsed = JSON.parse(savedNursery) as Nursery
      if (parsed?.id === nurseryId) {
        cachedNursery = parsed
      }
    }
  } catch {
    // Ignore cache errors
  }

  // Load both in parallel
  const [nursery, theme] = await Promise.all([
    nurseryApi.getNurseryById(nurseryId).catch(() => cachedNursery),
    fetchTheme(nurseryId),
  ])

  // Cache nursery if fetched successfully
  if (nursery) {
    localStorage.setItem(STORAGE_KEYS.NURSERY, JSON.stringify(nursery))
  }

  return {
    nursery: nursery || cachedNursery,
    theme,
  }
}

