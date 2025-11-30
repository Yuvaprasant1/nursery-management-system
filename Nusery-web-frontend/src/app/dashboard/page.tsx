'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { useTheme } from '@/contexts/ThemeContext'
import { LoadingState } from '@/components/Loading/LoadingState'
import DashboardScreen from '@/screens/dashboard/DashboardScreen'
import Layout from '@/components/Layout/Layout'
import { ROUTES } from '@/constants'

/**
 * Dashboard Page - Default landing page after successful login
 */
export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { nursery, isWaiting: nurseryWaiting } = useNursery()
  const { isWaiting: themeWaiting } = useTheme()

  useEffect(() => {
    // Only check after auth, nursery, and theme waiting are complete
    if (!authLoading && !nurseryWaiting && !themeWaiting) {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN)
        return
      }
      // Only redirect if nursery is missing AFTER waiting is complete
      // This ensures we wait for the API call to finish before checking
      if (!nursery) {
        router.push(ROUTES.LOGIN)
        return
      }
    }
    // If still waiting, don't do anything - wait for waiting to complete
  }, [isAuthenticated, nursery, authLoading, nurseryWaiting, themeWaiting, router])

  // Show loading state while any context is waiting
  if (authLoading || nurseryWaiting || themeWaiting) {
    return <LoadingState fullScreen message="Loading..." />
  }

  // Don't render if not authenticated or nursery is missing
  if (!isAuthenticated || !nursery) {
    return null
  }

  return (
    <Layout>
      <DashboardScreen />
    </Layout>
  )
}

