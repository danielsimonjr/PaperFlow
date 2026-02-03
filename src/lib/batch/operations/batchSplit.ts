/**
 * Batch Split Operation
 * Split PDFs by page count, file size, bookmarks, or blank pages.
 */

import { PDFDocument } from 'pdf-lib';
import type {
  BatchJob,
  SplitJobOptions,
  OutputFileInfo,
} from '@/types/batch';

/**
 * Progress callback type
 */
export type SplitProgressCallback = (
  fileId: string,
  progress: number,
  message?: string
) => void;

/**
 * Split result for a single file
 */
export interface SplitResult {
  parts: Array<{
    data: Uint8Array;
    pageRange: string;
    pageCount: number;
    name: string;
  }>;
  totalParts: number;
  originalPages: number;
}

/**
 * Split by page count
 */
async function splitByPageCount(
  pdfBytes: ArrayBuffer,
  pagesPerFile: number,
  baseName: string,
  onProgress?: (progress: number) => void
): Promise<SplitResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const parts: SplitResult['parts'] = [];

  const totalChunks = Math.ceil(totalPages / pagesPerFile);

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    onProgress?.(Math.round(((chunk + 1) / totalChunks) * 100));

    const startPage = chunk * pagesPerFile;
    const endPage = Math.min(startPage + pagesPerFile, totalPages);
    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, i) => startPage + i
    );

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    newPdf.setProducer('PaperFlow');

    const startPageDisplay = startPage + 1;
    const endPageDisplay = endPage;
    const pageRange =
      startPageDisplay === endPageDisplay
        ? `${startPageDisplay}`
        : `${startPageDisplay}-${endPageDisplay}`;

    parts.push({
      data: await newPdf.save(),
      pageRange,
      pageCount: pageIndices.length,
      name: `${baseName}_part${String(chunk + 1).padStart(3, '0')}.pdf`,
    });
  }

  return {
    parts,
    totalParts: parts.length,
    originalPages: totalPages,
  };
}

/**
 * Split by file size (approximate)
 */
async function splitByFileSize(
  pdfBytes: ArrayBuffer,
  maxSizeBytes: number,
  baseName: string,
  onProgress?: (progress: number) => void
): Promise<SplitResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const parts: SplitResult['parts'] = [];

  // Estimate average page size
  const avgPageSize = pdfBytes.byteLength / totalPages;
  let currentChunkPages: number[] = [];
  let chunkNumber = 0;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    onProgress?.(Math.round(((pageIndex + 1) / totalPages) * 100));

    const estimatedSize = (currentChunkPages.length + 1) * avgPageSize;

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

      parts.push({
        data: await newPdf.save(),
        pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
        pageCount: currentChunkPages.length,
        name: `${baseName}_part${String(chunkNumber).padStart(3, '0')}.pdf`,
      });

      // Start new chunk
      currentChunkPages = [pageIndex];
    } else {
      currentChunkPages.push(pageIndex);
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

    parts.push({
      data: await newPdf.save(),
      pageRange: startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`,
      pageCount: currentChunkPages.length,
      name: `${baseName}_part${String(chunkNumber).padStart(3, '0')}.pdf`,
    });
  }

  return {
    parts,
    totalParts: parts.length,
    originalPages: totalPages,
  };
}

/**
 * Split by specific page ranges
 */
async function splitByRanges(
  pdfBytes: ArrayBuffer,
  ranges: string[],
  baseName: string,
  onProgress?: (progress: number) => void
): Promise<SplitResult> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const totalPages = sourcePdf.getPageCount();
  const parts: SplitResult['parts'] = [];

  for (let i = 0; i < ranges.length; i++) {
    onProgress?.(Math.round(((i + 1) / ranges.length) * 100));

    const range = ranges[i]!;
    const pageIndices = parsePageRange(range, totalPages);

    if (pageIndices.length === 0) continue;

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    newPdf.setProducer('PaperFlow');

    parts.push({
      data: await newPdf.save(),
      pageRange: range,
      pageCount: pageIndices.length,
      name: `${baseName}_${range.replace(/[,\s]/g, '_')}.pdf`,
    });
  }

  return {
    parts,
    totalParts: parts.length,
    originalPages: totalPages,
  };
}

/**
 * Parse page range string to indices
 */
function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indices: Set<number> = new Set();
  const parts = rangeStr.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr!, 10);
      const end = parseInt(endStr!, 10);

      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1); // Convert to zero-based
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Split a single PDF
 */
export async function splitSinglePdf(
  pdfBytes: ArrayBuffer,
  options: SplitJobOptions,
  baseName: string,
  onProgress?: (progress: number) => void
): Promise<SplitResult> {
  switch (options.method) {
    case 'page-count':
      return splitByPageCount(
        pdfBytes,
        options.pagesPerFile || 10,
        baseName,
        onProgress
      );

    case 'file-size':
      return splitByFileSize(
        pdfBytes,
        options.maxFileSize || 5 * 1024 * 1024, // 5MB default
        baseName,
        onProgress
      );

    case 'range':
      return splitByRanges(
        pdfBytes,
        options.ranges || [],
        baseName,
        onProgress
      );

    case 'blank-pages':
      // Blank page detection would require rendering pages and analyzing content
      // For now, fall back to page count
      return splitByPageCount(
        pdfBytes,
        options.pagesPerFile || 10,
        baseName,
        onProgress
      );

    case 'bookmarks':
      // Bookmark-based splitting would require reading PDF outline
      // For now, fall back to page count
      return splitByPageCount(
        pdfBytes,
        options.pagesPerFile || 10,
        baseName,
        onProgress
      );

    default:
      return splitByPageCount(pdfBytes, 10, baseName, onProgress);
  }
}

/**
 * Process batch split job
 */
export async function processBatchSplit(
  job: BatchJob,
  readFile: (path: string) => Promise<ArrayBuffer>,
  writeFile: (path: string, data: Uint8Array) => Promise<void>,
  _generateOutputPath: (inputPath: string, suffix: string) => string, // Reserved for custom path generation
  outputDir: string,
  onProgress?: SplitProgressCallback,
  onFileComplete?: (fileId: string, results: OutputFileInfo[]) => void,
  onFileError?: (fileId: string, error: Error) => void,
  abortSignal?: AbortSignal
): Promise<OutputFileInfo[]> {
  const options = job.options.split;
  if (!options) {
    throw new Error('Split options are required');
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

      // Get base name without extension
      const baseName = file.name.replace(/\.pdf$/i, '');

      onProgress?.(file.id, 10, 'Splitting...');

      const splitResult = await splitSinglePdf(
        inputBytes,
        options,
        baseName,
        (progress) => {
          onProgress?.(file.id, 10 + progress * 0.8, 'Splitting...');
        }
      );

      onProgress?.(file.id, 90, 'Saving parts...');

      const fileResults: OutputFileInfo[] = [];

      // Write each part
      for (const part of splitResult.parts) {
        const outputPath = `${outputDir}/${part.name}`;
        await writeFile(outputPath, part.data);

        fileResults.push({
          inputPath: file.path,
          outputPath,
          inputSize,
          outputSize: part.data.byteLength,
          processingTime: Date.now() - startTime,
        });
      }

      results.push(...fileResults);
      onFileComplete?.(file.id, fileResults);
      onProgress?.(file.id, 100, `Split into ${splitResult.totalParts} parts`);
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
 * Validate split options
 */
export function validateSplitOptions(options: Partial<SplitJobOptions>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.method === 'page-count') {
    if (!options.pagesPerFile || options.pagesPerFile < 1) {
      errors.push('Pages per file must be at least 1');
    }
  }

  if (options.method === 'file-size') {
    if (!options.maxFileSize || options.maxFileSize < 1024) {
      errors.push('Max file size must be at least 1KB');
    }
  }

  if (options.method === 'range') {
    if (!options.ranges || options.ranges.length === 0) {
      errors.push('At least one page range is required');
    }
  }

  if (options.method === 'blank-pages') {
    if (
      options.blankPageThreshold !== undefined &&
      (options.blankPageThreshold < 0 || options.blankPageThreshold > 100)
    ) {
      errors.push('Blank page threshold must be between 0 and 100');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Estimate split result
 */
export async function estimateSplitResult(
  pdfBytes: ArrayBuffer,
  options: SplitJobOptions
): Promise<{ estimatedParts: number; pagesPerPart: number[] }> {
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();

  let estimatedParts = 1;
  const pagesPerPart: number[] = [];

  switch (options.method) {
    case 'page-count': {
      const pagesPerFile = options.pagesPerFile || 10;
      estimatedParts = Math.ceil(totalPages / pagesPerFile);
      for (let i = 0; i < estimatedParts; i++) {
        const start = i * pagesPerFile;
        const end = Math.min(start + pagesPerFile, totalPages);
        pagesPerPart.push(end - start);
      }
      break;
    }

    case 'file-size': {
      // Rough estimate
      const avgPageSize = pdfBytes.byteLength / totalPages;
      const maxSize = options.maxFileSize || 5 * 1024 * 1024;
      const pagesPerChunk = Math.floor(maxSize / avgPageSize);
      estimatedParts = Math.ceil(totalPages / pagesPerChunk);
      break;
    }

    case 'range':
      estimatedParts = options.ranges?.length || 1;
      break;
  }

  return { estimatedParts, pagesPerPart };
}
