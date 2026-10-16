import type { AnnotationRect, AnnotationReply } from './index';

/**
 * A text markup annotation on one page: highlight, underline, or strikethrough.
 */
export interface HighlightAnnotation {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough';
  pageIndex: number;
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  selectedText?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A sticky note on one page, with its content, position, and optional replies.
 */
export interface NoteAnnotation {
  id: string;
  type: 'note';
  pageIndex: number;
  position: { x: number; y: number };
  content: string;
  color: string;
  isCollapsed: boolean;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: AnnotationReply[];
}

/**
 * A freehand drawing on one page, made of one or more paths.
 */
export interface DrawingAnnotation {
  id: string;
  type: 'drawing';
  pageIndex: number;
  paths: DrawingPath[];
  color: string;
  strokeWidth: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One stroke of a drawing, as a list of points with optional pressure.
 */
export interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
}

/**
 * A shape on one page: rectangle, circle, arrow, or line, with its bounds.
 */
export interface ShapeAnnotation {
  id: string;
  type: 'shape';
  pageIndex: number;
  shapeType: 'rectangle' | 'circle' | 'arrow' | 'line';
  bounds: AnnotationRect;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A stamp on one page, with its kind, position, scale, rotation, and optional custom text.
 */
export interface StampAnnotation {
  id: string;
  type: 'stamp';
  pageIndex: number;
  stampType: 'approved' | 'rejected' | 'confidential' | 'draft' | 'custom';
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  customText?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Any one of the annotation kinds that this file defines.
 */
export type AnyAnnotation =
  | HighlightAnnotation
  | NoteAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | StampAnnotation;
