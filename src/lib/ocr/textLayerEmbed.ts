/**
 * Text Layer Embedding for Searchable PDFs
 * Embeds invisible text layer into PDF for text selection and search.
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import type { OCRResult } from './types';

export interface EmbedOptions {
  /** If true, text is invisible (for overlay on scanned images) */
  invisible: boolean;
  /** If true, try to preserve original formatting */
  preserveFormatting: boolean;
}

export interface EmbedResult {
  success: boolean;
  pdfBytes: ArrayBuffer | null;
  wordsEmbedded: number;
  pagesProcessed: number;
  errors: string[];
}

/**
 * Embeds OCR text layer into a PDF
 * @param pdfBytes Original PDF bytes
 * @param ocrResults Map of page index to OCR results
 * @param options Embedding options
 * @returns Result with new PDF bytes and stats
 */
export async function embedTextLayer(
  pdfBytes: ArrayBuffer,
  ocrResults: Map<number, OCRResult>,
  options: EmbedOptions = { invisible: true, preserveFormatting: true }
): Promise<EmbedResult> {
  const errors: string[] = [];
  let wordsEmbedded = 0;
  let pagesProcessed = 0;

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const [pageIndex, result] of ocrResults) {
      if (pageIndex >= pages.length) {
        errors.push(`Page index ${pageIndex} out of bounds (document has ${pages.length} pages)`);
        continue;
      }

      try {
        const page = pages[pageIndex]!;
        const embedCount = await embedPageText(page, result, font, options);
        wordsEmbedded += embedCount;
        pagesProcessed++;
      } catch (pageError) {
        const errorMsg =
          pageError instanceof Error ? pageError.message : 'Unknown error';
        errors.push(`Error embedding page ${pageIndex + 1}: ${errorMsg}`);
      }
    }

    const savedBytes = await pdfDoc.save();

    return {
      success: errors.length === 0,
      pdfBytes: savedBytes.buffer as ArrayBuffer,
      wordsEmbedded,
      pagesProcessed,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      pdfBytes: null,
      wordsEmbedded: 0,
      pagesProcessed: 0,
      errors: [`Failed to process PDF: ${errorMsg}`],
    };
  }
}

/**
 * Embeds text for a single page
 */
async function embedPageText(
  page: PDFPage,
  result: OCRResult,
  font: PDFFont,
  options: EmbedOptions
): Promise<number> {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const { imageDimensions } = result;

  // Calculate scale factor between OCR image and PDF page
  let scaleX = 1;
  let scaleY = 1;

  if (imageDimensions) {
    scaleX = pageWidth / imageDimensions.width;
    scaleY = pageHeight / imageDimensions.height;
  }

  let count = 0;

  for (const word of result.words) {
    try {
      const { bbox, text } = word;

      // Skip empty words
      if (!text.trim()) continue;

      // Convert OCR coordinates to PDF coordinates
      // OCR uses top-left origin, PDF uses bottom-left
      const x = bbox.x0 * scaleX;
      const y = pageHeight - bbox.y1 * scaleY;

      // Calculate font size to match word width
      const targetWidth = (bbox.x1 - bbox.x0) * scaleX;
      const fontSize = calculateFontSize(font, text, targetWidth);

      // Skip if font size is too small or too large
      if (fontSize < 1 || fontSize > 100) continue;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: options.invisible ? rgb(1, 1, 1) : rgb(0, 0, 0),
        opacity: options.invisible ? 0 : 1,
      });

      count++;
    } catch (wordError) {
      // Skip individual word errors to continue processing
      console.warn(`Failed to embed word: "${word.text}"`, wordError);
    }
  }

  return count;
}

/**
 * Calculates font size to make text fit target width
 */
function calculateFontSize(
  font: PDFFont,
  text: string,
  targetWidth: number
): number {
  // Start with base size and scale to fit
  const baseSize = 12;
  const measuredWidth = font.widthOfTextAtSize(text, baseSize);

  if (measuredWidth <= 0) return baseSize;

  const scaledSize = (targetWidth / measuredWidth) * baseSize;

  // Clamp to reasonable range
  return Math.max(4, Math.min(scaledSize, 72));
}

/**
 * Creates a searchable PDF from an image-based PDF
 * @param pdfBytes Original PDF bytes
 * @param ocrResults Map of page index to OCR results
 * @returns New PDF with embedded text layer
 */
export async function createSearchablePDF(
  pdfBytes: ArrayBuffer,
  ocrResults: Map<number, OCRResult>
): Promise<EmbedResult> {
  return embedTextLayer(pdfBytes, ocrResults, {
    invisible: true,
    preserveFormatting: true,
  });
}

/**
 * Validates that OCR results are compatible with a PDF
 */
export function validateOCRResults(
  pageCount: number,
  ocrResults: Map<number, OCRResult>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [pageIndex] of ocrResults) {
    if (pageIndex < 0 || pageIndex >= pageCount) {
      errors.push(`Invalid page index: ${pageIndex} (document has ${pageCount} pages)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
