import { PDFDocument, PageSizes, degrees } from 'pdf-lib';

export type PageSize = 'letter' | 'a4' | 'legal' | 'match';
export type RotationAngle = 0 | 90 | 180 | 270;

const PAGE_SIZE_MAP: Record<Exclude<PageSize, 'match'>, [number, number]> = {
  letter: PageSizes.Letter,
  a4: PageSizes.A4,
  legal: PageSizes.Legal,
};

/**
 * Delete a single page from the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndex - Zero-based page index to delete
 * @returns The modified PDF bytes
 */
export async function deletePage(
  pdfBytes: ArrayBuffer,
  pageIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (pageCount <= 1) {
    throw new Error('Cannot delete the last page of a document');
  }

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}`);
  }

  pdfDoc.removePage(pageIndex);
  return pdfDoc.save();
}

/**
 * Delete multiple pages from the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndices - Array of zero-based page indices to delete
 * @returns The modified PDF bytes
 */
export async function deletePages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  // Validate we're not deleting all pages
  if (pageIndices.length >= pageCount) {
    throw new Error('Cannot delete all pages from a document');
  }

  // Validate all indices
  for (const index of pageIndices) {
    if (index < 0 || index >= pageCount) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  // Sort indices in descending order to avoid index shifting issues
  const sortedIndices = [...pageIndices].sort((a, b) => b - a);

  // Remove pages from highest index to lowest
  for (const index of sortedIndices) {
    pdfDoc.removePage(index);
  }

  return pdfDoc.save();
}

/**
 * Duplicate a page in the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndex - Zero-based page index to duplicate
 * @param insertAfter - If true, insert after original; if false, insert before
 * @returns The modified PDF bytes
 */
export async function duplicatePage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  insertAfter: boolean = true
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}`);
  }

  // Copy the page
  const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [pageIndex]);

  // Insert at the appropriate position
  const insertIndex = insertAfter ? pageIndex + 1 : pageIndex;
  pdfDoc.insertPage(insertIndex, copiedPage);

  return pdfDoc.save();
}

/**
 * Rotate a page in the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndex - Zero-based page index to rotate
 * @param rotation - Rotation angle in degrees (90, 180, or 270)
 * @returns The modified PDF bytes
 */
export async function rotatePage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  rotation: RotationAngle
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}`);
  }

  const page = pdfDoc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  const newRotation = (currentRotation + rotation) % 360;

  page.setRotation(degrees(newRotation));

  return pdfDoc.save();
}

/**
 * Rotate multiple pages in the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndices - Array of zero-based page indices to rotate
 * @param rotation - Rotation angle in degrees (90, 180, or 270)
 * @returns The modified PDF bytes
 */
export async function rotatePages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[],
  rotation: RotationAngle
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  for (const pageIndex of pageIndices) {
    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(`Invalid page index: ${pageIndex}`);
    }

    const page = pdfDoc.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + rotation) % 360;

    page.setRotation(degrees(newRotation));
  }

  return pdfDoc.save();
}

/**
 * Insert a blank page into the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param insertIndex - Zero-based index where to insert the page
 * @param size - Page size or 'match' to match the size of an adjacent page
 * @returns The modified PDF bytes
 */
export async function insertBlankPage(
  pdfBytes: ArrayBuffer,
  insertIndex: number,
  size: PageSize = 'match'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (insertIndex < 0 || insertIndex > pageCount) {
    throw new Error(`Invalid insert index: ${insertIndex}`);
  }

  let pageSize: [number, number];

  if (size === 'match') {
    // Match the size of an adjacent page
    const referenceIndex = insertIndex > 0 ? insertIndex - 1 : 0;
    if (pageCount > 0) {
      const referencePage = pdfDoc.getPage(referenceIndex);
      const { width, height } = referencePage.getSize();
      pageSize = [width, height];
    } else {
      pageSize = PageSizes.Letter;
    }
  } else {
    pageSize = PAGE_SIZE_MAP[size];
  }

  const blankPage = pdfDoc.insertPage(insertIndex, pageSize);
  // Ensure the page is truly blank (pdf-lib does this by default)
  void blankPage;

  return pdfDoc.save();
}

/**
 * Reorder pages in the PDF document.
 * @param pdfBytes - The original PDF bytes
 * @param newOrder - Array of zero-based page indices in the new order
 * @returns The modified PDF bytes
 */
export async function reorderPages(
  pdfBytes: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  // Validate the new order
  if (newOrder.length !== pageCount) {
    throw new Error(
      `New order must include all pages. Expected ${pageCount} pages, got ${newOrder.length}`
    );
  }

  const sortedOrder = [...newOrder].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrder.length; i++) {
    if (sortedOrder[i] !== i) {
      throw new Error('New order must include each page index exactly once');
    }
  }

  // Create a new document with pages in the new order
  const newPdfDoc = await PDFDocument.create();
  const copiedPages = await newPdfDoc.copyPages(pdfDoc, newOrder);

  for (const page of copiedPages) {
    newPdfDoc.addPage(page);
  }

  // Copy metadata
  copyMetadata(pdfDoc, newPdfDoc);

  return newPdfDoc.save();
}

/**
 * Move a page from one position to another.
 * @param pdfBytes - The original PDF bytes
 * @param fromIndex - Zero-based source page index
 * @param toIndex - Zero-based target page index
 * @returns The modified PDF bytes
 */
export async function movePage(
  pdfBytes: ArrayBuffer,
  fromIndex: number,
  toIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (fromIndex < 0 || fromIndex >= pageCount) {
    throw new Error(`Invalid source page index: ${fromIndex}`);
  }

  if (toIndex < 0 || toIndex >= pageCount) {
    throw new Error(`Invalid target page index: ${toIndex}`);
  }

  if (fromIndex === toIndex) {
    return pdfDoc.save();
  }

  // Create new order array
  const newOrder: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    if (i === fromIndex) continue;
    if (newOrder.length === toIndex) {
      newOrder.push(fromIndex);
    }
    newOrder.push(i);
  }
  if (newOrder.length === toIndex) {
    newOrder.push(fromIndex);
  }

  return reorderPages(pdfBytes, newOrder);
}

/**
 * Move multiple pages to a new position.
 * @param pdfBytes - The original PDF bytes
 * @param pageIndices - Array of zero-based page indices to move
 * @param toIndex - Zero-based target position (where first page will be placed)
 * @returns The modified PDF bytes
 */
export async function movePages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[],
  toIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  // Validate indices
  for (const index of pageIndices) {
    if (index < 0 || index >= pageCount) {
      throw new Error(`Invalid page index: ${index}`);
    }
  }

  if (toIndex < 0 || toIndex > pageCount - pageIndices.length) {
    throw new Error(`Invalid target index: ${toIndex}`);
  }

  // Remove duplicates and sort for processing
  const uniqueIndices = [...new Set(pageIndices)];
  const indicesToMove = new Set(uniqueIndices);

  // Build new order: pages not being moved, then insert moved pages at toIndex
  const remainingPages: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    if (!indicesToMove.has(i)) {
      remainingPages.push(i);
    }
  }

  // Insert moved pages at the target position
  const newOrder = [
    ...remainingPages.slice(0, toIndex),
    ...uniqueIndices,
    ...remainingPages.slice(toIndex),
  ];

  return reorderPages(pdfBytes, newOrder);
}

/**
 * Get page information for all pages.
 * @param pdfBytes - The PDF bytes
 * @returns Array of page information objects
 */
export async function getPageInfo(pdfBytes: ArrayBuffer): Promise<
  Array<{
    index: number;
    width: number;
    height: number;
    rotation: number;
  }>
> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  return pages.map((page, index) => {
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    return {
      index,
      width,
      height,
      rotation,
    };
  });
}

/**
 * Copy metadata from one PDF document to another.
 */
function copyMetadata(source: PDFDocument, target: PDFDocument): void {
  const title = source.getTitle();
  const author = source.getAuthor();
  const subject = source.getSubject();
  const keywords = source.getKeywords();
  const creator = source.getCreator();

  if (title) target.setTitle(title);
  if (author) target.setAuthor(author);
  if (subject) target.setSubject(subject);
  if (keywords) target.setKeywords([keywords]);
  if (creator) target.setCreator(creator);

  target.setProducer('PaperFlow');
}
