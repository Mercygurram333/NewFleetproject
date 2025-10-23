/**
 * Utility functions to reset authentication state
 * Used for debugging and ensuring clean authentication flow
 */

/**
 * Completely clear all authentication data from storage
 */
export const clearAllAuthData = () => {
  console.log('🧹 Clearing all authentication data...')
  
  // Clear localStorage
  localStorage.removeItem('auth-storage')
  localStorage.removeItem('authToken')
  
  // Clear any other auth-related items
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('user') || key.includes('token')) {
      localStorage.removeItem(key)
      console.log(`Removed localStorage: ${key}`)
    }
  })
  
  // Clear sessionStorage
  sessionStorage.clear()
  
  console.log('✅ All authentication data cleared')
}

/**
 * Reset authentication and reload page
 */
export const resetAuthAndReload = () => {
  clearAllAuthData()
  console.log('🔄 Reloading page to reset React state...')
  window.location.reload()
}

/**
 * Check current authentication state in storage
 */
export const debugAuthState = () => {
  console.log('🔍 Current authentication state:')
  console.log('localStorage auth-storage:', localStorage.getItem('auth-storage'))
  console.log('localStorage authToken:', localStorage.getItem('authToken'))
  console.log('sessionStorage:', sessionStorage.length, 'items')
  
  // Parse and display auth storage if it exists
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      console.log('Parsed auth storage:', parsed)
    } catch (e) {
      console.log('Failed to parse auth storage:', e)
    }
  }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    clearAllAuthData,
    resetAuthAndReload,
    debugAuthState
  }
  
  console.log('🛠️ Auth debug functions available as window.authDebug')
}
