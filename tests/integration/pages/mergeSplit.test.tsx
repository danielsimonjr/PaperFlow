import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  mergePdfs,
  mergePdfsWithSelection,
  isValidPdf,
  getPdfPageCount,
} from '@lib/pages/mergePdf';
import {
  splitByRange,
  splitEveryNPages,
  splitBySize,
  parsePageRange,
} from '@lib/pages/splitPdf';
import { extractPages, extractPageRange } from '@lib/pages/extractPages';

// Create a mock PDF with specified number of pages
async function createMockPdf(pageCount: number): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([612, 792]); // Letter size
  }
  const bytes = await pdfDoc.save();
  return bytes.buffer;
}

describe('Merge and Split Integration', () => {
  describe('Complete merge workflow', () => {
    it('should merge multiple PDFs and verify result', async () => {
      const pdf1 = await createMockPdf(3);
      const pdf2 = await createMockPdf(5);
      const pdf3 = await createMockPdf(2);

      const merged = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
        { name: 'doc3.pdf', data: pdf3 },
      ]);

      const doc = await PDFDocument.load(merged);
      expect(doc.getPageCount()).toBe(10);
    });

    it('should merge PDFs with page selection', async () => {
      const pdf1 = await createMockPdf(5);
      const pdf2 = await createMockPdf(5);

      const merged = await mergePdfsWithSelection([
        { name: 'doc1.pdf', data: pdf1, pageIndices: [0, 2, 4] }, // odd pages
        { name: 'doc2.pdf', data: pdf2, pageIndices: [1, 3] }, // even pages
      ]);

      const doc = await PDFDocument.load(merged);
      expect(doc.getPageCount()).toBe(5);
    });

    it('should track progress during merge', async () => {
      const pdf1 = await createMockPdf(2);
      const pdf2 = await createMockPdf(2);
      const pdf3 = await createMockPdf(2);

      const progressCallback = vi.fn();

      await mergePdfs(
        [
          { name: 'doc1.pdf', data: pdf1 },
          { name: 'doc2.pdf', data: pdf2 },
          { name: 'doc3.pdf', data: pdf3 },
        ],
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          totalFiles: 3,
        })
      );
    });

    it('should preserve PDF validity after merge', async () => {
      const pdf1 = await createMockPdf(3);
      const pdf2 = await createMockPdf(2);

      const merged = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
      ]);

      const isValid = await isValidPdf(merged.buffer as ArrayBuffer);
      expect(isValid).toBe(true);
    });
  });

  describe('Complete split workflow', () => {
    it('should split by range and verify pages', async () => {
      const pdf = await createMockPdf(10);

      const result = await splitByRange(pdf, '1-5', 'test');

      expect(result.pageCount).toBe(5);
      expect(result.pageRange).toBe('1-5');

      const doc = await PDFDocument.load(result.data);
      expect(doc.getPageCount()).toBe(5);
    });

    it('should split every N pages correctly', async () => {
      const pdf = await createMockPdf(10);

      const results = await splitEveryNPages(pdf, 3, 'test');

      expect(results).toHaveLength(4);
      expect(results[0].pageCount).toBe(3);
      expect(results[1].pageCount).toBe(3);
      expect(results[2].pageCount).toBe(3);
      expect(results[3].pageCount).toBe(1);

      // Verify each split is valid
      for (const result of results) {
        const doc = await PDFDocument.load(result.data);
        expect(doc.getPageCount()).toBe(result.pageCount);
      }
    });

    it('should track progress during split', async () => {
      const pdf = await createMockPdf(12);
      const progressCallback = vi.fn();

      await splitEveryNPages(pdf, 4, 'test', progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 3,
        })
      );
    });

    it('should split by size with valid results', async () => {
      const pdf = await createMockPdf(10);

      const results = await splitBySize(pdf, 100 * 1024, 'test'); // 100KB

      expect(results.length).toBeGreaterThanOrEqual(1);

      // All results should be valid PDFs
      for (const result of results) {
        const isValid = await isValidPdf(result.data.buffer as ArrayBuffer);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Merge then split workflow', () => {
    it('should merge PDFs then split the result', async () => {
      // Step 1: Create and merge
      const pdf1 = await createMockPdf(4);
      const pdf2 = await createMockPdf(6);

      const merged = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
      ]);

      expect(await getPdfPageCount(merged.buffer as ArrayBuffer)).toBe(10);

      // Step 2: Split the merged result
      const splits = await splitEveryNPages(merged.buffer as ArrayBuffer, 5, 'merged');

      expect(splits).toHaveLength(2);
      expect(splits[0].pageCount).toBe(5);
      expect(splits[1].pageCount).toBe(5);
    });

    it('should extract specific pages from merged document', async () => {
      // Merge two documents
      const pdf1 = await createMockPdf(3);
      const pdf2 = await createMockPdf(3);

      const merged = await mergePdfs([
        { name: 'doc1.pdf', data: pdf1 },
        { name: 'doc2.pdf', data: pdf2 },
      ]);

      // Extract pages 2-4 (which spans both original documents)
      const extracted = await extractPageRange(merged.buffer as ArrayBuffer, 2, 4);

      expect(extracted.extractedCount).toBe(3);

      const doc = await PDFDocument.load(extracted.extractedPdf);
      expect(doc.getPageCount()).toBe(3);
    });
  });

  describe('Split then merge workflow', () => {
    it('should split a document and merge selected splits back together', async () => {
      // Create a 12-page document
      const pdf = await createMockPdf(12);

      // Split into 4-page chunks
      const splits = await splitEveryNPages(pdf, 4, 'test');
      expect(splits).toHaveLength(3);

      // Merge first and third splits back
      const remerged = await mergePdfs([
        { name: splits[0].name, data: splits[0].data.buffer as ArrayBuffer },
        { name: splits[2].name, data: splits[2].data.buffer as ArrayBuffer },
      ]);

      const doc = await PDFDocument.load(remerged);
      expect(doc.getPageCount()).toBe(8); // 4 + 4
    });
  });

  describe('Extract and merge workflow', () => {
    it('should extract pages from multiple documents and merge them', async () => {
      const pdf1 = await createMockPdf(5);
      const pdf2 = await createMockPdf(5);

      // Extract pages 1, 3 from first document
      const extracted1 = await extractPages(pdf1, [0, 2]);

      // Extract pages 2, 4 from second document
      const extracted2 = await extractPages(pdf2, [1, 3]);

      // Merge extractions
      const merged = await mergePdfs([
        { name: 'extract1.pdf', data: extracted1.extractedPdf.buffer as ArrayBuffer },
        { name: 'extract2.pdf', data: extracted2.extractedPdf.buffer as ArrayBuffer },
      ]);

      const doc = await PDFDocument.load(merged);
      expect(doc.getPageCount()).toBe(4);
    });
  });

  describe('Page range parsing', () => {
    it('should parse simple ranges correctly', () => {
      expect(parsePageRange('1-5', 10)).toEqual([0, 1, 2, 3, 4]);
      expect(parsePageRange('1', 10)).toEqual([0]);
      expect(parsePageRange('10', 10)).toEqual([9]);
    });

    it('should parse complex ranges correctly', () => {
      expect(parsePageRange('1-3, 5, 7-9', 10)).toEqual([0, 1, 2, 4, 6, 7, 8]);
      expect(parsePageRange('1, 3, 5, 7, 9', 10)).toEqual([0, 2, 4, 6, 8]);
    });

    it('should handle whitespace in ranges', () => {
      expect(parsePageRange('  1 - 3 , 5  ', 10)).toEqual([0, 1, 2, 4]);
    });

    it('should remove duplicates from ranges', () => {
      expect(parsePageRange('1-3, 2-4', 10)).toEqual([0, 1, 2, 3]);
    });

    it('should throw for invalid ranges', () => {
      expect(() => parsePageRange('11', 10)).toThrow();
      expect(() => parsePageRange('0', 10)).toThrow();
      expect(() => parsePageRange('5-3', 10)).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw when merging with no files', async () => {
      await expect(mergePdfs([])).rejects.toThrow(
        'At least one PDF file is required'
      );
    });

    it('should throw for invalid page indices in selection merge', async () => {
      const pdf = await createMockPdf(3);

      await expect(
        mergePdfsWithSelection([
          { name: 'test.pdf', data: pdf, pageIndices: [0, 10] },
        ])
      ).rejects.toThrow('Invalid page index');
    });

    it('should throw for invalid split page count', async () => {
      const pdf = await createMockPdf(5);

      await expect(splitEveryNPages(pdf, 0, 'test')).rejects.toThrow(
        'Pages per file must be at least 1'
      );
    });

    it('should handle corrupted PDF gracefully', async () => {
      const invalidData = new ArrayBuffer(100);

      const isValid = await isValidPdf(invalidData);
      expect(isValid).toBe(false);
    });

    it('should throw for too small file size in splitBySize', async () => {
      const pdf = await createMockPdf(5);

      await expect(splitBySize(pdf, 100, 'test')).rejects.toThrow(
        'Maximum size must be at least 1 KB'
      );
    });
  });

  describe('Performance considerations', () => {
    it('should handle merging many small PDFs', async () => {
      const pdfs = await Promise.all(
        Array.from({ length: 10 }, () => createMockPdf(2))
      );

      const merged = await mergePdfs(
        pdfs.map((data, i) => ({ name: `doc${i}.pdf`, data }))
      );

      const doc = await PDFDocument.load(merged);
      expect(doc.getPageCount()).toBe(20);
    });

    it('should handle splitting into many small files', async () => {
      const pdf = await createMockPdf(20);

      const results = await splitEveryNPages(pdf, 1, 'test');

      expect(results).toHaveLength(20);
      results.forEach((result) => {
        expect(result.pageCount).toBe(1);
      });
    });
  });
});
