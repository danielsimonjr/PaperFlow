import { describe, it, expect, vi } from 'vitest';
import { compressPdf, analyzePdfSize, formatFileSize } from '@lib/export/compressPdf';

// Mock pdf-lib
vi.mock('pdf-lib', () => {
  const mockPdfDoc = {
    setTitle: vi.fn(),
    setAuthor: vi.fn(),
    setSubject: vi.fn(),
    setKeywords: vi.fn(),
    setCreator: vi.fn(),
    setProducer: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
  };

  return {
    PDFDocument: {
      load: vi.fn().mockResolvedValue(mockPdfDoc),
    },
  };
});

describe('compressPdf', () => {
  const mockPdfBytes = new ArrayBuffer(1000);

  it('returns compression result with sizes', async () => {
    const result = await compressPdf(mockPdfBytes, {
      imageQuality: 0.7,
      removeMetadata: false,
      subsampleImages: false,
    });

    expect(result.originalSize).toBe(1000);
    expect(result.compressedSize).toBe(5);
    expect(result.compressionRatio).toBeGreaterThan(0);
    expect(result.compressedBytes).toBeInstanceOf(Uint8Array);
  });

  it('removes metadata when option is set', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const mockDoc = await PDFDocument.load(mockPdfBytes);

    await compressPdf(mockPdfBytes, {
      imageQuality: 0.7,
      removeMetadata: true,
      subsampleImages: false,
    });

    expect(mockDoc.setTitle).toHaveBeenCalledWith('');
    expect(mockDoc.setAuthor).toHaveBeenCalledWith('');
    expect(mockDoc.setProducer).toHaveBeenCalledWith('PaperFlow');
  });

  it('does not remove metadata when option is false', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const mockDoc = await PDFDocument.load(mockPdfBytes);

    vi.mocked(mockDoc.setTitle).mockClear();
    vi.mocked(mockDoc.setAuthor).mockClear();

    await compressPdf(mockPdfBytes, {
      imageQuality: 0.7,
      removeMetadata: false,
      subsampleImages: false,
    });

    expect(mockDoc.setTitle).not.toHaveBeenCalled();
  });

  it('calculates compression ratio correctly', async () => {
    const result = await compressPdf(mockPdfBytes, {
      imageQuality: 0.5,
      removeMetadata: true,
      subsampleImages: true,
    });

    // (1000 - 5) / 1000 * 100 = 99.5%
    expect(result.compressionRatio).toBeCloseTo(99.5, 1);
  });
});

describe('analyzePdfSize', () => {
  it('returns total size in bytes', () => {
    const pdfBytes = new ArrayBuffer(2048);
    const result = analyzePdfSize(pdfBytes);
    expect(result.totalSize).toBe(2048);
  });

  it('returns formatted size string', () => {
    const pdfBytes = new ArrayBuffer(2048);
    const result = analyzePdfSize(pdfBytes);
    expect(result.formattedSize).toBe('2.0 KB');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('handles zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});
