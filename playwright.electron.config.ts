import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron E2E tests
 *
 * Run with: npx playwright test --config=playwright.electron.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e-electron',
  fullyParallel: false, // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for Electron tests
  reporter: [['html', { outputFolder: 'playwright-report-electron' }]],
  timeout: 60000, // Longer timeout for Electron startup
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // No webServer needed - Electron tests launch the app directly
});
