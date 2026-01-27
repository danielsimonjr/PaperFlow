import { PDFDocument, rgb, degrees } from 'pdf-lib';
import type { PlacedSignature } from '@stores/signatureStore';
import { formatDate } from '@lib/signatures/dateUtils';

/**
 * Embed a single signature into a PDF page
 */
async function embedSignature(pdfDoc: PDFDocument, signature: PlacedSignature): Promise<void> {
  const pages = pdfDoc.getPages();
  const page = pages[signature.pageIndex];

  if (!page) {
    console.warn(`Page ${signature.pageIndex} not found in PDF`);
    return;
  }

  // Get page dimensions
  const { height: pageHeight } = page.getSize();

  // Extract base64 image data
  const base64Data = signature.signatureData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  // Embed the signature image
  let image;
  try {
    // Try PNG first
    image = await pdfDoc.embedPng(Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)));
  } catch {
    try {
      // Fall back to JPEG
      image = await pdfDoc.embedJpg(Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)));
    } catch (error) {
      console.error('Failed to embed signature image:', error);
      return;
    }
  }

  // Calculate position (PDF uses bottom-left origin)
  const x = signature.position.x;
  const y = pageHeight - signature.position.y - signature.size.height;

  // Draw the signature with rotation if needed
  if (signature.rotation !== 0) {
    page.drawImage(image, {
      x,
      y,
      width: signature.size.width,
      height: signature.size.height,
      rotate: degrees(-signature.rotation),
    });
  } else {
    // Draw without rotation
    page.drawImage(image, {
      x,
      y,
      width: signature.size.width,
      height: signature.size.height,
    });
  }

  // Add date stamp if enabled
  if (signature.dateStamp?.enabled) {
    const dateText = formatDate(signature.createdAt, signature.dateStamp.format as 'short' | 'medium' | 'long' | 'iso');
    const fontSize = 10;

    let dateX = x;
    let dateY = y - fontSize - 2;

    switch (signature.dateStamp.position) {
      case 'right':
        dateX = x + signature.size.width + 5;
        dateY = y + signature.size.height / 2 - fontSize / 2;
        break;
      case 'left':
        dateX = x - 80;
        dateY = y + signature.size.height / 2 - fontSize / 2;
        break;
      case 'below':
      default:
        dateX = x + (signature.size.width - dateText.length * 5) / 2;
        dateY = y - fontSize - 5;
        break;
    }

    page.drawText(dateText, {
      x: dateX,
      y: dateY,
      size: fontSize,
      color: rgb(0.22, 0.25, 0.29),
    });
  }
}

/**
 * Embed all placed signatures into a PDF
 */
export async function embedSignaturesInPdf(pdfBytes: ArrayBuffer, signatures: PlacedSignature[]): Promise<Uint8Array> {
  if (signatures.length === 0) {
    return new Uint8Array(pdfBytes);
  }

  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Sort signatures by page for efficient processing
  const sortedSignatures = [...signatures].sort((a, b) => a.pageIndex - b.pageIndex);

  // Embed each signature
  for (const signature of sortedSignatures) {
    try {
      await embedSignature(pdfDoc, signature);
    } catch (error) {
      console.error(`Failed to embed signature ${signature.id}:`, error);
    }
  }

  // Save and return the modified PDF
  return pdfDoc.save();
}

/**
 * Check if a PDF already contains embedded signatures at specific positions
 */
export function hasExistingSignatures(): boolean {
  // In a full implementation, we would parse the PDF to check for
  // existing signature annotations or images at signature field locations
  return false;
}

/**
 * Get signature field positions from a PDF
 */
export async function getSignatureFieldPositions(
  pdfBytes: ArrayBuffer
): Promise<
  Array<{
    pageIndex: number;
    bounds: { x: number; y: number; width: number; height: number };
    fieldName: string;
  }>
> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const signatureFields: Array<{
    pageIndex: number;
    bounds: { x: number; y: number; width: number; height: number };
    fieldName: string;
  }> = [];

  for (const field of fields) {
    // Check if this looks like a signature field based on name
    const name = field.getName();
    if (name.toLowerCase().includes('signature') || name.toLowerCase().includes('sign') || name.toLowerCase().includes('sig')) {
      // Get field widgets to find position
      const widgets = field.acroField.getWidgets();
      for (const widget of widgets) {
        const rect = widget.getRectangle();
        const pageRef = widget.P();

        // Find page index
        const pages = pdfDoc.getPages();
        let pageIndex = 0;
        for (let i = 0; i < pages.length; i++) {
          if (pages[i]?.ref === pageRef) {
            pageIndex = i;
            break;
          }
        }

        const page = pages[pageIndex];
        const pageHeight = page?.getHeight() ?? 0;

        signatureFields.push({
          pageIndex,
          bounds: {
            x: rect.x,
            y: pageHeight - rect.y - rect.height, // Convert to top-left origin
            width: rect.width,
            height: rect.height,
          },
          fieldName: name,
        });
      }
    }
  }

  return signatureFields;
}
