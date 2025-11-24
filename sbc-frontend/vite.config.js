import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'nongraphitic-serenely-heidy.ngrok-free.dev',
      '.ngrok-free.dev',  // Allow all ngrok free domains
      '.ngrok.io',        // Allow all ngrok domains
      'localhost',
      '127.0.0.1',
      '10.246.103.99',
    ],
  },
})
