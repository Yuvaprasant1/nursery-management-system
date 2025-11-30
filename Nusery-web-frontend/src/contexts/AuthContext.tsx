'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import apiClient from '@/api/client'
import { ApiResponse } from '@/api/types'
import { STORAGE_KEYS } from '@/constants'
import { getErrorMessage } from '@/utils/errors'
import { User } from '@/screens/auth/models/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User
        // Validate user structure
        if (parsedUser && typeof parsedUser.id === 'string' && parsedUser.phone) {
          setUser(parsedUser)
        } else {
          // Invalid user data, clear storage
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      }
    }
    
    setIsLoading(false)
  }, [])
  
  const login = useCallback(async (phone: string, password: string) => {
    try {
      const response = await apiClient.post<ApiResponse<{ token: string; phone: string; userId: string; nurseryId?: string | null }>>('/auth/login', {
        phone,
        password,
      })
      
      const { token, userId, nurseryId } = response.data.data
      
      // Create user object from response
      const userData: User = {
        id: userId,
        phone,
        nurseryId: nurseryId || null,
      }
      
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      setUser(userData)
      
      return userData
    } catch (error) {
      // Re-throw with user-friendly message
      throw new Error(getErrorMessage(error) || 'Login failed. Please check your credentials.')
    }
  }, [])
  
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setUser(null)
  }, [])
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

