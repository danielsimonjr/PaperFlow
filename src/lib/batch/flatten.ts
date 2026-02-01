/**
 * PDF Flatten Module
 * Flattens form fields, annotations, and layers in PDFs.
 */

import type { PageRange } from './types';

/**
 * Types of content that can be flattened
 */
export type FlattenTarget =
  | 'form-fields'
  | 'annotations'
  | 'comments'
  | 'signatures'
  | 'layers'
  | 'all';

/**
 * Flatten options
 */
export interface FlattenOptions {
  targets: FlattenTarget[];
  preserveAppearance: boolean;
  optimizeForPrint: boolean;
  removeInteractivity: boolean;
  pages: PageRange;
}

/**
 * Default flatten options
 */
export const DEFAULT_FLATTEN_OPTIONS: FlattenOptions = {
  targets: ['all'],
  preserveAppearance: true,
  optimizeForPrint: false,
  removeInteractivity: true,
  pages: { type: 'all' },
};

/**
 * Flatten result for a single page
 */
export interface PageFlattenResult {
  pageIndex: number;
  formFieldsFlattened: number;
  annotationsFlattened: number;
  commentsFlattened: number;
  signaturesFlattened: number;
  layersFlattened: number;
  success: boolean;
  error?: string;
}

/**
 * Flatten statistics
 */
export interface FlattenStats {
  totalPages: number;
  pagesProcessed: number;
  formFieldsFlattened: number;
  annotationsFlattened: number;
  commentsFlattened: number;
  signaturesFlattened: number;
  layersFlattened: number;
  errors: string[];
}

/**
 * Create empty flatten stats
 */
export function createEmptyFlattenStats(): FlattenStats {
  return {
    totalPages: 0,
    pagesProcessed: 0,
    formFieldsFlattened: 0,
    annotationsFlattened: 0,
    commentsFlattened: 0,
    signaturesFlattened: 0,
    layersFlattened: 0,
    errors: [],
  };
}

/**
 * Update stats with page result
 */
export function updateFlattenStats(
  stats: FlattenStats,
  pageResult: PageFlattenResult
): FlattenStats {
  return {
    ...stats,
    pagesProcessed: stats.pagesProcessed + 1,
    formFieldsFlattened: stats.formFieldsFlattened + pageResult.formFieldsFlattened,
    annotationsFlattened: stats.annotationsFlattened + pageResult.annotationsFlattened,
    commentsFlattened: stats.commentsFlattened + pageResult.commentsFlattened,
    signaturesFlattened: stats.signaturesFlattened + pageResult.signaturesFlattened,
    layersFlattened: stats.layersFlattened + pageResult.layersFlattened,
    errors: pageResult.error
      ? [...stats.errors, pageResult.error]
      : stats.errors,
  };
}

/**
 * Check if a target should be flattened based on options
 */
export function shouldFlattenTarget(
  target: FlattenTarget,
  options: FlattenOptions
): boolean {
  if (options.targets.includes('all')) {
    return true;
  }
  return options.targets.includes(target);
}

/**
 * Validate flatten options
 */
export function validateFlattenOptions(
  options: Partial<FlattenOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.targets && options.targets.length === 0) {
    errors.push('At least one flatten target must be specified');
  }

  const validTargets: FlattenTarget[] = [
    'form-fields',
    'annotations',
    'comments',
    'signatures',
    'layers',
    'all',
  ];

  if (options.targets) {
    for (const target of options.targets) {
      if (!validTargets.includes(target)) {
        errors.push(`Invalid flatten target: ${target}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge flatten options with defaults
 */
export function mergeFlattenOptions(
  options: Partial<FlattenOptions>
): FlattenOptions {
  return {
    ...DEFAULT_FLATTEN_OPTIONS,
    ...options,
    targets: options.targets || DEFAULT_FLATTEN_OPTIONS.targets,
    pages: options.pages || DEFAULT_FLATTEN_OPTIONS.pages,
  };
}

/**
 * Generate a summary of what will be flattened
 */
export function generateFlattenSummary(options: FlattenOptions): string[] {
  const summary: string[] = [];

  if (shouldFlattenTarget('form-fields', options)) {
    summary.push('Form fields will be converted to static content');
  }

  if (shouldFlattenTarget('annotations', options)) {
    summary.push('Annotations will be merged into page content');
  }

  if (shouldFlattenTarget('comments', options)) {
    summary.push('Comments and notes will be flattened');
  }

  if (shouldFlattenTarget('signatures', options)) {
    summary.push('Signature fields will be converted to images');
  }

  if (shouldFlattenTarget('layers', options)) {
    summary.push('PDF layers will be merged into a single layer');
  }

  if (options.removeInteractivity) {
    summary.push('All interactive elements will be removed');
  }

  if (options.optimizeForPrint) {
    summary.push('Document will be optimized for printing');
  }

  return summary;
}

/**
 * Check if a page should be flattened based on page range
 */
export function shouldFlattenPage(
  pageIndex: number, // 0-indexed
  pageRange: PageRange
): boolean {
  const pageNumber = pageIndex + 1; // Convert to 1-indexed

  switch (pageRange.type) {
    case 'all':
      return true;

    case 'even':
      return pageNumber % 2 === 0;

    case 'odd':
      return pageNumber % 2 === 1;

    case 'custom':
      if (pageRange.pages) {
        return pageRange.pages.includes(pageNumber);
      }
      if (pageRange.start !== undefined && pageRange.end !== undefined) {
        return pageNumber >= pageRange.start && pageNumber <= pageRange.end;
      }
      return false;

    default:
      return true;
  }
}

/**
 * Estimate file size reduction from flattening
 */
export function estimateSizeReduction(
  originalSizeBytes: number,
  options: FlattenOptions
): { estimatedSize: number; reductionPercent: number } {
  let reductionFactor = 1.0;

  // Each target typically reduces file size by a certain percentage
  if (shouldFlattenTarget('form-fields', options)) {
    reductionFactor *= 0.95; // 5% reduction
  }

  if (shouldFlattenTarget('annotations', options)) {
    reductionFactor *= 0.93; // 7% reduction
  }

  if (shouldFlattenTarget('comments', options)) {
    reductionFactor *= 0.98; // 2% reduction
  }

  if (shouldFlattenTarget('layers', options)) {
    reductionFactor *= 0.85; // 15% reduction
  }

  if (options.optimizeForPrint) {
    reductionFactor *= 0.90; // 10% additional reduction
  }

  const estimatedSize = Math.round(originalSizeBytes * reductionFactor);
  const reductionPercent = Math.round((1 - reductionFactor) * 100);

  return { estimatedSize, reductionPercent };
}

/**
 * Create a page flatten result
 */
export function createPageFlattenResult(
  pageIndex: number,
  counts: Partial<Omit<PageFlattenResult, 'pageIndex' | 'success' | 'error'>>,
  error?: string
): PageFlattenResult {
  return {
    pageIndex,
    formFieldsFlattened: counts.formFieldsFlattened || 0,
    annotationsFlattened: counts.annotationsFlattened || 0,
    commentsFlattened: counts.commentsFlattened || 0,
    signaturesFlattened: counts.signaturesFlattened || 0,
    layersFlattened: counts.layersFlattened || 0,
    success: !error,
    error,
  };
}

/**
 * Flatten presets for common use cases
 */
export const FLATTEN_PRESETS = {
  forPrinting: {
    targets: ['all'] as FlattenTarget[],
    preserveAppearance: true,
    optimizeForPrint: true,
    removeInteractivity: true,
  },
  forArchiving: {
    targets: ['form-fields', 'annotations', 'comments'] as FlattenTarget[],
    preserveAppearance: true,
    optimizeForPrint: false,
    removeInteractivity: true,
  },
  formsOnly: {
    targets: ['form-fields'] as FlattenTarget[],
    preserveAppearance: true,
    optimizeForPrint: false,
    removeInteractivity: false,
  },
  annotationsOnly: {
    targets: ['annotations', 'comments'] as FlattenTarget[],
    preserveAppearance: true,
    optimizeForPrint: false,
    removeInteractivity: false,
  },
  secureDocument: {
    targets: ['all'] as FlattenTarget[],
    preserveAppearance: true,
    optimizeForPrint: false,
    removeInteractivity: true,
  },
};

/**
 * Get a flatten preset by name
 */
export function getFlattenPreset(
  name: keyof typeof FLATTEN_PRESETS
): Partial<FlattenOptions> {
  return FLATTEN_PRESETS[name];
}

/**
 * Calculate total items flattened from stats
 */
export function getTotalItemsFlattened(stats: FlattenStats): number {
  return (
    stats.formFieldsFlattened +
    stats.annotationsFlattened +
    stats.commentsFlattened +
    stats.signaturesFlattened +
    stats.layersFlattened
  );
}

/**
 * Check if flattening completed successfully
 */
export function isFlattenComplete(stats: FlattenStats): boolean {
  return stats.pagesProcessed >= stats.totalPages && stats.errors.length === 0;
}

/**
 * Generate flatten progress percentage
 */
export function calculateFlattenProgress(stats: FlattenStats): number {
  if (stats.totalPages === 0) return 100;
  return Math.round((stats.pagesProcessed / stats.totalPages) * 100);
}
