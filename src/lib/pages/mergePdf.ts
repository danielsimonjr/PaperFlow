import { PDFDocument } from 'pdf-lib';

export interface MergeFile {
  name: string;
  data: ArrayBuffer;
}

export interface MergeProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  percentComplete: number;
}

export type MergeProgressCallback = (progress: MergeProgress) => void;

/**
 * Merge multiple PDF files into a single document.
 * @param files - Array of PDF files to merge
 * @param onProgress - Optional callback for progress updates
 * @returns The merged PDF bytes
 */
export async function mergePdfs(
  files: MergeFile[],
  onProgress?: MergeProgressCallback
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('At least one PDF file is required for merging');
  }

  if (files.length === 1) {
    // Just return the single file
    const pdfDoc = await PDFDocument.load(files[0]!.data);
    return pdfDoc.save();
  }

  // Create a new document for the merged result
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;

    // Report progress
    if (onProgress) {
      onProgress({
        currentFile: i + 1,
        totalFiles: files.length,
        currentFileName: file.name,
        percentComplete: Math.round((i / files.length) * 100),
      });
    }

    try {
      // Load the source PDF
      const sourcePdf = await PDFDocument.load(file.data);
      const pageCount = sourcePdf.getPageCount();

      // Copy all pages from the source to the merged document
      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        Array.from({ length: pageCount }, (_, i) => i)
      );

      // Add all copied pages
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (error) {
      throw new Error(
        `Failed to merge file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Report completion
  if (onProgress) {
    onProgress({
      currentFile: files.length,
      totalFiles: files.length,
      currentFileName: 'Complete',
      percentComplete: 100,
    });
  }

  // Set metadata on merged document
  mergedPdf.setProducer('PaperFlow');
  mergedPdf.setCreationDate(new Date());

  return mergedPdf.save();
}

/**
 * Merge PDFs with specific page selections from each file.
 * @param files - Array of objects containing PDF data and page selections
 * @param onProgress - Optional callback for progress updates
 * @returns The merged PDF bytes
 */
export async function mergePdfsWithSelection(
  files: Array<{
    name: string;
    data: ArrayBuffer;
    pageIndices: number[]; // Zero-based page indices to include
  }>,
  onProgress?: MergeProgressCallback
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('At least one PDF file is required for merging');
  }

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;

    if (onProgress) {
      onProgress({
        currentFile: i + 1,
        totalFiles: files.length,
        currentFileName: file.name,
        percentComplete: Math.round((i / files.length) * 100),
      });
    }

    try {
      const sourcePdf = await PDFDocument.load(file.data);
      const pageCount = sourcePdf.getPageCount();

      // Validate page indices
      for (const pageIndex of file.pageIndices) {
        if (pageIndex < 0 || pageIndex >= pageCount) {
          throw new Error(
            `Invalid page index ${pageIndex} for file "${file.name}" (has ${pageCount} pages)`
          );
        }
      }

      // Copy selected pages
      const copiedPages = await mergedPdf.copyPages(sourcePdf, file.pageIndices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (error) {
      throw new Error(
        `Failed to process file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  if (onProgress) {
    onProgress({
      currentFile: files.length,
      totalFiles: files.length,
      currentFileName: 'Complete',
      percentComplete: 100,
    });
  }

  mergedPdf.setProducer('PaperFlow');
  mergedPdf.setCreationDate(new Date());

  return mergedPdf.save();
}

/**
 * Get page count for a PDF file without fully loading it.
 * @param data - The PDF bytes
 * @returns The number of pages
 */
export async function getPdfPageCount(data: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(data);
  return pdfDoc.getPageCount();
}

/**
 * Validate that a file is a valid PDF.
 * @param data - The file bytes
 * @returns True if valid PDF, false otherwise
 */
export async function isValidPdf(data: ArrayBuffer): Promise<boolean> {
  try {
    await PDFDocument.load(data);
    return true;
  } catch {
    return false;
  }
}
