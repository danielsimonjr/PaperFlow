/**
 * Comparison Types
 * Type definitions for document comparison functionality.
 */

/**
 * Bounding box for change location
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Types of text changes
 */
export type ChangeType = 'added' | 'removed' | 'modified' | 'moved';

/**
 * A single text change
 */
export interface TextChange {
  id: string;
  type: ChangeType;
  text: string;
  originalText?: string; // For modified type
  location: Rect;
  pageIndex: number;
  lineNumber?: number;
  wordIndex?: number;
}

/**
 * Visual difference region
 */
export interface VisualChange {
  id: string;
  pageIndex: number;
  region: Rect;
  similarity: number; // 0-100%
  pixelsDifferent: number;
}

/**
 * Comparison result for a single page
 */
export interface PageComparison {
  pageNumber: number;
  textChanges: TextChange[];
  visualChanges: VisualChange[];
  similarity: number; // 0-100%
  text1: string;
  text2: string;
}

/**
 * Summary of comparison
 */
export interface ComparisonSummary {
  totalPages1: number;
  totalPages2: number;
  pagesCompared: number;
  totalTextChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  movedCount: number;
  overallSimilarity: number; // 0-100%
}

/**
 * Full comparison result
 */
export interface ComparisonResult {
  id: string;
  document1: DocumentInfo;
  document2: DocumentInfo;
  pages: PageComparison[];
  summary: ComparisonSummary;
  comparedAt: number;
}

/**
 * Document info
 */
export interface DocumentInfo {
  name: string;
  pageCount: number;
  size?: number;
}

/**
 * Comparison options
 */
export interface ComparisonOptions {
  compareText: boolean;
  compareVisual: boolean;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  pageRange1?: { start: number; end: number };
  pageRange2?: { start: number; end: number };
  granularity: 'character' | 'word' | 'line' | 'paragraph';
}

/**
 * Default comparison options
 */
export const DEFAULT_COMPARISON_OPTIONS: ComparisonOptions = {
  compareText: true,
  compareVisual: false,
  ignoreWhitespace: true,
  ignoreCase: false,
  granularity: 'word',
};

/**
 * View mode for comparison display
 */
export type ComparisonViewMode = 'side-by-side' | 'overlay' | 'diff-only';

/**
 * Diff token types for rendering
 */
export type DiffTokenType = 'equal' | 'insert' | 'delete';

/**
 * A diff token for rendering
 */
export interface DiffToken {
  type: DiffTokenType;
  value: string;
}

/**
 * Line diff result
 */
export interface LineDiff {
  lineNumber1?: number;
  lineNumber2?: number;
  type: 'equal' | 'added' | 'removed' | 'modified';
  content1?: string;
  content2?: string;
  tokens?: DiffToken[];
}

/**
 * Comparison report export format
 */
export type ReportFormat = 'pdf' | 'html' | 'text' | 'json';

/**
 * Comparison report
 */
export interface ComparisonReport {
  title: string;
  generatedAt: number;
  result: ComparisonResult;
  includeVisualDiff: boolean;
  includeThumbnails: boolean;
}
