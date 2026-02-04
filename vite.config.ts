import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Use relative paths for Electron builds (file:// protocol requires ./)
const isElectron = process.env.ELECTRON === 'true' || process.env.npm_lifecycle_event?.includes('electron');

export default defineConfig({
  // Use relative paths for Electron, absolute for web
  base: isElectron ? './' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'PaperFlow',
        short_name: 'PaperFlow',
        description: 'The Modern PDF Editor for Everyone',
        theme_color: '#1E3A5F',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up outdated caches
        cleanupOutdatedCaches: true,
        // Navigation fallback for SPA
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.[^/]+$/],
        runtimeCaching: [
          // PDF.js library - cache first for reliability
          {
            urlPattern: /^https:\/\/unpkg\.com\/pdfjs-dist/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'paperflow-pdfjs-v1',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Static assets - stale-while-revalidate for fast loading
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'paperflow-static-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Images - cache first with background update
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'paperflow-images-v1',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Fonts - cache first (fonts rarely change)
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'paperflow-fonts-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // PDF documents - cache first for offline access
          {
            urlPattern: /\.pdf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'paperflow-pdfs-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
          // API calls - network first with cache fallback
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'paperflow-api-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-engine': ['pdfjs-dist', 'pdf-lib'],
          'ui-framework': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
});
