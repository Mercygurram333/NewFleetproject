// Utility to reset localStorage for development
export const resetStorage = () => {
  localStorage.removeItem('fleet-admin-storage')
  localStorage.removeItem('fleet-realtime-storage')
  localStorage.removeItem('fleet-auth-storage')
  console.log('Storage cleared! Please refresh the page.')
}

// Add to window for easy access in dev tools
if (typeof window !== 'undefined') {
  (window as any).resetStorage = resetStorage
}
