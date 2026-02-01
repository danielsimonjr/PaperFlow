/**
 * PDF Accessibility Checker
 * Core accessibility checking functions for PDF/UA compliance.
 */

import type {
  AccessibilityIssue,
  CheckResult,
  CheckType,
  CheckCategory,
  IssueSeverity,
  AccessibilityReport,
  PageAccessibility,
  CheckerConfig,
} from './types';
import { WCAG_CRITERIA, PDFUA_REQUIREMENTS, DEFAULT_CHECKER_CONFIG } from './types';

/**
 * Generate unique issue ID
 */
function generateIssueId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an accessibility issue
 */
export function createIssue(
  type: CheckType,
  category: CheckCategory,
  severity: IssueSeverity,
  message: string,
  recommendation: string,
  options: Partial<AccessibilityIssue> = {}
): AccessibilityIssue {
  return {
    id: generateIssueId(),
    type,
    category,
    severity,
    message,
    description: getCheckDescription(type),
    recommendation,
    wcagCriteria: WCAG_CRITERIA[type],
    pdfuaRequirement: PDFUA_REQUIREMENTS[type],
    ...options,
  };
}

/**
 * Get description for a check type
 */
export function getCheckDescription(type: CheckType): string {
  const descriptions: Record<CheckType, string> = {
    'document-title': 'The document should have a meaningful title that describes its content.',
    'document-language': 'The document should specify its primary language for assistive technologies.',
    'tagged-pdf': 'The PDF should be properly tagged with structural elements for accessibility.',
    'logical-reading-order': 'Content should follow a logical reading order for screen readers.',
    'heading-structure': 'Headings should follow a proper hierarchical structure.',
    'bookmark-structure': 'Bookmarks should be present for navigation in longer documents.',
    'text-accessibility': 'Text should be actual text, not images of text.',
    'font-embedding': 'Fonts should be embedded to ensure consistent rendering.',
    'unicode-mapping': 'Characters should be mapped to Unicode for text extraction.',
    'image-alt-text': 'Images should have alternative text describing their content.',
    'decorative-image-marking': 'Decorative images should be marked as artifacts.',
    'figure-caption': 'Figures should have captions when appropriate.',
    'link-purpose': 'The purpose of each link should be clear from the link text.',
    'link-text': 'Link text should be descriptive, not generic like "click here".',
    'form-field-labels': 'Form fields should have associated labels.',
    'form-field-names': 'Form fields should have meaningful names.',
    'form-tab-order': 'Form fields should have a logical tab order.',
    'form-tooltips': 'Form fields should have tooltips for additional guidance.',
    'table-headers': 'Tables should have properly marked header cells.',
    'table-summary': 'Complex tables should have summaries.',
    'table-structure': 'Tables should use proper structural markup.',
    'color-contrast-text': 'Text should have sufficient contrast with its background.',
    'color-only-meaning': 'Color should not be the only means of conveying information.',
    'pdf-ua-identifier': 'Document should be marked as PDF/UA compliant.',
    'metadata-present': 'Document should have proper metadata.',
  };

  return descriptions[type] || 'Accessibility check';
}

/**
 * Create a check result
 */
export function createCheckResult(
  type: CheckType,
  passed: boolean,
  issues: AccessibilityIssue[] = [],
  counts?: { elementCount?: number; passedCount?: number; failedCount?: number }
): CheckResult {
  return {
    type,
    passed,
    issues,
    elementCount: counts?.elementCount,
    passedCount: counts?.passedCount,
    failedCount: counts?.failedCount,
  };
}

/**
 * Check document title
 */
export function checkDocumentTitle(title: string | undefined | null): CheckResult {
  const issues: AccessibilityIssue[] = [];

  if (!title || title.trim() === '') {
    issues.push(
      createIssue(
        'document-title',
        'document-structure',
        'error',
        'Document does not have a title',
        'Add a meaningful title to the document that describes its content.'
      )
    );
  } else if (title.length < 3) {
    issues.push(
      createIssue(
        'document-title',
        'document-structure',
        'warning',
        'Document title is too short',
        'Use a more descriptive title that clearly identifies the document content.'
      )
    );
  }

  return createCheckResult('document-title', issues.length === 0, issues);
}

/**
 * Check document language
 */
export function checkDocumentLanguage(language: string | undefined | null): CheckResult {
  const issues: AccessibilityIssue[] = [];

  if (!language) {
    issues.push(
      createIssue(
        'document-language',
        'language',
        'error',
        'Document language is not specified',
        'Set the document language in the document properties (e.g., "en" for English).'
      )
    );
  } else if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    issues.push(
      createIssue(
        'document-language',
        'language',
        'warning',
        'Document language format may be invalid',
        'Use a valid language code format like "en" or "en-US".'
      )
    );
  }

  return createCheckResult('document-language', issues.length === 0, issues);
}

/**
 * Check if PDF is tagged
 */
export function checkTaggedPdf(isTagged: boolean): CheckResult {
  const issues: AccessibilityIssue[] = [];

  if (!isTagged) {
    issues.push(
      createIssue(
        'tagged-pdf',
        'document-structure',
        'error',
        'PDF is not tagged',
        'Add structural tags to the document to make it accessible. Use PDF authoring tools to create a tagged PDF.'
      )
    );
  }

  return createCheckResult('tagged-pdf', issues.length === 0, issues);
}

/**
 * Check images for alt text
 */
export function checkImageAltText(
  images: Array<{ id: string; altText?: string; pageNumber?: number }>
): CheckResult {
  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const image of images) {
    if (!image.altText || image.altText.trim() === '') {
      failedCount++;
      issues.push(
        createIssue(
          'image-alt-text',
          'images',
          'error',
          `Image is missing alternative text`,
          'Add alternative text that describes the image content or mark it as decorative.',
          { elementId: image.id, pageNumber: image.pageNumber, elementType: 'image' }
        )
      );
    } else {
      passedCount++;
    }
  }

  return createCheckResult('image-alt-text', failedCount === 0, issues, {
    elementCount: images.length,
    passedCount,
    failedCount,
  });
}

/**
 * Check form fields for labels
 */
export function checkFormFieldLabels(
  fields: Array<{ id: string; name?: string; label?: string; tooltip?: string; pageNumber?: number }>
): CheckResult {
  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const field of fields) {
    const hasLabel = field.label && field.label.trim() !== '';
    const hasTooltip = field.tooltip && field.tooltip.trim() !== '';
    const hasName = field.name && field.name.trim() !== '';

    if (!hasLabel && !hasTooltip) {
      failedCount++;
      issues.push(
        createIssue(
          'form-field-labels',
          'forms',
          'error',
          `Form field "${hasName ? field.name : field.id}" is missing a label`,
          'Add a label or tooltip to describe the form field purpose.',
          { elementId: field.id, pageNumber: field.pageNumber, elementType: 'form-field' }
        )
      );
    } else {
      passedCount++;
    }
  }

  return createCheckResult('form-field-labels', failedCount === 0, issues, {
    elementCount: fields.length,
    passedCount,
    failedCount,
  });
}

/**
 * Check links for descriptive text
 */
export function checkLinkText(
  links: Array<{ id: string; text?: string; url?: string; pageNumber?: number }>
): CheckResult {
  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  const genericTexts = ['click here', 'read more', 'learn more', 'here', 'link', 'more'];

  for (const link of links) {
    if (!link.text || link.text.trim() === '') {
      failedCount++;
      issues.push(
        createIssue(
          'link-text',
          'links',
          'error',
          'Link has no text',
          'Add descriptive text to the link that indicates its purpose.',
          { elementId: link.id, pageNumber: link.pageNumber, elementType: 'link' }
        )
      );
    } else if (genericTexts.includes(link.text.toLowerCase().trim())) {
      failedCount++;
      issues.push(
        createIssue(
          'link-text',
          'links',
          'warning',
          `Link text "${link.text}" is not descriptive`,
          'Use link text that describes where the link goes or what it does.',
          { elementId: link.id, pageNumber: link.pageNumber, elementType: 'link' }
        )
      );
    } else {
      passedCount++;
    }
  }

  return createCheckResult('link-text', failedCount === 0, issues, {
    elementCount: links.length,
    passedCount,
    failedCount,
  });
}

/**
 * Check table headers
 */
export function checkTableHeaders(
  tables: Array<{ id: string; hasHeaders: boolean; pageNumber?: number }>
): CheckResult {
  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const table of tables) {
    if (!table.hasHeaders) {
      failedCount++;
      issues.push(
        createIssue(
          'table-headers',
          'tables',
          'error',
          'Table is missing header cells',
          'Add header cells (TH) to the table to identify row and column headers.',
          { elementId: table.id, pageNumber: table.pageNumber, elementType: 'table' }
        )
      );
    } else {
      passedCount++;
    }
  }

  return createCheckResult('table-headers', failedCount === 0, issues, {
    elementCount: tables.length,
    passedCount,
    failedCount,
  });
}

/**
 * Calculate color contrast ratio
 */
export function calculateContrastRatio(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number }
): number {
  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
    const toLinear = (c: number): number => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const r = toLinear(rgb.r);
    const g = toLinear(rgb.g);
    const b = toLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check text color contrast
 */
export function checkColorContrast(
  textElements: Array<{
    id: string;
    foreground: { r: number; g: number; b: number };
    background: { r: number; g: number; b: number };
    fontSize?: number;
    pageNumber?: number;
  }>,
  minRatio: number = 4.5
): CheckResult {
  const issues: AccessibilityIssue[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const element of textElements) {
    const ratio = calculateContrastRatio(element.foreground, element.background);
    // Large text (18pt+ or 14pt+ bold) requires 3:1, normal text requires 4.5:1
    const requiredRatio = element.fontSize && element.fontSize >= 18 ? 3 : minRatio;

    if (ratio < requiredRatio) {
      failedCount++;
      issues.push(
        createIssue(
          'color-contrast-text',
          'color-contrast',
          'error',
          `Insufficient color contrast (${ratio.toFixed(2)}:1, requires ${requiredRatio}:1)`,
          'Increase the contrast between text and background colors.',
          { elementId: element.id, pageNumber: element.pageNumber, elementType: 'text' }
        )
      );
    } else {
      passedCount++;
    }
  }

  return createCheckResult('color-contrast-text', failedCount === 0, issues, {
    elementCount: textElements.length,
    passedCount,
    failedCount,
  });
}

/**
 * Check heading structure
 */
export function checkHeadingStructure(
  headings: Array<{ level: number; text: string; pageNumber?: number }>
): CheckResult {
  const issues: AccessibilityIssue[] = [];

  if (headings.length === 0) {
    issues.push(
      createIssue(
        'heading-structure',
        'document-structure',
        'info',
        'Document has no headings',
        'Add headings to provide structure and navigation points.'
      )
    );
    return createCheckResult('heading-structure', true, issues);
  }

  // Check for skipped heading levels
  let previousLevel = 0;
  for (const heading of headings) {
    if (heading.level > previousLevel + 1 && previousLevel > 0) {
      issues.push(
        createIssue(
          'heading-structure',
          'document-structure',
          'warning',
          `Heading level skipped from H${previousLevel} to H${heading.level}`,
          'Use heading levels in order without skipping (e.g., H1 → H2 → H3).',
          { pageNumber: heading.pageNumber, elementType: 'heading' }
        )
      );
    }
    previousLevel = heading.level;
  }

  // Check if document starts with H1
  if (headings[0] && headings[0].level !== 1) {
    issues.push(
      createIssue(
        'heading-structure',
        'document-structure',
        'warning',
        'Document does not start with an H1 heading',
        'Start the document with a main heading (H1).',
        { pageNumber: headings[0].pageNumber }
      )
    );
  }

  return createCheckResult('heading-structure', issues.filter((i) => i.severity === 'error').length === 0, issues);
}

/**
 * Create accessibility report
 */
export function createAccessibilityReport(
  documentName: string,
  totalPages: number,
  isTagged: boolean,
  hasMetadata: boolean,
  checkResults: CheckResult[],
  pageIssues: PageAccessibility[]
): AccessibilityReport {
  // Collect all issues
  const allIssues = checkResults.flatMap((r) => r.issues);

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
  const infoCount = allIssues.filter((i) => i.severity === 'info').length;

  // Calculate score (0-100)
  const score = calculateAccessibilityScore(checkResults, isTagged, hasMetadata);

  // Determine WCAG level
  const wcagLevel = determineWcagLevel(checkResults);

  // Check PDF/UA compliance
  const pdfuaCompliant = errorCount === 0 && isTagged && hasMetadata;

  return {
    documentName,
    checkedAt: Date.now(),
    totalPages,
    isTagged,
    hasMetadata,
    errorCount,
    warningCount,
    infoCount,
    totalIssues: allIssues.length,
    checkResults,
    pageIssues,
    score,
    pdfuaCompliant,
    wcagLevel,
  };
}

/**
 * Calculate accessibility score
 */
export function calculateAccessibilityScore(
  checkResults: CheckResult[],
  isTagged: boolean,
  hasMetadata: boolean
): number {
  if (checkResults.length === 0) return 0;

  let totalWeight = 0;
  let weightedScore = 0;

  // Check weights by type
  const weights: Partial<Record<CheckType, number>> = {
    'document-title': 10,
    'document-language': 10,
    'tagged-pdf': 20,
    'image-alt-text': 15,
    'form-field-labels': 15,
    'link-text': 10,
    'table-headers': 10,
    'color-contrast-text': 10,
    'heading-structure': 10,
  };

  for (const result of checkResults) {
    const weight = weights[result.type] || 5;
    totalWeight += weight;

    if (result.passed) {
      weightedScore += weight;
    } else if (result.issues.every((i) => i.severity !== 'error')) {
      weightedScore += weight * 0.5; // Partial credit for warnings only
    }
  }

  // Base score from checks
  let score = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

  // Penalties for missing essentials
  if (!isTagged) score = Math.min(score, 40);
  if (!hasMetadata) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine WCAG compliance level
 */
export function determineWcagLevel(checkResults: CheckResult[]): 'none' | 'A' | 'AA' | 'AAA' {
  const hasErrors = checkResults.some(
    (r) => !r.passed && r.issues.some((i) => i.severity === 'error')
  );

  if (hasErrors) return 'none';

  const hasWarnings = checkResults.some(
    (r) => r.issues.some((i) => i.severity === 'warning')
  );

  if (hasWarnings) return 'A';

  return 'AA';
}

/**
 * Merge checker configuration
 */
export function mergeCheckerConfig(config: Partial<CheckerConfig>): CheckerConfig {
  return {
    ...DEFAULT_CHECKER_CONFIG,
    ...config,
  };
}

/**
 * Get issues by severity
 */
export function getIssuesBySeverity(
  report: AccessibilityReport,
  severity: IssueSeverity
): AccessibilityIssue[] {
  return report.checkResults
    .flatMap((r) => r.issues)
    .filter((i) => i.severity === severity);
}

/**
 * Get issues by category
 */
export function getIssuesByCategory(
  report: AccessibilityReport,
  category: CheckCategory
): AccessibilityIssue[] {
  return report.checkResults
    .flatMap((r) => r.issues)
    .filter((i) => i.category === category);
}

/**
 * Get issues by page
 */
export function getIssuesByPage(
  report: AccessibilityReport,
  pageNumber: number
): AccessibilityIssue[] {
  const pageAccessibility = report.pageIssues.find((p) => p.pageNumber === pageNumber);
  return pageAccessibility?.issues || [];
}

/**
 * Generate summary text for report
 */
export function generateReportSummary(report: AccessibilityReport): string[] {
  const summary: string[] = [];

  summary.push(`Accessibility Score: ${report.score}/100`);
  summary.push(`PDF/UA Compliant: ${report.pdfuaCompliant ? 'Yes' : 'No'}`);
  summary.push(`WCAG Level: ${report.wcagLevel === 'none' ? 'Not compliant' : report.wcagLevel}`);
  summary.push('');
  summary.push(`Total Issues: ${report.totalIssues}`);
  summary.push(`  Errors: ${report.errorCount}`);
  summary.push(`  Warnings: ${report.warningCount}`);
  summary.push(`  Info: ${report.infoCount}`);

  if (!report.isTagged) {
    summary.push('');
    summary.push('Critical: Document is not tagged for accessibility.');
  }

  return summary;
}
