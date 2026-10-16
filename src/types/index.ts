/**
 * Kind of annotation or annotation tool, including the eraser.
 */
export type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'drawing'
  | 'shape'
  | 'stamp'
  | 'eraser';

/**
 * A rectangle with an origin and a size, used for annotation bounds.
 */
export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A reply to an annotation note, with its author and text.
 */
export interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

// Drawing path for freehand annotations
/**
 * A freehand stroke, given as points that may carry pressure values.
 */
export interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
}

/**
 * A user annotation on one page, with optional fields for each annotation kind.
 */
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

/**
 * A PDF document record, with its page count, view state, and modified flag.
 */
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

/**
 * A signature, made by drawing, typing, or using an image.
 */
export interface Signature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string;
  createdAt: Date;
  isDefault?: boolean;
  isInitials?: boolean;
}

/**
 * A simple form field record, with a string or boolean value.
 */
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

/**
 * A record of one action with the state before it and the state after it.
 * `historyStore` does not use this type: it declares its own `HistoryEntry` with undo and redo functions.
 */
export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  before: unknown;
  after: unknown;
}
