import { authApi } from '@/screens/auth/api/authApi'
import { LoginRequest, User } from '@/screens/auth/models/types'

/**
 * Authentication Service
 * Centralized service for authentication operations
 */
export const authService = {
  /**
   * Login with phone and password
   */
  login: async (credentials: LoginRequest): Promise<{ token: string; user: User }> => {
    return authApi.login(credentials)
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    return authApi.getCurrentUser()
  },
}

