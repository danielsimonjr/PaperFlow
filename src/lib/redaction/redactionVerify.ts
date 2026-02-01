/**
 * Redaction Verification
 * Verifies that redactions are complete and no content is recoverable.
 */

import type { VerificationResult, VerificationIssue, RedactionMark } from './types';

/**
 * Metadata fields that commonly contain sensitive information
 */
const SENSITIVE_METADATA_FIELDS = [
  'Author',
  'Creator',
  'Producer',
  'ModDate',
  'CreationDate',
  'Title',
  'Subject',
  'Keywords',
];

/**
 * Verify redaction completeness
 */
export function verifyRedactions(
  marks: RedactionMark[],
  options: {
    documentMetadata?: Record<string, string>;
    hasAnnotations?: boolean;
    hasLayers?: boolean;
    hasJavaScript?: boolean;
    hasEmbeddedFiles?: boolean;
    textContent?: Map<number, string>;
  } = {}
): VerificationResult {
  const issues: VerificationIssue[] = [];

  // Check for unapplied marks
  const unappliedMarks = marks.filter((m) => m.status === 'marked');
  if (unappliedMarks.length > 0) {
    issues.push({
      type: 'incomplete',
      severity: 'error',
      description: `${unappliedMarks.length} redaction mark(s) have not been applied`,
      recommendation: 'Apply all redaction marks before saving the document',
    });
  }

  // Check metadata
  if (options.documentMetadata) {
    const sensitiveMetadata = checkSensitiveMetadata(options.documentMetadata);
    issues.push(...sensitiveMetadata);
  }

  // Check for annotations
  if (options.hasAnnotations) {
    issues.push({
      type: 'annotation',
      severity: 'warning',
      description: 'Document contains annotations that may contain sensitive information',
      recommendation: 'Review and flatten or remove annotations before sharing',
    });
  }

  // Check for layers
  if (options.hasLayers) {
    issues.push({
      type: 'layer',
      severity: 'warning',
      description: 'Document contains layers that may hide content',
      recommendation: 'Flatten all layers to ensure hidden content is removed',
    });
  }

  // Check for JavaScript
  if (options.hasJavaScript) {
    issues.push({
      type: 'hidden_text',
      severity: 'warning',
      description: 'Document contains JavaScript that may reveal or store data',
      recommendation: 'Remove all JavaScript before sharing',
    });
  }

  // Check for embedded files
  if (options.hasEmbeddedFiles) {
    issues.push({
      type: 'hidden_text',
      severity: 'warning',
      description: 'Document contains embedded files that may contain sensitive data',
      recommendation: 'Remove all embedded files before sharing',
    });
  }

  // Determine if verification passed
  const hasErrors = issues.some((i) => i.severity === 'error');

  return {
    passed: !hasErrors,
    issues,
    summary: generateSummary(issues),
    verifiedAt: Date.now(),
  };
}

/**
 * Check for sensitive metadata
 */
function checkSensitiveMetadata(metadata: Record<string, string>): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  const foundSensitive: string[] = [];

  for (const field of SENSITIVE_METADATA_FIELDS) {
    if (metadata[field] && metadata[field].trim() !== '') {
      foundSensitive.push(field);
    }
  }

  if (foundSensitive.length > 0) {
    issues.push({
      type: 'metadata',
      severity: 'warning',
      description: `Document metadata contains potentially sensitive fields: ${foundSensitive.join(', ')}`,
      recommendation: 'Remove or sanitize metadata fields before sharing',
    });
  }

  return issues;
}

/**
 * Generate summary message from issues
 */
function generateSummary(issues: VerificationIssue[]): string {
  if (issues.length === 0) {
    return 'Verification passed. No issues found.';
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;

  const parts: string[] = [];

  if (errors > 0) {
    parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  }
  if (warnings > 0) {
    parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  }
  if (info > 0) {
    parts.push(`${info} info`);
  }

  return `Verification ${errors > 0 ? 'failed' : 'completed with warnings'}. Found: ${parts.join(', ')}.`;
}

/**
 * Check if text content exists under redaction marks
 * This requires the actual PDF content and is a more thorough check
 */
export function checkHiddenText(
  marks: RedactionMark[],
  textContent: Map<number, Array<{ text: string; bounds: { x: number; y: number; width: number; height: number } }>>
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  for (const mark of marks.filter((m) => m.status === 'applied')) {
    const pageText = textContent.get(mark.pageIndex);
    if (!pageText) continue;

    // Check if any text falls within the mark bounds
    const overlappingText = pageText.filter((item) => {
      return rectsOverlap(mark.bounds, item.bounds);
    });

    if (overlappingText.length > 0) {
      issues.push({
        type: 'hidden_text',
        severity: 'error',
        pageIndex: mark.pageIndex,
        description: `Text content found under applied redaction on page ${mark.pageIndex + 1}`,
        recommendation: 'Re-apply redaction to ensure content is completely removed',
      });
    }
  }

  return issues;
}

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Verify metadata scrubbing
 */
export function verifyMetadataScrubbing(
  beforeMetadata: Record<string, string>,
  afterMetadata: Record<string, string>
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];

  for (const field of SENSITIVE_METADATA_FIELDS) {
    if (beforeMetadata[field] && afterMetadata[field] && beforeMetadata[field] === afterMetadata[field]) {
      issues.push({
        type: 'metadata',
        severity: 'warning',
        description: `Metadata field "${field}" was not scrubbed`,
        recommendation: `Remove or clear the "${field}" field`,
      });
    }
  }

  return issues;
}

/**
 * Create verification checklist for user confirmation
 */
export function createVerificationChecklist(): Array<{
  id: string;
  label: string;
  description: string;
  required: boolean;
}> {
  return [
    {
      id: 'redactions_applied',
      label: 'All redactions applied',
      description: 'All marked content has been permanently redacted',
      required: true,
    },
    {
      id: 'metadata_scrubbed',
      label: 'Metadata removed',
      description: 'Sensitive metadata fields have been cleared',
      required: false,
    },
    {
      id: 'layers_flattened',
      label: 'Layers flattened',
      description: 'All document layers have been merged',
      required: false,
    },
    {
      id: 'annotations_reviewed',
      label: 'Annotations reviewed',
      description: 'Comments and annotations have been removed or approved',
      required: false,
    },
    {
      id: 'javascript_removed',
      label: 'JavaScript removed',
      description: 'All JavaScript code has been removed from the document',
      required: false,
    },
    {
      id: 'visual_review',
      label: 'Visual review completed',
      description: 'Document has been visually reviewed for missed content',
      required: true,
    },
  ];
}

/**
 * Generate verification report text
 */
export function generateVerificationReport(result: VerificationResult): string {
  const lines: string[] = [
    '=== Redaction Verification Report ===',
    '',
    `Status: ${result.passed ? 'PASSED' : 'FAILED'}`,
    `Verified At: ${new Date(result.verifiedAt).toISOString()}`,
    '',
    'Summary:',
    result.summary,
    '',
  ];

  if (result.issues.length > 0) {
    lines.push('Issues Found:');
    lines.push('');

    for (const issue of result.issues) {
      const severityIcon =
        issue.severity === 'error' ? '[ERROR]' : issue.severity === 'warning' ? '[WARN]' : '[INFO]';

      lines.push(`${severityIcon} ${issue.description}`);
      if (issue.pageIndex !== undefined) {
        lines.push(`  Page: ${issue.pageIndex + 1}`);
      }
      lines.push(`  Recommendation: ${issue.recommendation}`);
      lines.push('');
    }
  } else {
    lines.push('No issues found.');
  }

  lines.push('');
  lines.push('=== End of Report ===');

  return lines.join('\n');
}
