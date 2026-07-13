import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Default pool `forks` spawns one OS child process per worker; Windows
    // process creation is far more expensive than Linux fork(), so the full
    // 153-file suite's cold-start burst (~1 process per logical core, each
    // importing the full React/jsdom/testing-library module graph) causes
    // measurably worse contention on Windows than on the Linux CI runner.
    // Under synthetic full-core CPU contention (10 busy-loop processes on a
    // 12-core Windows box), that contention was severe enough to trip
    // Vitest's fixed 5000ms default testTimeout on purely-synchronous tests
    // that do no async work at all — reproduced exactly
    // Privacy.test.tsx > "should have a back button",
    // formFilling.test.tsx > "should render all form fields on a page", and
    // signatureCreation.test.tsx > "should call onClose when close button is
    // clicked" as `Error: Test timed out in 5000ms`, none of which involve
    // async code. `threads` reuses worker_threads inside one process (cheap
    // to spawn on every OS) instead of forking child processes. Measured
    // under identical synthetic stress: full-suite wall time dropped from
    // 235s (forks) to 121s (threads) — roughly half — which is why this is
    // a real fix for the underlying contention rather than a workaround.
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
