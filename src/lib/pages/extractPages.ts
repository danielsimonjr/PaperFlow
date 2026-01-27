import { PDFDocument } from 'pdf-lib';

export interface ExtractResult {
  extractedPdf: Uint8Array;
  remainingPdf?: Uint8Array;
  extractedCount: number;
  remainingCount: number;
}

/**
 * Extract specific pages from a PDF into a new document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndices - Zero-based page indices to extract
 * @param removeFromOriginal - If true, also return the original without extracted pages
 * @returns Object containing extracted PDF and optionally the remaining PDF
 */
export async function extractPages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[],
  removeFromOriginal: boolean = false
): Promise<ExtractResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  // Validate page indices
  for (const index of pageIndices) {
    if (index < 0 || index >= totalPages) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  // Remove duplicates and sort
  const uniqueIndices = [...new Set(pageIndices)].sort((a, b) => a - b);

  if (uniqueIndices.length === 0) {
    throw new Error('No pages selected for extraction');
  }

  // Create the extracted PDF
  const extractedPdf = await PDFDocument.create();
  const copiedPages = await extractedPdf.copyPages(sourcePdf, uniqueIndices);

  for (const page of copiedPages) {
    extractedPdf.addPage(page);
  }

  // Copy metadata to extracted PDF
  copyMetadata(sourcePdf, extractedPdf);
  extractedPdf.setProducer('PaperFlow');

  const result: ExtractResult = {
    extractedPdf: await extractedPdf.save(),
    extractedCount: uniqueIndices.length,
    remainingCount: totalPages - uniqueIndices.length,
  };

  // Optionally create the remaining PDF (original without extracted pages)
  if (removeFromOriginal && uniqueIndices.length < totalPages) {
    const remainingIndices: number[] = [];
    const extractedSet = new Set(uniqueIndices);

    for (let i = 0; i < totalPages; i++) {
      if (!extractedSet.has(i)) {
        remainingIndices.push(i);
      }
    }

    const remainingPdf = await PDFDocument.create();
    const remainingPages = await remainingPdf.copyPages(sourcePdf, remainingIndices);

    for (const page of remainingPages) {
      remainingPdf.addPage(page);
    }

    copyMetadata(sourcePdf, remainingPdf);
    remainingPdf.setProducer('PaperFlow');

    result.remainingPdf = await remainingPdf.save();
  }

  return result;
}

/**
 * Extract a range of pages from a PDF.
 * @param pdfBytes - The original PDF bytes
 * @param startPage - Start page (1-based, inclusive)
 * @param endPage - End page (1-based, inclusive)
 * @param removeFromOriginal - If true, also return the original without extracted pages
 * @returns Object containing extracted PDF and optionally the remaining PDF
 */
export async function extractPageRange(
  pdfBytes: ArrayBuffer,
  startPage: number,
  endPage: number,
  removeFromOriginal: boolean = false
): Promise<ExtractResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  if (startPage < 1 || startPage > totalPages) {
    throw new Error(`Invalid start page: ${startPage}`);
  }

  if (endPage < startPage || endPage > totalPages) {
    throw new Error(`Invalid end page: ${endPage}`);
  }

  // Convert to zero-based indices
  const pageIndices: number[] = [];
  for (let i = startPage - 1; i < endPage; i++) {
    pageIndices.push(i);
  }

  return extractPages(pdfBytes, pageIndices, removeFromOriginal);
}

/**
 * Extract odd or even pages from a PDF.
 * @param pdfBytes - The original PDF bytes
 * @param extractOdd - If true, extract odd pages; if false, extract even pages
 * @param removeFromOriginal - If true, also return the original without extracted pages
 * @returns Object containing extracted PDF and optionally the remaining PDF
 */
export async function extractOddEvenPages(
  pdfBytes: ArrayBuffer,
  extractOdd: boolean,
  removeFromOriginal: boolean = false
): Promise<ExtractResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  const pageIndices: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1; // 1-based page number
    if ((extractOdd && pageNumber % 2 === 1) || (!extractOdd && pageNumber % 2 === 0)) {
      pageIndices.push(i);
    }
  }

  if (pageIndices.length === 0) {
    throw new Error(`No ${extractOdd ? 'odd' : 'even'} pages to extract`);
  }

  return extractPages(pdfBytes, pageIndices, removeFromOriginal);
}

/**
 * Extract the first N pages from a PDF.
 * @param pdfBytes - The original PDF bytes
 * @param count - Number of pages to extract from the beginning
 * @param removeFromOriginal - If true, also return the original without extracted pages
 * @returns Object containing extracted PDF and optionally the remaining PDF
 */
export async function extractFirstPages(
  pdfBytes: ArrayBuffer,
  count: number,
  removeFromOriginal: boolean = false
): Promise<ExtractResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  if (count < 1) {
    throw new Error('Count must be at least 1');
  }

  const actualCount = Math.min(count, totalPages);
  const pageIndices = Array.from({ length: actualCount }, (_, i) => i);

  return extractPages(pdfBytes, pageIndices, removeFromOriginal);
}

/**
 * Extract the last N pages from a PDF.
 * @param pdfBytes - The original PDF bytes
 * @param count - Number of pages to extract from the end
 * @param removeFromOriginal - If true, also return the original without extracted pages
 * @returns Object containing extracted PDF and optionally the remaining PDF
 */
export async function extractLastPages(
  pdfBytes: ArrayBuffer,
  count: number,
  removeFromOriginal: boolean = false
): Promise<ExtractResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  if (count < 1) {
    throw new Error('Count must be at least 1');
  }

  const actualCount = Math.min(count, totalPages);
  const startIndex = totalPages - actualCount;
  const pageIndices = Array.from({ length: actualCount }, (_, i) => startIndex + i);

  return extractPages(pdfBytes, pageIndices, removeFromOriginal);
}

/**
 * Copy metadata from one PDF document to another.
 */
function copyMetadata(source: PDFDocument, target: PDFDocument): void {
  const title = source.getTitle();
  const author = source.getAuthor();
  const subject = source.getSubject();
  const keywords = source.getKeywords();
  const creator = source.getCreator();

  if (title) target.setTitle(title);
  if (author) target.setAuthor(author);
  if (subject) target.setSubject(subject);
  if (keywords) target.setKeywords([keywords]);
  if (creator) target.setCreator(creator);
}
