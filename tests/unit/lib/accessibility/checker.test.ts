/**
 * Tests for PDF Accessibility Checker Module
 */

import { describe, it, expect } from 'vitest';
import {
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
  generateReportSummary,
  DEFAULT_CHECKER_CONFIG,
} from '@/lib/accessibility';

describe('PDF Accessibility Checker', () => {
  describe('createIssue', () => {
    it('should create an issue with all required fields', () => {
      const issue = createIssue(
        'image-alt-text',
        'images',
        'error',
        'Image missing alt text',
        'Add alt text to the image'
      );

      expect(issue.id).toBeDefined();
      expect(issue.type).toBe('image-alt-text');
      expect(issue.category).toBe('images');
      expect(issue.severity).toBe('error');
      expect(issue.message).toBe('Image missing alt text');
      expect(issue.recommendation).toBe('Add alt text to the image');
      expect(issue.wcagCriteria).toBeDefined();
      expect(issue.pdfuaRequirement).toBeDefined();
    });

    it('should include optional fields', () => {
      const issue = createIssue(
        'image-alt-text',
        'images',
        'error',
        'Test',
        'Fix it',
        { pageNumber: 5, elementId: 'img1' }
      );

      expect(issue.pageNumber).toBe(5);
      expect(issue.elementId).toBe('img1');
    });
  });

  describe('getCheckDescription', () => {
    it('should return description for check types', () => {
      const desc = getCheckDescription('document-title');
      expect(desc).toContain('title');
    });

    it('should return description for image-alt-text', () => {
      const desc = getCheckDescription('image-alt-text');
      expect(desc).toContain('alternative text');
    });
  });

  describe('createCheckResult', () => {
    it('should create passed result', () => {
      const result = createCheckResult('document-title', true);

      expect(result.type).toBe('document-title');
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should create failed result with issues', () => {
      const issue = createIssue('document-title', 'document-structure', 'error', 'Test', 'Fix');
      const result = createCheckResult('document-title', false, [issue]);

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    it('should include counts', () => {
      const result = createCheckResult('image-alt-text', true, [], {
        elementCount: 10,
        passedCount: 8,
        failedCount: 2,
      });

      expect(result.elementCount).toBe(10);
      expect(result.passedCount).toBe(8);
      expect(result.failedCount).toBe(2);
    });
  });

  describe('checkDocumentTitle', () => {
    it('should pass with valid title', () => {
      const result = checkDocumentTitle('My Document');
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail without title', () => {
      const result = checkDocumentTitle(undefined);
      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should fail with empty title', () => {
      const result = checkDocumentTitle('');
      expect(result.passed).toBe(false);
    });

    it('should warn with short title', () => {
      const result = checkDocumentTitle('AB');
      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('warning');
    });
  });

  describe('checkDocumentLanguage', () => {
    it('should pass with valid language code', () => {
      expect(checkDocumentLanguage('en').passed).toBe(true);
      expect(checkDocumentLanguage('en-US').passed).toBe(true);
      expect(checkDocumentLanguage('fr').passed).toBe(true);
    });

    it('should fail without language', () => {
      const result = checkDocumentLanguage(undefined);
      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should warn with invalid format', () => {
      const result = checkDocumentLanguage('english');
      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('warning');
    });
  });

  describe('checkTaggedPdf', () => {
    it('should pass when tagged', () => {
      const result = checkTaggedPdf(true);
      expect(result.passed).toBe(true);
    });

    it('should fail when not tagged', () => {
      const result = checkTaggedPdf(false);
      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('error');
    });
  });

  describe('checkImageAltText', () => {
    it('should pass when all images have alt text', () => {
      const images = [
        { id: 'img1', altText: 'A cat' },
        { id: 'img2', altText: 'A dog' },
      ];
      const result = checkImageAltText(images);

      expect(result.passed).toBe(true);
      expect(result.passedCount).toBe(2);
      expect(result.failedCount).toBe(0);
    });

    it('should fail when images missing alt text', () => {
      const images = [
        { id: 'img1', altText: 'A cat' },
        { id: 'img2', altText: '' },
        { id: 'img3' },
      ];
      const result = checkImageAltText(images);

      expect(result.passed).toBe(false);
      expect(result.passedCount).toBe(1);
      expect(result.failedCount).toBe(2);
    });

    it('should include page number in issues', () => {
      const images = [{ id: 'img1', pageNumber: 3 }];
      const result = checkImageAltText(images);

      expect(result.issues[0].pageNumber).toBe(3);
    });
  });

  describe('checkFormFieldLabels', () => {
    it('should pass when all fields have labels', () => {
      const fields = [
        { id: 'f1', name: 'name', label: 'Your Name' },
        { id: 'f2', name: 'email', tooltip: 'Enter email' },
      ];
      const result = checkFormFieldLabels(fields);

      expect(result.passed).toBe(true);
    });

    it('should fail when fields missing labels', () => {
      const fields = [
        { id: 'f1', name: 'name' },
        { id: 'f2' },
      ];
      const result = checkFormFieldLabels(fields);

      expect(result.passed).toBe(false);
      expect(result.failedCount).toBe(2);
    });
  });

  describe('checkLinkText', () => {
    it('should pass with descriptive link text', () => {
      const links = [
        { id: 'l1', text: 'Read our privacy policy' },
        { id: 'l2', text: 'Contact support' },
      ];
      const result = checkLinkText(links);

      expect(result.passed).toBe(true);
    });

    it('should fail with empty link text', () => {
      const links = [{ id: 'l1', text: '' }];
      const result = checkLinkText(links);

      expect(result.passed).toBe(false);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should fail with generic link text', () => {
      const genericTexts = ['click here', 'read more', 'learn more', 'here', 'link', 'more'];

      for (const text of genericTexts) {
        const result = checkLinkText([{ id: 'l1', text }]);
        expect(result.passed).toBe(false);
      }
    });
  });

  describe('checkTableHeaders', () => {
    it('should pass when tables have headers', () => {
      const tables = [
        { id: 't1', hasHeaders: true },
        { id: 't2', hasHeaders: true },
      ];
      const result = checkTableHeaders(tables);

      expect(result.passed).toBe(true);
    });

    it('should fail when tables missing headers', () => {
      const tables = [
        { id: 't1', hasHeaders: false, pageNumber: 2 },
      ];
      const result = checkTableHeaders(tables);

      expect(result.passed).toBe(false);
      expect(result.issues[0].pageNumber).toBe(2);
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate black on white contrast', () => {
      const ratio = calculateContrastRatio(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate white on black contrast', () => {
      const ratio = calculateContrastRatio(
        { r: 255, g: 255, b: 255 },
        { r: 0, g: 0, b: 0 }
      );
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate low contrast', () => {
      const ratio = calculateContrastRatio(
        { r: 200, g: 200, b: 200 },
        { r: 255, g: 255, b: 255 }
      );
      expect(ratio).toBeLessThan(2);
    });
  });

  describe('checkColorContrast', () => {
    it('should pass with good contrast', () => {
      const elements = [
        {
          id: 'e1',
          foreground: { r: 0, g: 0, b: 0 },
          background: { r: 255, g: 255, b: 255 },
        },
      ];
      const result = checkColorContrast(elements);

      expect(result.passed).toBe(true);
    });

    it('should fail with low contrast', () => {
      const elements = [
        {
          id: 'e1',
          foreground: { r: 200, g: 200, b: 200 },
          background: { r: 255, g: 255, b: 255 },
        },
      ];
      const result = checkColorContrast(elements);

      expect(result.passed).toBe(false);
    });

    it('should use lower ratio for large text', () => {
      const elements = [
        {
          id: 'e1',
          foreground: { r: 100, g: 100, b: 100 },
          background: { r: 255, g: 255, b: 255 },
          fontSize: 24,
        },
      ];
      // Large text (18pt+) requires 3:1 instead of 4.5:1
      const result = checkColorContrast(elements, 4.5);
      expect(result.passed).toBe(true);
    });
  });

  describe('checkHeadingStructure', () => {
    it('should pass with proper structure', () => {
      const headings = [
        { level: 1, text: 'Main Title' },
        { level: 2, text: 'Section' },
        { level: 3, text: 'Subsection' },
      ];
      const result = checkHeadingStructure(headings);

      expect(result.passed).toBe(true);
    });

    it('should warn when skipping levels', () => {
      const headings = [
        { level: 1, text: 'Main Title' },
        { level: 3, text: 'Subsection' }, // Skipped H2
      ];
      const result = checkHeadingStructure(headings);

      expect(result.issues.some((i) => i.message.includes('skipped'))).toBe(true);
    });

    it('should warn when not starting with H1', () => {
      const headings = [
        { level: 2, text: 'Section' },
      ];
      const result = checkHeadingStructure(headings);

      expect(result.issues.some((i) => i.message.includes('H1'))).toBe(true);
    });

    it('should handle empty headings', () => {
      const result = checkHeadingStructure([]);
      expect(result.passed).toBe(true); // Info level only
    });
  });

  describe('createAccessibilityReport', () => {
    it('should create complete report', () => {
      const checkResults = [
        createCheckResult('document-title', true),
        createCheckResult('tagged-pdf', true),
      ];

      const report = createAccessibilityReport(
        'test.pdf',
        10,
        true,
        true,
        checkResults,
        []
      );

      expect(report.documentName).toBe('test.pdf');
      expect(report.totalPages).toBe(10);
      expect(report.isTagged).toBe(true);
      expect(report.hasMetadata).toBe(true);
      expect(report.score).toBeGreaterThan(0);
    });

    it('should count issues by severity', () => {
      const issue1 = createIssue('document-title', 'document-structure', 'error', 'E1', 'Fix');
      const issue2 = createIssue('link-text', 'links', 'warning', 'W1', 'Fix');
      const issue3 = createIssue('heading-structure', 'document-structure', 'info', 'I1', 'Fix');

      const checkResults = [
        createCheckResult('document-title', false, [issue1]),
        createCheckResult('link-text', false, [issue2]),
        createCheckResult('heading-structure', true, [issue3]),
      ];

      const report = createAccessibilityReport('test.pdf', 1, true, true, checkResults, []);

      expect(report.errorCount).toBe(1);
      expect(report.warningCount).toBe(1);
      expect(report.infoCount).toBe(1);
      expect(report.totalIssues).toBe(3);
    });
  });

  describe('calculateAccessibilityScore', () => {
    it('should return high score for passing checks', () => {
      const checkResults = [
        createCheckResult('document-title', true),
        createCheckResult('tagged-pdf', true),
        createCheckResult('image-alt-text', true),
      ];

      const score = calculateAccessibilityScore(checkResults, true, true);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should return low score for failing checks', () => {
      const issue = createIssue('tagged-pdf', 'document-structure', 'error', 'Not tagged', 'Fix');
      const checkResults = [
        createCheckResult('tagged-pdf', false, [issue]),
      ];

      const score = calculateAccessibilityScore(checkResults, false, true);
      expect(score).toBeLessThanOrEqual(40);
    });

    it('should return 0 for empty checks', () => {
      const score = calculateAccessibilityScore([], true, true);
      expect(score).toBe(0);
    });
  });

  describe('determineWcagLevel', () => {
    it('should return AA for all passed', () => {
      const checkResults = [
        createCheckResult('document-title', true),
        createCheckResult('tagged-pdf', true),
      ];

      expect(determineWcagLevel(checkResults)).toBe('AA');
    });

    it('should return A for warnings only', () => {
      const warning = createIssue('link-text', 'links', 'warning', 'W', 'Fix');
      const checkResults = [
        createCheckResult('document-title', true),
        createCheckResult('link-text', true, [warning]),
      ];

      expect(determineWcagLevel(checkResults)).toBe('A');
    });

    it('should return none for errors', () => {
      const error = createIssue('tagged-pdf', 'document-structure', 'error', 'E', 'Fix');
      const checkResults = [
        createCheckResult('tagged-pdf', false, [error]),
      ];

      expect(determineWcagLevel(checkResults)).toBe('none');
    });
  });

  describe('mergeCheckerConfig', () => {
    it('should merge with defaults', () => {
      const config = mergeCheckerConfig({ checkImages: false });

      expect(config.checkImages).toBe(false);
      expect(config.checkForms).toBe(true);
      expect(config.minContrastRatio).toBe(4.5);
    });
  });

  describe('getIssuesBySeverity', () => {
    it('should filter issues by severity', () => {
      const error = createIssue('tagged-pdf', 'document-structure', 'error', 'E', 'Fix');
      const warning = createIssue('link-text', 'links', 'warning', 'W', 'Fix');

      const checkResults = [
        createCheckResult('tagged-pdf', false, [error]),
        createCheckResult('link-text', false, [warning]),
      ];

      const report = createAccessibilityReport('test.pdf', 1, true, true, checkResults, []);

      const errors = getIssuesBySeverity(report, 'error');
      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('error');
    });
  });

  describe('getIssuesByCategory', () => {
    it('should filter issues by category', () => {
      const docIssue = createIssue('document-title', 'document-structure', 'error', 'E', 'Fix');
      const linkIssue = createIssue('link-text', 'links', 'warning', 'W', 'Fix');

      const checkResults = [
        createCheckResult('document-title', false, [docIssue]),
        createCheckResult('link-text', false, [linkIssue]),
      ];

      const report = createAccessibilityReport('test.pdf', 1, true, true, checkResults, []);

      const docIssues = getIssuesByCategory(report, 'document-structure');
      expect(docIssues).toHaveLength(1);
      expect(docIssues[0].category).toBe('document-structure');
    });
  });

  describe('generateReportSummary', () => {
    it('should generate summary text', () => {
      const report = createAccessibilityReport('test.pdf', 5, true, true, [], []);

      const summary = generateReportSummary(report);

      expect(summary.some((s) => s.includes('Score'))).toBe(true);
      expect(summary.some((s) => s.includes('PDF/UA'))).toBe(true);
      expect(summary.some((s) => s.includes('WCAG'))).toBe(true);
    });

    it('should include critical message for untagged PDF', () => {
      const report = createAccessibilityReport('test.pdf', 5, false, true, [], []);

      const summary = generateReportSummary(report);

      expect(summary.some((s) => s.includes('not tagged'))).toBe(true);
    });
  });

  describe('DEFAULT_CHECKER_CONFIG', () => {
    it('should have all checks enabled by default', () => {
      expect(DEFAULT_CHECKER_CONFIG.checkDocument).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkText).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkImages).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkLinks).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkForms).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkTables).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkReadingOrder).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkColorContrast).toBe(true);
      expect(DEFAULT_CHECKER_CONFIG.checkMetadata).toBe(true);
    });

    it('should have WCAG AA contrast ratio by default', () => {
      expect(DEFAULT_CHECKER_CONFIG.minContrastRatio).toBe(4.5);
    });
  });
});
