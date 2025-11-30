'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { useNursery } from './NurseryContext'

interface Theme {
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

interface ThemeContextType {
  theme: Theme
  isWaiting: boolean
  updateTheme: (nurseryId: string, themeData: Partial<Theme>) => Promise<void>
  refreshTheme: (nurseryId: string) => Promise<void>
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

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider Component
 * 
 * Manages theme data and CSS variable application:
 * - Loads theme from API based on nursery
 * - Applies theme to CSS variables
 * - Resets to default theme when no nursery
 * - Synchronizes with nursery context state
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isWaiting, setIsWaiting] = useState(true)
  
  const { nursery, isWaiting: nurseryWaiting } = useNursery()
  
  /**
   * Fetches theme from API
   */
  const refreshTheme = useCallback(async (nurseryId: string) => {
    try {
      setIsWaiting(true)
      const response = await apiClient.get<ApiResponse<Theme>>(
        `/theme/nursery/${nurseryId}`
      )
      setTheme(response.data.data)
    } catch {
      setTheme(defaultTheme)
    } finally {
      setIsWaiting(false)
    }
  }, [])
  
  /**
   * Loads theme when nursery changes
   */
  useEffect(() => {
    if (nursery?.id) {
      refreshTheme(nursery.id)
    } else {
      setTheme(defaultTheme)
      setIsWaiting(false)
    }
  }, [nursery?.id, refreshTheme])
  
  /**
   * Resets waiting state when nursery context resets (on logout)
   */
  useEffect(() => {
    if (nurseryWaiting && !nursery) {
      setIsWaiting(true)
    }
  }, [nurseryWaiting, nursery])

  /**
   * Applies theme to CSS variables and document
   */
  useEffect(() => {
    const root = document.documentElement
    
    // Set CSS custom properties
    root.style.setProperty('--primary-color', theme.primaryColor)
    root.style.setProperty('--secondary-color', theme.secondaryColor)
    root.style.setProperty('--accent-color', theme.accentColor)
    root.style.setProperty('--font-family', theme.fontFamily)
    root.style.setProperty('--font-size-base', theme.fontSizeBase)
    root.style.setProperty('--border-radius', theme.borderRadius)
    root.style.setProperty('--spacing-unit', theme.spacingUnit)
    
    // Apply theme mode
    if (theme.themeMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])
  
  /**
   * Updates theme via API
   */
  const updateTheme = useCallback(
    async (nurseryId: string, themeData: Partial<Theme>) => {
      const response = await apiClient.post<ApiResponse<Theme>>(
        `/theme/nursery/${nurseryId}`,
        themeData
      )
    setTheme(response.data.data)
    },
    []
  )
  
  return (
    <ThemeContext.Provider
      value={{
        theme,
        isWaiting,
        updateTheme,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access ThemeContext
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}
