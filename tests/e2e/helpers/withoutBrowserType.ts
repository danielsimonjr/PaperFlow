import type { devices } from '@playwright/test';

/**
 * Drop `defaultBrowserType` from a Playwright device descriptor.
 *
 * A descriptor carries `defaultBrowserType`, and that key forces a new worker. Playwright therefore
 * refuses `test.use()` with it inside a describe group, and at file level it overrides the browser
 * of the running project (an iPhone descriptor demands webkit even under the chromium project).
 * This keeps the viewport, user agent and touch flags and leaves the browser to the project in
 * `playwright.config.ts`.
 */
export function withoutBrowserType(device: (typeof devices)[string]) {
  const { defaultBrowserType: _browser, ...rest } = device;
  return rest;
}
