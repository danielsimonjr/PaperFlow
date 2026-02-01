/**
 * PDF Accessibility Types
 * Type definitions for PDF/UA accessibility checking.
 */

/**
 * Accessibility issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Accessibility check categories based on WCAG and PDF/UA
 */
export type CheckCategory =
  | 'document-structure'
  | 'text-content'
  | 'images'
  | 'links'
  | 'forms'
  | 'tables'
  | 'reading-order'
  | 'language'
  | 'color-contrast'
  | 'metadata'
  | 'navigation';

/**
 * Specific accessibility check types
 */
export type CheckType =
  // Document structure
  | 'document-title'
  | 'document-language'
  | 'tagged-pdf'
  | 'logical-reading-order'
  | 'heading-structure'
  | 'bookmark-structure'
  // Text content
  | 'text-accessibility'
  | 'font-embedding'
  | 'unicode-mapping'
  // Images
  | 'image-alt-text'
  | 'decorative-image-marking'
  | 'figure-caption'
  // Links
  | 'link-purpose'
  | 'link-text'
  // Forms
  | 'form-field-labels'
  | 'form-field-names'
  | 'form-tab-order'
  | 'form-tooltips'
  // Tables
  | 'table-headers'
  | 'table-summary'
  | 'table-structure'
  // Color
  | 'color-contrast-text'
  | 'color-only-meaning'
  // Metadata
  | 'pdf-ua-identifier'
  | 'metadata-present';

/**
 * Individual accessibility issue
 */
export interface AccessibilityIssue {
  id: string;
  type: CheckType;
  category: CheckCategory;
  severity: IssueSeverity;
  message: string;
  description: string;
  pageNumber?: number;
  elementId?: string;
  elementType?: string;
  recommendation: string;
  wcagCriteria?: string[];
  pdfuaRequirement?: string;
}

/**
 * Check result for a single check
 */
export interface CheckResult {
  type: CheckType;
  passed: boolean;
  issues: AccessibilityIssue[];
  elementCount?: number;
  passedCount?: number;
  failedCount?: number;
}

/**
 * Page accessibility summary
 */
export interface PageAccessibility {
  pageNumber: number;
  issues: AccessibilityIssue[];
  hasImages: boolean;
  hasLinks: boolean;
  hasForms: boolean;
  hasTables: boolean;
}

/**
 * Document accessibility report
 */
export interface AccessibilityReport {
  documentName: string;
  checkedAt: number;
  totalPages: number;
  isTagged: boolean;
  hasMetadata: boolean;

  // Summary counts
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalIssues: number;

  // Check results by category
  checkResults: CheckResult[];

  // Issues by page
  pageIssues: PageAccessibility[];

  // Overall score (0-100)
  score: number;

  // Compliance status
  pdfuaCompliant: boolean;
  wcagLevel: 'none' | 'A' | 'AA' | 'AAA';
}

/**
 * Checker configuration
 */
export interface CheckerConfig {
  checkDocument: boolean;
  checkText: boolean;
  checkImages: boolean;
  checkLinks: boolean;
  checkForms: boolean;
  checkTables: boolean;
  checkReadingOrder: boolean;
  checkColorContrast: boolean;
  checkMetadata: boolean;
  minContrastRatio: number; // Default 4.5 for AA
  includeInfoLevel: boolean;
}

/**
 * Default checker configuration
 */
export const DEFAULT_CHECKER_CONFIG: CheckerConfig = {
  checkDocument: true,
  checkText: true,
  checkImages: true,
  checkLinks: true,
  checkForms: true,
  checkTables: true,
  checkReadingOrder: true,
  checkColorContrast: true,
  checkMetadata: true,
  minContrastRatio: 4.5,
  includeInfoLevel: true,
};

/**
 * WCAG criteria mapping
 */
export const WCAG_CRITERIA: Record<CheckType, string[]> = {
  'document-title': ['2.4.2'],
  'document-language': ['3.1.1'],
  'tagged-pdf': ['1.3.1', '4.1.1'],
  'logical-reading-order': ['1.3.2'],
  'heading-structure': ['1.3.1', '2.4.6'],
  'bookmark-structure': ['2.4.5'],
  'text-accessibility': ['1.4.4'],
  'font-embedding': ['1.4.5'],
  'unicode-mapping': ['1.3.1'],
  'image-alt-text': ['1.1.1'],
  'decorative-image-marking': ['1.1.1'],
  'figure-caption': ['1.1.1'],
  'link-purpose': ['2.4.4'],
  'link-text': ['2.4.4', '2.4.9'],
  'form-field-labels': ['1.3.1', '3.3.2'],
  'form-field-names': ['4.1.2'],
  'form-tab-order': ['2.4.3'],
  'form-tooltips': ['3.3.2'],
  'table-headers': ['1.3.1'],
  'table-summary': ['1.3.1'],
  'table-structure': ['1.3.1'],
  'color-contrast-text': ['1.4.3'],
  'color-only-meaning': ['1.4.1'],
  'pdf-ua-identifier': ['4.1.1'],
  'metadata-present': ['3.1.1'],
};

/**
 * PDF/UA requirement mapping
 */
export const PDFUA_REQUIREMENTS: Record<CheckType, string> = {
  'document-title': 'PDF/UA-1 7.1',
  'document-language': 'PDF/UA-1 7.2',
  'tagged-pdf': 'PDF/UA-1 7.1',
  'logical-reading-order': 'PDF/UA-1 7.3',
  'heading-structure': 'PDF/UA-1 7.4',
  'bookmark-structure': 'PDF/UA-1 7.18',
  'text-accessibility': 'PDF/UA-1 7.20',
  'font-embedding': 'PDF/UA-1 7.21',
  'unicode-mapping': 'PDF/UA-1 7.21',
  'image-alt-text': 'PDF/UA-1 7.3',
  'decorative-image-marking': 'PDF/UA-1 7.3',
  'figure-caption': 'PDF/UA-1 7.3',
  'link-purpose': 'PDF/UA-1 7.18',
  'link-text': 'PDF/UA-1 7.18',
  'form-field-labels': 'PDF/UA-1 7.18',
  'form-field-names': 'PDF/UA-1 7.18',
  'form-tab-order': 'PDF/UA-1 7.18',
  'form-tooltips': 'PDF/UA-1 7.18',
  'table-headers': 'PDF/UA-1 7.5',
  'table-summary': 'PDF/UA-1 7.5',
  'table-structure': 'PDF/UA-1 7.5',
  'color-contrast-text': 'PDF/UA-1 7.1',
  'color-only-meaning': 'PDF/UA-1 7.1',
  'pdf-ua-identifier': 'PDF/UA-1 6.7',
  'metadata-present': 'PDF/UA-1 7.1',
};

/**
 * Category to checks mapping
 */
export const CATEGORY_CHECKS: Record<CheckCategory, CheckType[]> = {
  'document-structure': ['document-title', 'tagged-pdf', 'heading-structure', 'bookmark-structure'],
  'text-content': ['text-accessibility', 'font-embedding', 'unicode-mapping'],
  'images': ['image-alt-text', 'decorative-image-marking', 'figure-caption'],
  'links': ['link-purpose', 'link-text'],
  'forms': ['form-field-labels', 'form-field-names', 'form-tab-order', 'form-tooltips'],
  'tables': ['table-headers', 'table-summary', 'table-structure'],
  'reading-order': ['logical-reading-order'],
  'language': ['document-language'],
  'color-contrast': ['color-contrast-text', 'color-only-meaning'],
  'metadata': ['pdf-ua-identifier', 'metadata-present'],
  'navigation': ['bookmark-structure'],
};
