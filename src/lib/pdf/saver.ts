import { PDFDocument } from 'pdf-lib';

export interface SaveOptions {
  preserveEditHistory?: boolean;
  flattenAnnotations?: boolean;
  linearize?: boolean;
}

/**
 * Saves the PDF document with any modifications.
 * Currently returns the original PDF bytes as we don't have annotation/edit systems yet.
 * This will be expanded when we implement annotation and editing features.
 */
export async function savePdf(
  originalPdfBytes: ArrayBuffer,
  // Options will be used in future sprints for annotation embedding, etc.
  options: SaveOptions = {}
): Promise<Uint8Array> {
  // Mark options as intentionally unused for now
  void options;

  // Load the original PDF
  const pdfDoc = await PDFDocument.load(originalPdfBytes);

  // In future sprints, we'll add:
  // - Annotation embedding
  // - Text edits
  // - Form field values
  // - Signature embedding

  // Save the PDF
  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
}

/**
 * Creates a copy of the PDF without modifications.
 */
export async function copyPdf(originalPdfBytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  return pdfDoc.save();
}

/**
 * Gets basic information about the PDF structure for debugging.
 */
export async function getPdfInfo(pdfBytes: ArrayBuffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
  };
}
