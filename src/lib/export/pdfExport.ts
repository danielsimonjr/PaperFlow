import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Annotation } from '@/types';
import type { FormField } from '@/types';

export interface PdfExportOptions {
  includeAnnotations?: boolean;
  includeFormData?: boolean;
  includeTextEdits?: boolean;
  flatten?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return { r, g, b };
}

export async function exportPdf(
  pdfBytes: ArrayBuffer,
  options: PdfExportOptions = {},
  annotations: Annotation[] = [],
  formFields: FormField[] = []
): Promise<Uint8Array> {
  const {
    includeAnnotations = true,
    includeFormData = true,
    flatten = false,
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (includeAnnotations && annotations.length > 0) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const annotation of annotations) {
      const page = pages[annotation.pageIndex];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();

      if (annotation.type === 'highlight' || annotation.type === 'underline' || annotation.type === 'strikethrough') {
        const color = hexToRgb(annotation.color);

        for (const rect of annotation.rects) {
          if (annotation.type === 'highlight') {
            page.drawRectangle({
              x: rect.x,
              y: pageHeight - rect.y - rect.height,
              width: rect.width,
              height: rect.height,
              color: rgb(color.r, color.g, color.b),
              opacity: annotation.opacity * 0.4,
            });
          } else if (annotation.type === 'underline') {
            page.drawLine({
              start: { x: rect.x, y: pageHeight - rect.y - rect.height },
              end: { x: rect.x + rect.width, y: pageHeight - rect.y - rect.height },
              thickness: 1,
              color: rgb(color.r, color.g, color.b),
              opacity: annotation.opacity,
            });
          } else if (annotation.type === 'strikethrough') {
            const midY = pageHeight - rect.y - rect.height / 2;
            page.drawLine({
              start: { x: rect.x, y: midY },
              end: { x: rect.x + rect.width, y: midY },
              thickness: 1,
              color: rgb(color.r, color.g, color.b),
              opacity: annotation.opacity,
            });
          }
        }
      }

      if (annotation.type === 'note' && annotation.content) {
        const noteX = annotation.rects[0]?.x ?? 0;
        const noteY = pageHeight - (annotation.rects[0]?.y ?? 0) - 20;

        page.drawSquare({
          x: noteX,
          y: noteY,
          size: 16,
          color: rgb(1, 0.92, 0.23),
          borderColor: rgb(0.8, 0.7, 0),
          borderWidth: 1,
        });

        if (flatten && annotation.content) {
          page.drawText(annotation.content, {
            x: noteX + 20,
            y: noteY,
            size: 8,
            font,
            color: rgb(0, 0, 0),
            maxWidth: 200,
          });
        }
      }

      if (annotation.type === 'shape' && annotation.bounds) {
        const color = hexToRgb(annotation.color);
        const bounds = annotation.bounds;
        const y = pageHeight - bounds.y - bounds.height;

        if (annotation.shapeType === 'rectangle') {
          page.drawRectangle({
            x: bounds.x,
            y,
            width: bounds.width,
            height: bounds.height,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth ?? 2,
            opacity: annotation.opacity,
          });
        } else if (annotation.shapeType === 'ellipse') {
          page.drawEllipse({
            x: bounds.x + bounds.width / 2,
            y: y + bounds.height / 2,
            xScale: bounds.width / 2,
            yScale: bounds.height / 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: annotation.strokeWidth ?? 2,
            opacity: annotation.opacity,
          });
        }
      }
    }
  }

  if (includeFormData && formFields.length > 0) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const field of formFields) {
      const page = pages[field.pageIndex];
      if (!page) continue;

      const { height: pageHeight } = page.getSize();

      if (field.type === 'text' && typeof field.value === 'string' && field.value) {
        page.drawText(field.value, {
          x: field.bounds.x + 2,
          y: pageHeight - field.bounds.y - field.bounds.height + 4,
          size: 10,
          font,
          color: rgb(0, 0, 0),
          maxWidth: field.bounds.width - 4,
        });
      } else if (field.type === 'checkbox' && field.value === true) {
        const centerX = field.bounds.x + field.bounds.width / 2;
        const centerY = pageHeight - field.bounds.y - field.bounds.height / 2;
        page.drawText('\u2713', {
          x: centerX - 4,
          y: centerY - 4,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }
  }

  return pdfDoc.save();
}
