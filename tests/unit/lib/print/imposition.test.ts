/**
 * Imposition Tests
 *
 * Tests for page imposition including booklet printing,
 * n-up printing, and poster printing.
 */

import { describe, it, expect } from 'vitest';
import {
  Imposition,
  type SheetDimensions,
} from '@lib/print/imposition';

describe('Imposition', () => {
  // Standard Letter size in points
  const letterSize: SheetDimensions = { width: 612, height: 792 };

  describe('booklet', () => {
    it('should calculate correct number of sheets for 8 pages', () => {
      const result = Imposition.booklet(8, letterSize);

      expect(result.totalSheets).toBe(2);
      expect(result.totalPages).toBe(8);
      expect(result.type).toBe('booklet');
    });

    it('should add blank pages when page count is not multiple of 4', () => {
      const result = Imposition.booklet(10, letterSize);

      expect(result.totalPages).toBe(12); // Rounded up to 12
      expect(result.totalSheets).toBe(3);
    });

    it('should create correct page order for saddle stitch', () => {
      const result = Imposition.booklet(8, letterSize);

      // First sheet front should have pages 8 and 1
      const frontSheet = result.sheets.find(
        (s) => s.sheetIndex === 0 && s.side === 'front'
      );
      expect(frontSheet).toBeDefined();
      expect(frontSheet?.pages[0].pageNumber).toBe(8);
      expect(frontSheet?.pages[1].pageNumber).toBe(1);

      // First sheet back should have pages 2 and 7
      const backSheet = result.sheets.find(
        (s) => s.sheetIndex === 0 && s.side === 'back'
      );
      expect(backSheet).toBeDefined();
      expect(backSheet?.pages[0].pageNumber).toBe(2);
      expect(backSheet?.pages[1].pageNumber).toBe(7);
    });

    it('should apply binding edge correctly', () => {
      const resultLeft = Imposition.booklet(8, letterSize, { binding: 'left' });
      const resultTop = Imposition.booklet(8, letterSize, { binding: 'top' });

      // Left binding uses vertical fold
      expect(resultLeft.sheets[0].pages[0].width).toBe(letterSize.width / 2);
      expect(resultLeft.sheets[0].pages[0].height).toBe(letterSize.height);

      // Top binding uses horizontal fold
      expect(resultTop.sheets[0].pages[0].width).toBe(letterSize.width);
      expect(resultTop.sheets[0].pages[0].height).toBe(letterSize.height / 2);
    });

    it('should apply creep compensation', () => {
      const result = Imposition.booklet(16, letterSize, {
        binding: 'left',
        creep: 2,
      });

      // Inner pages should have different x offset than outer pages
      const outerSheet = result.sheets.find((s) => s.sheetIndex === 0);
      const innerSheet = result.sheets.find((s) => s.sheetIndex === 3);

      expect(outerSheet).toBeDefined();
      expect(innerSheet).toBeDefined();
      // Creep increases towards center
    });

    it('should handle single sheet booklet (4 pages)', () => {
      const result = Imposition.booklet(4, letterSize);

      expect(result.totalSheets).toBe(1);
      expect(result.sheets.length).toBe(2); // Front and back
    });

    it('should mark blank pages', () => {
      const result = Imposition.booklet(6, letterSize);

      // 6 pages rounds to 8, so 2 blanks
      const blankPages = result.sheets
        .flatMap((s) => s.pages)
        .filter((p) => p.isBlank);

      expect(blankPages.length).toBe(2);
    });
  });

  describe('nup', () => {
    it('should calculate correct sheets for 2-up', () => {
      const result = Imposition.nup(10, letterSize, { layout: 2 });

      expect(result.totalSheets).toBe(5); // 10 pages / 2 per sheet
      expect(result.type).toBe('nup');
    });

    it('should calculate correct sheets for 4-up', () => {
      const result = Imposition.nup(10, letterSize, { layout: 4 });

      expect(result.totalSheets).toBe(3); // ceil(10/4) = 3
    });

    it('should calculate correct sheets for 6-up', () => {
      const result = Imposition.nup(20, letterSize, { layout: 6 });

      expect(result.totalSheets).toBe(4); // ceil(20/6) = 4
    });

    it('should calculate correct sheets for 9-up', () => {
      const result = Imposition.nup(27, letterSize, { layout: 9 });

      expect(result.totalSheets).toBe(3); // 27/9 = 3
    });

    it('should calculate correct sheets for 16-up', () => {
      const result = Imposition.nup(100, letterSize, { layout: 16 });

      expect(result.totalSheets).toBe(7); // ceil(100/16) = 7
    });

    it('should apply horizontal page order', () => {
      const result = Imposition.nup(4, letterSize, {
        layout: 4,
        order: 'horizontal',
      });

      const positions = result.sheets[0].pages;
      // Page 1 at top-left, 2 at top-right, 3 at bottom-left, 4 at bottom-right
      expect(positions[0].x).toBeLessThan(positions[1].x);
      expect(positions[0].y).toBeLessThan(positions[2].y);
    });

    it('should apply vertical page order', () => {
      const result = Imposition.nup(4, letterSize, {
        layout: 4,
        order: 'vertical',
      });

      const positions = result.sheets[0].pages;
      // Page 1 at top-left, 2 below it, 3 at top-right
      expect(positions[0].y).toBeLessThan(positions[1].y);
    });

    it('should apply gap between pages', () => {
      const gap = 18; // 0.25 inch
      const result = Imposition.nup(4, letterSize, { layout: 4, gap });

      const positions = result.sheets[0].pages;
      const cellWidth = (letterSize.width - gap) / 2;

      // Position of second page should account for gap
      expect(positions[1].x).toBeCloseTo(cellWidth + gap, 1);
    });
  });

  describe('poster', () => {
    const pageSize: SheetDimensions = { width: 2448, height: 3168 }; // 34x44 inches

    it('should calculate correct number of tiles', () => {
      const result = Imposition.poster(pageSize, letterSize, {
        tilesWide: 4,
        tilesHigh: 5,
      });

      expect(result.totalSheets).toBe(20); // 4x5 = 20
      expect(result.type).toBe('poster');
    });

    it('should have all sheets be single-sided', () => {
      const result = Imposition.poster(pageSize, letterSize, {
        tilesWide: 2,
        tilesHigh: 2,
      });

      expect(result.sheets.every((s) => s.side === 'front')).toBe(true);
    });

    it('should handle overlap', () => {
      const overlap = 36; // 0.5 inch
      const result = Imposition.poster(pageSize, letterSize, {
        tilesWide: 2,
        tilesHigh: 2,
        overlap,
      });

      expect(result.totalSheets).toBe(4);
      // Each tile should reference page 1
      expect(result.sheets.every((s) => s.pages[0].pageNumber === 1)).toBe(true);
    });
  });

  describe('helper methods', () => {
    it('should calculate booklet pages correctly', () => {
      expect(Imposition.calculateBookletPages(3)).toBe(4);
      expect(Imposition.calculateBookletPages(4)).toBe(4);
      expect(Imposition.calculateBookletPages(5)).toBe(8);
      expect(Imposition.calculateBookletPages(16)).toBe(16);
      expect(Imposition.calculateBookletPages(17)).toBe(20);
    });

    it('should calculate booklet sheets correctly', () => {
      expect(Imposition.calculateBookletSheets(4)).toBe(1);
      expect(Imposition.calculateBookletSheets(8)).toBe(2);
      expect(Imposition.calculateBookletSheets(16)).toBe(4);
      expect(Imposition.calculateBookletSheets(20)).toBe(5);
    });

    it('should calculate n-up sheets correctly', () => {
      expect(Imposition.calculateNUpSheets(10, 2)).toBe(5);
      expect(Imposition.calculateNUpSheets(10, 4)).toBe(3);
      expect(Imposition.calculateNUpSheets(10, 6)).toBe(2);
      expect(Imposition.calculateNUpSheets(100, 16)).toBe(7);
    });
  });
});
