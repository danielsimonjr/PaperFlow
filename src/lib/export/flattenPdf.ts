import { PDFDocument } from 'pdf-lib';
import type { Annotation } from '@/types';
import type { FormField } from '@/types';
import { exportPdf } from './pdfExport';

export interface FlattenOptions {
  flattenAnnotations?: boolean;
  flattenFormFields?: boolean;
}

/**
 * Flatten a PDF by permanently embedding annotations and form field values
 * into the page content. After flattening, these elements cannot be edited.
 */
export async function flattenPdf(
  pdfBytes: ArrayBuffer,
  options: FlattenOptions = {},
  annotations: Annotation[] = [],
  formFields: FormField[] = []
): Promise<Uint8Array> {
  const {
    flattenAnnotations = true,
    flattenFormFields = true,
  } = options;

  // First export with all modifications drawn onto pages
  const exportedBytes = await exportPdf(
    pdfBytes,
    {
      includeAnnotations: flattenAnnotations,
      includeFormData: flattenFormFields,
      flatten: true,
    },
    annotations,
    formFields
  );

  // Load the exported PDF and remove any interactive elements
  const pdfDoc = await PDFDocument.load(exportedBytes);
  const form = pdfDoc.getForm();

  if (flattenFormFields) {
    try {
      form.flatten();
    } catch {
      // Form may not have fields, which is fine
    }
  }

  return pdfDoc.save();
}
