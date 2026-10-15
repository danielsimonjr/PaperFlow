import path from 'path';
import { fileURLToPath } from 'url';
import { expect, type Page } from '@playwright/test';

// The package is ESM, so __dirname does not exist; derive it from the module URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the generated fixture. Regenerate it with `node scripts/generate-sample-pdf.mjs`. */
export const SAMPLE_PDF = path.join(__dirname, '../../fixtures/sample.pdf');

/**
 * Open the fixture the way a user does: choose the file on the home page and land on the editor.
 * Resolves once the first page is rendered and the page count is known.
 */
export async function openSampleDocument(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="file"]').first().setInputFiles(SAMPLE_PDF);
  await page.waitForURL('**/editor');
  await expect(page.locator('[data-testid="page-count"]')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
}
