import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dashboard/', // Base path for NPM proxy routing
  build: {
    sourcemap: false, // Disable source maps to avoid CSP eval issues
    minify: 'terser', // Use terser instead of esbuild for better CSP compatibility
    target: 'es2015', // Target older browsers to avoid eval in polyfills
  },
  server: {
    host: '0.0.0.0', // Allow network access (iPad)
    port: 5173,
    strictPort: true,
  },
})
