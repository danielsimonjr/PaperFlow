import { describe, it, expect, vi } from 'vitest';
import {
  mergePdfs,
  mergePdfsWithSelection,
  getPdfPageCount,
  isValidPdf,
} from '@lib/pages/mergePdf';
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

describe('mergePdf', () => {
  describe('mergePdfs', () => {
    it('should merge two PDF files', async () => {
      const pdf1 = await createMockPdf(2);
      const pdf2 = await createMockPdf(3);

      const result = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
      ]);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(5);
    });

    it('should merge three PDF files', async () => {
      const pdf1 = await createMockPdf(1);
      const pdf2 = await createMockPdf(2);
      const pdf3 = await createMockPdf(3);

      const result = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
        { name: 'doc3.pdf', data: pdf3 },
      ]);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(6);
    });

    it('should return single file as-is when only one provided', async () => {
      const pdf1 = await createMockPdf(3);

      const result = await mergePdfs([{ name: 'doc1.pdf', data: pdf1 }]);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should throw error when no files provided', async () => {
      await expect(mergePdfs([])).rejects.toThrow(
        'At least one PDF file is required'
      );
    });

    it('should call progress callback', async () => {
      const pdf1 = await createMockPdf(2);
      const pdf2 = await createMockPdf(2);

      const progressCallback = vi.fn();

      await mergePdfs(
        [
          { name: 'doc1.pdf', data: pdf1 },
          { name: 'doc2.pdf', data: pdf2 },
        ],
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          totalFiles: 2,
          percentComplete: expect.any(Number),
        })
      );
    });
  });

  describe('mergePdfsWithSelection', () => {
    it('should merge selected pages from multiple files', async () => {
      const pdf1 = await createMockPdf(3);
      const pdf2 = await createMockPdf(4);

      const result = await mergePdfsWithSelection([
        { name: 'doc1.pdf', data: pdf1, pageIndices: [0, 2] },
        { name: 'doc2.pdf', data: pdf2, pageIndices: [1, 3] },
      ]);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(4);
    });

    it('should throw error for invalid page index', async () => {
      const pdf1 = await createMockPdf(2);

      await expect(
        mergePdfsWithSelection([
          { name: 'doc1.pdf', data: pdf1, pageIndices: [0, 5] },
        ])
      ).rejects.toThrow('Invalid page index');
    });
  });

  describe('getPdfPageCount', () => {
    it('should return correct page count', async () => {
      const pdf = await createMockPdf(5);
      const count = await getPdfPageCount(pdf);

      expect(count).toBe(5);
    });
  });

  describe('isValidPdf', () => {
    it('should return true for valid PDF', async () => {
      const pdf = await createMockPdf(1);
      const isValid = await isValidPdf(pdf);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid data', async () => {
      const invalidData = new ArrayBuffer(100);
      const isValid = await isValidPdf(invalidData);

      expect(isValid).toBe(false);
    });
  });
});
