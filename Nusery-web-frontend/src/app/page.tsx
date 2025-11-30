'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants'

/**
 * Root route (/) - Always redirects to login page
 */
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to login page
    router.replace(ROUTES.LOGIN)
  }, [router])

  // Return null while redirecting
  return null
}

