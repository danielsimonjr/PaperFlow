import type { AnnotationType, AnnotationRect, AnnotationReply } from './index';

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

export interface DrawingPath {
  points: { x: number; y: number; pressure?: number }[];
}

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

export type AnyAnnotation =
  | HighlightAnnotation
  | NoteAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | StampAnnotation;
