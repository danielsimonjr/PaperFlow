import { describe, it, expect, vi } from 'vitest';
import { flattenPdf } from '@lib/export/flattenPdf';

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
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    getForm: vi.fn().mockReturnValue(mockForm),
    load: vi.fn(),
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

describe('flattenPdf', () => {
  const mockPdfBytes = new ArrayBuffer(10);

  it('returns flattened PDF bytes', async () => {
    const result = await flattenPdf(mockPdfBytes);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('flattens with default options', async () => {
    const result = await flattenPdf(mockPdfBytes, {});
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('accepts annotations for flattening', async () => {
    const annotations = [{
      id: '1',
      type: 'highlight' as const,
      pageIndex: 0,
      rects: [{ x: 0, y: 0, width: 100, height: 20 }],
      color: '#FFEB3B',
      opacity: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    const result = await flattenPdf(mockPdfBytes, { flattenAnnotations: true }, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('accepts form fields for flattening', async () => {
    const formFields = [{
      id: '1',
      pageIndex: 0,
      type: 'text' as const,
      name: 'field1',
      bounds: { x: 0, y: 0, width: 100, height: 20 },
      value: 'test',
    }];

    const result = await flattenPdf(mockPdfBytes, { flattenFormFields: true }, [], formFields);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
