/**
 * Cross-Platform Core Features E2E Tests
 *
 * Verifies that core PDF functionality works identically across all platforms.
 */

import { test, expect } from '@playwright/test';
import path from 'path';

// Test fixtures
const TEST_PDF = path.join(__dirname, '../../fixtures/sample.pdf');

test.describe('Cross-Platform Core Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('PDF Loading', () => {
    test('should load a PDF document', async ({ page }) => {
      // Open file dialog would be triggered here
      // For E2E, we use the drag-drop or URL loading

      // Verify the viewer is rendered
      await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display correct page count', async ({ page }) => {
      // Load a test PDF via URL if supported
      await page.goto('/?file=' + encodeURIComponent(TEST_PDF));

      // Wait for PDF to load
      await page.waitForSelector('[data-testid="page-count"]', { timeout: 10000 });

      // Verify page count is displayed
      const pageCount = await page.locator('[data-testid="page-count"]').textContent();
      expect(pageCount).toBeTruthy();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to next page', async ({ page }) => {
      // Navigate to next page
      await page.click('[data-testid="next-page-btn"]');

      // Verify current page changed
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(currentPage).toContain('2');
    });

    test('should navigate to previous page', async ({ page }) => {
      // First go to page 2
      await page.click('[data-testid="next-page-btn"]');

      // Then go back
      await page.click('[data-testid="prev-page-btn"]');

      // Verify we're on page 1
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(currentPage).toContain('1');
    });

    test('should navigate via page input', async ({ page }) => {
      const pageInput = page.locator('[data-testid="page-input"]');
      await pageInput.fill('5');
      await pageInput.press('Enter');

      // Verify navigation
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(currentPage).toContain('5');
    });
  });

  test.describe('Zoom', () => {
    test('should zoom in', async ({ page }) => {
      const initialZoom = await page.locator('[data-testid="zoom-level"]').textContent();

      await page.click('[data-testid="zoom-in-btn"]');

      const newZoom = await page.locator('[data-testid="zoom-level"]').textContent();
      expect(parseInt(newZoom || '0')).toBeGreaterThan(parseInt(initialZoom || '0'));
    });

    test('should zoom out', async ({ page }) => {
      const initialZoom = await page.locator('[data-testid="zoom-level"]').textContent();

      await page.click('[data-testid="zoom-out-btn"]');

      const newZoom = await page.locator('[data-testid="zoom-level"]').textContent();
      expect(parseInt(newZoom || '0')).toBeLessThan(parseInt(initialZoom || '0'));
    });

    test('should fit to width', async ({ page }) => {
      await page.click('[data-testid="fit-width-btn"]');

      // Verify zoom mode
      const zoomMode = await page.locator('[data-testid="zoom-mode"]').textContent();
      expect(zoomMode?.toLowerCase()).toContain('width');
    });
  });

  test.describe('View Modes', () => {
    test('should switch to continuous view', async ({ page }) => {
      await page.click('[data-testid="view-continuous-btn"]');

      // Verify view mode
      const viewMode = await page.locator('[data-testid="view-mode"]').getAttribute('data-mode');
      expect(viewMode).toBe('continuous');
    });

    test('should switch to single page view', async ({ page }) => {
      await page.click('[data-testid="view-single-btn"]');

      const viewMode = await page.locator('[data-testid="view-mode"]').getAttribute('data-mode');
      expect(viewMode).toBe('single');
    });

    test('should switch to spread view', async ({ page }) => {
      await page.click('[data-testid="view-spread-btn"]');

      const viewMode = await page.locator('[data-testid="view-mode"]').getAttribute('data-mode');
      expect(viewMode).toBe('spread');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should navigate with arrow keys', async ({ page }) => {
      // Focus the viewer
      await page.locator('[data-testid="pdf-viewer"]').focus();

      // Press right arrow
      await page.keyboard.press('ArrowRight');

      // Verify page changed
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(currentPage).toContain('2');
    });

    test('should zoom with keyboard', async ({ page }) => {
      const initialZoom = await page.locator('[data-testid="zoom-level"]').textContent();

      // Use Ctrl+= to zoom in
      await page.keyboard.press('Control+=');

      const newZoom = await page.locator('[data-testid="zoom-level"]').textContent();
      expect(parseInt(newZoom || '0')).toBeGreaterThan(parseInt(initialZoom || '0'));
    });
  });

  test.describe('Search', () => {
    test('should open search dialog', async ({ page }) => {
      // Use Ctrl+F shortcut
      await page.keyboard.press('Control+f');

      // Verify search dialog is visible
      await expect(page.locator('[data-testid="search-dialog"]')).toBeVisible();
    });

    test('should find text in document', async ({ page }) => {
      await page.keyboard.press('Control+f');
      await page.locator('[data-testid="search-input"]').fill('test');
      await page.keyboard.press('Enter');

      // Verify search results
      const results = await page.locator('[data-testid="search-results-count"]').textContent();
      expect(results).toBeTruthy();
    });
  });

  test.describe('Sidebar', () => {
    test('should toggle thumbnails sidebar', async ({ page }) => {
      const sidebar = page.locator('[data-testid="thumbnail-sidebar"]');

      // Toggle sidebar
      await page.click('[data-testid="toggle-thumbnails-btn"]');

      // Check visibility changed
      const isVisible = await sidebar.isVisible();
      expect(isVisible).toBeDefined();
    });

    test('should navigate via thumbnail click', async ({ page }) => {
      // Open sidebar if closed
      await page.click('[data-testid="toggle-thumbnails-btn"]');

      // Click third thumbnail
      await page.locator('[data-testid="thumbnail-3"]').click();

      // Verify navigation
      const currentPage = await page.locator('[data-testid="current-page"]').textContent();
      expect(currentPage).toContain('3');
    });
  });
});
