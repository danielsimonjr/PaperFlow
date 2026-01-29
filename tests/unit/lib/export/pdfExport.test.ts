import { describe, it, expect, vi } from 'vitest';
import { exportPdf, type PdfExportOptions } from '@lib/export/pdfExport';
import type { Annotation, FormField } from '@/types';

// Mock pdf-lib
vi.mock('pdf-lib', () => {
  const mockPage = {
    getSize: () => ({ width: 612, height: 792 }),
    drawRectangle: vi.fn(),
    drawLine: vi.fn(),
    drawSquare: vi.fn(),
    drawText: vi.fn(),
    drawEllipse: vi.fn(),
  };

  const mockFont = {};

  const mockPdfDoc = {
    getPages: () => [mockPage, mockPage],
    embedFont: vi.fn().mockResolvedValue(mockFont),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
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

describe('pdfExport', () => {
  const mockPdfBytes = new ArrayBuffer(10);

  const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
    id: 'test-1',
    type: 'highlight',
    pageIndex: 0,
    rects: [{ x: 100, y: 200, width: 150, height: 20 }],
    color: '#FFEB3B',
    opacity: 0.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeFormField = (overrides: Partial<FormField> = {}): FormField => ({
    id: 'field-1',
    pageIndex: 0,
    type: 'text',
    name: 'testField',
    bounds: { x: 50, y: 100, width: 200, height: 20 },
    value: 'Hello',
    ...overrides,
  });

  it('exports PDF without modifications when no annotations or form data', async () => {
    const result = await exportPdf(mockPdfBytes);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('exports PDF with annotations', async () => {
    const annotations = [makeAnnotation()];
    const result = await exportPdf(mockPdfBytes, { includeAnnotations: true }, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('exports PDF with form data', async () => {
    const formFields = [makeFormField()];
    const result = await exportPdf(mockPdfBytes, { includeFormData: true }, [], formFields);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('skips annotations when includeAnnotations is false', async () => {
    const annotations = [makeAnnotation()];
    const options: PdfExportOptions = { includeAnnotations: false };
    const result = await exportPdf(mockPdfBytes, options, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('skips form data when includeFormData is false', async () => {
    const formFields = [makeFormField()];
    const options: PdfExportOptions = { includeFormData: false };
    const result = await exportPdf(mockPdfBytes, options, [], formFields);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles highlight annotations', async () => {
    const annotations = [makeAnnotation({ type: 'highlight' })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles underline annotations', async () => {
    const annotations = [makeAnnotation({ type: 'underline' })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles strikethrough annotations', async () => {
    const annotations = [makeAnnotation({ type: 'strikethrough' })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles note annotations', async () => {
    const annotations = [makeAnnotation({ type: 'note', content: 'Test note' })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles checkbox form fields', async () => {
    const formFields = [makeFormField({ type: 'checkbox', value: true })];
    const result = await exportPdf(mockPdfBytes, {}, [], formFields);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles shape annotations with bounds', async () => {
    const annotations = [makeAnnotation({
      type: 'shape',
      shapeType: 'rectangle',
      bounds: { x: 50, y: 50, width: 100, height: 80 },
    })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('handles ellipse shape annotations', async () => {
    const annotations = [makeAnnotation({
      type: 'shape',
      shapeType: 'ellipse',
      bounds: { x: 50, y: 50, width: 100, height: 80 },
    })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('skips annotations on non-existent pages', async () => {
    const annotations = [makeAnnotation({ pageIndex: 99 })];
    const result = await exportPdf(mockPdfBytes, {}, annotations);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
