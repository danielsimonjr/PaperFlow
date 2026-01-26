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

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PDFTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

export interface PDFOutlineItem {
  title: string;
  pageNumber: number;
  children?: PDFOutlineItem[];
}

export type ViewMode = 'single' | 'continuous' | 'spread';

export interface ViewportOptions {
  scale: number;
  rotation: number;
}
