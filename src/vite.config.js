import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Rewrite /mobile/* to mobile.html in dev server
    {
      name: 'mobile-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/mobile') && !req.url.includes('.')) {
            req.url = '/mobile.html';
          }
          next();
        });
      },
    },
  ],
  base: './', // Use relative paths for assets
  build: {
    sourcemap: false, // Disable source maps to avoid CSP eval issues
    minify: 'terser', // Use terser instead of esbuild for better CSP compatibility
    target: 'es2015', // Target older browsers to avoid eval in polyfills
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mobile: resolve(__dirname, 'mobile.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0', // Allow network access (iPad)
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.2:8123',
        changeOrigin: true,
      },
    },
  },
})
