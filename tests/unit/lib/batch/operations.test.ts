/**
 * Tests for Batch Operations
 */

import { describe, it, expect } from 'vitest';
import {
  estimateCompression,
  isCompressionWorthwhile,
  getCompressionSummary,
} from '@/lib/batch/operations/batchCompress';
import {
  validateMergeOptions,
} from '@/lib/batch/operations/batchMerge';
import {
  validateSplitOptions,
} from '@/lib/batch/operations/batchSplit';
import {
  validateWatermarkOptions,
  WATERMARK_PRESETS,
} from '@/lib/batch/operations/batchWatermark';
import {
  validateOCROptions,
  getAvailableLanguages,
  estimateOCRTime,
  getPreprocessingForAccuracy,
} from '@/lib/batch/operations/batchOCR';
import type { OutputFileInfo } from '@/types/batch';

describe('Batch Compress Operations', () => {
  describe('estimateCompression', () => {
    it('should estimate compression for low quality', () => {
      const result = estimateCompression(1000000, 'low');

      expect(result.estimatedSize).toBeLessThan(1000000);
      expect(result.estimatedRatio).toBeGreaterThan(0);
    });

    it('should estimate compression for maximum quality', () => {
      const result = estimateCompression(1000000, 'maximum');

      expect(result.estimatedSize).toBeGreaterThan(800000);
      expect(result.estimatedRatio).toBeLessThan(20);
    });

    it('should have higher ratio for lower quality', () => {
      const lowResult = estimateCompression(1000000, 'low');
      const highResult = estimateCompression(1000000, 'high');

      expect(lowResult.estimatedRatio).toBeGreaterThan(highResult.estimatedRatio);
    });
  });

  describe('isCompressionWorthwhile', () => {
    it('should return true for significant compression', () => {
      expect(isCompressionWorthwhile(1000000, 800000)).toBe(true); // 20% savings
    });

    it('should return false for minimal compression', () => {
      expect(isCompressionWorthwhile(1000000, 970000)).toBe(false); // 3% savings
    });

    it('should respect custom threshold', () => {
      expect(isCompressionWorthwhile(1000000, 900000, 15)).toBe(false); // 10% < 15%
      expect(isCompressionWorthwhile(1000000, 800000, 15)).toBe(true); // 20% > 15%
    });
  });

  describe('getCompressionSummary', () => {
    it('should calculate summary for empty results', () => {
      const summary = getCompressionSummary([]);

      expect(summary.totalOriginalSize).toBe(0);
      expect(summary.totalCompressedSize).toBe(0);
      expect(summary.overallRatio).toBe(0);
    });

    it('should calculate summary for multiple results', () => {
      const results: OutputFileInfo[] = [
        { inputPath: 'a.pdf', outputPath: 'a_c.pdf', inputSize: 1000000, outputSize: 800000, processingTime: 1000 },
        { inputPath: 'b.pdf', outputPath: 'b_c.pdf', inputSize: 2000000, outputSize: 1500000, processingTime: 2000 },
      ];

      const summary = getCompressionSummary(results);

      expect(summary.totalOriginalSize).toBe(3000000);
      expect(summary.totalCompressedSize).toBe(2300000);
      expect(summary.overallRatio).toBeCloseTo(23.33, 1);
      expect(summary.bestRatio).toBeGreaterThan(summary.worstRatio);
    });
  });
});

describe('Batch Merge Operations', () => {
  describe('validateMergeOptions', () => {
    it('should validate valid merge options', () => {
      const result = validateMergeOptions({
        outputName: 'merged',
        strategy: 'append',
        addBookmarks: true,
        bookmarkLevel: 1,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require output name', () => {
      const result = validateMergeOptions({
        strategy: 'append',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Output name is required');
    });

    it('should reject invalid output name', () => {
      const result = validateMergeOptions({
        outputName: 'invalid/name.pdf',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Output name contains invalid characters');
    });

    it('should reject invalid strategy', () => {
      const result = validateMergeOptions({
        outputName: 'merged',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strategy: 'invalid' as any,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid merge strategy');
    });
  });
});

describe('Batch Split Operations', () => {
  describe('validateSplitOptions', () => {
    it('should validate page count split', () => {
      const result = validateSplitOptions({
        method: 'page-count',
        pagesPerFile: 10,
      });

      expect(result.valid).toBe(true);
    });

    it('should require pages per file for page-count method', () => {
      const result = validateSplitOptions({
        method: 'page-count',
        pagesPerFile: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pages per file must be at least 1');
    });

    it('should validate file size split', () => {
      const result = validateSplitOptions({
        method: 'file-size',
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });

      expect(result.valid).toBe(true);
    });

    it('should require minimum file size', () => {
      const result = validateSplitOptions({
        method: 'file-size',
        maxFileSize: 500, // 500 bytes
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max file size must be at least 1KB');
    });

    it('should require ranges for range method', () => {
      const result = validateSplitOptions({
        method: 'range',
        ranges: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one page range is required');
    });
  });
});

describe('Batch Watermark Operations', () => {
  describe('validateWatermarkOptions', () => {
    it('should validate valid watermark options', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        opacity: 0.3,
        rotation: -45,
        scale: 1,
        fontSize: 72,
        fontColor: '#888888',
      });

      expect(result.valid).toBe(true);
    });

    it('should require watermark content', () => {
      const result = validateWatermarkOptions({
        content: '',
        opacity: 0.3,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Watermark content is required');
    });

    it('should validate opacity range', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        opacity: 1.5,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Opacity must be between 0 and 1');
    });

    it('should validate rotation range', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        rotation: 500,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rotation must be between -360 and 360');
    });

    it('should validate font color format', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        fontColor: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid font color format (use #RRGGBB)');
    });

    it('should require custom position when position is custom', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        position: 'custom',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Custom position coordinates are required');
    });
  });

  describe('WATERMARK_PRESETS', () => {
    it('should have draft preset', () => {
      expect(WATERMARK_PRESETS.draft).toBeDefined();
      expect(WATERMARK_PRESETS.draft.content).toBe('DRAFT');
    });

    it('should have confidential preset', () => {
      expect(WATERMARK_PRESETS.confidential).toBeDefined();
      expect(WATERMARK_PRESETS.confidential.content).toBe('CONFIDENTIAL');
      expect(WATERMARK_PRESETS.confidential.fontColor).toBe('#cc0000');
    });

    it('should have valid opacity in all presets', () => {
      Object.values(WATERMARK_PRESETS).forEach((preset) => {
        expect(preset.opacity).toBeGreaterThanOrEqual(0);
        expect(preset.opacity).toBeLessThanOrEqual(1);
      });
    });
  });
});

describe('Batch OCR Operations', () => {
  describe('validateOCROptions', () => {
    it('should validate valid OCR options', () => {
      const result = validateOCROptions({
        language: 'eng',
        outputFormat: 'searchable-pdf',
        accuracy: 'balanced',
      });

      expect(result.valid).toBe(true);
    });

    it('should require language', () => {
      const result = validateOCROptions({
        outputFormat: 'searchable-pdf',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OCR language is required');
    });

    it('should validate output format', () => {
      const result = validateOCROptions({
        language: 'eng',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outputFormat: 'invalid' as any,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid output format');
    });

    it('should validate accuracy setting', () => {
      const result = validateOCROptions({
        language: 'eng',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accuracy: 'invalid' as any,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid accuracy setting');
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages', () => {
      const languages = getAvailableLanguages();

      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.some((l) => l.code === 'eng')).toBe(true);
    });

    it('should have English as a language', () => {
      const languages = getAvailableLanguages();
      const english = languages.find((l) => l.code === 'eng');

      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
    });
  });

  describe('estimateOCRTime', () => {
    it('should estimate time for fast accuracy', () => {
      const time = estimateOCRTime(10, 'fast');
      expect(time).toBe(20000); // 10 pages * 2000ms
    });

    it('should estimate time for best accuracy', () => {
      const time = estimateOCRTime(10, 'best');
      expect(time).toBe(80000); // 10 pages * 8000ms
    });

    it('should scale with page count', () => {
      const time5 = estimateOCRTime(5, 'balanced');
      const time10 = estimateOCRTime(10, 'balanced');

      expect(time10).toBe(time5 * 2);
    });
  });

  describe('getPreprocessingForAccuracy', () => {
    it('should return minimal preprocessing for fast', () => {
      const preprocessing = getPreprocessingForAccuracy('fast');

      expect(preprocessing.deskew).toBe(false);
      expect(preprocessing.denoise).toBe(false);
      expect(preprocessing.contrast).toBe(false);
    });

    it('should return full preprocessing for best', () => {
      const preprocessing = getPreprocessingForAccuracy('best');

      expect(preprocessing.deskew).toBe(true);
      expect(preprocessing.denoise).toBe(true);
      expect(preprocessing.contrast).toBe(true);
    });

    it('should return balanced preprocessing', () => {
      const preprocessing = getPreprocessingForAccuracy('balanced');

      expect(preprocessing.deskew).toBe(true);
      expect(preprocessing.denoise).toBe(false);
      expect(preprocessing.contrast).toBe(true);
    });
  });
});
