'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useNursery } from '@/contexts/NurseryContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/Toaster/useToast'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { NurseryConfigurationModal } from '@/components/Modal/NurseryConfigurationModal'
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner'
import { getErrorMessage } from '@/utils/errors'

const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9]+$/, 'Phone must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

/**
 * LoginScreen Component
 * 
 * Handles user authentication and navigation flow:
 * - Validates user credentials
 * - Manages nursery configuration for new users
 * - Waits for nursery and theme data to load before navigation
 * - Shows loading states during async operations
 */
export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [showNurseryModal, setShowNurseryModal] = useState(false)
  
  const { login, user } = useAuth()
  const { nursery, isWaiting: nurseryWaiting } = useNursery()
  const { isWaiting: themeWaiting } = useTheme()
  const router = useRouter()
  const toast = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Computed state for loading indicators
  const isDataLoading = useMemo(
    () => nurseryWaiting || themeWaiting,
    [nurseryWaiting, themeWaiting]
  )

  /**
   * Handles login form submission
   */
  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true)
      const loggedInUser = await login(data.phone, data.password)
      
      if (!loggedInUser?.nurseryId) {
        setShowNurseryModal(true)
        setIsLoading(false)
        return
      }
      
      toast.success('Login successful!')
      // Keep loading state active - will be reset in navigation effect
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error) || 'Login failed. Please check your credentials.'
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  /**
   * Handles navigation after data loading completes
   * - Waits for both nursery and theme contexts to finish loading
   * - Navigates to dashboard on success
   * - Shows error or modal based on user state
   */
  useEffect(() => {
    if (isDataLoading) {
      return
    }
    
    if (!user) {
      return
    }

    if (nursery && user.nurseryId) {
      router.replace('/dashboard')
      setIsLoading(false)
      return
    }

    if (user.nurseryId && !nursery) {
      setIsLoading(false)
      toast.error('Failed to load nursery data. Please try again.')
      return
    }

    if (!user.nurseryId) {
      setIsLoading(false)
      setShowNurseryModal(true)
    }
  }, [isDataLoading, nursery, user, router, toast])

  /**
   * Handles nursery configuration completion
   */
  const handleNurseryConfigured = () => {
    setShowNurseryModal(false)
    toast.success('Nursery configured successfully!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12 animate-in fade-in-0 duration-500">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-10 border border-white/20 animate-in slide-in-from-bottom-4 duration-500">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
              Nursery Management
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Welcome back! Please sign in to continue
            </p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              {...register('phone')}
              error={errors.phone?.message}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
              className="transition-all duration-200 focus:scale-[1.02]"
            />
            
            <Button
              type="submit"
              className="w-full mt-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          {/* Loading Indicator - Shows after login success while waiting for data */}
          {isDataLoading && user && (
            <div className="mt-4 flex flex-col items-center justify-center gap-2 animate-in fade-in-0">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-gray-600">Loading your data...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Secure login with encrypted credentials
            </p>
          </div>
        </div>
      </div>

      <NurseryConfigurationModal
        isOpen={showNurseryModal}
        onSuccess={handleNurseryConfigured}
      />
    </div>
  )
}
