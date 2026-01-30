/**
 * PDF Editor Deep Test
 * Diagnose why PDF isn't rendering
 */

import { test } from '@playwright/test';

const PDF_PATH = 'C:\\Users\\danie\\Dropbox\\Misc\\ Large Language Models - A Survey.pdf';
const BASE_URL = 'http://localhost:5173';

test.describe('PDF Editor Deep Test', () => {
  test.setTimeout(60000);

  test('Diagnose PDF loading issue', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    console.log('\n🔍 PDF Editor Deep Test\n');

    // Step 1: Go to home page
    console.log('Step 1: Loading home page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Step 2: Check what elements exist on home page
    console.log('\nStep 2: Analyzing home page structure...');
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();
    console.log(`   File inputs found: ${fileInputCount}`);

    if (fileInputCount === 0) {
      console.log('   ❌ No file input found!');
      await page.screenshot({ path: 'tests/e2e/screenshots/debug-no-input.png', fullPage: true });
      return;
    }

    // Step 3: Upload PDF
    console.log('\nStep 3: Uploading PDF...');
    const input = fileInput.first();

    // Check if input is visible or hidden
    const isVisible = await input.isVisible();
    console.log(`   Input visible: ${isVisible}`);

    // Set the file
    await input.setInputFiles(PDF_PATH);
    console.log(`   ✅ File set: ${PDF_PATH}`);

    // Step 4: Wait for navigation or response
    console.log('\nStep 4: Waiting for navigation...');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Take screenshot of current state
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-after-upload.png', fullPage: true });

    // Step 5: Check editor page content
    console.log('\nStep 5: Checking editor page content...');

    // Get all elements on the page
    const bodyHtml = await page.locator('body').innerHTML();
    console.log(`   Body HTML length: ${bodyHtml.length} chars`);

    // Look for specific elements
    const canvases = await page.locator('canvas').count();
    const svgs = await page.locator('svg').count();
    const headers = await page.locator('header').count();
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"], .animate-spin').count();

    console.log(`   Canvas elements: ${canvases}`);
    console.log(`   SVG elements: ${svgs}`);
    console.log(`   Header elements: ${headers}`);
    console.log(`   Loading indicators: ${loadingIndicators}`);

    // Wait longer for PDF to potentially load
    console.log('\nStep 6: Waiting 5 more seconds for PDF render...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'tests/e2e/screenshots/debug-after-wait.png', fullPage: true });

    // Check again
    const canvasesAfter = await page.locator('canvas').count();
    console.log(`   Canvas elements after wait: ${canvasesAfter}`);

    // Step 7: Check for any error messages in the UI
    console.log('\nStep 7: Looking for error messages...');
    const errorElements = await page.locator('[class*="error"], [role="alert"]').allTextContents();
    if (errorElements.length > 0) {
      console.log('   Error messages found:');
      errorElements.forEach(e => console.log(`      - ${e}`));
    } else {
      console.log('   No visible error messages');
    }

    // Step 8: Print console logs
    console.log('\nStep 8: Console output...');
    console.log(`   Total logs: ${consoleLogs.length}`);
    console.log(`   Errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n   ❌ Console Errors:');
      consoleErrors.forEach(e => console.log(`      ${e}`));
    }

    // Print last 10 console logs
    console.log('\n   Last 10 console logs:');
    consoleLogs.slice(-10).forEach(log => console.log(`      ${log}`));

    // Final screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/debug-final.png', fullPage: true });

    console.log('\n📊 Test complete. Check screenshots in tests/e2e/screenshots/');
  });
});
