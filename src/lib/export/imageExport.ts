import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Annotation } from '@/types';

export type ImageFormat = 'png' | 'jpeg';
export type ImageDpi = 72 | 150 | 300;

export interface ImageExportOptions {
  format: ImageFormat;
  dpi: ImageDpi;
  quality: number; // 0.6 to 1.0 for JPEG
  pageNumbers: number[]; // 1-based page numbers
  includeAnnotations?: boolean;
  annotations?: Annotation[];
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
 * Render annotations onto a canvas context.
 * Converts PDF coordinates (origin bottom-left) to canvas coordinates (origin top-left).
 */
function renderAnnotationsToCanvas(
  context: CanvasRenderingContext2D,
  annotations: Annotation[],
  pageIndex: number,
  scale: number,
  pageHeight: number
): void {
  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  for (const annotation of pageAnnotations) {
    context.save();
    context.globalAlpha = annotation.opacity;

    switch (annotation.type) {
      case 'highlight':
      case 'underline':
      case 'strikethrough':
        context.fillStyle = annotation.color;
        for (const rect of annotation.rects) {
          // Convert PDF coordinates to canvas coordinates
          const x = rect.x * scale;
          const y = (pageHeight - rect.y - rect.height) * scale;
          const width = rect.width * scale;
          const height = rect.height * scale;

          if (annotation.type === 'highlight') {
            context.fillRect(x, y, width, height);
          } else if (annotation.type === 'underline') {
            context.fillRect(x, y + height - 2 * scale, width, 2 * scale);
          } else if (annotation.type === 'strikethrough') {
            context.fillRect(x, y + height / 2 - scale, width, 2 * scale);
          }
        }
        break;

      case 'note':
        // Render note icon if position available
        if (annotation.rects.length > 0) {
          const rect = annotation.rects[0]!;
          const x = rect.x * scale;
          const y = (pageHeight - rect.y - rect.height) * scale;
          context.fillStyle = annotation.color;
          context.beginPath();
          context.arc(x + 10 * scale, y + 10 * scale, 8 * scale, 0, Math.PI * 2);
          context.fill();
        }
        break;

      case 'shape':
        if (annotation.bounds) {
          const bounds = annotation.bounds;
          const x = bounds.x * scale;
          const y = (pageHeight - bounds.y - bounds.height) * scale;
          const width = bounds.width * scale;
          const height = bounds.height * scale;

          context.strokeStyle = annotation.color;
          context.lineWidth = (annotation.strokeWidth || 2) * scale;
          if (annotation.fillColor) {
            context.fillStyle = annotation.fillColor;
          }

          if (annotation.shapeType === 'rectangle') {
            if (annotation.fillColor) context.fillRect(x, y, width, height);
            context.strokeRect(x, y, width, height);
          } else if (annotation.shapeType === 'ellipse') {
            context.beginPath();
            context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
            if (annotation.fillColor) context.fill();
            context.stroke();
          } else if (annotation.shapeType === 'line' && annotation.startPoint && annotation.endPoint) {
            context.beginPath();
            context.moveTo(annotation.startPoint.x * scale, (pageHeight - annotation.startPoint.y) * scale);
            context.lineTo(annotation.endPoint.x * scale, (pageHeight - annotation.endPoint.y) * scale);
            context.stroke();
          } else if (annotation.shapeType === 'arrow' && annotation.startPoint && annotation.endPoint) {
            const startX = annotation.startPoint.x * scale;
            const startY = (pageHeight - annotation.startPoint.y) * scale;
            const endX = annotation.endPoint.x * scale;
            const endY = (pageHeight - annotation.endPoint.y) * scale;

            // Draw line
            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.stroke();

            // Draw arrowhead
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowSize = 10 * scale;
            context.beginPath();
            context.moveTo(endX, endY);
            context.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
            context.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
            context.closePath();
            context.fill();
          }
        }
        break;

      case 'drawing':
        if (annotation.paths) {
          context.strokeStyle = annotation.color;
          context.lineWidth = (annotation.strokeWidth || 2) * scale;
          context.lineCap = 'round';
          context.lineJoin = 'round';

          for (const path of annotation.paths) {
            if (path.points.length < 2) continue;
            context.beginPath();
            const firstPoint = path.points[0]!;
            context.moveTo(firstPoint.x * scale, (pageHeight - firstPoint.y) * scale);
            for (let i = 1; i < path.points.length; i++) {
              const point = path.points[i]!;
              context.lineTo(point.x * scale, (pageHeight - point.y) * scale);
            }
            context.stroke();
          }
        }
        break;

      case 'stamp':
        if (annotation.position) {
          const x = annotation.position.x * scale;
          const y = (pageHeight - annotation.position.y) * scale;
          const stampScale = (annotation.scale || 1) * scale;

          context.fillStyle = annotation.backgroundColor || annotation.color;
          context.strokeStyle = annotation.borderColor || annotation.color;
          context.lineWidth = 2 * stampScale;

          // Draw stamp background
          const stampWidth = 100 * stampScale;
          const stampHeight = 30 * stampScale;
          context.fillRect(x - stampWidth / 2, y - stampHeight / 2, stampWidth, stampHeight);
          context.strokeRect(x - stampWidth / 2, y - stampHeight / 2, stampWidth, stampHeight);

          // Draw stamp text
          context.fillStyle = annotation.color;
          context.font = `bold ${14 * stampScale}px sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          const text = annotation.customText || annotation.stampType?.toUpperCase() || 'STAMP';
          context.fillText(text, x, y);
        }
        break;
    }

    context.restore();
  }
}

/**
 * Render a single page to a canvas at the specified DPI.
 */
export async function renderPageToCanvas(
  renderer: PageRenderer,
  pageNumber: number,
  dpi: ImageDpi,
  annotations?: Annotation[]
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

  // Render annotations if provided
  if (annotations && annotations.length > 0) {
    // Page height in PDF units (before scale)
    const pageHeight = viewport.height / scale;
    renderAnnotationsToCanvas(context, annotations, pageNumber - 1, scale, pageHeight);
  }

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
  const annotations = options.includeAnnotations ? options.annotations : undefined;
  const canvas = await renderPageToCanvas(renderer, pageNumber, options.dpi, annotations);
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
  const annotations = options.includeAnnotations ? options.annotations : undefined;

  for (let i = 0; i < options.pageNumbers.length; i++) {
    const pageNumber = options.pageNumbers[i]!;
    const canvas = await renderPageToCanvas(renderer, pageNumber, options.dpi, annotations);
    const blob = await canvasToBlob(canvas, options.format, options.quality);

    zip.file(`${fileName}_page${pageNumber}.${ext}`, blob);

    onProgress?.(i + 1, options.pageNumbers.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${fileName}_images.zip`);
}
