/**
 * Print Types
 *
 * TypeScript types for print functionality in the Electron main process.
 */

import type { PrinterInfo } from 'electron';

/**
 * Print margins type
 */
export interface PrintMargins {
  marginType?: 'default' | 'none' | 'printableArea' | 'custom';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Page range
 */
export interface PageRange {
  from: number;
  to: number;
}

/**
 * Duplex mode
 */
export type DuplexMode = 'simplex' | 'shortEdge' | 'longEdge';

/**
 * Print DPI
 */
export interface PrintDPI {
  horizontal: number;
  vertical: number;
}

/**
 * Paper size options
 */
export type PaperSize =
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Ledger'
  | 'A0'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | { width: number; height: number };

/**
 * Print options
 */
export interface PrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
  color?: boolean;
  margins?: PrintMargins;
  landscape?: boolean;
  scaleFactor?: number;
  pagesPerSheet?: number;
  collate?: boolean;
  copies?: number;
  pageRanges?: PageRange[];
  duplexMode?: DuplexMode;
  dpi?: PrintDPI;
  header?: string;
  footer?: string;
  pageSize?: PaperSize;
}

/**
 * Print dialog options
 */
export interface PrintDialogOptions extends PrintOptions {
  showDialog?: boolean;
}

/**
 * Print dialog result
 */
export interface PrintDialogResult {
  success: boolean;
  error?: string;
  jobId?: number;
}

/**
 * Print job status
 */
export type PrintJobStatus =
  | 'pending'
  | 'printing'
  | 'completed'
  | 'cancelled'
  | 'error';

/**
 * Print job
 */
export interface PrintJob {
  id: number;
  status: PrintJobStatus;
  startTime: number;
  endTime?: number;
  options: PrintOptions;
  error?: string;
  printerName?: string;
  documentName?: string;
  pagesPrinted?: number;
  totalPages?: number;
}

/**
 * Printer capabilities
 */
export interface PrinterCapabilities {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  status: PrinterStatus;
  paperSizes: PaperSizeInfo[];
  colorCapable: boolean;
  duplexCapable: boolean;
  maxCopies: number;
  maxDPI: PrintDPI;
  supportedMediaTypes: string[];
  isNetworkPrinter: boolean;
  location?: string;
}

/**
 * Printer status
 */
export type PrinterStatus =
  | 'idle'
  | 'printing'
  | 'paused'
  | 'error'
  | 'offline'
  | 'unknown';

/**
 * Paper size info
 */
export interface PaperSizeInfo {
  name: string;
  displayName: string;
  width: number;
  height: number;
  unit: 'mm' | 'inch' | 'points';
}

/**
 * Printer status info
 */
export interface PrinterStatusInfo {
  name: string;
  status: PrinterStatus;
  jobCount: number;
  paperStatus?: 'ok' | 'low' | 'empty' | 'jam';
  inkStatus?: InkStatus[];
  errorMessage?: string;
}

/**
 * Ink status
 */
export interface InkStatus {
  color: string;
  level: number; // 0-100
  type: 'ink' | 'toner';
}

/**
 * Print preset
 */
export interface PrintPreset {
  id: string;
  name: string;
  description?: string;
  options: PrintOptions;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Booklet options
 */
export interface BookletOptions {
  binding: 'left' | 'right' | 'top' | 'bottom';
  sheetsPerSection: number;
  printFoldGuides: boolean;
  gutterWidth: number;
  creep: number;
}

/**
 * N-up layout options
 */
export interface NUpOptions {
  pagesPerSheet: 1 | 2 | 4 | 6 | 9 | 16;
  order: 'horizontal' | 'vertical' | 'horizontalReverse' | 'verticalReverse';
  border: boolean;
}

/**
 * Poster options
 */
export interface PosterOptions {
  tilesWide: number;
  tilesHigh: number;
  overlap: number;
  cutMarks: boolean;
  labelTiles: boolean;
}

/**
 * Imposition result
 */
export interface ImpositionResult {
  pages: ImposedPage[];
  totalSheets: number;
}

/**
 * Imposed page
 */
export interface ImposedPage {
  sheetIndex: number;
  side: 'front' | 'back';
  positions: PagePosition[];
}

/**
 * Page position
 */
export interface PagePosition {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Print queue entry
 */
export interface PrintQueueEntry {
  id: string;
  documentPath: string;
  documentName: string;
  printerName: string;
  options: PrintOptions;
  status: PrintJobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  pagesPrinted: number;
  totalPages: number;
  error?: string;
}

/**
 * Print accessibility options
 */
export interface PrintAccessibilityOptions {
  largePrint: boolean;
  fontSize: number;
  highContrast: boolean;
  textOnly: boolean;
  lineSpacing: number;
}

/**
 * Virtual printer options
 */
export interface VirtualPrinterOptions {
  outputPath: string;
  fileNamePattern: string;
  overwriteExisting: boolean;
  openAfterSave: boolean;
}

/**
 * Color management options
 */
export interface ColorManagementOptions {
  colorProfile?: string;
  renderingIntent: 'perceptual' | 'relative' | 'saturation' | 'absolute';
  blackPointCompensation: boolean;
}

/**
 * Extended printer info
 */
export interface ExtendedPrinterInfo extends PrinterInfo {
  capabilities?: PrinterCapabilities;
  statusInfo?: PrinterStatusInfo;
}
