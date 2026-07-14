/**
 * Vite Configuration for Electron Main Process
 *
 * This config builds the Electron main process and preload scripts.
 * It's separate from the main vite.config.ts to allow different build settings.
 */

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    ssr: true,
    lib: {
      entry: {
        // Preload is NOT built here. package.json has "type": "module", so a .js
        // preload is loaded as ESM — and Electron requires a CommonJS preload when
        // `sandbox: true` (which this app sets). It failed at launch with:
        //   Unable to load preload script: dist-electron/preload/index.js
        //   SyntaxError: Cannot use import statement outside a module
        // ...silently killing every contextBridge API (i.e. all native file IPC).
        // It is built separately as CommonJS by vite.preload.config.ts -> index.cjs.
        // The MAIN process is fine as ESM (Electron 28+ supports it).
        'main/index': path.resolve(__dirname, 'electron/main/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'electron',
        'electron-updater',
        'electron-log',
        /^node:/,
        'path',
        'fs',
        'fs/promises',
        'url',
        'os',
        'crypto',
        'events',
        'stream',
        'util',
        'assert',
        'child_process',
        'http',
        'https',
        'net',
        'tls',
        'zlib',
        'constants',
        'buffer',
        'worker_threads',
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
      },
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    target: 'node18',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
