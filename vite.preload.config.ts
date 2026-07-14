import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Preload build — CommonJS, deliberately separate from vite.electron.config.ts.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * package.json declares `"type": "module"`, so a `.js` preload is loaded as ESM.
 * But Electron requires the preload to be **CommonJS** whenever `sandbox: true`
 * (which electron/main/index.ts sets, alongside contextIsolation). The preload was
 * previously emitted as ESM by vite.electron.config.ts (`formats: ['es']`), and
 * Electron rejected it at launch:
 *
 *   Unable to load preload script: dist-electron/preload/index.js
 *   SyntaxError: Cannot use import statement outside a module
 *
 * That failure is SILENT from the app's point of view: the window still opens, but
 * no `contextBridge` API is ever exposed — so every native file operation / IPC
 * path in the desktop app is dead.
 *
 * Emitting `.cjs` (not `.js`) is what makes Node treat it as CommonJS despite
 * `"type": "module"`. The MAIN process stays ESM — Electron 28+ supports that.
 *
 * `emptyOutDir: false` because this runs AFTER the main build and must not wipe it.
 */
export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: false,
    ssr: true,
    lib: {
      entry: {
        'preload/index': path.resolve(__dirname, 'electron/preload/index.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
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
        'buffer',
      ],
      output: {
        entryFileNames: '[name].cjs',
        chunkFileNames: 'chunks/[name].cjs',
      },
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
  },
});
