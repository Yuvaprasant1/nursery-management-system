'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { LoadingState } from '@/components/Loading/LoadingState'
import NurseryScreen from '@/screens/admin/NurseryScreen'
import Layout from '@/components/Layout/Layout'

export default function AdminNurseryPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { nursery, isWaiting: nurseryWaiting } = useNursery()

  useEffect(() => {
    if (!authLoading && !nurseryWaiting) {
      if (!isAuthenticated || !nursery) {
        router.push('/login')
      }
    }
  }, [isAuthenticated, nursery, authLoading, nurseryWaiting, router])

  if (authLoading || nurseryWaiting) {
    return <LoadingState fullScreen message="Checking authentication..." />
  }

  if (!isAuthenticated || !nursery) {
    return null
  }

  return (
    <Layout>
      <NurseryScreen />
    </Layout>
  )
}

