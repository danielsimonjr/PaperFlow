/**
 * Tests for Bates Numbering Module
 */

import { describe, it, expect } from 'vitest';
import {
  formatBatesNumber,
  getNextBatesNumber,
  createBatesState,
  resetBatesState,
  calculateBatesPosition,
  estimateBatesTextDimensions,
  validateBatesOptions,
  mergeBatesOptions,
  generateBatesPreview,
  calculateLastBatesNumber,
  parseBatesNumber,
  createBatesOperationData,
  getBatesPreset,
  shouldApplyBatesToPage,
  BATES_PRESETS,
  DEFAULT_BATES_OPTIONS,
} from '@/lib/batch/batesNumber';
import type { BatesState, BatesNumberOptions } from '@/lib/batch/batesNumber';

describe('Bates Numbering Module', () => {
  describe('formatBatesNumber', () => {
    it('should format with zero padding', () => {
      expect(formatBatesNumber(1, '', '', 6)).toBe('000001');
      expect(formatBatesNumber(123, '', '', 6)).toBe('000123');
      expect(formatBatesNumber(123456, '', '', 6)).toBe('123456');
    });

    it('should include prefix', () => {
      expect(formatBatesNumber(1, 'ABC-', '', 4)).toBe('ABC-0001');
    });

    it('should include suffix', () => {
      expect(formatBatesNumber(1, '', '-XYZ', 4)).toBe('0001-XYZ');
    });

    it('should include prefix and suffix', () => {
      expect(formatBatesNumber(42, 'DOC-', '-v1', 5)).toBe('DOC-00042-v1');
    });

    it('should handle numbers exceeding digits', () => {
      expect(formatBatesNumber(1234567, '', '', 4)).toBe('1234567');
    });
  });

  describe('createBatesState', () => {
    it('should create initial state', () => {
      const state = createBatesState(100);

      expect(state.currentNumber).toBe(100);
      expect(state.processedPages).toBe(0);
      expect(state.startNumber).toBe(100);
    });
  });

  describe('getNextBatesNumber', () => {
    it('should increment state', () => {
      const state = createBatesState(1);
      const next = getNextBatesNumber(state, 1);

      expect(next.currentNumber).toBe(2);
      expect(next.processedPages).toBe(1);
    });

    it('should increment by custom amount', () => {
      const state = createBatesState(1);
      const next = getNextBatesNumber(state, 10);

      expect(next.currentNumber).toBe(11);
    });
  });

  describe('resetBatesState', () => {
    it('should reset to starting number', () => {
      const state: BatesState = {
        currentNumber: 500,
        processedPages: 10,
        startNumber: 100,
      };

      const reset = resetBatesState(state);

      expect(reset.currentNumber).toBe(100);
      expect(reset.processedPages).toBe(0);
      expect(reset.startNumber).toBe(100);
    });
  });

  describe('calculateBatesPosition', () => {
    const pageWidth = 612;
    const pageHeight = 792;
    const margins = { top: 50, right: 50, bottom: 50, left: 50 };
    const textWidth = 100;
    const textHeight = 12;

    it('should calculate top-left position', () => {
      const pos = calculateBatesPosition(
        'top-left',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe(50); // left margin
      expect(pos.y).toBe(792 - 50 - 12); // pageHeight - margin - textHeight
    });

    it('should calculate top-center position', () => {
      const pos = calculateBatesPosition(
        'top-center',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe((612 - 100) / 2); // center
    });

    it('should calculate top-right position', () => {
      const pos = calculateBatesPosition(
        'top-right',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe(612 - 50 - 100); // pageWidth - margin - textWidth
    });

    it('should calculate bottom-left position', () => {
      const pos = calculateBatesPosition(
        'bottom-left',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe(50);
      expect(pos.y).toBe(50); // bottom margin
    });

    it('should calculate bottom-center position', () => {
      const pos = calculateBatesPosition(
        'bottom-center',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe((612 - 100) / 2);
      expect(pos.y).toBe(50);
    });

    it('should calculate bottom-right position', () => {
      const pos = calculateBatesPosition(
        'bottom-right',
        pageWidth,
        pageHeight,
        margins,
        textWidth,
        textHeight
      );

      expect(pos.x).toBe(612 - 50 - 100);
      expect(pos.y).toBe(50);
    });
  });

  describe('estimateBatesTextDimensions', () => {
    it('should estimate dimensions based on text and font size', () => {
      const dims = estimateBatesTextDimensions('ABC-000001', 10);

      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
      expect(dims.height).toBe(12); // fontSize * 1.2
    });

    it('should scale with font size', () => {
      const small = estimateBatesTextDimensions('TEST', 10);
      const large = estimateBatesTextDimensions('TEST', 20);

      expect(large.width).toBeGreaterThan(small.width);
      expect(large.height).toBeGreaterThan(small.height);
    });
  });

  describe('validateBatesOptions', () => {
    it('should accept valid options', () => {
      const result = validateBatesOptions({
        startNumber: 1,
        digits: 6,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject negative start number', () => {
      const result = validateBatesOptions({ startNumber: -1 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Start number must be non-negative');
    });

    it('should reject invalid digits count', () => {
      expect(validateBatesOptions({ digits: 0 }).valid).toBe(false);
      expect(validateBatesOptions({ digits: 21 }).valid).toBe(false);
    });

    it('should reject zero increment', () => {
      const result = validateBatesOptions({ increment: 0 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Increment cannot be zero');
    });

    it('should reject too long prefix', () => {
      const result = validateBatesOptions({ prefix: 'x'.repeat(51) });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prefix is too long (max 50 characters)');
    });

    it('should reject too long suffix', () => {
      const result = validateBatesOptions({ suffix: 'x'.repeat(51) });

      expect(result.valid).toBe(false);
    });
  });

  describe('mergeBatesOptions', () => {
    it('should merge with defaults', () => {
      const merged = mergeBatesOptions({ prefix: 'ABC' });

      expect(merged.prefix).toBe('ABC');
      expect(merged.suffix).toBe('');
      expect(merged.digits).toBe(6);
      expect(merged.startNumber).toBe(1);
    });

    it('should preserve nested options', () => {
      const merged = mergeBatesOptions({
        font: { size: 14 } as any,
      });

      expect(merged.font.size).toBe(14);
      expect(merged.font.family).toBeDefined();
    });
  });

  describe('generateBatesPreview', () => {
    it('should generate preview for pages', () => {
      const options = mergeBatesOptions({
        prefix: 'ABC-',
        startNumber: 1,
        digits: 4,
      });

      const preview = generateBatesPreview(options, 10, 3);

      expect(preview).toHaveLength(3);
      expect(preview[0]).toBe('ABC-0001');
      expect(preview[1]).toBe('ABC-0002');
      expect(preview[2]).toBe('ABC-0003');
    });

    it('should limit preview to page count', () => {
      const options = mergeBatesOptions({});
      const preview = generateBatesPreview(options, 3, 10);

      expect(preview).toHaveLength(3);
    });
  });

  describe('calculateLastBatesNumber', () => {
    it('should calculate last number', () => {
      expect(calculateLastBatesNumber(1, 10, 1)).toBe(10);
      expect(calculateLastBatesNumber(100, 5, 1)).toBe(104);
      expect(calculateLastBatesNumber(1, 10, 10)).toBe(91);
    });
  });

  describe('parseBatesNumber', () => {
    it('should parse Bates number string', () => {
      expect(parseBatesNumber('ABC-000123-XYZ', 'ABC-', '-XYZ')).toBe(123);
    });

    it('should handle prefix only', () => {
      expect(parseBatesNumber('DOC-0001', 'DOC-', '')).toBe(1);
    });

    it('should handle suffix only', () => {
      expect(parseBatesNumber('0001-v1', '', '-v1')).toBe(1);
    });

    it('should return null for invalid string', () => {
      expect(parseBatesNumber('invalid', '', '')).toBe(null);
    });
  });

  describe('createBatesOperationData', () => {
    it('should create operation data for page', () => {
      const options = mergeBatesOptions({
        prefix: 'ABC-',
        digits: 4,
        position: 'bottom-right',
      });
      const state = createBatesState(1);

      const data = createBatesOperationData(options, 0, 612, 792, state);

      expect(data.text).toBe('ABC-0001');
      expect(data.position).toBeDefined();
      expect(data.font).toBeDefined();
      expect(data.nextState.currentNumber).toBe(2);
    });
  });

  describe('getBatesPreset', () => {
    it('should return legal preset', () => {
      const preset = getBatesPreset('legal');

      expect(preset.prefix).toBe('ABC');
      expect(preset.digits).toBe(6);
    });

    it('should return confidential preset', () => {
      const preset = getBatesPreset('confidential');

      expect(preset.prefix).toBe('CONF-');
    });

    it('should return exhibit preset', () => {
      const preset = getBatesPreset('exhibit');

      expect(preset.prefix).toBe('EX-');
    });

    it('should return production preset', () => {
      const preset = getBatesPreset('production');

      expect(preset.prefix).toBe('PROD');
    });
  });

  describe('BATES_PRESETS', () => {
    it('should have all expected presets', () => {
      expect(BATES_PRESETS.legal).toBeDefined();
      expect(BATES_PRESETS.confidential).toBeDefined();
      expect(BATES_PRESETS.exhibit).toBeDefined();
      expect(BATES_PRESETS.production).toBeDefined();
    });
  });

  describe('shouldApplyBatesToPage', () => {
    it('should return true for all pages when type is all', () => {
      expect(shouldApplyBatesToPage(0, { type: 'all' }, 10)).toBe(true);
      expect(shouldApplyBatesToPage(5, { type: 'all' }, 10)).toBe(true);
    });

    it('should return true for even pages', () => {
      expect(shouldApplyBatesToPage(1, { type: 'even' }, 10)).toBe(true); // page 2
      expect(shouldApplyBatesToPage(0, { type: 'even' }, 10)).toBe(false); // page 1
    });

    it('should return true for odd pages', () => {
      expect(shouldApplyBatesToPage(0, { type: 'odd' }, 10)).toBe(true); // page 1
      expect(shouldApplyBatesToPage(1, { type: 'odd' }, 10)).toBe(false); // page 2
    });

    it('should handle custom pages array', () => {
      const range = { type: 'custom' as const, pages: [1, 3, 5] };
      expect(shouldApplyBatesToPage(0, range, 10)).toBe(true); // page 1
      expect(shouldApplyBatesToPage(2, range, 10)).toBe(true); // page 3
      expect(shouldApplyBatesToPage(1, range, 10)).toBe(false); // page 2
    });

    it('should handle custom range', () => {
      const range = { type: 'custom' as const, start: 2, end: 5 };
      expect(shouldApplyBatesToPage(1, range, 10)).toBe(true); // page 2
      expect(shouldApplyBatesToPage(4, range, 10)).toBe(true); // page 5
      expect(shouldApplyBatesToPage(5, range, 10)).toBe(false); // page 6
    });
  });

  describe('DEFAULT_BATES_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_BATES_OPTIONS.prefix).toBe('');
      expect(DEFAULT_BATES_OPTIONS.suffix).toBe('');
      expect(DEFAULT_BATES_OPTIONS.startNumber).toBe(1);
      expect(DEFAULT_BATES_OPTIONS.digits).toBe(6);
      expect(DEFAULT_BATES_OPTIONS.increment).toBe(1);
      expect(DEFAULT_BATES_OPTIONS.position).toBe('bottom-right');
    });
  });
});
