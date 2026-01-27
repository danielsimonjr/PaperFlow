import { PDFDocument } from 'pdf-lib';

export interface SignatureFieldInfo {
  pageIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
  fieldName: string;
}

/**
 * Detect signature form fields in a PDF document.
 * Returns positions and dimensions of signature fields.
 */
export async function detectSignatureFields(pdfBytes: ArrayBuffer): Promise<SignatureFieldInfo[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const signatureFields: SignatureFieldInfo[] = [];

  for (const field of fields) {
    // Check if this looks like a signature field based on name
    const name = field.getName();
    const isSignatureField =
      name.toLowerCase().includes('signature') || name.toLowerCase().includes('sign') || name.toLowerCase().includes('sig');

    if (!isSignatureField) continue;

    // Get field widgets to find position
    try {
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
    } catch {
      // Skip fields that can't be processed
      continue;
    }
  }

  return signatureFields;
}

/**
 * Find the nearest signature field to a given position on a page.
 * Returns null if no field is within the snap threshold.
 */
export function findNearestSignatureField(
  position: { x: number; y: number },
  pageIndex: number,
  fields: SignatureFieldInfo[],
  snapThreshold: number = 50
): SignatureFieldInfo | null {
  const pageFields = fields.filter((f) => f.pageIndex === pageIndex);

  let nearestField: SignatureFieldInfo | null = null;
  let nearestDistance = Infinity;

  for (const field of pageFields) {
    // Calculate center of field
    const fieldCenterX = field.bounds.x + field.bounds.width / 2;
    const fieldCenterY = field.bounds.y + field.bounds.height / 2;

    // Calculate distance
    const dx = position.x - fieldCenterX;
    const dy = position.y - fieldCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance && distance < snapThreshold) {
      nearestDistance = distance;
      nearestField = field;
    }
  }

  return nearestField;
}

/**
 * Align a signature position and size to a signature field.
 * Returns the adjusted position and size to fit within the field bounds.
 */
export function alignToField(
  signatureSize: { width: number; height: number },
  field: SignatureFieldInfo,
  padding: number = 5
): { position: { x: number; y: number }; size: { width: number; height: number } } {
  const availableWidth = field.bounds.width - padding * 2;
  const availableHeight = field.bounds.height - padding * 2;

  // Calculate scale to fit signature in field while maintaining aspect ratio
  const aspectRatio = signatureSize.width / signatureSize.height;
  let newWidth: number;
  let newHeight: number;

  if (availableWidth / availableHeight > aspectRatio) {
    // Field is wider - fit by height
    newHeight = availableHeight;
    newWidth = newHeight * aspectRatio;
  } else {
    // Field is taller - fit by width
    newWidth = availableWidth;
    newHeight = newWidth / aspectRatio;
  }

  // Center in field
  const offsetX = (field.bounds.width - newWidth) / 2;
  const offsetY = (field.bounds.height - newHeight) / 2;

  return {
    position: {
      x: field.bounds.x + offsetX,
      y: field.bounds.y + offsetY,
    },
    size: {
      width: newWidth,
      height: newHeight,
    },
  };
}

/**
 * Check if a position is inside a signature field.
 */
export function isInsideField(position: { x: number; y: number }, field: SignatureFieldInfo): boolean {
  return (
    position.x >= field.bounds.x &&
    position.x <= field.bounds.x + field.bounds.width &&
    position.y >= field.bounds.y &&
    position.y <= field.bounds.y + field.bounds.height
  );
}
