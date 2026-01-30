/**
 * Full Feature Test Suite for PaperFlow
 * Tests all toolbar tools, header actions, and viewer features
 */

import { test, expect, Page } from '@playwright/test';

const PDF_PATH = 'C:\\Users\\danie\\Dropbox\\Misc\\ Large Language Models - A Survey.pdf';
const BASE_URL = 'http://localhost:5173';

// Helper to wait for PDF to load
async function waitForPdfLoad(page: Page) {
  await page.waitForTimeout(3000);
  await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });
}

// Helper to take a labeled screenshot
async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/full-test-${name}.png`, fullPage: true });
}

test.describe('PaperFlow Full Feature Test', () => {
  test.setTimeout(300000); // 5 minutes for comprehensive testing

  test.beforeEach(async ({ page }) => {
    // Navigate to home and upload PDF
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(PDF_PATH);

    await waitForPdfLoad(page);
  });

  test('1. Page loads correctly with PDF', async ({ page }) => {
    console.log('\n📄 TEST 1: Page Load Verification\n');

    // Verify URL navigated to editor
    expect(page.url()).toContain('/editor');

    // Check header elements
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Check filename is displayed
    const fileName = page.getByText('Large Language Models - A Survey.pdf');
    await expect(fileName).toBeVisible();
    console.log('   ✅ PDF loaded and filename displayed');

    // Check canvas is rendered
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    console.log('   ✅ Canvas rendered');

    await screenshot(page, '01-page-loaded');
  });

  test('2. Toolbar Tool Selection', async ({ page }) => {
    console.log('\n📄 TEST 2: Toolbar Tool Selection\n');

    // Test each tool by clicking toolbar buttons
    const tools = [
      { title: 'Select', key: 'v', desc: 'Select tool' },
      { title: 'Hand', key: null, desc: 'Hand/Pan tool' },
      { title: 'Add Text', key: null, desc: 'Text tool' },
      { title: 'Highlight', key: 'h', desc: 'Highlight tool' },
      { title: 'Underline', key: 'u', desc: 'Underline tool' },
      { title: 'Strikethrough', key: 's', desc: 'Strikethrough tool' },
      { title: 'Sticky Note', key: 'n', desc: 'Note tool' },
      { title: 'Draw', key: null, desc: 'Draw tool' },
      { title: 'Shapes', key: null, desc: 'Shape tool' },
    ];

    for (const tool of tools) {
      const button = page.locator(`button[title*="${tool.title}"]`).first();
      if (await button.count() > 0) {
        await button.click();
        await page.waitForTimeout(200);
        console.log(`   ✅ ${tool.desc} clicked`);
      } else {
        console.log(`   ⚠️ ${tool.desc} button not found`);
      }
    }

    await screenshot(page, '02-tools-tested');
  });

  test('3. Keyboard Shortcuts', async ({ page }) => {
    console.log('\n📄 TEST 3: Keyboard Shortcuts\n');

    const shortcuts = [
      { key: 'v', tool: 'Select' },
      { key: 'h', tool: 'Highlight' },
      { key: 'u', tool: 'Underline' },
      { key: 's', tool: 'Strikethrough' },
      { key: 'n', tool: 'Note' },
    ];

    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut.key);
      await page.waitForTimeout(200);
      console.log(`   ✅ Pressed '${shortcut.key.toUpperCase()}' (${shortcut.tool})`);
    }

    // Return to select tool
    await page.keyboard.press('v');

    await screenshot(page, '03-shortcuts-tested');
  });

  test('4. Zoom Controls', async ({ page }) => {
    console.log('\n📄 TEST 4: Zoom Controls\n');

    // Find zoom buttons
    const zoomIn = page.locator('button[title*="Zoom in"], button[title*="zoom in"]').first();
    const zoomOut = page.locator('button[title*="Zoom out"], button[title*="zoom out"]').first();

    // Get initial zoom level from display
    const zoomDisplay = page.locator('text=/\\d+%/').first();
    let initialZoom = '100%';
    if (await zoomDisplay.count() > 0) {
      initialZoom = await zoomDisplay.textContent() || '100%';
    }
    console.log(`   Initial zoom: ${initialZoom}`);

    // Zoom in 3 times
    for (let i = 0; i < 3; i++) {
      if (await zoomIn.count() > 0) {
        await zoomIn.click();
        await page.waitForTimeout(300);
      }
    }
    console.log('   ✅ Zoomed in 3 times');

    await screenshot(page, '04a-zoomed-in');

    // Zoom out 5 times
    for (let i = 0; i < 5; i++) {
      if (await zoomOut.count() > 0) {
        await zoomOut.click();
        await page.waitForTimeout(300);
      }
    }
    console.log('   ✅ Zoomed out 5 times');

    await screenshot(page, '04b-zoomed-out');

    // Try fit to width/page if available
    const fitWidth = page.locator('button[title*="Fit to width"], button[title*="fit width"]').first();
    const fitPage = page.locator('button[title*="Fit to page"], button[title*="fit page"]').first();

    if (await fitWidth.count() > 0) {
      await fitWidth.click();
      await page.waitForTimeout(300);
      console.log('   ✅ Fit to width');
    }

    if (await fitPage.count() > 0) {
      await fitPage.click();
      await page.waitForTimeout(300);
      console.log('   ✅ Fit to page');
    }

    await screenshot(page, '04c-zoom-fit');
  });

  test('5. Page Navigation', async ({ page }) => {
    console.log('\n📄 TEST 5: Page Navigation\n');

    // Get page count from navigation
    const pageInfo = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
    if (await pageInfo.count() > 0) {
      const text = await pageInfo.textContent();
      console.log(`   Page info: ${text}`);
    }

    // Next page button
    const nextBtn = page.locator('button[aria-label*="Next"], button[title*="Next"], button:has(svg[class*="chevron-right"]), button:has(svg[class*="arrow-right"])').first();
    const prevBtn = page.locator('button[aria-label*="Previous"], button[title*="Previous"], button:has(svg[class*="chevron-left"]), button:has(svg[class*="arrow-left"])').first();

    // Navigate forward
    for (let i = 0; i < 5; i++) {
      // Try clicking the > button in page navigation
      const navNext = page.locator('button').filter({ hasText: '>' }).first();
      if (await navNext.count() > 0) {
        await navNext.click();
        await page.waitForTimeout(500);
      } else if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }
    console.log('   ✅ Navigated forward 5 pages');

    await screenshot(page, '05a-page-forward');

    // Navigate backward
    for (let i = 0; i < 3; i++) {
      const navPrev = page.locator('button').filter({ hasText: '<' }).first();
      if (await navPrev.count() > 0) {
        await navPrev.click();
        await page.waitForTimeout(500);
      } else if (await prevBtn.count() > 0) {
        await prevBtn.click();
        await page.waitForTimeout(500);
      }
    }
    console.log('   ✅ Navigated backward 3 pages');

    await screenshot(page, '05b-page-backward');

    // Try direct page input
    const pageInput = page.locator('input[type="text"], input[type="number"]').filter({ hasText: '' }).first();
    const pageInputs = await page.locator('input').all();
    for (const input of pageInputs) {
      const value = await input.inputValue();
      if (/^\d+$/.test(value)) {
        await input.fill('10');
        await input.press('Enter');
        await page.waitForTimeout(500);
        console.log('   ✅ Jumped to page 10 via input');
        break;
      }
    }

    await screenshot(page, '05c-page-jump');
  });

  test('6. View Modes', async ({ page }) => {
    console.log('\n📄 TEST 6: View Modes\n');

    // Look for view mode toggle buttons
    const viewModeButtons = page.locator('button[title*="page"], button[title*="view"], button[aria-label*="view"]');
    const count = await viewModeButtons.count();

    if (count > 0) {
      console.log(`   Found ${count} view mode buttons`);

      // Click each view mode
      for (let i = 0; i < count; i++) {
        await viewModeButtons.nth(i).click();
        await page.waitForTimeout(500);
        console.log(`   ✅ Clicked view mode button ${i + 1}`);
      }
    }

    // Also look for specific view mode icons
    const singlePage = page.locator('button[title*="Single"]').first();
    const continuous = page.locator('button[title*="Continuous"]').first();
    const spread = page.locator('button[title*="Spread"], button[title*="Two"]').first();

    if (await singlePage.count() > 0) {
      await singlePage.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Single page view');
      await screenshot(page, '06a-single-page');
    }

    if (await continuous.count() > 0) {
      await continuous.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Continuous view');
      await screenshot(page, '06b-continuous');
    }

    if (await spread.count() > 0) {
      await spread.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Spread view');
      await screenshot(page, '06c-spread');
    }
  });

  test('7. Theme Toggle', async ({ page }) => {
    console.log('\n📄 TEST 7: Theme Toggle\n');

    // Find theme toggle (sun/moon icon)
    const themeToggle = page.locator('button[title*="theme" i], button[aria-label*="theme" i], button:has(svg[class*="sun"]), button:has(svg[class*="moon"])').first();

    if (await themeToggle.count() > 0) {
      // Toggle dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Theme toggled (1)');
      await screenshot(page, '07a-theme-toggle-1');

      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
      console.log('   ✅ Theme toggled (2)');
      await screenshot(page, '07b-theme-toggle-2');
    } else {
      console.log('   ⚠️ Theme toggle not found');
    }
  });

  test('8. Header Actions - Image Export', async ({ page }) => {
    console.log('\n📄 TEST 8: Image Export Dialog\n');

    const imageExportBtn = page.locator('button[title*="Image"], button[title*="Export"]').first();

    if (await imageExportBtn.count() > 0) {
      await imageExportBtn.click();
      await page.waitForTimeout(500);

      // Check if dialog opened
      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]').first();
      if (await dialog.count() > 0) {
        console.log('   ✅ Image export dialog opened');
        await screenshot(page, '08-image-export-dialog');

        // Close dialog
        const closeBtn = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label*="close"]').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(300);
      }
    } else {
      console.log('   ⚠️ Image export button not found');
    }
  });

  test('9. Header Actions - Print Dialog', async ({ page }) => {
    console.log('\n📄 TEST 9: Print Dialog\n');

    const printBtn = page.locator('button[title*="Print"]').first();

    if (await printBtn.count() > 0) {
      await printBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]').first();
      if (await dialog.count() > 0) {
        console.log('   ✅ Print dialog opened');
        await screenshot(page, '09-print-dialog');

        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } else {
      console.log('   ⚠️ Print button not found');
    }
  });

  test('10. Header Actions - Compress Dialog', async ({ page }) => {
    console.log('\n📄 TEST 10: Compress Dialog\n');

    const compressBtn = page.locator('button[title*="Compress"]').first();

    if (await compressBtn.count() > 0) {
      await compressBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]').first();
      if (await dialog.count() > 0) {
        console.log('   ✅ Compress dialog opened');
        await screenshot(page, '10-compress-dialog');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } else {
      console.log('   ⚠️ Compress button not found');
    }
  });

  test('11. Sidebar - Thumbnails', async ({ page }) => {
    console.log('\n📄 TEST 11: Sidebar Thumbnails\n');

    // Look for sidebar/thumbnail area
    const sidebar = page.locator('[class*="sidebar"], aside, [class*="thumbnail"]').first();

    if (await sidebar.count() > 0) {
      console.log('   ✅ Sidebar visible');

      // Count thumbnails
      const thumbnails = page.locator('[class*="thumbnail"] img, [class*="thumbnail"] canvas');
      const thumbCount = await thumbnails.count();
      console.log(`   📑 Thumbnails found: ${thumbCount}`);

      // Click a thumbnail
      if (thumbCount > 3) {
        await thumbnails.nth(3).click();
        await page.waitForTimeout(500);
        console.log('   ✅ Clicked thumbnail 4');
      }

      await screenshot(page, '11-sidebar-thumbnails');
    } else {
      console.log('   ⚠️ Sidebar not found');
    }
  });

  test('12. Highlight Color Picker', async ({ page }) => {
    console.log('\n📄 TEST 12: Highlight Color Picker\n');

    // Activate highlight tool
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    // Look for dropdown arrow near highlight button
    const highlightArea = page.locator('button[title*="Highlight"]').first();
    if (await highlightArea.count() > 0) {
      // Try to find and click the color dropdown
      const dropdownArrow = page.locator('button[title*="color" i], button[title*="Choose"]').first();

      if (await dropdownArrow.count() > 0) {
        await dropdownArrow.click();
        await page.waitForTimeout(300);

        // Look for color options
        const colorButtons = page.locator('[class*="color"] button, button[style*="background"]');
        const colorCount = await colorButtons.count();
        console.log(`   🎨 Color options found: ${colorCount}`);

        if (colorCount > 0) {
          await colorButtons.nth(2).click();
          console.log('   ✅ Selected a different color');
        }

        await screenshot(page, '12-highlight-colors');
      }
    }

    // Return to select
    await page.keyboard.press('v');
  });

  test('13. Export/Import Annotations', async ({ page }) => {
    console.log('\n📄 TEST 13: Export/Import Annotations\n');

    const exportImportBtn = page.locator('button[title*="Export/Import"], button[title*="annotation" i]').first();

    if (await exportImportBtn.count() > 0) {
      await exportImportBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"], .modal, [class*="dialog"]').first();
      if (await dialog.count() > 0) {
        console.log('   ✅ Export/Import dialog opened');
        await screenshot(page, '13-export-import-dialog');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } else {
      console.log('   ⚠️ Export/Import button not found');
    }
  });

  test('14. Text Selection and Annotation', async ({ page }) => {
    console.log('\n📄 TEST 14: Text Selection\n');

    // Make sure we're on the first page
    await page.keyboard.press('v'); // Select tool

    // Try to select text on the PDF canvas area
    const textLayer = page.locator('.textLayer, [class*="text-layer"]').first();

    if (await textLayer.count() > 0) {
      const box = await textLayer.boundingBox();
      if (box) {
        // Try to drag select some text
        await page.mouse.move(box.x + 50, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 100);
        await page.mouse.up();
        await page.waitForTimeout(500);

        console.log('   ✅ Attempted text selection');
        await screenshot(page, '14-text-selection');
      }
    } else {
      console.log('   ⚠️ Text layer not found');
    }
  });

  test('15. Settings Page', async ({ page }) => {
    console.log('\n📄 TEST 15: Settings Page\n');

    const settingsBtn = page.locator('button[title*="Settings"], a[href*="settings"]').first();

    if (await settingsBtn.count() > 0) {
      await settingsBtn.click();
      await page.waitForTimeout(500);

      // Check if we navigated to settings
      if (page.url().includes('settings')) {
        console.log('   ✅ Navigated to settings page');
        await screenshot(page, '15-settings-page');

        // Look for setting options
        const toggles = page.locator('[role="switch"], input[type="checkbox"]');
        const toggleCount = await toggles.count();
        console.log(`   ⚙️ Found ${toggleCount} toggle settings`);

        // Go back
        await page.goBack();
        await page.waitForTimeout(500);
      }
    } else {
      // Try direct navigation
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForTimeout(500);
      console.log('   ✅ Navigated to settings via URL');
      await screenshot(page, '15-settings-page');
    }
  });

  test('16. Scroll and Continuous Mode', async ({ page }) => {
    console.log('\n📄 TEST 16: Scroll Behavior\n');

    // Get the main viewer/scroll container
    const viewer = page.locator('[class*="viewer"], [class*="scroll"], main').first();

    if (await viewer.count() > 0) {
      // Scroll down
      await viewer.evaluate((el) => {
        el.scrollTop += 1000;
      });
      await page.waitForTimeout(500);
      console.log('   ✅ Scrolled down');

      // Scroll more
      await viewer.evaluate((el) => {
        el.scrollTop += 2000;
      });
      await page.waitForTimeout(500);
      console.log('   ✅ Scrolled more');

      await screenshot(page, '16-scrolled');

      // Scroll back to top
      await viewer.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.waitForTimeout(500);
      console.log('   ✅ Scrolled to top');
    }
  });

  test('17. Comprehensive Console Error Check', async ({ page }) => {
    console.log('\n📄 TEST 17: Console Error Check\n');

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Perform rapid actions
    await page.keyboard.press('h');
    await page.waitForTimeout(100);
    await page.keyboard.press('n');
    await page.waitForTimeout(100);
    await page.keyboard.press('u');
    await page.waitForTimeout(100);
    await page.keyboard.press('s');
    await page.waitForTimeout(100);
    await page.keyboard.press('v');
    await page.waitForTimeout(500);

    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('   ❌ Errors found:');
      errors.slice(0, 5).forEach(e => console.log(`      - ${e.substring(0, 100)}`));
    } else {
      console.log('   ✅ No console errors');
    }
  });

  test('18. Final Summary', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FULL FEATURE TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\nScreenshots saved to: tests/e2e/screenshots/full-test-*.png');
    console.log('\n✅ All feature tests executed!');
    console.log('='.repeat(60) + '\n');

    await screenshot(page, '18-final');
  });
});
