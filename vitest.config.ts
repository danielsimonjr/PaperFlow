import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Use the threads pool rather than the default forks pool. Under forks,
    // a single child process is reused across many jsdom files and jsdom's
    // per-realm globals (ArrayBuffer / typed arrays, navigator) drift out of
    // sync with Node's native Web Crypto realm. That surfaces at full-suite
    // scale as nondeterministic failures: SubtleCrypto.importKey rejecting
    // jsdom-realm BufferSource ("2nd argument is not instance of ArrayBuffer
    // ... ERR_INVALID_ARG_TYPE") in the crypto/license tests, and
    // "navigator is not defined" in offlineStorage.getStorageStats. The
    // threads pool keeps each worker's jsdom globals consistent with the
    // crypto realm, so these pass deterministically. No production code or
    // security behaviour changes.
    pool: 'threads',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts', 'tests/integration/**/*.test.tsx', 'tests/electron/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      // Mock optional dependencies for testing
      '@sentry/browser': path.resolve(__dirname, './tests/mocks/sentry.ts'),
    },
  },
});
