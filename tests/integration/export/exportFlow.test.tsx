import { describe, it, expect, vi } from 'vitest';
import { exportPdf } from '@lib/export/pdfExport';
import { flattenPdf } from '@lib/export/flattenPdf';
import { compressPdf } from '@lib/export/compressPdf';
import type { Annotation, FormField } from '@/types';

// Mock pdf-lib
vi.mock('pdf-lib', () => {
  const mockForm = {
    flatten: vi.fn(),
  };

  const mockPage = {
    getSize: () => ({ width: 612, height: 792 }),
    drawRectangle: vi.fn(),
    drawLine: vi.fn(),
    drawSquare: vi.fn(),
    drawText: vi.fn(),
    drawEllipse: vi.fn(),
  };

  const mockPdfDoc = {
    getPages: () => [mockPage],
    embedFont: vi.fn().mockResolvedValue({}),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
    getForm: vi.fn().mockReturnValue(mockForm),
    setTitle: vi.fn(),
    setAuthor: vi.fn(),
    setSubject: vi.fn(),
    setKeywords: vi.fn(),
    setCreator: vi.fn(),
    setProducer: vi.fn(),
  };

  return {
    PDFDocument: {
      load: vi.fn().mockResolvedValue(mockPdfDoc),
    },
    rgb: vi.fn((r: number, g: number, b: number) => ({ r, g, b })),
    StandardFonts: {
      Helvetica: 'Helvetica',
    },
  };
});

describe('Export Flow Integration', () => {
  const mockPdfBytes = new ArrayBuffer(100);

  const sampleAnnotations: Annotation[] = [
    {
      id: 'ann-1',
      type: 'highlight',
      pageIndex: 0,
      rects: [{ x: 50, y: 100, width: 200, height: 15 }],
      color: '#FFEB3B',
      opacity: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ann-2',
      type: 'note',
      pageIndex: 0,
      rects: [{ x: 300, y: 200, width: 20, height: 20 }],
      color: '#FFEB3B',
      opacity: 1,
      content: 'Review this section',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sampleFormFields: FormField[] = [
    {
      id: 'field-1',
      pageIndex: 0,
      type: 'text',
      name: 'name',
      bounds: { x: 100, y: 300, width: 200, height: 20 },
      value: 'John Doe',
    },
    {
      id: 'field-2',
      pageIndex: 0,
      type: 'checkbox',
      name: 'agree',
      bounds: { x: 100, y: 350, width: 15, height: 15 },
      value: true,
    },
  ];

  it('exports PDF with both annotations and form data', async () => {
    const result = await exportPdf(
      mockPdfBytes,
      { includeAnnotations: true, includeFormData: true },
      sampleAnnotations,
      sampleFormFields
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('flattens PDF with all content', async () => {
    const result = await flattenPdf(
      mockPdfBytes,
      { flattenAnnotations: true, flattenFormFields: true },
      sampleAnnotations,
      sampleFormFields
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('compresses PDF successfully', async () => {
    const result = await compressPdf(mockPdfBytes, {
      imageQuality: 0.7,
      removeMetadata: true,
      subsampleImages: false,
    });

    expect(result.originalSize).toBe(100);
    expect(result.compressedBytes).toBeInstanceOf(Uint8Array);
    expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
  });

  it('export then compress pipeline works', async () => {
    const exported = await exportPdf(
      mockPdfBytes,
      { includeAnnotations: true },
      sampleAnnotations
    );

    const compressed = await compressPdf(exported.buffer as ArrayBuffer, {
      imageQuality: 0.7,
      removeMetadata: true,
      subsampleImages: false,
    });

    expect(compressed.compressedBytes).toBeInstanceOf(Uint8Array);
  });
});
