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
    lib: {
      entry: {
        'main/index': path.resolve(__dirname, 'electron/main/index.ts'),
        'preload/index': path.resolve(__dirname, 'electron/preload/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'electron',
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
