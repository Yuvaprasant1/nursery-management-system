'use client'

import { Toaster } from '@/components/Toaster/Toaster'
import ConfirmationDialog from '@/components/ConfirmationDialog/ConfirmationDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary'
import { LoadingOverlay } from '@/components/Loading'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { NurseryProvider } from '@/contexts/NurseryContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import '../index.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <LoadingProvider>
            <AuthProvider>
              <NurseryProvider>
                <ThemeProvider>
                  {children}
                  <LoadingOverlay />
                  <Toaster />
                  <ConfirmationDialog />
                </ThemeProvider>
              </NurseryProvider>
            </AuthProvider>
          </LoadingProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

