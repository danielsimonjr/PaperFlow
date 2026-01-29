import type { PageRenderer } from '@lib/export/imageExport';
import type { Annotation } from '@/types';
import type { FormField } from '@/types/forms';

export interface PrintRenderOptions {
  includeAnnotations: boolean;
  includeFormFields: boolean;
  scale: number;
  annotations?: Annotation[];
  formFields?: FormField[];
}

/**
 * Render annotations onto a canvas context for printing.
 */
function renderAnnotationsForPrint(
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

            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.stroke();

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

          const stampWidth = 100 * stampScale;
          const stampHeight = 30 * stampScale;
          context.fillRect(x - stampWidth / 2, y - stampHeight / 2, stampWidth, stampHeight);
          context.strokeRect(x - stampWidth / 2, y - stampHeight / 2, stampWidth, stampHeight);

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
 * Render form field values onto a canvas context for printing.
 */
function renderFormFieldsForPrint(
  context: CanvasRenderingContext2D,
  formFields: FormField[],
  pageIndex: number,
  scale: number,
  pageHeight: number
): void {
  const pageFields = formFields.filter((f) => f.pageIndex === pageIndex);

  for (const field of pageFields) {
    context.save();

    const x = field.bounds.x * scale;
    const y = (pageHeight - field.bounds.y - field.bounds.height) * scale;
    const width = field.bounds.width * scale;
    const height = field.bounds.height * scale;

    switch (field.type) {
      case 'text':
      case 'date':
        if (typeof field.value === 'string' && field.value) {
          context.font = `${12 * scale}px sans-serif`;
          context.fillStyle = '#000000';
          context.textBaseline = 'middle';
          context.fillText(field.value, x + 4 * scale, y + height / 2, width - 8 * scale);
        }
        break;

      case 'number':
        if (field.value !== null && field.value !== undefined) {
          context.font = `${12 * scale}px sans-serif`;
          context.fillStyle = '#000000';
          context.textBaseline = 'middle';
          context.fillText(String(field.value), x + 4 * scale, y + height / 2, width - 8 * scale);
        }
        break;

      case 'checkbox':
        if (field.value === true) {
          context.strokeStyle = '#000000';
          context.lineWidth = 2 * scale;
          context.beginPath();
          context.moveTo(x + 3 * scale, y + height / 2);
          context.lineTo(x + width / 3, y + height - 3 * scale);
          context.lineTo(x + width - 3 * scale, y + 3 * scale);
          context.stroke();
        }
        break;

      case 'radio':
        // Radio value is a string representing the selected option
        if (field.value) {
          context.fillStyle = '#000000';
          context.beginPath();
          context.arc(x + width / 2, y + height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
          context.fill();
        }
        break;

      case 'dropdown':
        if (typeof field.value === 'string' && field.value) {
          context.font = `${12 * scale}px sans-serif`;
          context.fillStyle = '#000000';
          context.textBaseline = 'middle';
          context.fillText(field.value, x + 4 * scale, y + height / 2, width - 8 * scale);
        }
        break;

      case 'signature':
        if (typeof field.value === 'string' && field.value) {
          // Signature is stored as a data URL
          // For print, we just show a placeholder text
          context.font = `italic ${10 * scale}px sans-serif`;
          context.fillStyle = '#666666';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText('[Signed]', x + width / 2, y + height / 2);
        }
        break;
    }

    context.restore();
  }
}

/**
 * Render a PDF page to a canvas for printing.
 */
export async function renderPageForPrint(
  renderer: PageRenderer,
  pageNumber: number,
  options: PrintRenderOptions
): Promise<HTMLCanvasElement> {
  const page = await renderer.getPage(pageNumber);
  const viewport = page.getViewport({ scale: options.scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  // Page height in PDF units (before scale)
  const pageHeight = viewport.height / options.scale;

  // Render annotations if requested
  if (options.includeAnnotations && options.annotations) {
    renderAnnotationsForPrint(context, options.annotations, pageNumber - 1, options.scale, pageHeight);
  }

  // Render form fields if requested
  if (options.includeFormFields && options.formFields) {
    renderFormFieldsForPrint(context, options.formFields, pageNumber - 1, options.scale, pageHeight);
  }

  return canvas;
}

/**
 * Render multiple pages for printing.
 */
export async function renderPagesForPrint(
  renderer: PageRenderer,
  pageNumbers: number[],
  options: PrintRenderOptions,
  onProgress?: (current: number, total: number) => void
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 0; i < pageNumbers.length; i++) {
    const pageNumber = pageNumbers[i]!;
    const canvas = await renderPageForPrint(renderer, pageNumber, options);
    canvases.push(canvas);
    onProgress?.(i + 1, pageNumbers.length);
  }

  return canvases;
}
