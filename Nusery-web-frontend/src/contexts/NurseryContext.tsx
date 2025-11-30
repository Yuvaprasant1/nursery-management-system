'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { STORAGE_KEYS, ROUTES } from '@/constants'
import { useAuth } from './AuthContext'
import { useRouter } from 'next/navigation'
import { nurseryApi } from '@/services/nurseryService'
import { Nursery } from '@/types/nursery'

interface NurseryContextType {
  nursery: Nursery | null
  isWaiting: boolean
  setNursery: (nursery: Nursery | null) => void
  refreshNursery: () => Promise<void>
}

const NurseryContext = createContext<NurseryContextType | undefined>(undefined)

/**
 * NurseryProvider Component
 * 
 * Manages nursery data state and loading:
 * - Loads nursery from localStorage or API
 * - Validates cached nursery matches user's nurseryId
 * - Resets state on logout
 * - Provides nursery data to child components
 */
export function NurseryProvider({ children }: { children: ReactNode }) {
  const [nursery, setNurseryState] = useState<Nursery | null>(null)
  const [isWaiting, setIsWaiting] = useState(true)
  
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  /**
   * Validates and parses nursery from localStorage
   */
  const getCachedNursery = useCallback((): Nursery | null => {
    try {
      const savedNursery = localStorage.getItem(STORAGE_KEYS.NURSERY)
      if (!savedNursery) {
        return null
      }

      const parsedNursery = JSON.parse(savedNursery) as Nursery
      
      if (!parsedNursery?.id) {
        localStorage.removeItem(STORAGE_KEYS.NURSERY)
        return null
      }

      // Validate nursery matches user's nurseryId
      if (user?.nurseryId && parsedNursery.id !== user.nurseryId) {
        localStorage.removeItem(STORAGE_KEYS.NURSERY)
        return null
      }

      return parsedNursery
    } catch {
      localStorage.removeItem(STORAGE_KEYS.NURSERY)
      return null
    }
  }, [user?.nurseryId])

  /**
   * Fetches nursery from API
   */
  const fetchNursery = useCallback(async (nurseryId: string): Promise<Nursery | null> => {
    try {
      const fetchedNursery = await nurseryApi.getNurseryById(nurseryId)
      localStorage.setItem(STORAGE_KEYS.NURSERY, JSON.stringify(fetchedNursery))
      return fetchedNursery
    } catch {
      localStorage.removeItem(STORAGE_KEYS.NURSERY)
      return null
    }
  }, [])

  /**
   * Main nursery loading logic
   */
  useEffect(() => {
    const loadNursery = async () => {
      setIsWaiting(true)

      if (!isAuthenticated || !user) {
        setNurseryState(null)
        setIsWaiting(false)
        return
      }

      // Try to load from cache first
      const cachedNursery = getCachedNursery()
      if (cachedNursery) {
        setNurseryState(cachedNursery)
        setIsWaiting(false)
        return
      }

      // If user has nurseryId, fetch from API
      if (user.nurseryId) {
        const fetchedNursery = await fetchNursery(user.nurseryId)
        setNurseryState(fetchedNursery)
      } else {
        setNurseryState(null)
      }

      setIsWaiting(false)
    }

    loadNursery()
  }, [isAuthenticated, user, getCachedNursery, fetchNursery])

  /**
   * Updates nursery state and localStorage
   */
  const setNursery = useCallback((newNursery: Nursery | null) => {
    setNurseryState(newNursery)
    
    if (newNursery) {
      localStorage.setItem(STORAGE_KEYS.NURSERY, JSON.stringify(newNursery))
    } else {
      localStorage.removeItem(STORAGE_KEYS.NURSERY)
    }
  }, [])

  /**
   * Refreshes nursery data from API
   */
  const refreshNursery = useCallback(async () => {
    if (!nursery?.id) {
      return
    }

    try {
      const updatedNursery = await nurseryApi.getNurseryById(nursery.id)
      setNursery(updatedNursery)
    } catch {
      setNursery(null)
      logout()
      router.push(ROUTES.LOGIN)
    }
  }, [nursery?.id, setNursery, logout, router])

  /**
   * Reset state on logout
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setNurseryState(null)
      localStorage.removeItem(STORAGE_KEYS.NURSERY)
      setIsWaiting(true)
    }
  }, [isAuthenticated])

  return (
    <NurseryContext.Provider
      value={{
        nursery,
        isWaiting,
        setNursery,
        refreshNursery,
      }}
    >
      {children}
    </NurseryContext.Provider>
  )
}

/**
 * Hook to access NurseryContext
 * @throws Error if used outside NurseryProvider
 */
export function useNursery() {
  const context = useContext(NurseryContext)
  
  if (context === undefined) {
    throw new Error('useNursery must be used within a NurseryProvider')
  }
  
  return context
}
