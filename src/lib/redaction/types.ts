/**
 * Redaction Types
 * Types and interfaces for the redaction system.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RedactionType = 'text' | 'area' | 'pattern';

export type RedactionStatus = 'marked' | 'applied';

export interface RedactionMark {
  /** Unique identifier */
  id: string;
  /** Page index (0-based) */
  pageIndex: number;
  /** Bounding rectangle in PDF coordinates */
  bounds: Rect;
  /** Type of redaction */
  type: RedactionType;
  /** Pattern used for pattern-based redaction */
  pattern?: string;
  /** Pattern name for display */
  patternName?: string;
  /** Text that was matched (for audit) */
  matchedText?: string;
  /** Text to overlay on redaction */
  overlayText: string;
  /** Color of redaction rectangle */
  overlayColor: string;
  /** Current status */
  status: RedactionStatus;
  /** Creation timestamp */
  createdAt: number;
  /** User who created the mark */
  createdBy?: string;
}

export interface RedactionPattern {
  /** Pattern identifier */
  id: string;
  /** Display name */
  name: string;
  /** Regular expression pattern */
  regex: string;
  /** Case sensitive matching */
  caseSensitive: boolean;
  /** Whole word matching */
  wholeWord: boolean;
  /** Description of what the pattern matches */
  description: string;
  /** Category for grouping */
  category: 'pii' | 'financial' | 'contact' | 'date' | 'custom';
}

export interface PatternMatch {
  /** The matched text */
  text: string;
  /** Page index */
  pageIndex: number;
  /** Bounding rectangles (may span multiple areas for wrapped text) */
  bounds: Rect[];
  /** Pattern that matched */
  pattern: RedactionPattern;
  /** Start index in text content */
  startIndex: number;
  /** End index in text content */
  endIndex: number;
}

export interface RedactionOptions {
  /** Color of the redaction rectangle */
  overlayColor: string;
  /** Text to display over redaction (e.g., "REDACTED") */
  overlayText: string;
  /** Whether to remove metadata when applying */
  removeMetadata: boolean;
  /** Specific metadata fields to preserve */
  preserveMetadataFields?: string[];
}

export interface VerificationResult {
  /** Overall pass/fail status */
  passed: boolean;
  /** List of issues found */
  issues: VerificationIssue[];
  /** Summary message */
  summary: string;
  /** Timestamp of verification */
  verifiedAt: number;
}

export interface VerificationIssue {
  /** Type of issue */
  type: 'hidden_text' | 'metadata' | 'annotation' | 'incomplete' | 'layer';
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Page index (if applicable) */
  pageIndex?: number;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  recommendation: string;
}

export interface AuditLogEntry {
  /** Action type */
  action: 'mark' | 'unmark' | 'apply' | 'verify';
  /** Timestamp */
  timestamp: number;
  /** User who performed action */
  user?: string;
  /** Redaction mark ID */
  markId?: string;
  /** Pattern used (if pattern-based) */
  pattern?: string;
  /** Page index */
  pageIndex?: number;
  /** Additional details */
  details?: string;
}

export interface RedactionReport {
  /** Document name */
  documentName: string;
  /** Report generation timestamp */
  generatedAt: number;
  /** Total marks created */
  totalMarks: number;
  /** Marks applied */
  appliedMarks: number;
  /** Marks by type */
  marksByType: {
    text: number;
    area: number;
    pattern: number;
  };
  /** Marks by page */
  marksByPage: Record<number, number>;
  /** Patterns used */
  patternsUsed: string[];
  /** Verification result */
  verification?: VerificationResult;
  /** Audit log */
  auditLog: AuditLogEntry[];
}

export const DEFAULT_REDACTION_OPTIONS: RedactionOptions = {
  overlayColor: '#000000',
  overlayText: '',
  removeMetadata: true,
};

export const DEFAULT_OVERLAY_COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#808080', label: 'Gray' },
  { value: '#FF0000', label: 'Red' },
  { value: '#0000FF', label: 'Blue' },
];
