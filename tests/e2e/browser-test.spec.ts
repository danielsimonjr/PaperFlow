/**
 * Manual Browser Test Script
 * Run with: npx playwright test tests/manual/browser-test.ts --headed
 */

import { test } from '@playwright/test';
import path from 'path';

const PDF_PATH = 'C:\\Users\\danie\\Dropbox\\Misc\\ Large Language Models - A Survey.pdf';
const BASE_URL = 'http://localhost:5173';

test.describe('PaperFlow Browser Testing', () => {
  test.setTimeout(120000); // 2 minute timeout for manual observation

  test('Complete app walkthrough', async ({ page }) => {
    console.log('\n🚀 Starting PaperFlow Browser Test...\n');

    // 1. Test Home Page
    console.log('📄 Step 1: Testing Home Page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of home page
    await page.screenshot({ path: 'tests/e2e/screenshots/01-home.png', fullPage: true });
    console.log('   ✅ Home page loaded');

    // Check for drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"], .drop-zone, [class*="drop"], [class*="upload"]').first();
    const hasDropZone = await dropZone.count() > 0;
    console.log(`   ${hasDropZone ? '✅' : '❌'} Drop zone present`);

    // 2. Upload PDF
    console.log('\n📄 Step 2: Uploading PDF...');

    // Find file input (might be hidden)
    const fileInput = page.locator('input[type="file"]').first();

    // Upload the PDF
    await fileInput.setInputFiles(PDF_PATH);
    console.log('   📁 PDF file selected:', path.basename(PDF_PATH));

    // Wait for PDF to load
    await page.waitForTimeout(3000); // Give time for PDF to process

    // Take screenshot after upload
    await page.screenshot({ path: 'tests/e2e/screenshots/02-pdf-loaded.png', fullPage: true });

    // Check if we're on the editor page or if PDF rendered
    const currentUrl = page.url();
    console.log('   📍 Current URL:', currentUrl);

    // 3. Test PDF Viewer (if loaded)
    console.log('\n📄 Step 3: Testing PDF Viewer...');

    // Look for common PDF viewer elements
    const canvas = page.locator('canvas').first();
    const hasCanvas = await canvas.count() > 0;
    console.log(`   ${hasCanvas ? '✅' : '⏳'} PDF canvas rendered`);

    // Look for thumbnails
    const thumbnails = page.locator('[class*="thumbnail"], [data-testid*="thumbnail"]');
    const thumbnailCount = await thumbnails.count();
    console.log(`   📑 Thumbnails found: ${thumbnailCount}`);

    // Look for toolbar
    const toolbar = page.locator('[class*="toolbar"], [role="toolbar"], header').first();
    const hasToolbar = await toolbar.count() > 0;
    console.log(`   ${hasToolbar ? '✅' : '❌'} Toolbar present`);

    // 4. Test Zoom Controls
    console.log('\n📄 Step 4: Testing Zoom Controls...');

    const zoomIn = page.locator('button:has-text("+"), [aria-label*="zoom in" i], [title*="zoom in" i]').first();
    const zoomOut = page.locator('button:has-text("-"), [aria-label*="zoom out" i], [title*="zoom out" i]').first();

    if (await zoomIn.count() > 0) {
      await zoomIn.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Zoom in clicked');
    }

    if (await zoomOut.count() > 0) {
      await zoomOut.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Zoom out clicked');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/03-zoomed.png', fullPage: true });

    // 5. Test Keyboard Shortcuts
    console.log('\n📄 Step 5: Testing Keyboard Shortcuts...');

    // Press H for highlight tool
    await page.keyboard.press('h');
    await page.waitForTimeout(300);
    console.log('   ⌨️ Pressed H (highlight tool)');

    // Press N for note tool
    await page.keyboard.press('n');
    await page.waitForTimeout(300);
    console.log('   ⌨️ Pressed N (note tool)');

    // Press V for select tool
    await page.keyboard.press('v');
    await page.waitForTimeout(300);
    console.log('   ⌨️ Pressed V (select tool)');

    await page.screenshot({ path: 'tests/e2e/screenshots/04-tools.png', fullPage: true });

    // 6. Test Settings Page
    console.log('\n📄 Step 6: Testing Settings Page...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/05-settings.png', fullPage: true });

    const settingsTitle = page.locator('h1, h2').first();
    const settingsText = await settingsTitle.textContent().catch(() => '');
    console.log('   📋 Settings page title:', settingsText || '(none found)');

    // 7. Test Privacy Page
    console.log('\n📄 Step 7: Testing Privacy Page...');
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/06-privacy.png', fullPage: true });
    console.log('   ✅ Privacy page loaded');

    // 8. Test Terms Page
    console.log('\n📄 Step 8: Testing Terms Page...');
    await page.goto(`${BASE_URL}/terms`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/07-terms.png', fullPage: true });
    console.log('   ✅ Terms page loaded');

    // 9. Test 404 Page
    console.log('\n📄 Step 9: Testing 404 Page...');
    await page.goto(`${BASE_URL}/nonexistent-page`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/08-404.png', fullPage: true });
    console.log('   ✅ 404 page loaded');

    // 10. Go back to editor and take final screenshot
    console.log('\n📄 Step 10: Final check...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for any console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`   Screenshots saved to: tests/e2e/screenshots/`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach(err => console.log(`      ❌ ${err}`));
    }
    console.log('='.repeat(50));
    console.log('\n✅ Browser test complete!\n');
  });
});
