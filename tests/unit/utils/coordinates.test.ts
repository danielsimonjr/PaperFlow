import { describe, it, expect } from 'vitest';
import {
  pdfToScreen,
  screenToPdf,
  pdfRectToScreen,
  screenRectToPdf,
  getBoundingRect,
  isPointInRect,
  rectsIntersect,
  normalizeRects,
} from '@utils/coordinates';

describe('coordinates', () => {
  const baseContext = {
    scale: 1.0,
    pageHeight: 792, // Standard US Letter height in points
    offsetX: 0,
    offsetY: 0,
  };

  describe('pdfToScreen', () => {
    it('should convert PDF coordinates to screen coordinates', () => {
      const pdfPoint = { x: 100, y: 100 };
      const screenPoint = pdfToScreen(pdfPoint, baseContext);

      // PDF Y is from bottom, screen Y is from top
      expect(screenPoint.x).toBe(100);
      expect(screenPoint.y).toBe(792 - 100); // 692
    });

    it('should handle scale', () => {
      const pdfPoint = { x: 100, y: 100 };
      const context = { ...baseContext, scale: 2.0 };
      const screenPoint = pdfToScreen(pdfPoint, context);

      expect(screenPoint.x).toBe(200);
      expect(screenPoint.y).toBe((792 - 100) * 2); // 1384
    });

    it('should handle offsets', () => {
      const pdfPoint = { x: 100, y: 100 };
      const context = { ...baseContext, offsetX: 50, offsetY: 30 };
      const screenPoint = pdfToScreen(pdfPoint, context);

      expect(screenPoint.x).toBe(150);
      expect(screenPoint.y).toBe(792 - 100 + 30); // 722
    });
  });

  describe('screenToPdf', () => {
    it('should convert screen coordinates to PDF coordinates', () => {
      const screenPoint = { x: 100, y: 692 };
      const pdfPoint = screenToPdf(screenPoint, baseContext);

      expect(pdfPoint.x).toBe(100);
      expect(pdfPoint.y).toBe(100);
    });

    it('should be inverse of pdfToScreen', () => {
      const originalPdf = { x: 150, y: 300 };
      const screen = pdfToScreen(originalPdf, baseContext);
      const backToPdf = screenToPdf(screen, baseContext);

      expect(backToPdf.x).toBeCloseTo(originalPdf.x);
      expect(backToPdf.y).toBeCloseTo(originalPdf.y);
    });

    it('should handle scale and offsets', () => {
      const context = { ...baseContext, scale: 1.5, offsetX: 20, offsetY: 10 };
      const originalPdf = { x: 100, y: 200 };
      const screen = pdfToScreen(originalPdf, context);
      const backToPdf = screenToPdf(screen, context);

      expect(backToPdf.x).toBeCloseTo(originalPdf.x);
      expect(backToPdf.y).toBeCloseTo(originalPdf.y);
    });
  });

  describe('pdfRectToScreen', () => {
    it('should convert PDF rect to screen rect', () => {
      const pdfRect = { x: 100, y: 100, width: 50, height: 20 };
      const screenRect = pdfRectToScreen(pdfRect, baseContext);

      expect(screenRect.x).toBe(100);
      expect(screenRect.width).toBe(50);
      expect(screenRect.height).toBe(20);
      // Top of rect in screen coords = pageHeight - (pdfY + height)
      expect(screenRect.y).toBe(792 - 100 - 20); // 672
    });

    it('should handle scale', () => {
      const pdfRect = { x: 100, y: 100, width: 50, height: 20 };
      const context = { ...baseContext, scale: 2.0 };
      const screenRect = pdfRectToScreen(pdfRect, context);

      expect(screenRect.x).toBe(200);
      expect(screenRect.width).toBe(100);
      expect(screenRect.height).toBe(40);
    });
  });

  describe('screenRectToPdf', () => {
    it('should convert screen rect to PDF rect', () => {
      const screenRect = { x: 100, y: 672, width: 50, height: 20 };
      const pdfRect = screenRectToPdf(screenRect, baseContext);

      expect(pdfRect.x).toBe(100);
      expect(pdfRect.width).toBe(50);
      expect(pdfRect.height).toBe(20);
      expect(pdfRect.y).toBe(100);
    });

    it('should be inverse of pdfRectToScreen', () => {
      const originalPdf = { x: 150, y: 300, width: 100, height: 30 };
      const screen = pdfRectToScreen(originalPdf, baseContext);
      const backToPdf = screenRectToPdf(screen, baseContext);

      expect(backToPdf.x).toBeCloseTo(originalPdf.x);
      expect(backToPdf.y).toBeCloseTo(originalPdf.y);
      expect(backToPdf.width).toBeCloseTo(originalPdf.width);
      expect(backToPdf.height).toBeCloseTo(originalPdf.height);
    });
  });

  describe('getBoundingRect', () => {
    it('should return null for empty array', () => {
      expect(getBoundingRect([])).toBeNull();
    });

    it('should return same rect for single rect', () => {
      const rect = { x: 100, y: 100, width: 50, height: 20 };
      const bounding = getBoundingRect([rect]);

      expect(bounding).toEqual(rect);
    });

    it('should compute bounding rect for multiple rects', () => {
      const rects = [
        { x: 100, y: 100, width: 50, height: 20 },
        { x: 200, y: 150, width: 30, height: 40 },
        { x: 80, y: 120, width: 20, height: 10 },
      ];
      const bounding = getBoundingRect(rects);

      expect(bounding?.x).toBe(80); // min x
      expect(bounding?.y).toBe(100); // min y
      expect(bounding?.width).toBe(150); // 230 - 80
      expect(bounding?.height).toBe(90); // 190 - 100
    });
  });

  describe('isPointInRect', () => {
    const rect = { x: 100, y: 100, width: 50, height: 20 };

    it('should return true for point inside rect', () => {
      expect(isPointInRect({ x: 125, y: 110 }, rect)).toBe(true);
    });

    it('should return true for point on edge', () => {
      expect(isPointInRect({ x: 100, y: 100 }, rect)).toBe(true);
      expect(isPointInRect({ x: 150, y: 120 }, rect)).toBe(true);
    });

    it('should return false for point outside rect', () => {
      expect(isPointInRect({ x: 99, y: 110 }, rect)).toBe(false);
      expect(isPointInRect({ x: 151, y: 110 }, rect)).toBe(false);
      expect(isPointInRect({ x: 125, y: 99 }, rect)).toBe(false);
      expect(isPointInRect({ x: 125, y: 121 }, rect)).toBe(false);
    });
  });

  describe('rectsIntersect', () => {
    const rect1 = { x: 100, y: 100, width: 50, height: 20 };

    it('should return true for overlapping rects', () => {
      const rect2 = { x: 120, y: 110, width: 50, height: 20 };
      expect(rectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return true for touching rects', () => {
      const rect2 = { x: 150, y: 100, width: 50, height: 20 };
      expect(rectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return false for non-overlapping rects', () => {
      const rect2 = { x: 200, y: 200, width: 50, height: 20 };
      expect(rectsIntersect(rect1, rect2)).toBe(false);
    });

    it('should return true for contained rect', () => {
      const rect2 = { x: 110, y: 105, width: 30, height: 10 };
      expect(rectsIntersect(rect1, rect2)).toBe(true);
    });
  });

  describe('normalizeRects', () => {
    it('should return empty array for empty input', () => {
      expect(normalizeRects([])).toEqual([]);
    });

    it('should return same rect for single rect', () => {
      const rects = [{ x: 100, y: 100, width: 50, height: 20 }];
      const normalized = normalizeRects(rects);

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toEqual(rects[0]);
    });

    it('should merge adjacent rects on same line', () => {
      const rects = [
        { x: 100, y: 100, width: 50, height: 20 },
        { x: 150, y: 100, width: 30, height: 20 },
      ];
      const normalized = normalizeRects(rects);

      expect(normalized).toHaveLength(1);
      expect(normalized[0]?.x).toBe(100);
      expect(normalized[0]?.width).toBe(80); // 50 + 30
    });

    it('should not merge rects on different lines', () => {
      const rects = [
        { x: 100, y: 100, width: 50, height: 20 },
        { x: 100, y: 130, width: 50, height: 20 },
      ];
      const normalized = normalizeRects(rects);

      expect(normalized).toHaveLength(2);
    });

    it('should sort rects by position', () => {
      const rects = [
        { x: 200, y: 100, width: 30, height: 20 },
        { x: 100, y: 100, width: 50, height: 20 },
      ];
      const normalized = normalizeRects(rects);

      expect(normalized[0]?.x).toBe(100);
    });
  });
});
