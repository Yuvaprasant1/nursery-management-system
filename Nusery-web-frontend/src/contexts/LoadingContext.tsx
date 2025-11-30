'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { loadingManager } from '@/utils/loadingManager'

interface LoadingContextType {
  isLoading: boolean
  loadingCount: number
  startLoading: () => void
  stopLoading: () => void
  setLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to loading manager for API request tracking
  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((loading) => {
      setIsLoading(loading)
      setLoadingCount(loadingManager.getRequestCount())
    })

    return unsubscribe
  }, [])

  const startLoading = useCallback(() => {
    loadingManager.startLoading()
  }, [])

  const stopLoading = useCallback(() => {
    loadingManager.stopLoading()
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      loadingManager.startLoading()
    } else {
      loadingManager.stopLoading()
    }
  }, [])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingCount,
        startLoading,
        stopLoading,
        setLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

