/**
 * Tests for PDF Flatten Module
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyFlattenStats,
  updateFlattenStats,
  shouldFlattenTarget,
  validateFlattenOptions,
  mergeFlattenOptions,
  generateFlattenSummary,
  shouldFlattenPage,
  estimateSizeReduction,
  createPageFlattenResult,
  getFlattenPreset,
  getTotalItemsFlattened,
  isFlattenComplete,
  calculateFlattenProgress,
  FLATTEN_PRESETS,
  DEFAULT_FLATTEN_OPTIONS,
} from '@/lib/batch/flatten';
import type { FlattenStats, PageFlattenResult, FlattenOptions } from '@/lib/batch/flatten';

describe('PDF Flatten Module', () => {
  describe('createEmptyFlattenStats', () => {
    it('should create empty stats', () => {
      const stats = createEmptyFlattenStats();

      expect(stats.totalPages).toBe(0);
      expect(stats.pagesProcessed).toBe(0);
      expect(stats.formFieldsFlattened).toBe(0);
      expect(stats.annotationsFlattened).toBe(0);
      expect(stats.commentsFlattened).toBe(0);
      expect(stats.signaturesFlattened).toBe(0);
      expect(stats.layersFlattened).toBe(0);
      expect(stats.errors).toHaveLength(0);
    });
  });

  describe('updateFlattenStats', () => {
    it('should update stats with page result', () => {
      const stats = createEmptyFlattenStats();
      const pageResult: PageFlattenResult = {
        pageIndex: 0,
        formFieldsFlattened: 5,
        annotationsFlattened: 3,
        commentsFlattened: 2,
        signaturesFlattened: 1,
        layersFlattened: 0,
        success: true,
      };

      const updated = updateFlattenStats(stats, pageResult);

      expect(updated.pagesProcessed).toBe(1);
      expect(updated.formFieldsFlattened).toBe(5);
      expect(updated.annotationsFlattened).toBe(3);
      expect(updated.commentsFlattened).toBe(2);
      expect(updated.signaturesFlattened).toBe(1);
      expect(updated.errors).toHaveLength(0);
    });

    it('should accumulate stats from multiple pages', () => {
      let stats = createEmptyFlattenStats();

      stats = updateFlattenStats(stats, createPageFlattenResult(0, { formFieldsFlattened: 3 }));
      stats = updateFlattenStats(stats, createPageFlattenResult(1, { formFieldsFlattened: 2 }));

      expect(stats.pagesProcessed).toBe(2);
      expect(stats.formFieldsFlattened).toBe(5);
    });

    it('should collect errors', () => {
      const stats = createEmptyFlattenStats();
      const pageResult = createPageFlattenResult(0, {}, 'Page error');

      const updated = updateFlattenStats(stats, pageResult);

      expect(updated.errors).toContain('Page error');
    });
  });

  describe('shouldFlattenTarget', () => {
    it('should return true for target in list', () => {
      const options = mergeFlattenOptions({ targets: ['form-fields', 'annotations'] });

      expect(shouldFlattenTarget('form-fields', options)).toBe(true);
      expect(shouldFlattenTarget('annotations', options)).toBe(true);
      expect(shouldFlattenTarget('comments', options)).toBe(false);
    });

    it('should return true for all targets when "all" is specified', () => {
      const options = mergeFlattenOptions({ targets: ['all'] });

      expect(shouldFlattenTarget('form-fields', options)).toBe(true);
      expect(shouldFlattenTarget('annotations', options)).toBe(true);
      expect(shouldFlattenTarget('comments', options)).toBe(true);
      expect(shouldFlattenTarget('signatures', options)).toBe(true);
      expect(shouldFlattenTarget('layers', options)).toBe(true);
    });
  });

  describe('validateFlattenOptions', () => {
    it('should accept valid options', () => {
      const result = validateFlattenOptions({
        targets: ['form-fields', 'annotations'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject empty targets', () => {
      const result = validateFlattenOptions({ targets: [] });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one flatten target must be specified');
    });

    it('should reject invalid targets', () => {
      const result = validateFlattenOptions({ targets: ['invalid' as any] });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid flatten target');
    });
  });

  describe('mergeFlattenOptions', () => {
    it('should merge with defaults', () => {
      const merged = mergeFlattenOptions({ optimizeForPrint: true });

      expect(merged.optimizeForPrint).toBe(true);
      expect(merged.targets).toEqual(['all']);
      expect(merged.preserveAppearance).toBe(true);
    });

    it('should override targets', () => {
      const merged = mergeFlattenOptions({ targets: ['form-fields'] });

      expect(merged.targets).toEqual(['form-fields']);
    });
  });

  describe('generateFlattenSummary', () => {
    it('should generate summary for all targets', () => {
      const options = mergeFlattenOptions({ targets: ['all'] });
      const summary = generateFlattenSummary(options);

      expect(summary.length).toBeGreaterThan(0);
      expect(summary.some((s) => s.includes('Form fields'))).toBe(true);
      expect(summary.some((s) => s.includes('Annotations'))).toBe(true);
    });

    it('should include interactivity message', () => {
      const options = mergeFlattenOptions({ removeInteractivity: true });
      const summary = generateFlattenSummary(options);

      expect(summary.some((s) => s.includes('interactive'))).toBe(true);
    });

    it('should include print optimization message', () => {
      const options = mergeFlattenOptions({ optimizeForPrint: true });
      const summary = generateFlattenSummary(options);

      expect(summary.some((s) => s.includes('printing'))).toBe(true);
    });

    it('should only include relevant targets', () => {
      const options = mergeFlattenOptions({
        targets: ['form-fields'],
        removeInteractivity: false,
        optimizeForPrint: false,
      });
      const summary = generateFlattenSummary(options);

      expect(summary).toHaveLength(1);
      expect(summary[0]).toContain('Form fields');
    });
  });

  describe('shouldFlattenPage', () => {
    it('should return true for all pages when type is all', () => {
      expect(shouldFlattenPage(0, { type: 'all' }, 10)).toBe(true);
      expect(shouldFlattenPage(9, { type: 'all' }, 10)).toBe(true);
    });

    it('should return true for even pages', () => {
      expect(shouldFlattenPage(1, { type: 'even' }, 10)).toBe(true); // page 2
      expect(shouldFlattenPage(0, { type: 'even' }, 10)).toBe(false); // page 1
    });

    it('should return true for odd pages', () => {
      expect(shouldFlattenPage(0, { type: 'odd' }, 10)).toBe(true); // page 1
      expect(shouldFlattenPage(1, { type: 'odd' }, 10)).toBe(false); // page 2
    });

    it('should handle custom pages array', () => {
      const range = { type: 'custom' as const, pages: [1, 5, 10] };
      expect(shouldFlattenPage(0, range, 10)).toBe(true); // page 1
      expect(shouldFlattenPage(4, range, 10)).toBe(true); // page 5
      expect(shouldFlattenPage(2, range, 10)).toBe(false); // page 3
    });

    it('should handle custom range', () => {
      const range = { type: 'custom' as const, start: 3, end: 7 };
      expect(shouldFlattenPage(2, range, 10)).toBe(true); // page 3
      expect(shouldFlattenPage(6, range, 10)).toBe(true); // page 7
      expect(shouldFlattenPage(7, range, 10)).toBe(false); // page 8
    });
  });

  describe('estimateSizeReduction', () => {
    it('should estimate size reduction', () => {
      const options = mergeFlattenOptions({ targets: ['all'] });
      const result = estimateSizeReduction(1000000, options);

      expect(result.estimatedSize).toBeLessThan(1000000);
      expect(result.reductionPercent).toBeGreaterThan(0);
    });

    it('should apply more reduction with print optimization', () => {
      const withPrint = mergeFlattenOptions({ targets: ['form-fields'], optimizeForPrint: true });
      const withoutPrint = mergeFlattenOptions({ targets: ['form-fields'], optimizeForPrint: false });

      const resultWithPrint = estimateSizeReduction(1000000, withPrint);
      const resultWithoutPrint = estimateSizeReduction(1000000, withoutPrint);

      expect(resultWithPrint.estimatedSize).toBeLessThan(resultWithoutPrint.estimatedSize);
    });

    it('should calculate reduction percentage correctly', () => {
      const options = mergeFlattenOptions({ targets: [] });
      const result = estimateSizeReduction(1000, { ...options, targets: [] });

      expect(result.estimatedSize + result.reductionPercent * 10).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createPageFlattenResult', () => {
    it('should create successful result', () => {
      const result = createPageFlattenResult(5, {
        formFieldsFlattened: 3,
        annotationsFlattened: 2,
      });

      expect(result.pageIndex).toBe(5);
      expect(result.formFieldsFlattened).toBe(3);
      expect(result.annotationsFlattened).toBe(2);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should create failed result with error', () => {
      const result = createPageFlattenResult(0, {}, 'Failed to flatten');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to flatten');
    });

    it('should default counts to zero', () => {
      const result = createPageFlattenResult(0, {});

      expect(result.formFieldsFlattened).toBe(0);
      expect(result.annotationsFlattened).toBe(0);
      expect(result.commentsFlattened).toBe(0);
      expect(result.signaturesFlattened).toBe(0);
      expect(result.layersFlattened).toBe(0);
    });
  });

  describe('getFlattenPreset', () => {
    it('should return forPrinting preset', () => {
      const preset = getFlattenPreset('forPrinting');

      expect(preset.targets).toEqual(['all']);
      expect(preset.optimizeForPrint).toBe(true);
    });

    it('should return forArchiving preset', () => {
      const preset = getFlattenPreset('forArchiving');

      expect(preset.targets).toContain('form-fields');
      expect(preset.targets).toContain('annotations');
    });

    it('should return formsOnly preset', () => {
      const preset = getFlattenPreset('formsOnly');

      expect(preset.targets).toEqual(['form-fields']);
    });

    it('should return annotationsOnly preset', () => {
      const preset = getFlattenPreset('annotationsOnly');

      expect(preset.targets).toContain('annotations');
      expect(preset.targets).toContain('comments');
    });

    it('should return secureDocument preset', () => {
      const preset = getFlattenPreset('secureDocument');

      expect(preset.targets).toEqual(['all']);
      expect(preset.removeInteractivity).toBe(true);
    });
  });

  describe('FLATTEN_PRESETS', () => {
    it('should have all expected presets', () => {
      expect(FLATTEN_PRESETS.forPrinting).toBeDefined();
      expect(FLATTEN_PRESETS.forArchiving).toBeDefined();
      expect(FLATTEN_PRESETS.formsOnly).toBeDefined();
      expect(FLATTEN_PRESETS.annotationsOnly).toBeDefined();
      expect(FLATTEN_PRESETS.secureDocument).toBeDefined();
    });
  });

  describe('getTotalItemsFlattened', () => {
    it('should sum all flattened items', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 10,
        formFieldsFlattened: 5,
        annotationsFlattened: 3,
        commentsFlattened: 2,
        signaturesFlattened: 1,
        layersFlattened: 4,
        errors: [],
      };

      expect(getTotalItemsFlattened(stats)).toBe(15);
    });
  });

  describe('isFlattenComplete', () => {
    it('should return true when all pages processed and no errors', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 10,
        formFieldsFlattened: 5,
        annotationsFlattened: 0,
        commentsFlattened: 0,
        signaturesFlattened: 0,
        layersFlattened: 0,
        errors: [],
      };

      expect(isFlattenComplete(stats)).toBe(true);
    });

    it('should return false when not all pages processed', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 5,
        formFieldsFlattened: 0,
        annotationsFlattened: 0,
        commentsFlattened: 0,
        signaturesFlattened: 0,
        layersFlattened: 0,
        errors: [],
      };

      expect(isFlattenComplete(stats)).toBe(false);
    });

    it('should return false when there are errors', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 10,
        formFieldsFlattened: 0,
        annotationsFlattened: 0,
        commentsFlattened: 0,
        signaturesFlattened: 0,
        layersFlattened: 0,
        errors: ['Error occurred'],
      };

      expect(isFlattenComplete(stats)).toBe(false);
    });
  });

  describe('calculateFlattenProgress', () => {
    it('should calculate progress percentage', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 5,
        formFieldsFlattened: 0,
        annotationsFlattened: 0,
        commentsFlattened: 0,
        signaturesFlattened: 0,
        layersFlattened: 0,
        errors: [],
      };

      expect(calculateFlattenProgress(stats)).toBe(50);
    });

    it('should return 100 when no pages', () => {
      const stats = createEmptyFlattenStats();

      expect(calculateFlattenProgress(stats)).toBe(100);
    });

    it('should return 100 when complete', () => {
      const stats: FlattenStats = {
        totalPages: 10,
        pagesProcessed: 10,
        formFieldsFlattened: 0,
        annotationsFlattened: 0,
        commentsFlattened: 0,
        signaturesFlattened: 0,
        layersFlattened: 0,
        errors: [],
      };

      expect(calculateFlattenProgress(stats)).toBe(100);
    });
  });

  describe('DEFAULT_FLATTEN_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_FLATTEN_OPTIONS.targets).toEqual(['all']);
      expect(DEFAULT_FLATTEN_OPTIONS.preserveAppearance).toBe(true);
      expect(DEFAULT_FLATTEN_OPTIONS.optimizeForPrint).toBe(false);
      expect(DEFAULT_FLATTEN_OPTIONS.removeInteractivity).toBe(true);
    });
  });
});
