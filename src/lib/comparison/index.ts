/**
 * Comparison Module
 * Document comparison functionality.
 */

// Types
export type {
  Rect,
  ChangeType,
  TextChange,
  VisualChange,
  PageComparison,
  ComparisonSummary,
  ComparisonResult,
  DocumentInfo,
  ComparisonOptions,
  ComparisonViewMode,
  DiffTokenType,
  DiffToken,
  LineDiff,
  ReportFormat,
  ComparisonReport,
} from './types';

export { DEFAULT_COMPARISON_OPTIONS } from './types';

// Text diff
export {
  diffCharacters,
  diffWords,
  diffLines,
  calculateSimilarity,
  getDiffStats,
  getLineChangeStats,
  normalizeText,
} from './textDiff';

// Comparison engine
export {
  compareDocuments,
  comparePage,
  calculateSummary,
  getPageChanges,
  getAllChanges,
  filterChangesByType,
  getChangeAtIndex,
  getAdjacentChange,
  areDocumentsIdentical,
  getPagesWithChanges,
} from './comparisonEngine';

// Report generator
export {
  generateReport,
  exportToText,
  exportToHTML,
  exportToJSON,
  exportReport,
  downloadReport,
} from './reportGenerator';
