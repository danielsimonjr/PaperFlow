import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  deletePage,
  duplicatePage,
  rotatePage,
  insertBlankPage,
  movePages,
} from '@lib/pages/pageOperations';
import { mergePdfs } from '@lib/pages/mergePdf';
import { splitByRange, splitEveryNPages } from '@lib/pages/splitPdf';
import { extractPages } from '@lib/pages/extractPages';

// Create a mock PDF with specified number of pages
async function createMockPdf(pageCount: number): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([612, 792]);
  }
  const bytes = await pdfDoc.save();
  return bytes.buffer;
}

describe('Page Management Integration', () => {
  describe('Complete page reordering workflow', () => {
    it('should allow multiple page operations in sequence', async () => {
      // Start with 5 pages
      let pdfBytes = await createMockPdf(5);
      let doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(5);

      // Duplicate page 1
      pdfBytes = (await duplicatePage(pdfBytes, 0, true)).buffer as ArrayBuffer;
      doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(6);

      // Delete page 3
      pdfBytes = (await deletePage(pdfBytes, 2)).buffer as ArrayBuffer;
      doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(5);

      // Rotate page 1
      pdfBytes = (await rotatePage(pdfBytes, 0, 90)).buffer as ArrayBuffer;
      doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPage(0).getRotation().angle).toBe(90);

      // Insert blank page at position 2
      pdfBytes = (await insertBlankPage(pdfBytes, 2, 'letter')).buffer as ArrayBuffer;
      doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(6);
    });
  });

  describe('Merge and split workflow', () => {
    it('should merge PDFs and then split them', async () => {
      // Create two PDFs
      const pdf1 = await createMockPdf(3);
      const pdf2 = await createMockPdf(2);

      // Merge them
      const merged = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
      ]);

      const doc = await PDFDocument.load(merged);
      expect(doc.getPageCount()).toBe(5);

      // Split into individual files
      const splitResults = await splitEveryNPages(merged.buffer as ArrayBuffer, 2, 'split');

      expect(splitResults).toHaveLength(3);
      expect(splitResults[0].pageCount).toBe(2);
      expect(splitResults[1].pageCount).toBe(2);
      expect(splitResults[2].pageCount).toBe(1);
    });
  });

  describe('Extract and reorder workflow', () => {
    it('should extract pages and preserve them independently', async () => {
      // Start with 10 pages
      const pdfBytes = await createMockPdf(10);

      // Extract pages 3-5 and also get remaining
      const result = await extractPages(pdfBytes, [2, 3, 4], true);

      const extractedDoc = await PDFDocument.load(result.extractedPdf);
      expect(extractedDoc.getPageCount()).toBe(3);

      const remainingDoc = await PDFDocument.load(result.remainingPdf!);
      expect(remainingDoc.getPageCount()).toBe(7);
    });
  });

  describe('Page movement workflow', () => {
    it('should move multiple pages to a new position', async () => {
      // Start with 6 pages
      const pdfBytes = await createMockPdf(6);

      // Move pages 0, 1 to position 4
      const result = await movePages(pdfBytes, [0, 1], 4);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(6);
    });
  });

  describe('Range-based split workflow', () => {
    it('should split by specific page ranges', async () => {
      const pdfBytes = await createMockPdf(10);

      // Extract pages 1-3, 5, 7-9
      const result = await splitByRange(pdfBytes, '1-3, 5, 7-9', 'document');

      const doc = await PDFDocument.load(result.data);
      expect(doc.getPageCount()).toBe(7);
      expect(result.pageRange).toBe('1-3, 5, 7-9');
    });
  });

  describe('Error handling', () => {
    it('should handle operations on corrupted data gracefully', async () => {
      const invalidData = new ArrayBuffer(100);

      await expect(deletePage(invalidData, 0)).rejects.toThrow();
      await expect(rotatePage(invalidData, 0, 90)).rejects.toThrow();
    });

    it('should prevent deleting all pages', async () => {
      const pdfBytes = await createMockPdf(1);

      await expect(deletePage(pdfBytes, 0)).rejects.toThrow('Cannot delete the last page');
    });
  });
});
