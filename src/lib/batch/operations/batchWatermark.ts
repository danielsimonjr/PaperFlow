/**
 * Batch Watermark Operation
 * Apply text or image watermarks to multiple PDF files.
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type {
  BatchJob,
  WatermarkJobOptions,
  OutputFileInfo,
} from '@/types/batch';

/**
 * Progress callback type
 */
export type WatermarkProgressCallback = (
  fileId: string,
  progress: number,
  message?: string
) => void;

/**
 * Watermark result
 */
export interface WatermarkResult {
  watermarkedBytes: Uint8Array;
  pagesProcessed: number;
}

/**
 * Parse hex color to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

/**
 * Calculate watermark position
 */
function calculatePosition(
  position: WatermarkJobOptions['position'],
  customPosition: { x: number; y: number } | undefined,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number
): { x: number; y: number } {
  switch (position) {
    case 'center':
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - textHeight) / 2,
      };

    case 'diagonal':
      return {
        x: pageWidth / 2,
        y: pageHeight / 2,
      };

    case 'tile':
      // Tile starts from top-left
      return { x: 50, y: pageHeight - 50 };

    case 'custom':
      if (customPosition) {
        return customPosition;
      }
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - textHeight) / 2,
      };

    default:
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - textHeight) / 2,
      };
  }
}

/**
 * Generate tile positions for watermark
 */
function generateTilePositions(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  rotation: number,
  spacing = 100
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  // Adjust for rotation
  const effectiveWidth = rotation !== 0 ? Math.max(textWidth, textHeight) * 1.5 : textWidth;
  const effectiveHeight = rotation !== 0 ? Math.max(textWidth, textHeight) * 1.5 : textHeight;

  for (let y = 50; y < pageHeight; y += effectiveHeight + spacing) {
    for (let x = 50; x < pageWidth; x += effectiveWidth + spacing) {
      positions.push({ x, y });
    }
  }

  return positions;
}

/**
 * Apply watermark to a single PDF
 */
export async function applyWatermarkToPdf(
  pdfBytes: ArrayBuffer,
  options: WatermarkJobOptions,
  onProgress?: (progress: number) => void
): Promise<WatermarkResult> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Get font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSize || 72;
  const color = parseColor(options.fontColor || '#888888');

  onProgress?.(10);

  // Calculate approximate text dimensions
  const textWidth = font.widthOfTextAtSize(options.content, fontSize);
  const textHeight = fontSize;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const { width, height } = page.getSize();

    onProgress?.(10 + Math.round(((i + 1) / pages.length) * 80));

    // Get positions based on mode
    let positions: Array<{ x: number; y: number }>;

    if (options.position === 'tile') {
      positions = generateTilePositions(
        width,
        height,
        textWidth * options.scale,
        textHeight * options.scale,
        options.rotation,
        150
      );
    } else {
      positions = [
        calculatePosition(
          options.position,
          options.customPosition,
          width,
          height,
          textWidth * options.scale,
          textHeight * options.scale
        ),
      ];
    }

    // Draw watermarks
    for (const pos of positions) {
      if (options.type === 'text') {
        // For diagonal/rotated watermarks, we need special handling
        if (options.position === 'diagonal' || options.rotation !== 0) {
          page.drawText(options.content, {
            x: pos.x,
            y: pos.y,
            size: fontSize * options.scale,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity: options.opacity,
            rotate: degrees(options.rotation),
          });
        } else {
          page.drawText(options.content, {
            x: pos.x,
            y: pos.y,
            size: fontSize * options.scale,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity: options.opacity,
          });
        }
      }
      // Image watermarks would require additional handling to embed and draw images
    }
  }

  onProgress?.(95);

  // Set metadata
  pdfDoc.setProducer('PaperFlow');

  const watermarkedBytes = await pdfDoc.save();

  onProgress?.(100);

  return {
    watermarkedBytes,
    pagesProcessed: pages.length,
  };
}

/**
 * Process batch watermark job
 */
export async function processBatchWatermark(
  job: BatchJob,
  readFile: (path: string) => Promise<ArrayBuffer>,
  writeFile: (path: string, data: Uint8Array) => Promise<void>,
  generateOutputPath: (inputPath: string, suffix: string) => string,
  onProgress?: WatermarkProgressCallback,
  onFileComplete?: (fileId: string, result: OutputFileInfo) => void,
  onFileError?: (fileId: string, error: Error) => void,
  abortSignal?: AbortSignal
): Promise<OutputFileInfo[]> {
  const options = job.options.watermark;
  if (!options) {
    throw new Error('Watermark options are required');
  }

  const results: OutputFileInfo[] = [];

  for (const file of job.files) {
    if (abortSignal?.aborted) {
      break;
    }

    if (file.status !== 'pending' && file.status !== 'queued') {
      continue;
    }

    const startTime = Date.now();

    try {
      onProgress?.(file.id, 0, 'Reading file...');

      const inputBytes = await readFile(file.path);
      const inputSize = inputBytes.byteLength;

      onProgress?.(file.id, 10, 'Applying watermark...');

      const result = await applyWatermarkToPdf(inputBytes, options, (progress) => {
        onProgress?.(file.id, 10 + progress * 0.8, 'Applying watermark...');
      });

      onProgress?.(file.id, 90, 'Saving...');

      const outputPath = generateOutputPath(file.path, '_watermarked');
      await writeFile(outputPath, result.watermarkedBytes);

      const processingTime = Date.now() - startTime;

      const fileResult: OutputFileInfo = {
        inputPath: file.path,
        outputPath,
        inputSize,
        outputSize: result.watermarkedBytes.byteLength,
        processingTime,
      };

      results.push(fileResult);
      onFileComplete?.(file.id, fileResult);
      onProgress?.(file.id, 100, 'Complete');
    } catch (error) {
      onFileError?.(
        file.id,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  return results;
}

/**
 * Validate watermark options
 */
export function validateWatermarkOptions(options: Partial<WatermarkJobOptions>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.content || options.content.trim() === '') {
    errors.push('Watermark content is required');
  }

  if (options.opacity !== undefined && (options.opacity < 0 || options.opacity > 1)) {
    errors.push('Opacity must be between 0 and 1');
  }

  if (options.rotation !== undefined && (options.rotation < -360 || options.rotation > 360)) {
    errors.push('Rotation must be between -360 and 360');
  }

  if (options.scale !== undefined && options.scale <= 0) {
    errors.push('Scale must be greater than 0');
  }

  if (options.fontSize !== undefined && (options.fontSize < 1 || options.fontSize > 500)) {
    errors.push('Font size must be between 1 and 500');
  }

  if (options.fontColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(options.fontColor)) {
    errors.push('Invalid font color format (use #RRGGBB)');
  }

  if (options.position === 'custom' && !options.customPosition) {
    errors.push('Custom position coordinates are required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Preview watermark on a single page
 */
export async function previewWatermark(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  options: WatermarkJobOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error('Invalid page index');
  }

  // Create a new document with just the preview page
  const previewDoc = await PDFDocument.create();
  const [copiedPage] = await previewDoc.copyPages(pdfDoc, [pageIndex]);

  if (!copiedPage) {
    throw new Error('Failed to copy page');
  }

  previewDoc.addPage(copiedPage);

  // Apply watermark to the single page
  const savedBytes = await previewDoc.save();
  // Convert Uint8Array to ArrayBuffer for processing
  const arrayBuffer = savedBytes.buffer.slice(
    savedBytes.byteOffset,
    savedBytes.byteOffset + savedBytes.byteLength
  ) as ArrayBuffer;
  const result = await applyWatermarkToPdf(arrayBuffer, options);

  return result.watermarkedBytes;
}

/**
 * Common watermark presets
 */
export const WATERMARK_PRESETS = {
  draft: {
    type: 'text' as const,
    content: 'DRAFT',
    position: 'diagonal' as const,
    opacity: 0.3,
    rotation: -45,
    scale: 1,
    layer: 'over' as const,
    fontSize: 72,
    fontColor: '#888888',
  },
  confidential: {
    type: 'text' as const,
    content: 'CONFIDENTIAL',
    position: 'diagonal' as const,
    opacity: 0.3,
    rotation: -45,
    scale: 1,
    layer: 'over' as const,
    fontSize: 72,
    fontColor: '#cc0000',
  },
  copy: {
    type: 'text' as const,
    content: 'COPY',
    position: 'center' as const,
    opacity: 0.2,
    rotation: 0,
    scale: 2,
    layer: 'over' as const,
    fontSize: 72,
    fontColor: '#666666',
  },
  sample: {
    type: 'text' as const,
    content: 'SAMPLE',
    position: 'tile' as const,
    opacity: 0.15,
    rotation: -30,
    scale: 0.8,
    layer: 'over' as const,
    fontSize: 48,
    fontColor: '#999999',
  },
};
