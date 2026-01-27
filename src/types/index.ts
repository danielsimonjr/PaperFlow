export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'drawing'
  | 'shape'
  | 'stamp'
  | 'eraser';

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

// Drawing path for freehand annotations
export interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
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
  // Drawing properties (Sprint 4)
  paths?: DrawingPath[];
  strokeWidth?: number;
  // Shape properties (Sprint 4)
  shapeType?: 'rectangle' | 'ellipse' | 'arrow' | 'line';
  bounds?: AnnotationRect;
  fillColor?: string;
  rotation?: number;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  // Stamp properties (Sprint 4)
  stampType?: 'approved' | 'rejected' | 'confidential' | 'draft' | 'final' | 'for-review' | 'custom';
  position?: { x: number; y: number };
  scale?: number;
  customText?: string;
  backgroundColor?: string;
  borderColor?: string;
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
  isDefault?: boolean;
  isInitials?: boolean;
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
