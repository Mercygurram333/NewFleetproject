// Script to generate self-signed certificate for HTTPS development
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating self-signed certificate for HTTPS development...');

try {
  // Check if OpenSSL is available
  execSync('openssl version', { stdio: 'ignore' });
  
  // Generate private key
  execSync('openssl genrsa -out localhost-key.pem 2048', { cwd: __dirname });
  
  // Generate certificate
  execSync(`openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { cwd: __dirname });
  
  console.log('✅ Certificate generated successfully!');
  console.log('📁 Files created:');
  console.log('   - localhost-key.pem (private key)');
  console.log('   - localhost.pem (certificate)');
  console.log('');
  console.log('🔧 To enable HTTPS:');
  console.log('   1. Uncomment the HTTPS section in vite.config.ts');
  console.log('   2. Set https: true in the server config');
  console.log('   3. Restart the development server');
  
} catch (error) {
  console.log('❌ OpenSSL not found or error generating certificate');
  console.log('💡 Alternative solutions:');
  console.log('   1. Install OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Use mkcert: https://github.com/FiloSottile/mkcert');
  console.log('   3. Or simply proceed with HTTP for development (safe for local use)');
}
