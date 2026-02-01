/**
 * Batch Processing Types
 * Type definitions for batch operations.
 */

/**
 * Page range specification
 */
export interface PageRange {
  type: 'all' | 'even' | 'odd' | 'custom';
  pages?: number[]; // For custom range
  start?: number;
  end?: number;
}

/**
 * Position on page
 */
export type PositionPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Custom position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Font configuration
 */
export interface FontConfig {
  family: string;
  size: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Default font config
 */
export const DEFAULT_FONT_CONFIG: FontConfig = {
  family: 'Helvetica',
  size: 12,
  color: '#000000',
  bold: false,
  italic: false,
};

/**
 * Margins configuration
 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Default margins
 */
export const DEFAULT_MARGINS: Margins = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
};

/**
 * Watermark type
 */
export type WatermarkType = 'text' | 'image';

/**
 * Watermark position type
 */
export interface WatermarkPosition {
  preset?: PositionPreset;
  custom?: Position;
  tile?: boolean;
  tileSpacing?: number;
}

/**
 * Watermark options
 */
export interface WatermarkOptions {
  type: WatermarkType;
  content: string; // Text or base64 image data
  position: WatermarkPosition;
  opacity: number; // 0-1
  rotation: number; // degrees
  scale: number; // 1 = 100%
  layer: 'over' | 'under';
  pages: PageRange;
  font?: FontConfig;
}

/**
 * Default watermark options
 */
export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  type: 'text',
  content: 'DRAFT',
  position: { preset: 'center' },
  opacity: 0.3,
  rotation: -45,
  scale: 1,
  layer: 'over',
  pages: { type: 'all' },
  font: {
    family: 'Helvetica',
    size: 72,
    color: '#888888',
    bold: true,
  },
};

/**
 * Watermark template
 */
export interface WatermarkTemplate {
  id: string;
  name: string;
  options: WatermarkOptions;
}

/**
 * Built-in watermark templates
 */
export const WATERMARK_TEMPLATES: WatermarkTemplate[] = [
  {
    id: 'draft',
    name: 'DRAFT',
    options: {
      ...DEFAULT_WATERMARK_OPTIONS,
      content: 'DRAFT',
    },
  },
  {
    id: 'confidential',
    name: 'CONFIDENTIAL',
    options: {
      ...DEFAULT_WATERMARK_OPTIONS,
      content: 'CONFIDENTIAL',
      font: { ...DEFAULT_WATERMARK_OPTIONS.font!, color: '#cc0000' },
    },
  },
  {
    id: 'copy',
    name: 'COPY',
    options: {
      ...DEFAULT_WATERMARK_OPTIONS,
      content: 'COPY',
    },
  },
  {
    id: 'sample',
    name: 'SAMPLE',
    options: {
      ...DEFAULT_WATERMARK_OPTIONS,
      content: 'SAMPLE',
    },
  },
];

/**
 * Header/Footer section content
 */
export interface HeaderFooterSection {
  left?: string;
  center?: string;
  right?: string;
}

/**
 * Header/Footer options
 */
export interface HeaderFooterOptions {
  header?: HeaderFooterSection;
  footer?: HeaderFooterSection;
  font: FontConfig;
  margins: Margins;
  startPage: number; // 1-indexed
  pages: PageRange;
}

/**
 * Default header/footer options
 */
export const DEFAULT_HEADER_FOOTER_OPTIONS: HeaderFooterOptions = {
  font: { ...DEFAULT_FONT_CONFIG, size: 10 },
  margins: { ...DEFAULT_MARGINS },
  startPage: 1,
  pages: { type: 'all' },
};

/**
 * Page number format
 */
export type PageNumberFormat = 'arabic' | 'roman-lower' | 'roman-upper' | 'letter-lower' | 'letter-upper';

/**
 * Available variables for header/footer
 */
export const HEADER_FOOTER_VARIABLES = [
  { name: 'page', description: 'Current page number', example: '{{page}}' },
  { name: 'total', description: 'Total page count', example: '{{total}}' },
  { name: 'date', description: 'Current date', example: '{{date}}' },
  { name: 'time', description: 'Current time', example: '{{time}}' },
  { name: 'filename', description: 'Document filename', example: '{{filename}}' },
  { name: 'author', description: 'Document author', example: '{{author}}' },
];

/**
 * Batch operation type
 */
export type BatchOperationType = 'watermark' | 'header-footer' | 'bates-number' | 'flatten';

/**
 * Batch operation status
 */
export type BatchOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Batch operation
 */
export interface BatchOperation {
  id: string;
  type: BatchOperationType;
  options: WatermarkOptions | HeaderFooterOptions | Record<string, unknown>;
  status: BatchOperationStatus;
  progress: number; // 0-100
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Batch progress
 */
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number; // milliseconds
}

/**
 * Batch result
 */
export interface BatchResult {
  operationId: string;
  success: boolean;
  error?: string;
  outputPath?: string;
  processingTime: number;
}
