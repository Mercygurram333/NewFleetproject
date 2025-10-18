import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: false, // Set to true if you want HTTPS in development
    host: true,
    port: 5173,
    // Uncomment below for HTTPS (requires certificate files)
    // https: {
    //   key: readFileSync(resolve(__dirname, 'localhost-key.pem')),
    //   cert: readFileSync(resolve(__dirname, 'localhost.pem')),
    // }
  }
})
