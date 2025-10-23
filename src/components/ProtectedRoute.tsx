import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore, UserRole } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

/**
 * ProtectedRoute Component
 * Handles authentication and authorization for protected routes
 * 
 * @param children - Child components to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route
 * @param requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const location = useLocation()
  const [isVerifying, setIsVerifying] = useState(true)
  
  const { 
    isAuthenticated, 
    user, 
    token, 
    verifyToken,
    isLoading 
  } = useAuthStore()

  /**
   * Verify token on component mount and when token changes
   */
  useEffect(() => {
    const verifyUserToken = async () => {
      if (token && !isAuthenticated) {
        // Token exists but user is not authenticated, verify it
        await verifyToken()
      }
      setIsVerifying(false)
    }

    verifyUserToken()
  }, [token, isAuthenticated, verifyToken])

  // Show loading spinner while verifying token or during auth operations
  if (isVerifying || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but doesn't have required role
  if (isAuthenticated && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = `/dashboard/${user.role}`
    return <Navigate to={redirectPath} replace />
  }

  // User is authenticated and authorized, render children
  return <>{children}</>
}

/**
 * Higher-order component for creating role-specific protected routes
 */
export const createRoleProtectedRoute = (allowedRoles: UserRole[]) => {
  return ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Pre-configured protected route components for specific roles
 */
export const AdminRoute = createRoleProtectedRoute(['admin'])
export const DriverRoute = createRoleProtectedRoute(['driver'])
export const CustomerRoute = createRoleProtectedRoute(['customer'])
export const DriverOrAdminRoute = createRoleProtectedRoute(['driver', 'admin'])
export const CustomerOrAdminRoute = createRoleProtectedRoute(['customer', 'admin'])

/**
 * Component for routes that should only be accessible when NOT authenticated
 * (e.g., login, register pages)
 */
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, token } = useAuthStore()
  
  // Debug logging
  console.log('🔍 PublicOnlyRoute check:', {
    isAuthenticated,
    hasUser: !!user,
    hasToken: !!token,
    userRole: user?.role
  })

  // Only redirect if user is truly authenticated with valid token and user data
  if (isAuthenticated && user && token) {
    console.log(`🔄 Authenticated user detected, redirecting to /dashboard/${user.role}`)
    return <Navigate to={`/dashboard/${user.role}`} replace />
  }

  // User is not authenticated, render auth forms
  console.log('✅ User not authenticated, showing auth form')
  return <>{children}</>
}

export default ProtectedRoute
