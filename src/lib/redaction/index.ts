/**
 * Redaction Module
 * Provides tools for marking, applying, and verifying redactions in PDF documents.
 */

// Types
export type {
  Rect,
  RedactionType,
  RedactionStatus,
  RedactionMark,
  RedactionPattern,
  PatternMatch,
  RedactionOptions,
  VerificationResult,
  VerificationIssue,
  AuditLogEntry,
  RedactionReport,
} from './types';

export { DEFAULT_REDACTION_OPTIONS, DEFAULT_OVERLAY_COLORS } from './types';

// Pattern Matching
export {
  BUILT_IN_PATTERNS,
  getAllPatterns,
  getPatternsByCategory,
  getPatternById,
  createCustomPattern,
  validatePattern,
  findPatternMatches,
  findAllPatternMatches,
  findTextMatches,
  getMatchStatistics,
} from './patternMatcher';

// Redaction Engine
export {
  createAreaMark,
  createTextMark,
  createPatternMarks,
  updateMarkOptions,
  markAsApplied,
  groupMarksByPage,
  sortMarksByPosition,
  rectsOverlap,
  mergeOverlappingMarks,
  createAuditEntry,
  generateReport,
  exportMarksToJSON,
  importMarksFromJSON,
  calculateMarkStatistics,
} from './redactionEngine';

// Verification
export {
  verifyRedactions,
  checkHiddenText,
  verifyMetadataScrubbing,
  createVerificationChecklist,
  generateVerificationReport,
} from './redactionVerify';
