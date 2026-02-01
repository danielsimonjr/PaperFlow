/**
 * Tests for Layout Analyzer
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeLayout,
  tableToCSV,
  type Table,
} from '@/lib/ocr/layoutAnalyzer';
import type { OCRResult, OCRBlock, OCRLine, BoundingBox } from '@/lib/ocr/types';

const createMockResult = (overrides: Partial<OCRResult> = {}): OCRResult => ({
  text: 'Sample text',
  confidence: 95,
  blocks: [],
  lines: [],
  words: [],
  processingTime: 1000,
  imageDimensions: { width: 800, height: 1000 },
  ...overrides,
});

const createMockBlock = (
  text: string,
  bbox: BoundingBox,
  lines: OCRLine[] = []
): OCRBlock => ({
  text,
  confidence: 90,
  bbox,
  blockType: 'text',
  lines,
});


describe('Layout Analyzer', () => {
  describe('analyzeLayout', () => {
    it('should return default analysis for empty result', () => {
      const result = createMockResult();
      const layout = analyzeLayout(result);

      expect(layout.columns).toHaveLength(0);
      expect(layout.tables).toHaveLength(0);
      expect(layout.images).toHaveLength(0);
      expect(layout.isMultiColumn).toBe(false);
      expect(layout.estimatedColumns).toBe(0);
    });

    it('should detect single column layout', () => {
      const result = createMockResult({
        blocks: [
          createMockBlock('Block 1', { x0: 100, y0: 200, x1: 700, y1: 300 }),
          createMockBlock('Block 2', { x0: 100, y0: 320, x1: 700, y1: 420 }),
        ],
      });

      const layout = analyzeLayout(result);

      expect(layout.isMultiColumn).toBe(false);
      expect(layout.estimatedColumns).toBe(1);
    });

    it('should detect multi-column layout', () => {
      const result = createMockResult({
        blocks: [
          // Left column
          createMockBlock('Left 1', { x0: 50, y0: 200, x1: 350, y1: 300 }),
          createMockBlock('Left 2', { x0: 50, y0: 320, x1: 350, y1: 420 }),
          // Right column
          createMockBlock('Right 1', { x0: 450, y0: 200, x1: 750, y1: 300 }),
          createMockBlock('Right 2', { x0: 450, y0: 320, x1: 750, y1: 420 }),
        ],
      });

      const layout = analyzeLayout(result);

      expect(layout.isMultiColumn).toBe(true);
      expect(layout.estimatedColumns).toBe(2);
    });

    it('should detect headers at top of page', () => {
      const result = createMockResult({
        blocks: [
          createMockBlock('Header', { x0: 100, y0: 20, x1: 700, y1: 80 }),
          createMockBlock('Content', { x0: 100, y0: 200, x1: 700, y1: 800 }),
        ],
      });

      const layout = analyzeLayout(result);

      expect(layout.headers).toHaveLength(1);
      expect(layout.headers[0]?.text).toBe('Header');
    });

    it('should detect footers at bottom of page', () => {
      const result = createMockResult({
        blocks: [
          createMockBlock('Content', { x0: 100, y0: 100, x1: 700, y1: 800 }),
          createMockBlock('Footer', { x0: 100, y0: 920, x1: 700, y1: 980 }),
        ],
      });

      const layout = analyzeLayout(result);

      expect(layout.footers).toHaveLength(1);
      expect(layout.footers[0]?.text).toBe('Footer');
    });

    it('should detect LTR language direction', () => {
      const result = createMockResult({
        text: 'This is English text',
      });

      const layout = analyzeLayout(result);
      expect(layout.language).toBe('ltr');
    });

    it('should detect RTL language direction', () => {
      const result = createMockResult({
        text: 'مرحبا العالم', // Arabic: Hello World
      });

      const layout = analyzeLayout(result);
      expect(layout.language).toBe('rtl');
    });
  });

  describe('reading order', () => {
    it('should order headers first', () => {
      const result = createMockResult({
        blocks: [
          createMockBlock('Content', { x0: 100, y0: 200, x1: 700, y1: 800 }),
          createMockBlock('Header', { x0: 100, y0: 20, x1: 700, y1: 80 }),
        ],
      });

      const layout = analyzeLayout(result);

      expect(layout.readingOrder[0]?.type).toBe('header');
    });

    it('should order footers last', () => {
      const result = createMockResult({
        blocks: [
          createMockBlock('Footer', { x0: 100, y0: 920, x1: 700, y1: 980 }),
          createMockBlock('Content', { x0: 100, y0: 200, x1: 700, y1: 800 }),
        ],
      });

      const layout = analyzeLayout(result);

      const lastRegion = layout.readingOrder[layout.readingOrder.length - 1];
      expect(lastRegion?.type).toBe('footer');
    });
  });

  describe('tableToCSV', () => {
    it('should convert table to CSV format', () => {
      const table: Table = {
        id: 'test-table',
        bounds: { x0: 0, y0: 0, x1: 400, y1: 200 },
        rows: 2,
        cols: 3,
        cells: [
          { row: 0, col: 0, rowSpan: 1, colSpan: 1, bounds: { x0: 0, y0: 0, x1: 100, y1: 100 }, text: 'A1', confidence: 90 },
          { row: 0, col: 1, rowSpan: 1, colSpan: 1, bounds: { x0: 100, y0: 0, x1: 200, y1: 100 }, text: 'B1', confidence: 90 },
          { row: 0, col: 2, rowSpan: 1, colSpan: 1, bounds: { x0: 200, y0: 0, x1: 300, y1: 100 }, text: 'C1', confidence: 90 },
          { row: 1, col: 0, rowSpan: 1, colSpan: 1, bounds: { x0: 0, y0: 100, x1: 100, y1: 200 }, text: 'A2', confidence: 90 },
          { row: 1, col: 1, rowSpan: 1, colSpan: 1, bounds: { x0: 100, y0: 100, x1: 200, y1: 200 }, text: 'B2', confidence: 90 },
          { row: 1, col: 2, rowSpan: 1, colSpan: 1, bounds: { x0: 200, y0: 100, x1: 300, y1: 200 }, text: 'C2', confidence: 90 },
        ],
        hasHeader: true,
      };

      const csv = tableToCSV(table);

      expect(csv).toContain('"A1","B1","C1"');
      expect(csv).toContain('"A2","B2","C2"');
    });

    it('should escape quotes in CSV', () => {
      const table: Table = {
        id: 'test-table',
        bounds: { x0: 0, y0: 0, x1: 200, y1: 100 },
        rows: 1,
        cols: 1,
        cells: [
          { row: 0, col: 0, rowSpan: 1, colSpan: 1, bounds: { x0: 0, y0: 0, x1: 100, y1: 100 }, text: 'Text with "quotes"', confidence: 90 },
        ],
        hasHeader: false,
      };

      const csv = tableToCSV(table);

      expect(csv).toContain('""quotes""');
    });
  });
});
