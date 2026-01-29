import { PDFDocument } from 'pdf-lib';

export interface CompressOptions {
  imageQuality: number; // 0.1 to 1.0
  removeMetadata: boolean;
  subsampleImages: boolean;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressedBytes: Uint8Array;
}

/**
 * Analyze a PDF and return its size breakdown.
 */
export function analyzePdfSize(pdfBytes: ArrayBuffer): {
  totalSize: number;
  formattedSize: string;
} {
  const totalSize = pdfBytes.byteLength;
  return {
    totalSize,
    formattedSize: formatFileSize(totalSize),
  };
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compress a PDF by re-encoding with optional metadata removal.
 * Note: Full image re-compression requires canvas rendering which is
 * handled separately. This focuses on structural optimization.
 */
export async function compressPdf(
  pdfBytes: ArrayBuffer,
  options: CompressOptions
): Promise<CompressionResult> {
  const originalSize = pdfBytes.byteLength;

  const pdfDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  });

  if (options.removeMetadata) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('PaperFlow');
  }

  // Save with object streams enabled for better compression
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const compressedSize = compressedBytes.byteLength;
  const compressionRatio = originalSize > 0
    ? ((originalSize - compressedSize) / originalSize) * 100
    : 0;

  return {
    originalSize,
    compressedSize,
    compressionRatio: Math.max(0, compressionRatio),
    compressedBytes,
  };
}
