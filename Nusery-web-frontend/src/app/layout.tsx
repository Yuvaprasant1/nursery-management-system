'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/Toaster/Toaster'
import ConfirmationDialog from '@/components/ConfirmationDialog/ConfirmationDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { NurseryProvider } from '@/contexts/NurseryContext'
import '../index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always refetch when component mounts
      staleTime: 0, // Always fetch fresh data (no caching) - ensures live data
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep in cache for quick access but always refetch
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as { statusCode?: number }).statusCode
          if (statusCode && statusCode >= 400 && statusCode < 500) {
            return false
          }
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NurseryProvider>
                <ThemeProvider>
                  {children}
                  <Toaster />
                  <ConfirmationDialog />
                </ThemeProvider>
              </NurseryProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

