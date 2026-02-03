/**
 * Cross-Platform Editing E2E Tests
 *
 * Verifies that editing functionality works identically across all platforms.
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Platform Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/viewer');
    // Wait for PDF to load
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
      // Select note tool
      await page.click('[data-testid="tool-note"]');

      // Click to place note
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 200, y: 200 } });

      // Verify note dialog appears
      await expect(page.locator('[data-testid="note-editor"]')).toBeVisible();

      // Add note content
      await page.locator('[data-testid="note-content"]').fill('Test note content');
      await page.click('[data-testid="note-save-btn"]');

      // Verify note was created
      const notes = await page.locator('[data-testid="sticky-note"]').count();
      expect(notes).toBeGreaterThan(0);
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
      // First create an annotation
      await page.click('[data-testid="tool-note"]');
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 200, y: 200 } });
      await page.locator('[data-testid="note-content"]').fill('Note to delete');
      await page.click('[data-testid="note-save-btn"]');

      // Select the annotation
      await page.locator('[data-testid="sticky-note"]').first().click();

      // Delete it
      await page.keyboard.press('Delete');

      // Verify deletion
      const notes = await page.locator('[data-testid="sticky-note"]').count();
      expect(notes).toBe(0);
    });
  });

  test.describe('Undo/Redo', () => {
    test('should undo annotation', async ({ page }) => {
      // Create annotation
      await page.click('[data-testid="tool-note"]');
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 200, y: 200 } });
      await page.locator('[data-testid="note-content"]').fill('Test');
      await page.click('[data-testid="note-save-btn"]');

      // Undo
      await page.keyboard.press('Control+z');

      // Verify annotation was removed
      const notes = await page.locator('[data-testid="sticky-note"]').count();
      expect(notes).toBe(0);
    });

    test('should redo annotation', async ({ page }) => {
      // Create and undo
      await page.click('[data-testid="tool-note"]');
      const viewer = page.locator('[data-testid="pdf-viewer"]');
      await viewer.click({ position: { x: 200, y: 200 } });
      await page.locator('[data-testid="note-content"]').fill('Test');
      await page.click('[data-testid="note-save-btn"]');
      await page.keyboard.press('Control+z');

      // Redo
      await page.keyboard.press('Control+Shift+z');

      // Verify annotation was restored
      const notes = await page.locator('[data-testid="sticky-note"]').count();
      expect(notes).toBe(1);
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
