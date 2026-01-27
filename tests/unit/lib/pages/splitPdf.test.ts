import { describe, it, expect, vi } from 'vitest';
import {
  parsePageRange,
  splitByRange,
  splitEveryNPages,
  splitBySize,
  splitIntoSinglePages,
} from '@lib/pages/splitPdf';
import { PDFDocument } from 'pdf-lib';

// Create a mock PDF with specified number of pages
async function createMockPdf(pageCount: number): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([612, 792]); // Letter size
  }
  const bytes = await pdfDoc.save();
  return bytes.buffer;
}

describe('splitPdf', () => {
  describe('parsePageRange', () => {
    it('should parse single page', () => {
      const result = parsePageRange('5', 10);
      expect(result).toEqual([4]); // Zero-based
    });

    it('should parse page range', () => {
      const result = parsePageRange('1-5', 10);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('should parse comma-separated pages', () => {
      const result = parsePageRange('1, 3, 5', 10);
      expect(result).toEqual([0, 2, 4]);
    });

    it('should parse mixed ranges and pages', () => {
      const result = parsePageRange('1-3, 5, 8-10', 10);
      expect(result).toEqual([0, 1, 2, 4, 7, 8, 9]);
    });

    it('should remove duplicates', () => {
      const result = parsePageRange('1, 1-3', 10);
      expect(result).toEqual([0, 1, 2]);
    });

    it('should throw error for invalid page number', () => {
      expect(() => parsePageRange('abc', 10)).toThrow('Invalid page number');
    });

    it('should throw error for out of range page', () => {
      expect(() => parsePageRange('15', 10)).toThrow('Invalid page number');
    });

    it('should throw error for invalid range', () => {
      expect(() => parsePageRange('5-3', 10)).toThrow('Invalid page range');
    });
  });

  describe('splitByRange', () => {
    it('should split PDF by page range', async () => {
      const pdf = await createMockPdf(10);
      const result = await splitByRange(pdf, '1-5', 'test');

      const resultDoc = await PDFDocument.load(result.data);
      expect(resultDoc.getPageCount()).toBe(5);
      expect(result.pageRange).toBe('1-5');
      expect(result.pageCount).toBe(5);
    });

    it('should extract non-consecutive pages', async () => {
      const pdf = await createMockPdf(10);
      const result = await splitByRange(pdf, '1, 3, 5, 7', 'test');

      const resultDoc = await PDFDocument.load(result.data);
      expect(resultDoc.getPageCount()).toBe(4);
    });

    it('should throw error for empty range', async () => {
      const pdf = await createMockPdf(10);

      await expect(splitByRange(pdf, '', 'test')).rejects.toThrow(
        'Invalid page number'
      );
    });
  });

  describe('splitEveryNPages', () => {
    it('should split into files of N pages each', async () => {
      const pdf = await createMockPdf(10);
      const results = await splitEveryNPages(pdf, 3, 'test');

      expect(results).toHaveLength(4);
      expect(results[0].pageCount).toBe(3);
      expect(results[1].pageCount).toBe(3);
      expect(results[2].pageCount).toBe(3);
      expect(results[3].pageCount).toBe(1);
    });

    it('should handle exact division', async () => {
      const pdf = await createMockPdf(6);
      const results = await splitEveryNPages(pdf, 2, 'test');

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.pageCount).toBe(2);
      });
    });

    it('should throw error for invalid pages per file', async () => {
      const pdf = await createMockPdf(5);

      await expect(splitEveryNPages(pdf, 0, 'test')).rejects.toThrow(
        'Pages per file must be at least 1'
      );
    });

    it('should call progress callback', async () => {
      const pdf = await createMockPdf(6);
      const progressCallback = vi.fn();

      await splitEveryNPages(pdf, 2, 'test', progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('splitBySize', () => {
    it('should split into files under max size', async () => {
      const pdf = await createMockPdf(10);
      const results = await splitBySize(pdf, 50 * 1024, 'test'); // 50KB max

      expect(results.length).toBeGreaterThanOrEqual(1);
      results.forEach((result) => {
        expect(result.pageCount).toBeGreaterThan(0);
      });
    });

    it('should throw error for very small max size', async () => {
      const pdf = await createMockPdf(10);

      await expect(splitBySize(pdf, 100, 'test')).rejects.toThrow(
        'Maximum size must be at least 1 KB'
      );
    });
  });

  describe('splitIntoSinglePages', () => {
    it('should split into individual pages', async () => {
      const pdf = await createMockPdf(5);
      const results = await splitIntoSinglePages(pdf, 'page');

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.pageCount).toBe(1);
      });
    });
  });
});
