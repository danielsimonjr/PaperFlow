export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'drawing'
  | 'shape'
  | 'stamp';

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  content?: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: AnnotationReply[];
}

export interface PDFDocument {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  currentPage: number;
  zoom: number;
  rotation: number;
  modified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Signature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string;
  createdAt: Date;
}

export interface FormField {
  id: string;
  pageIndex: number;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date';
  name: string;
  bounds: AnnotationRect;
  value: string | boolean;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  before: unknown;
  after: unknown;
}
