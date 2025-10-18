import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'driver' | 'customer'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>
  register: (name: string, email: string, password: string, role?: UserRole, phone?: string) => Promise<boolean>
  logout: () => void
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, password: string) => Promise<boolean>
  verifyToken: () => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api'

// Helper function to handle fetch with better error handling
const fetchWithErrorHandling = async (url: string, options: RequestInit) => {
  console.log('Making request to:', url)
  console.log('Request options:', options)
  
  try {
    const response = await fetch(url, options)
    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }))
      console.error('Error response:', errorData)
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Success response:', data)
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check if the backend is running on port 3001.')
    }
    throw error
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user with email and password
       * @param email - User email
       * @param password - User password  
       * @param role - Optional role filter
       * @returns Promise<boolean> - Success status
       */
      login: async (email: string, password: string, role?: UserRole) => {
        set({ isLoading: true, error: null })
        
        try {
          const data = await fetchWithErrorHandling(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
          })

          if (data.success) {
            // Store token and user data
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // Store token in localStorage for API requests
            localStorage.setItem('authToken', data.token)
            
            return true
          } else {
            set({
              isLoading: false,
              error: data.message || 'Login failed'
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Network error. Please check your connection.'
          })
          return false
        }
      },

      /**
       * Register new user
       * @param name - User name
       * @param email - User email
       * @param password - User password
       * @param role - User role (default: customer)
       * @param phone - Optional phone number
       * @returns Promise<boolean> - Success status
       */
      register: async (name: string, email: string, password: string, role: UserRole = 'customer', phone?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const data = await fetchWithErrorHandling(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role, phone }),
          })

          if (data.success) {
            // Auto-login after successful registration
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // Store token in localStorage
            localStorage.setItem('authToken', data.token)
            
            return true
          } else {
            set({
              isLoading: false,
              error: data.message || 'Registration failed'
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Network error. Please check your connection.'
          })
          return false
        }
      },

      /**
       * Send forgot password request
       * @param email - User email
       * @returns Promise<boolean> - Success status
       */
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          })

          const data = await response.json()

          if (data.success) {
            set({ isLoading: false, error: null })
            return true
          } else {
            set({
              isLoading: false,
              error: data.message || 'Failed to send reset email'
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Network error. Please check your connection.'
          })
          return false
        }
      },

      /**
       * Reset password with token
       * @param token - Reset token
       * @param password - New password
       * @returns Promise<boolean> - Success status
       */
      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, password }),
          })

          const data = await response.json()

          if (data.success) {
            set({ isLoading: false, error: null })
            return true
          } else {
            set({
              isLoading: false,
              error: data.message || 'Password reset failed'
            })
            return false
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Network error. Please check your connection.'
          })
          return false
        }
      },

      /**
       * Verify JWT token
       * @returns Promise<boolean> - Token validity
       */
      verifyToken: async () => {
        const { token } = get()
        
        if (!token) {
          return false
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          const data = await response.json()

          if (data.success) {
            set({
              user: data.user,
              isAuthenticated: true
            })
            return true
          } else {
            // Token is invalid, clear auth state
            get().logout()
            return false
          }
        } catch (error) {
          // Network error or invalid token, clear auth state
          get().logout()
          return false
        }
      },

      /**
       * Logout user
       */
      logout: () => {
        // Clear localStorage
        localStorage.removeItem('authToken')
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null })
      },

      /**
       * Set loading state
       * @param loading - Loading status
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
