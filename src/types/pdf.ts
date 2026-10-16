/**
 * Document metadata of a PDF: page count, title, author, and similar fields. PDFRenderer.loadDocument never sets creationDate or modificationDate.
 */
export interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Number, size, and rotation of one PDF page.
 */
export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * One text item from a PDF page, with its text, position, size, and font name.
 */
export interface PDFTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

/**
 * One entry of a PDF outline, with its title, target page, and child entries.
 */
export interface PDFOutlineItem {
  title: string;
  pageNumber: number;
  children?: PDFOutlineItem[];
}

/**
 * Page layout of the viewer: single, continuous, or spread.
 */
export type ViewMode = 'single' | 'continuous' | 'spread';

/**
 * Scale and rotation of a page view.
 */
export interface ViewportOptions {
  scale: number;
  rotation: number;
}
