import { PDFDocument } from 'pdf-lib';

export interface SplitResult {
  name: string;
  data: Uint8Array;
  pageRange: string;
  pageCount: number;
}

export interface SplitProgress {
  current: number;
  total: number;
  percentComplete: number;
}

export type SplitProgressCallback = (progress: SplitProgress) => void;

/**
 * Parse a page range string into an array of page indices.
 * Supports formats like: "1-5", "1,3,5", "1-3,5,7-9"
 * @param rangeStr - The page range string (1-based)
 * @param totalPages - Total number of pages in the document
 * @returns Array of zero-based page indices
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indices: Set<number> = new Set();
  const parts = rangeStr.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr!, 10);
      const end = parseInt(endStr!, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid page range: ${part}`);
      }

      if (start < 1 || end > totalPages || start > end) {
        throw new Error(
          `Invalid page range: ${part} (document has ${totalPages} pages)`
        );
      }

      for (let i = start; i <= end; i++) {
        indices.add(i - 1); // Convert to zero-based
      }
    } else {
      const pageNum = parseInt(part, 10);

      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: ${part}`);
      }

      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(
          `Invalid page number: ${pageNum} (document has ${totalPages} pages)`
        );
      }

      indices.add(pageNum - 1); // Convert to zero-based
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Split a PDF by page range.
 * @param pdfBytes - The original PDF bytes
 * @param rangeStr - Page range string (e.g., "1-5", "1,3,5-7")
 * @param baseName - Base name for the output file
 * @returns The split PDF data
 */
export async function splitByRange(
  pdfBytes: ArrayBuffer,
  rangeStr: string,
  baseName: string = 'split'
): Promise<SplitResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();

  const pageIndices = parsePageRange(rangeStr, totalPages);

  if (pageIndices.length === 0) {
    throw new Error('No pages selected for extraction');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  newPdf.setProducer('PaperFlow');

  return {
    name: `${baseName}_pages_${rangeStr.replace(/,/g, '_')}.pdf`,
    data: await newPdf.save(),
    pageRange: rangeStr,
    pageCount: pageIndices.length,
  };
}

/**
 * Split a PDF into multiple files of N pages each.
 * @param pdfBytes - The original PDF bytes
 * @param pagesPerFile - Number of pages per output file
 * @param baseName - Base name for output files
 * @param onProgress - Optional progress callback
 * @returns Array of split PDF results
 */
export async function splitEveryNPages(
  pdfBytes: ArrayBuffer,
  pagesPerFile: number,
  baseName: string = 'split',
  onProgress?: SplitProgressCallback
): Promise<SplitResult[]> {
  if (pagesPerFile < 1) {
    throw new Error('Pages per file must be at least 1');
  }

  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const results: SplitResult[] = [];

  const totalChunks = Math.ceil(totalPages / pagesPerFile);

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const startPage = chunk * pagesPerFile;
    const endPage = Math.min(startPage + pagesPerFile, totalPages);
    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, i) => startPage + i
    );

    if (onProgress) {
      onProgress({
        current: chunk + 1,
        total: totalChunks,
        percentComplete: Math.round(((chunk + 1) / totalChunks) * 100),
      });
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    newPdf.setProducer('PaperFlow');

    const startPageDisplay = startPage + 1;
    const endPageDisplay = endPage;

    results.push({
      name: `${baseName}_${String(chunk + 1).padStart(3, '0')}.pdf`,
      data: await newPdf.save(),
      pageRange: `${startPageDisplay}-${endPageDisplay}`,
      pageCount: pageIndices.length,
    });
  }

  return results;
}

/**
 * Estimate the size of a PDF with specific pages.
 * This is an approximation based on the average page size.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndices - Zero-based page indices
 * @returns Estimated size in bytes
 */
async function estimatePageSize(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<number> {
  // Simple estimation: total size / total pages * selected pages
  // This is rough but works for splitting by size
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const avgPageSize = pdfBytes.byteLength / totalPages;

  return avgPageSize * pageIndices.length;
}

/**
 * Split a PDF into files under a maximum size.
 * @param pdfBytes - The original PDF bytes
 * @param maxSizeBytes - Maximum size per file in bytes
 * @param baseName - Base name for output files
 * @param onProgress - Optional progress callback
 * @returns Array of split PDF results
 */
export async function splitBySize(
  pdfBytes: ArrayBuffer,
  maxSizeBytes: number,
  baseName: string = 'split',
  onProgress?: SplitProgressCallback
): Promise<SplitResult[]> {
  if (maxSizeBytes < 1024) {
    throw new Error('Maximum size must be at least 1 KB');
  }

  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const results: SplitResult[] = [];

  let currentChunkPages: number[] = [];
  let chunkNumber = 0;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const testPages = [...currentChunkPages, pageIndex];
    const estimatedSize = await estimatePageSize(pdfBytes, testPages);

    if (estimatedSize > maxSizeBytes && currentChunkPages.length > 0) {
      // Save current chunk
      chunkNumber++;
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, currentChunkPages);

      for (const page of copiedPages) {
        newPdf.addPage(page);
      }

      newPdf.setProducer('PaperFlow');

      const startPage = currentChunkPages[0]! + 1;
      const endPage = currentChunkPages[currentChunkPages.length - 1]! + 1;

      results.push({
        name: `${baseName}_${String(chunkNumber).padStart(3, '0')}.pdf`,
        data: await newPdf.save(),
        pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
        pageCount: currentChunkPages.length,
      });

      // Start new chunk with current page
      currentChunkPages = [pageIndex];
    } else {
      currentChunkPages.push(pageIndex);
    }

    if (onProgress) {
      onProgress({
        current: pageIndex + 1,
        total: totalPages,
        percentComplete: Math.round(((pageIndex + 1) / totalPages) * 100),
      });
    }
  }

  // Save remaining pages
  if (currentChunkPages.length > 0) {
    chunkNumber++;
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, currentChunkPages);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    newPdf.setProducer('PaperFlow');

    const startPage = currentChunkPages[0]! + 1;
    const endPage = currentChunkPages[currentChunkPages.length - 1]! + 1;

    results.push({
      name: `${baseName}_${String(chunkNumber).padStart(3, '0')}.pdf`,
      data: await newPdf.save(),
      pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
      pageCount: currentChunkPages.length,
    });
  }

  return results;
}

/**
 * Split a PDF into individual pages.
 * @param pdfBytes - The original PDF bytes
 * @param baseName - Base name for output files
 * @param onProgress - Optional progress callback
 * @returns Array of split PDF results
 */
export async function splitIntoSinglePages(
  pdfBytes: ArrayBuffer,
  baseName: string = 'page',
  onProgress?: SplitProgressCallback
): Promise<SplitResult[]> {
  return splitEveryNPages(pdfBytes, 1, baseName, onProgress);
}
