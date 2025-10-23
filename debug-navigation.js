// Debug script to test navigation functionality
// Run this in browser console to test button clicks

console.log('🔍 Navigation Debug Script Started');

// Test if React Router navigate function is available
const testNavigation = () => {
  console.log('Testing navigation functionality...');
  
  // Check if we're on the homepage
  if (window.location.pathname === '/') {
    console.log('✅ On homepage, testing buttons...');
    
    // Find all navigation buttons
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons on page`);
    
    buttons.forEach((button, index) => {
      const text = button.textContent.trim();
      console.log(`Button ${index + 1}: "${text}"`);
      
      // Check if button has click handler
      const hasClickHandler = button.onclick !== null || 
                             button.getAttribute('onclick') !== null ||
                             button.hasAttribute('data-testid');
      
      console.log(`  - Has click handler: ${hasClickHandler}`);
      console.log(`  - Classes: ${button.className}`);
      console.log(`  - Disabled: ${button.disabled}`);
      console.log('---');
    });
    
    // Test specific buttons
    const loginButtons = Array.from(buttons).filter(btn => 
      btn.textContent.toLowerCase().includes('login')
    );
    
    const startButtons = Array.from(buttons).filter(btn => 
      btn.textContent.toLowerCase().includes('start') ||
      btn.textContent.toLowerCase().includes('get started')
    );
    
    console.log(`🔑 Found ${loginButtons.length} login buttons`);
    console.log(`🚀 Found ${startButtons.length} start/register buttons`);
    
    // Test clicking first login button
    if (loginButtons.length > 0) {
      console.log('Testing login button click...');
      try {
        loginButtons[0].click();
        console.log('✅ Login button clicked successfully');
      } catch (error) {
        console.error('❌ Login button click failed:', error);
      }
    }
    
  } else {
    console.log(`Currently on: ${window.location.pathname}`);
  }
};

// Test React Router state
const testReactRouter = () => {
  console.log('Testing React Router...');
  
  // Check if React Router is loaded
  if (window.React) {
    console.log('✅ React is loaded');
  } else {
    console.log('❌ React not found');
  }
  
  // Check current route
  console.log(`Current URL: ${window.location.href}`);
  console.log(`Current pathname: ${window.location.pathname}`);
  console.log(`Current search: ${window.location.search}`);
  console.log(`Current hash: ${window.location.hash}`);
};

// Test backend connectivity
const testBackend = async () => {
  console.log('Testing backend connectivity...');
  
  try {
    const response = await fetch('http://localhost:3001/api/test');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is responding:', data);
    } else {
      console.log('❌ Backend responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🧪 Running comprehensive navigation tests...');
  console.log('=====================================');
  
  testReactRouter();
  console.log('');
  
  await testBackend();
  console.log('');
  
  testNavigation();
  console.log('');
  
  console.log('🏁 Tests completed. Check results above.');
};

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.debugNav = {
  testNavigation,
  testReactRouter,
  testBackend,
  runAllTests
};

console.log('💡 Debug functions available as window.debugNav');
console.log('   - debugNav.testNavigation()');
console.log('   - debugNav.testReactRouter()');
console.log('   - debugNav.testBackend()');
console.log('   - debugNav.runAllTests()');
