import { describe, it, expect } from 'vitest';
import {
  deletePage,
  deletePages,
  duplicatePage,
  rotatePage,
  rotatePages,
  insertBlankPage,
  reorderPages,
  movePage,
  movePages,
  getPageInfo,
} from '@lib/pages/pageOperations';
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

describe('pageOperations', () => {
  describe('deletePage', () => {
    it('should delete a page from a multi-page document', async () => {
      const pdfBytes = await createMockPdf(3);
      const result = await deletePage(pdfBytes, 1); // Delete second page

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(2);
    });

    it('should throw error when deleting from single-page document', async () => {
      const pdfBytes = await createMockPdf(1);

      await expect(deletePage(pdfBytes, 0)).rejects.toThrow(
        'Cannot delete the last page'
      );
    });

    it('should throw error for invalid page index', async () => {
      const pdfBytes = await createMockPdf(3);

      await expect(deletePage(pdfBytes, 5)).rejects.toThrow('Invalid page index');
      await expect(deletePage(pdfBytes, -1)).rejects.toThrow('Invalid page index');
    });
  });

  describe('deletePages', () => {
    it('should delete multiple pages', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await deletePages(pdfBytes, [0, 2, 4]); // Delete pages 1, 3, 5

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(2);
    });

    it('should throw error when deleting all pages', async () => {
      const pdfBytes = await createMockPdf(3);

      await expect(deletePages(pdfBytes, [0, 1, 2])).rejects.toThrow(
        'Cannot delete all pages'
      );
    });

    it('should handle unsorted indices correctly', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await deletePages(pdfBytes, [4, 0, 2]); // Unsorted indices

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(2);
    });
  });

  describe('duplicatePage', () => {
    it('should duplicate a page after the original', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await duplicatePage(pdfBytes, 0, true);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should duplicate a page before the original', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await duplicatePage(pdfBytes, 1, false);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should throw error for invalid page index', async () => {
      const pdfBytes = await createMockPdf(2);

      await expect(duplicatePage(pdfBytes, 5)).rejects.toThrow('Invalid page index');
    });
  });

  describe('rotatePage', () => {
    it('should rotate a page 90 degrees', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await rotatePage(pdfBytes, 0, 90);

      const resultDoc = await PDFDocument.load(result);
      const page = resultDoc.getPage(0);
      expect(page.getRotation().angle).toBe(90);
    });

    it('should rotate a page 180 degrees', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await rotatePage(pdfBytes, 0, 180);

      const resultDoc = await PDFDocument.load(result);
      const page = resultDoc.getPage(0);
      expect(page.getRotation().angle).toBe(180);
    });

    it('should accumulate rotation', async () => {
      const pdfBytes = await createMockPdf(1);
      let result = await rotatePage(pdfBytes, 0, 90);
      result = await rotatePage(result.buffer as ArrayBuffer, 0, 90);

      const resultDoc = await PDFDocument.load(result);
      const page = resultDoc.getPage(0);
      expect(page.getRotation().angle).toBe(180);
    });
  });

  describe('rotatePages', () => {
    it('should rotate multiple pages', async () => {
      const pdfBytes = await createMockPdf(3);
      const result = await rotatePages(pdfBytes, [0, 2], 90);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPage(0).getRotation().angle).toBe(90);
      expect(resultDoc.getPage(1).getRotation().angle).toBe(0);
      expect(resultDoc.getPage(2).getRotation().angle).toBe(90);
    });
  });

  describe('insertBlankPage', () => {
    it('should insert a blank page at specified index', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await insertBlankPage(pdfBytes, 1, 'letter');

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should insert at beginning', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await insertBlankPage(pdfBytes, 0, 'a4');

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should insert at end', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await insertBlankPage(pdfBytes, 2, 'legal');

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should match adjacent page size when using match', async () => {
      const pdfBytes = await createMockPdf(2);
      const result = await insertBlankPage(pdfBytes, 1, 'match');

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });
  });

  describe('reorderPages', () => {
    it('should reorder pages correctly', async () => {
      const pdfBytes = await createMockPdf(3);
      const result = await reorderPages(pdfBytes, [2, 0, 1]);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });

    it('should throw error for invalid order length', async () => {
      const pdfBytes = await createMockPdf(3);

      await expect(reorderPages(pdfBytes, [0, 1])).rejects.toThrow(
        'New order must include all pages'
      );
    });

    it('should throw error for duplicate indices in order', async () => {
      const pdfBytes = await createMockPdf(3);

      await expect(reorderPages(pdfBytes, [0, 0, 2])).rejects.toThrow(
        'New order must include each page index exactly once'
      );
    });
  });

  describe('movePage', () => {
    it('should move a page to a new position', async () => {
      const pdfBytes = await createMockPdf(4);
      const result = await movePage(pdfBytes, 0, 3);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(4);
    });

    it('should return unchanged document when moving to same position', async () => {
      const pdfBytes = await createMockPdf(3);
      const result = await movePage(pdfBytes, 1, 1);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(3);
    });
  });

  describe('movePages', () => {
    it('should move multiple pages to a new position', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await movePages(pdfBytes, [0, 1], 3);

      const resultDoc = await PDFDocument.load(result);
      expect(resultDoc.getPageCount()).toBe(5);
    });

    it('should throw error for invalid target index', async () => {
      const pdfBytes = await createMockPdf(5);

      await expect(movePages(pdfBytes, [0, 1], 10)).rejects.toThrow(
        'Invalid target index'
      );
    });
  });

  describe('getPageInfo', () => {
    it('should return page information for all pages', async () => {
      const pdfBytes = await createMockPdf(3);
      const info = await getPageInfo(pdfBytes);

      expect(info).toHaveLength(3);
      expect(info[0]).toMatchObject({
        index: 0,
        width: 612,
        height: 792,
        rotation: 0,
      });
    });
  });
});
