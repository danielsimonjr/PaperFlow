/**
 * Cross-Platform Editing E2E Tests
 *
 * Verifies that editing functionality works identically across all platforms.
 */

import { test, expect, type Page } from '@playwright/test';
import { openSampleDocument } from '../helpers/openSampleDocument';

/**
 * Place a collapsed sticky note with the note tool. The tool overlays the page and places a
 * note where it is clicked, so the click goes to the overlay, not to the `pdf-viewer` region
 * (that region is the scroll area and starts left of the page).
 */
async function placeNote(page: Page): Promise<void> {
  await page.click('[data-testid="tool-note"]');
  await page
    .getByRole('button', { name: 'Click to place note' })
    .first()
    .click({ position: { x: 200, y: 200 } });
  await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(1);
}

/** Expand the collapsed note: the icon button inside it opens the editor. */
async function expandNote(page: Page): Promise<void> {
  await page.locator('[data-testid="sticky-note"] button').first().click();
  await expect(page.locator('[data-testid="note-editor"]')).toBeVisible();
}

test.describe('Cross-Platform Editing', () => {
  test.beforeEach(async ({ page }) => {
    // The editor lives at /editor and needs an open document.
    await openSampleDocument(page);
    await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 10000 });
  });

  test.describe('Annotations', () => {
    test('should add highlight annotation', async ({ page }) => {
      // Select highlight tool
      await page.click('[data-testid="tool-highlight"]');

      // Select text (simulate selection)
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 100, y: 100 } });
      await page.mouse.down();
      await page.mouse.move(300, 100);
      await page.mouse.up();

      // Verify highlight was created
      const highlights = await page.locator('[data-testid="highlight-annotation"]').count();
      expect(highlights).toBeGreaterThan(0);
    });

    test('should add sticky note', async ({ page }) => {
      await placeNote(page);

      // The editor opens when the note is expanded. A note saves as its text changes,
      // so the editor has no save button; closing it keeps the text.
      await expandNote(page);
      await page.locator('[data-testid="note-content"]').fill('Test note content');
      await page.locator('[data-testid="note-content"]').press('Escape');
      await expect(page.locator('[data-testid="note-editor"]')).toBeHidden();

      await expandNote(page);
      await expect(page.locator('[data-testid="note-content"]')).toHaveValue('Test note content');
    });

    test('should keep the text under a highlight selectable', async ({ page }) => {
      const line = page.locator('.textLayer span').nth(4);
      const box = await line.boundingBox();
      if (!box) throw new Error('the text line has no box');
      const y = box.y + box.height / 2;
      const dragAcrossLine = async () => {
        await page.mouse.move(box.x + 3, y);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 3, y, { steps: 6 });
        await page.mouse.up();
      };

      // Highlight the line with the selection popup.
      await dragAcrossLine();
      await page.locator('button[title="Highlight"]').first().click();
      await expect(page.locator('[data-testid="highlight-annotation"]')).toHaveCount(1);

      // The annotation layer is above the text layer. A drag that starts on the highlighted
      // text must still select it, so the highlight lets the pointer through.
      await page.evaluate(() => window.getSelection()?.removeAllRanges());
      await dragAcrossLine();
      const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
      expect(selected).toContain('The word test');
    });

    test('should draw freehand annotation', async ({ page }) => {
      // Select draw tool
      await page.click('[data-testid="tool-draw"]');

      // Draw on canvas
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 100, y: 100 } });
      await page.mouse.down();
      await page.mouse.move(150, 150);
      await page.mouse.move(200, 100);
      await page.mouse.move(250, 150);
      await page.mouse.up();

      // Verify drawing was created
      const drawings = await page.locator('[data-testid="drawing-annotation"]').count();
      expect(drawings).toBeGreaterThan(0);
    });

    test('should delete annotation', async ({ page }) => {
      await placeNote(page);
      await expandNote(page);
      await page.locator('[data-testid="note-content"]').fill('Note to delete');

      // The editor's footer deletes the note.
      await page.getByRole('button', { name: 'Delete Note' }).click();

      await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(0);
    });
  });

  test.describe('Undo/Redo', () => {
    test('should undo annotation', async ({ page }) => {
      await placeNote(page);

      await page.keyboard.press('Control+z');

      await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(0);
    });

    test('should redo annotation', async ({ page }) => {
      await placeNote(page);
      await page.keyboard.press('Control+z');
      await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(0);

      await page.keyboard.press('Control+Shift+z');

      await expect(page.locator('[data-testid="sticky-note"]')).toHaveCount(1);
    });
  });

  test.describe('Forms', () => {
    test('should fill text field', async ({ page }) => {
      // Navigate to a page with forms
      const textField = page.locator('[data-testid="form-text-field"]').first();

      if (await textField.isVisible()) {
        await textField.fill('Test input');
        expect(await textField.inputValue()).toBe('Test input');
      }
    });

    test('should check checkbox', async ({ page }) => {
      const checkbox = page.locator('[data-testid="form-checkbox"]').first();

      if (await checkbox.isVisible()) {
        await checkbox.click();
        expect(await checkbox.isChecked()).toBe(true);
      }
    });

    test('should select dropdown option', async ({ page }) => {
      const dropdown = page.locator('[data-testid="form-dropdown"]').first();

      if (await dropdown.isVisible()) {
        await dropdown.selectOption({ index: 1 });
        const value = await dropdown.inputValue();
        expect(value).toBeTruthy();
      }
    });
  });

  test.describe('Signatures', () => {
    test('should open signature dialog', async ({ page }) => {
      await page.click('[data-testid="tool-signature"]');

      // Verify signature modal opens
      await expect(page.locator('[data-testid="signature-modal"]')).toBeVisible();
    });

    test('should draw signature', async ({ page }) => {
      await page.click('[data-testid="tool-signature"]');

      // Draw in signature pad
      const signaturePad = page.locator('[data-testid="signature-pad"]');
      await signaturePad.click({ position: { x: 50, y: 50 } });
      await page.mouse.down();
      await page.mouse.move(100, 50);
      await page.mouse.move(150, 100);
      await page.mouse.up();

      // Verify drawing
      const isEmpty = await page.locator('[data-testid="signature-pad"]').getAttribute('data-empty');
      expect(isEmpty).toBe('false');
    });

    test('should place signature on document', async ({ page }) => {
      await page.click('[data-testid="tool-signature"]');

      // Draw signature
      const signaturePad = page.locator('[data-testid="signature-pad"]');
      await signaturePad.click({ position: { x: 50, y: 50 } });
      await page.mouse.down();
      await page.mouse.move(100, 50);
      await page.mouse.up();

      // Apply signature
      await page.click('[data-testid="apply-signature-btn"]');

      // Click to place
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 300, y: 400 } });

      // Verify signature was placed
      const signatures = await page.locator('[data-testid="signature-annotation"]').count();
      expect(signatures).toBeGreaterThan(0);
    });
  });
});
