/**
 * PDF Accessibility Module
 * PDF/UA and WCAG accessibility checking for PDF documents.
 */

// Types
export type {
  IssueSeverity,
  CheckCategory,
  CheckType,
  AccessibilityIssue,
  CheckResult,
  PageAccessibility,
  AccessibilityReport,
  CheckerConfig,
} from './types';

export {
  DEFAULT_CHECKER_CONFIG,
  WCAG_CRITERIA,
  PDFUA_REQUIREMENTS,
  CATEGORY_CHECKS,
} from './types';

// Checker functions
export {
  createIssue,
  getCheckDescription,
  createCheckResult,
  checkDocumentTitle,
  checkDocumentLanguage,
  checkTaggedPdf,
  checkImageAltText,
  checkFormFieldLabels,
  checkLinkText,
  checkTableHeaders,
  calculateContrastRatio,
  checkColorContrast,
  checkHeadingStructure,
  createAccessibilityReport,
  calculateAccessibilityScore,
  determineWcagLevel,
  mergeCheckerConfig,
  getIssuesBySeverity,
  getIssuesByCategory,
  getIssuesByPage,
  generateReportSummary,
} from './checker';
