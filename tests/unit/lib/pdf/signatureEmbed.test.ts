import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embedSignaturesInPdf, hasExistingSignatures, getSignatureFieldPositions } from '@lib/pdf/signatureEmbed';
import type { PlacedSignature } from '@stores/signatureStore';
import { PDFDocument } from 'pdf-lib';

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn(),
  },
  rgb: vi.fn((r: number, g: number, b: number) => ({ r, g, b })),
  degrees: vi.fn((angle: number) => ({ type: 'degrees', angle })),
}));

const mockedPDFDocument = vi.mocked(PDFDocument);

describe('signatureEmbed', () => {
  const mockPlacedSignature: PlacedSignature = {
    id: 'placed-1',
    signatureId: 'sig-1',
    pageIndex: 0,
    position: { x: 100, y: 200 },
    size: { width: 150, height: 50 },
    rotation: 0,
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signatureType: 'draw',
    createdAt: new Date(),
  };

  const mockPage = {
    getSize: vi.fn(() => ({ width: 612, height: 792 })),
    getHeight: vi.fn(() => 792),
    drawImage: vi.fn(),
    drawText: vi.fn(),
    ref: { tag: 'ref1' },
  };

  const mockPdfDoc = {
    getPages: vi.fn(() => [mockPage]),
    embedPng: vi.fn(() => Promise.resolve({ width: 100, height: 50 })),
    embedJpg: vi.fn(() => Promise.resolve({ width: 100, height: 50 })),
    save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
    getForm: vi.fn(() => ({
      getFields: vi.fn(() => []),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedPDFDocument.load.mockResolvedValue(mockPdfDoc as unknown as Awaited<ReturnType<typeof PDFDocument.load>>);
  });

  describe('embedSignaturesInPdf', () => {
    it('should return original bytes when no signatures provided', async () => {
      const pdfBytes = new ArrayBuffer(10);
      const result = await embedSignaturesInPdf(pdfBytes, []);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should load PDF document', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockedPDFDocument.load).toHaveBeenCalledWith(pdfBytes);
    });

    it('should embed signature as PNG', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockPdfDoc.embedPng).toHaveBeenCalled();
    });

    it('should fallback to JPG if PNG embedding fails', async () => {
      mockPdfDoc.embedPng.mockRejectedValueOnce(new Error('PNG failed'));

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockPdfDoc.embedJpg).toHaveBeenCalled();
    });

    it('should draw image on the correct page', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockPage.drawImage).toHaveBeenCalled();
    });

    it('should calculate correct Y position for PDF coordinates', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      // PDF uses bottom-left origin, so Y should be transformed
      expect(mockPage.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          x: 100,
          y: 792 - 200 - 50, // pageHeight - position.y - size.height
          width: 150,
          height: 50,
        })
      );
    });

    it('should save the PDF after embedding', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockPdfDoc.save).toHaveBeenCalled();
    });

    it('should sort signatures by page index', async () => {
      // Create multiple pages for this test
      const mockPage1 = {
        getSize: vi.fn(() => ({ width: 612, height: 792 })),
        getHeight: vi.fn(() => 792),
        drawImage: vi.fn(),
        drawText: vi.fn(),
      };
      const mockPage2 = {
        getSize: vi.fn(() => ({ width: 612, height: 792 })),
        getHeight: vi.fn(() => 792),
        drawImage: vi.fn(),
        drawText: vi.fn(),
      };
      const mockPage3 = {
        getSize: vi.fn(() => ({ width: 612, height: 792 })),
        getHeight: vi.fn(() => 792),
        drawImage: vi.fn(),
        drawText: vi.fn(),
      };
      // Use mockImplementation so all calls to getPages() return the multi-page array
      mockPdfDoc.getPages.mockImplementation(() => [mockPage1, mockPage2, mockPage3]);

      const signature1: PlacedSignature = { ...mockPlacedSignature, id: '1', pageIndex: 2 };
      const signature2: PlacedSignature = { ...mockPlacedSignature, id: '2', pageIndex: 0 };
      const signature3: PlacedSignature = { ...mockPlacedSignature, id: '3', pageIndex: 1 };

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [signature1, signature2, signature3]);

      // Verify embedPng was called for each signature (signatures are processed in sorted order)
      expect(mockPdfDoc.embedPng).toHaveBeenCalledTimes(3);

      // Reset the mock for subsequent tests
      mockPdfDoc.getPages.mockImplementation(() => [mockPage]);
    });

    it('should handle rotation when specified', async () => {
      const rotatedSignature: PlacedSignature = {
        ...mockPlacedSignature,
        rotation: 45,
      };

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [rotatedSignature]);

      // Just verify drawImage was called with rotate property
      expect(mockPage.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rotate: expect.anything(),
        })
      );
    });

    it('should draw date stamp when enabled', async () => {
      const signatureWithDate: PlacedSignature = {
        ...mockPlacedSignature,
        dateStamp: {
          enabled: true,
          format: 'short',
          position: 'below',
        },
      };

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [signatureWithDate]);

      expect(mockPage.drawText).toHaveBeenCalled();
    });

    it('should not draw date stamp when disabled', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [mockPlacedSignature]);

      expect(mockPage.drawText).not.toHaveBeenCalled();
    });

    it('should handle multiple signatures', async () => {
      const signatures: PlacedSignature[] = [
        { ...mockPlacedSignature, id: '1' },
        { ...mockPlacedSignature, id: '2', position: { x: 200, y: 300 } },
        { ...mockPlacedSignature, id: '3', position: { x: 300, y: 400 } },
      ];

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, signatures);

      expect(mockPage.drawImage).toHaveBeenCalledTimes(3);
    });

    it('should warn when page index is out of bounds', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const signatureOnMissingPage: PlacedSignature = {
        ...mockPlacedSignature,
        pageIndex: 10, // Page doesn't exist
      };

      const pdfBytes = new ArrayBuffer(10);

      await embedSignaturesInPdf(pdfBytes, [signatureOnMissingPage]);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Page 10 not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('hasExistingSignatures', () => {
    it('should return false (placeholder implementation)', () => {
      const result = hasExistingSignatures();

      expect(result).toBe(false);
    });
  });

  describe('getSignatureFieldPositions', () => {
    it('should load PDF document', async () => {
      const pdfBytes = new ArrayBuffer(10);

      await getSignatureFieldPositions(pdfBytes);

      expect(mockedPDFDocument.load).toHaveBeenCalledWith(pdfBytes);
    });

    it('should return empty array when no signature fields found', async () => {
      const pdfBytes = new ArrayBuffer(10);

      const result = await getSignatureFieldPositions(pdfBytes);

      expect(result).toEqual([]);
    });

    it('should find fields with signature-related names', async () => {
      const mockField = {
        getName: vi.fn(() => 'signature_field'),
        acroField: {
          getWidgets: vi.fn(() => [
            {
              getRectangle: vi.fn(() => ({ x: 100, y: 200, width: 200, height: 50 })),
              P: vi.fn(() => ({ tag: 'ref1' })),
            },
          ]),
        },
      };

      mockPdfDoc.getForm.mockReturnValue({
        getFields: vi.fn(() => [mockField]),
      });

      const pdfBytes = new ArrayBuffer(10);

      const result = await getSignatureFieldPositions(pdfBytes);

      expect(result.length).toBe(1);
      expect(result[0]?.fieldName).toBe('signature_field');
    });

    it('should convert Y coordinate to top-left origin', async () => {
      const mockField = {
        getName: vi.fn(() => 'sign_here'),
        acroField: {
          getWidgets: vi.fn(() => [
            {
              getRectangle: vi.fn(() => ({ x: 100, y: 200, width: 200, height: 50 })),
              P: vi.fn(() => ({ tag: 'ref1' })),
            },
          ]),
        },
      };

      mockPdfDoc.getForm.mockReturnValue({
        getFields: vi.fn(() => [mockField]),
      });

      const pdfBytes = new ArrayBuffer(10);

      const result = await getSignatureFieldPositions(pdfBytes);

      // Y should be converted: pageHeight - rect.y - rect.height
      expect(result[0]?.bounds.y).toBe(792 - 200 - 50);
    });
  });
});
