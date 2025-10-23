// Script to clear authentication state and test proper login flow
// Run this in browser console to reset authentication

console.log('🔄 Clearing authentication state...');

// Clear localStorage auth data
localStorage.removeItem('auth-storage');
localStorage.removeItem('authToken');

// Clear any other auth-related storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('auth') || key.includes('user') || key.includes('token')) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

// Clear sessionStorage as well
sessionStorage.clear();

console.log('✅ Authentication state cleared');
console.log('🔄 Reloading page to reset React state...');

// Reload the page to reset React state
window.location.reload();
