import { describe, it, expect } from 'vitest';
import {
  extractPages,
  extractPageRange,
  extractOddEvenPages,
  extractFirstPages,
  extractLastPages,
} from '@lib/pages/extractPages';
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

describe('extractPages', () => {
  describe('extractPages', () => {
    it('should extract specific pages', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractPages(pdf, [0, 2, 4]);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3);
      expect(result.extractedCount).toBe(3);
      expect(result.remainingCount).toBe(2);
    });

    it('should extract pages and return remaining document', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractPages(pdf, [1, 3], true);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(2);

      expect(result.remainingPdf).toBeDefined();
      const remainingDoc = await PDFDocument.load(result.remainingPdf!);
      expect(remainingDoc.getPageCount()).toBe(3);
    });

    it('should remove duplicate indices', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractPages(pdf, [0, 0, 1, 1, 2]);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3);
    });

    it('should throw error for invalid page index', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractPages(pdf, [0, 10])).rejects.toThrow('Invalid page index');
    });

    it('should throw error for empty page selection', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractPages(pdf, [])).rejects.toThrow('No pages selected');
    });
  });

  describe('extractPageRange', () => {
    it('should extract a range of pages', async () => {
      const pdf = await createMockPdf(10);
      const result = await extractPageRange(pdf, 3, 7);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(5);
    });

    it('should extract single page range', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractPageRange(pdf, 3, 3);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(1);
    });

    it('should throw error for invalid start page', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractPageRange(pdf, 0, 3)).rejects.toThrow('Invalid start page');
      await expect(extractPageRange(pdf, 10, 12)).rejects.toThrow('Invalid start page');
    });

    it('should throw error for invalid end page', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractPageRange(pdf, 3, 1)).rejects.toThrow('Invalid end page');
      await expect(extractPageRange(pdf, 1, 10)).rejects.toThrow('Invalid end page');
    });
  });

  describe('extractOddEvenPages', () => {
    it('should extract odd pages', async () => {
      const pdf = await createMockPdf(6);
      const result = await extractOddEvenPages(pdf, true);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3); // Pages 1, 3, 5
    });

    it('should extract even pages', async () => {
      const pdf = await createMockPdf(6);
      const result = await extractOddEvenPages(pdf, false);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3); // Pages 2, 4, 6
    });

    it('should extract odd pages and return remaining', async () => {
      const pdf = await createMockPdf(6);
      const result = await extractOddEvenPages(pdf, true, true);

      expect(result.remainingPdf).toBeDefined();
      const remainingDoc = await PDFDocument.load(result.remainingPdf!);
      expect(remainingDoc.getPageCount()).toBe(3); // Pages 2, 4, 6
    });
  });

  describe('extractFirstPages', () => {
    it('should extract first N pages', async () => {
      const pdf = await createMockPdf(10);
      const result = await extractFirstPages(pdf, 3);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3);
    });

    it('should handle count larger than page count', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractFirstPages(pdf, 10);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(5);
    });

    it('should throw error for invalid count', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractFirstPages(pdf, 0)).rejects.toThrow('Count must be at least 1');
    });
  });

  describe('extractLastPages', () => {
    it('should extract last N pages', async () => {
      const pdf = await createMockPdf(10);
      const result = await extractLastPages(pdf, 3);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3);
    });

    it('should handle count larger than page count', async () => {
      const pdf = await createMockPdf(5);
      const result = await extractLastPages(pdf, 10);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(5);
    });

    it('should throw error for invalid count', async () => {
      const pdf = await createMockPdf(5);

      await expect(extractLastPages(pdf, 0)).rejects.toThrow('Count must be at least 1');
    });
  });
});
