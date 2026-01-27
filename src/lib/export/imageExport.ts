import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type ImageFormat = 'png' | 'jpeg';
export type ImageDpi = 72 | 150 | 300;

export interface ImageExportOptions {
  format: ImageFormat;
  dpi: ImageDpi;
  quality: number; // 0.6 to 1.0 for JPEG
  pageNumbers: number[]; // 1-based page numbers
  includeAnnotations?: boolean;
}

/** Minimal renderer interface for image export (compatible with PDFRenderer). */
export interface PageRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPage: (pageNumber: number) => Promise<any>;
}

/**
 * Calculate the scale factor to achieve the target DPI.
 * PDF pages are at 72 DPI by default.
 */
export function dpiToScale(dpi: ImageDpi): number {
  return dpi / 72;
}

/**
 * Render a single page to a canvas at the specified DPI.
 */
export async function renderPageToCanvas(
  renderer: PageRenderer,
  pageNumber: number,
  dpi: ImageDpi
): Promise<HTMLCanvasElement> {
  const scale = dpiToScale(dpi);
  const page = await renderer.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

/**
 * Convert a canvas to a Blob of the specified format.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const q = format === 'jpeg' ? quality : undefined;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      q
    );
  });
}

/**
 * Export a single page as an image and trigger download.
 */
export async function exportSinglePage(
  renderer: PageRenderer,
  pageNumber: number,
  options: ImageExportOptions,
  fileName: string
): Promise<void> {
  const canvas = await renderPageToCanvas(renderer, pageNumber, options.dpi);
  const blob = await canvasToBlob(canvas, options.format, options.quality);
  const ext = options.format === 'png' ? 'png' : 'jpg';
  saveAs(blob, `${fileName}_page${pageNumber}.${ext}`);
}

/**
 * Export multiple pages as a ZIP file.
 */
export async function exportPagesAsZip(
  renderer: PageRenderer,
  options: ImageExportOptions,
  fileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const ext = options.format === 'png' ? 'png' : 'jpg';

  for (let i = 0; i < options.pageNumbers.length; i++) {
    const pageNumber = options.pageNumbers[i]!;
    const canvas = await renderPageToCanvas(renderer, pageNumber, options.dpi);
    const blob = await canvasToBlob(canvas, options.format, options.quality);

    zip.file(`${fileName}_page${pageNumber}.${ext}`, blob);

    onProgress?.(i + 1, options.pageNumbers.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${fileName}_images.zip`);
}
