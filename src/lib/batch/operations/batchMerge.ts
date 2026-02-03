/**
 * Batch Merge Operation
 * Merge multiple PDF files with various strategies (append, interleave, by bookmark).
 */

import { PDFDocument } from 'pdf-lib';
import type {
  BatchJob,
  MergeJobOptions,
  OutputFileInfo,
} from '@/types/batch';

/**
 * Progress callback type
 */
export type MergeProgressCallback = (
  progress: number,
  message: string,
  currentFile?: string
) => void;

/**
 * Merge result
 */
export interface MergeResult {
  mergedBytes: Uint8Array;
  totalPages: number;
  sourceFiles: number;
}

/**
 * Merge PDFs using append strategy (sequential)
 */
async function mergeAppend(
  pdfs: Array<{ name: string; data: ArrayBuffer }>,
  _addBookmarks: boolean, // Reserved for future bookmark support
  _bookmarkLevel: number, // Reserved for future bookmark support
  onProgress?: (progress: number, currentFile: string) => void
): Promise<MergeResult> {
  // Note: Bookmark support requires PDF outline manipulation
  // which is planned for a future release
  void _addBookmarks;
  void _bookmarkLevel;

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i]!;
    onProgress?.(Math.round((i / pdfs.length) * 100), pdf.name);

    const sourcePdf = await PDFDocument.load(pdf.data);
    const pageCount = sourcePdf.getPageCount();

    // Copy all pages
    const copiedPages = await mergedPdf.copyPages(
      sourcePdf,
      Array.from({ length: pageCount }, (_, j) => j)
    );

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }

    totalPages += pageCount;
  }

  mergedPdf.setProducer('PaperFlow');
  mergedPdf.setCreationDate(new Date());

  return {
    mergedBytes: await mergedPdf.save(),
    totalPages,
    sourceFiles: pdfs.length,
  };
}

/**
 * Merge PDFs using interleave strategy (alternating pages)
 */
async function mergeInterleave(
  pdfs: Array<{ name: string; data: ArrayBuffer }>,
  onProgress?: (progress: number, currentFile: string) => void
): Promise<MergeResult> {
  const mergedPdf = await PDFDocument.create();

  // Load all PDFs first
  const loadedPdfs: Array<{
    name: string;
    doc: PDFDocument;
    pageCount: number;
  }> = [];

  for (let i = 0; i < pdfs.length; i++) {
    const pdf = pdfs[i]!;
    onProgress?.(Math.round((i / pdfs.length) * 30), `Loading ${pdf.name}`);

    const doc = await PDFDocument.load(pdf.data);
    loadedPdfs.push({
      name: pdf.name,
      doc,
      pageCount: doc.getPageCount(),
    });
  }

  // Find max page count
  const maxPages = Math.max(...loadedPdfs.map((p) => p.pageCount));
  let totalPages = 0;

  // Interleave pages
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    for (const pdf of loadedPdfs) {
      if (pageIndex < pdf.pageCount) {
        onProgress?.(
          30 + Math.round(((pageIndex * loadedPdfs.length) / (maxPages * loadedPdfs.length)) * 70),
          `Page ${pageIndex + 1}`
        );

        const [copiedPage] = await mergedPdf.copyPages(pdf.doc, [pageIndex]);
        if (copiedPage) {
          mergedPdf.addPage(copiedPage);
          totalPages++;
        }
      }
    }
  }

  mergedPdf.setProducer('PaperFlow');
  mergedPdf.setCreationDate(new Date());

  return {
    mergedBytes: await mergedPdf.save(),
    totalPages,
    sourceFiles: pdfs.length,
  };
}

/**
 * Merge a single set of PDFs
 */
export async function mergePdfs(
  pdfs: Array<{ name: string; data: ArrayBuffer }>,
  options: MergeJobOptions,
  onProgress?: MergeProgressCallback
): Promise<MergeResult> {
  if (pdfs.length === 0) {
    throw new Error('At least one PDF file is required for merging');
  }

  if (pdfs.length === 1) {
    // Return single file as-is
    const doc = await PDFDocument.load(pdfs[0]!.data);
    return {
      mergedBytes: await doc.save(),
      totalPages: doc.getPageCount(),
      sourceFiles: 1,
    };
  }

  switch (options.strategy) {
    case 'interleave':
      return mergeInterleave(pdfs, (progress, file) =>
        onProgress?.(progress, `Interleaving: ${file}`, file)
      );

    case 'by-bookmark':
      // For bookmark-based merge, we use append but could add bookmark processing
      // This would require analyzing existing bookmarks in each PDF
      return mergeAppend(
        pdfs,
        options.addBookmarks,
        options.bookmarkLevel,
        (progress, file) => onProgress?.(progress, `Merging: ${file}`, file)
      );

    case 'append':
    default:
      return mergeAppend(
        pdfs,
        options.addBookmarks,
        options.bookmarkLevel,
        (progress, file) => onProgress?.(progress, `Merging: ${file}`, file)
      );
  }
}

/**
 * Process batch merge job
 */
export async function processBatchMerge(
  job: BatchJob,
  readFile: (path: string) => Promise<ArrayBuffer>,
  writeFile: (path: string, data: Uint8Array) => Promise<void>,
  outputDir: string,
  onProgress?: MergeProgressCallback,
  abortSignal?: AbortSignal
): Promise<OutputFileInfo> {
  const options = job.options.merge;
  if (!options) {
    throw new Error('Merge options are required');
  }

  const startTime = Date.now();

  // Collect all pending files
  const pendingFiles = job.files.filter(
    (f) => f.status === 'pending' || f.status === 'queued'
  );

  if (pendingFiles.length === 0) {
    throw new Error('No files to merge');
  }

  // Read all files
  const pdfs: Array<{ name: string; data: ArrayBuffer }> = [];
  let totalInputSize = 0;

  for (let i = 0; i < pendingFiles.length; i++) {
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled');
    }

    const file = pendingFiles[i]!;
    onProgress?.(
      Math.round((i / pendingFiles.length) * 30),
      `Reading ${file.name}`,
      file.name
    );

    const data = await readFile(file.path);
    totalInputSize += data.byteLength;

    pdfs.push({ name: file.name, data });
  }

  if (abortSignal?.aborted) {
    throw new Error('Operation cancelled');
  }

  // Merge
  const result = await mergePdfs(pdfs, options, (progress, message, file) => {
    onProgress?.(30 + Math.round(progress * 0.6), message, file);
  });

  if (abortSignal?.aborted) {
    throw new Error('Operation cancelled');
  }

  // Write output
  onProgress?.(90, 'Saving merged PDF...');
  const outputPath = `${outputDir}/${options.outputName}.pdf`;
  await writeFile(outputPath, result.mergedBytes);

  const processingTime = Date.now() - startTime;

  onProgress?.(100, 'Merge complete');

  return {
    inputPath: pendingFiles.map((f) => f.path).join(', '),
    outputPath,
    inputSize: totalInputSize,
    outputSize: result.mergedBytes.byteLength,
    processingTime,
  };
}

/**
 * Validate merge options
 */
export function validateMergeOptions(options: Partial<MergeJobOptions>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.outputName) {
    errors.push('Output name is required');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(options.outputName)) {
    errors.push('Output name contains invalid characters');
  }

  if (options.strategy && !['append', 'interleave', 'by-bookmark'].includes(options.strategy)) {
    errors.push('Invalid merge strategy');
  }

  if (options.bookmarkLevel !== undefined && options.bookmarkLevel < 0) {
    errors.push('Bookmark level must be non-negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get merge preview info
 */
export async function getMergePreview(
  files: Array<{ name: string; data: ArrayBuffer }>
): Promise<{
  totalPages: number;
  totalSize: number;
  fileInfo: Array<{ name: string; pages: number; size: number }>;
}> {
  const fileInfo: Array<{ name: string; pages: number; size: number }> = [];
  let totalPages = 0;
  let totalSize = 0;

  for (const file of files) {
    const doc = await PDFDocument.load(file.data);
    const pages = doc.getPageCount();
    const size = file.data.byteLength;

    fileInfo.push({ name: file.name, pages, size });
    totalPages += pages;
    totalSize += size;
  }

  return { totalPages, totalSize, fileInfo };
}
