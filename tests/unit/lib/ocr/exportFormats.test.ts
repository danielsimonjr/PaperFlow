/**
 * Tests for OCR Export Formats
 */

import { describe, it, expect } from 'vitest';
import {
  exportToPlainText,
  exportToHTML,
  exportToHOCR,
  exportToJSON,
} from '@/lib/ocr/exportFormats';
import type { OCRResult, OCRBlock, OCRLine, OCRWord } from '@/lib/ocr/types';

const createMockWord = (text: string, x0: number = 0): OCRWord => ({
  text,
  confidence: 90,
  bbox: { x0, y0: 0, x1: x0 + 50, y1: 20 },
});

const createMockLine = (text: string, words: OCRWord[] = []): OCRLine => ({
  text,
  confidence: 90,
  bbox: { x0: 0, y0: 0, x1: 400, y1: 20 },
  words: words.length > 0 ? words : [createMockWord(text)],
});

const createMockBlock = (text: string, lines: OCRLine[] = []): OCRBlock => ({
  text,
  confidence: 90,
  bbox: { x0: 0, y0: 0, x1: 400, y1: 100 },
  blockType: 'text',
  lines: lines.length > 0 ? lines : [createMockLine(text)],
});

const createMockResult = (pageIndex: number = 0): OCRResult => ({
  text: `Page ${pageIndex + 1} content`,
  confidence: 95,
  blocks: [
    createMockBlock(`Paragraph 1 on page ${pageIndex + 1}`, [
      createMockLine('Line 1', [createMockWord('Line'), createMockWord('1', 60)]),
      createMockLine('Line 2', [createMockWord('Line'), createMockWord('2', 60)]),
    ]),
  ],
  lines: [
    createMockLine('Line 1'),
    createMockLine('Line 2'),
  ],
  words: [createMockWord('Test')],
  processingTime: 1000,
  imageDimensions: { width: 800, height: 1000 },
});

describe('Export Formats', () => {
  describe('exportToPlainText', () => {
    it('should export single page to plain text', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const text = exportToPlainText(results);

      expect(text).toContain('Paragraph 1 on page 1');
    });

    it('should export multiple pages with separators', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));
      results.set(1, createMockResult(1));

      const text = exportToPlainText(results);

      expect(text).toContain('Paragraph 1 on page 1');
      expect(text).toContain('--- Page 2 ---');
      expect(text).toContain('Paragraph 1 on page 2');
    });

    it('should respect page range option', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));
      results.set(1, createMockResult(1));
      results.set(2, createMockResult(2));

      const text = exportToPlainText(results, undefined, { pageRange: [1] });

      expect(text).not.toContain('page 1');
      expect(text).toContain('Paragraph 1 on page 2');
      expect(text).not.toContain('page 3');
    });
  });

  describe('exportToHTML', () => {
    it('should export to valid HTML', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const html = exportToHTML(results);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('Paragraph 1 on page 1');
    });

    it('should include page markers', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const html = exportToHTML(results);

      expect(html).toContain('data-page="1"');
      expect(html).toContain('Page 1');
    });

    it('should escape HTML characters', () => {
      const results = new Map<number, OCRResult>();
      const result = createMockResult(0);
      result.blocks[0]!.text = 'Text with <script>alert("XSS")</script>';
      results.set(0, result);

      const html = exportToHTML(results);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should show confidence when option is enabled', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const html = exportToHTML(results, undefined, { includeConfidence: true });

      expect(html).toContain('Confidence:');
    });
  });

  describe('exportToHOCR', () => {
    it('should export to valid hOCR format', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const hocr = exportToHOCR(results);

      expect(hocr).toContain('<?xml version="1.0"');
      expect(hocr).toContain('class="ocr_page"');
      expect(hocr).toContain('class="ocr_carea"');
      expect(hocr).toContain('class="ocr_line"');
      expect(hocr).toContain('class="ocrx_word"');
    });

    it('should include bounding boxes', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const hocr = exportToHOCR(results);

      expect(hocr).toContain('bbox');
    });

    it('should include confidence scores', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const hocr = exportToHOCR(results);

      expect(hocr).toContain('x_wconf');
    });

    it('should have proper page metadata', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const hocr = exportToHOCR(results);

      expect(hocr).toContain('ppageno 0');
      expect(hocr).toContain('800 1000'); // image dimensions
    });
  });

  describe('exportToJSON', () => {
    it('should export to valid JSON', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const json = exportToJSON(results);
      const parsed = JSON.parse(json);

      expect(parsed).toBeDefined();
      expect(parsed.pageCount).toBe(1);
      expect(parsed.pages).toHaveLength(1);
    });

    it('should include page data', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const json = exportToJSON(results);
      const parsed = JSON.parse(json);

      expect(parsed.pages[0].pageNumber).toBe(1);
      expect(parsed.pages[0].text).toBeDefined();
      expect(parsed.pages[0].confidence).toBeDefined();
    });

    it('should include bounding boxes when option is enabled', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const json = exportToJSON(results, undefined, { includeBoundingBoxes: true });
      const parsed = JSON.parse(json);

      expect(parsed.pages[0].blocks[0].bbox).toBeDefined();
    });

    it('should include export date', () => {
      const results = new Map<number, OCRResult>();
      results.set(0, createMockResult(0));

      const json = exportToJSON(results);
      const parsed = JSON.parse(json);

      expect(parsed.exportDate).toBeDefined();
    });
  });
});
