/**
 * Tests for Watermark Module
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePositionFromPreset,
  getApplicablePages,
  calculateTextDimensions,
  generateTilePositions,
  applyRotation,
  parseColor,
  validateWatermarkOptions,
  mergeWatermarkOptions,
  createWatermarkOperationData,
  createCustomTemplate,
} from '@/lib/batch/watermark';
import type { PageRange, WatermarkOptions } from '@/lib/batch/types';

describe('Watermark Module', () => {
  describe('calculatePositionFromPreset', () => {
    const pageWidth = 612;
    const pageHeight = 792;
    const contentWidth = 100;
    const contentHeight = 50;

    it('should calculate center position', () => {
      const pos = calculatePositionFromPreset('center', pageWidth, pageHeight, contentWidth, contentHeight);
      expect(pos.x).toBe((pageWidth - contentWidth) / 2);
      expect(pos.y).toBe((pageHeight - contentHeight) / 2);
    });

    it('should calculate top-left position', () => {
      const pos = calculatePositionFromPreset('top-left', pageWidth, pageHeight, contentWidth, contentHeight);
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(pageHeight - 50 - contentHeight);
    });

    it('should calculate bottom-right position', () => {
      const pos = calculatePositionFromPreset('bottom-right', pageWidth, pageHeight, contentWidth, contentHeight);
      expect(pos.x).toBe(pageWidth - 50 - contentWidth);
      expect(pos.y).toBe(50);
    });

    it('should handle all position presets', () => {
      const presets: Array<'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'> = [
        'top-left', 'top-center', 'top-right',
        'center-left', 'center', 'center-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ];

      for (const preset of presets) {
        const pos = calculatePositionFromPreset(preset, pageWidth, pageHeight, contentWidth, contentHeight);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getApplicablePages', () => {
    const totalPages = 10;

    it('should return all pages for "all" type', () => {
      const range: PageRange = { type: 'all' };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toHaveLength(10);
      expect(pages).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should return even pages for "even" type', () => {
      const range: PageRange = { type: 'even' };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toEqual([1, 3, 5, 7, 9]);
    });

    it('should return odd pages for "odd" type', () => {
      const range: PageRange = { type: 'odd' };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toEqual([0, 2, 4, 6, 8]);
    });

    it('should return specified pages for "custom" type with pages array', () => {
      const range: PageRange = { type: 'custom', pages: [1, 3, 5] };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toEqual([0, 2, 4]); // 1-indexed to 0-indexed
    });

    it('should return range for "custom" type with start/end', () => {
      const range: PageRange = { type: 'custom', start: 3, end: 7 };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toEqual([2, 3, 4, 5, 6]);
    });

    it('should filter out invalid page numbers', () => {
      const range: PageRange = { type: 'custom', pages: [0, 5, 15] };
      const pages = getApplicablePages(range, totalPages);
      expect(pages).toEqual([4]); // Only page 5 (index 4) is valid
    });
  });

  describe('calculateTextDimensions', () => {
    it('should calculate dimensions based on text and font', () => {
      const { width, height } = calculateTextDimensions('Hello', {
        family: 'Helvetica',
        size: 12,
        color: '#000000',
      });

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });

    it('should scale with font size', () => {
      const small = calculateTextDimensions('Hello', {
        family: 'Helvetica',
        size: 12,
        color: '#000000',
      });
      const large = calculateTextDimensions('Hello', {
        family: 'Helvetica',
        size: 24,
        color: '#000000',
      });

      expect(large.width).toBeGreaterThan(small.width);
      expect(large.height).toBeGreaterThan(small.height);
    });
  });

  describe('generateTilePositions', () => {
    it('should generate multiple positions for tiling', () => {
      const positions = generateTilePositions(612, 792, 100, 50, 50);
      expect(positions.length).toBeGreaterThan(1);
    });

    it('should generate positions within page bounds', () => {
      const positions = generateTilePositions(612, 792, 100, 50, 100);

      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(50);
        expect(pos.x).toBeLessThan(612);
        expect(pos.y).toBeGreaterThanOrEqual(50);
        expect(pos.y).toBeLessThan(792);
      }
    });
  });

  describe('applyRotation', () => {
    it('should not change position for 0 rotation', () => {
      const pos = { x: 100, y: 100 };
      const rotated = applyRotation(pos, 0, 50, 50);

      expect(rotated.x).toBeCloseTo(100);
      expect(rotated.y).toBeCloseTo(100);
    });

    it('should rotate position around center', () => {
      const pos = { x: 100, y: 50 };
      const rotated = applyRotation(pos, 180, 50, 50);

      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.y).toBeCloseTo(50);
    });
  });

  describe('parseColor', () => {
    it('should parse hex color with hash', () => {
      const color = parseColor('#FF0000');
      expect(color.r).toBeCloseTo(1);
      expect(color.g).toBeCloseTo(0);
      expect(color.b).toBeCloseTo(0);
    });

    it('should parse hex color without hash', () => {
      const color = parseColor('00FF00');
      expect(color.r).toBeCloseTo(0);
      expect(color.g).toBeCloseTo(1);
      expect(color.b).toBeCloseTo(0);
    });

    it('should parse short hex color', () => {
      const color = parseColor('#F00');
      expect(color.r).toBeCloseTo(1);
      expect(color.g).toBeCloseTo(0);
      expect(color.b).toBeCloseTo(0);
    });
  });

  describe('validateWatermarkOptions', () => {
    it('should validate valid options', () => {
      const result = validateWatermarkOptions({
        content: 'DRAFT',
        opacity: 0.5,
        rotation: 45,
        scale: 1,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty content', () => {
      const result = validateWatermarkOptions({ content: '  ' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Watermark content cannot be empty');
    });

    it('should reject invalid opacity', () => {
      const result = validateWatermarkOptions({ opacity: 1.5 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Opacity must be between 0 and 1');
    });

    it('should reject invalid rotation', () => {
      const result = validateWatermarkOptions({ rotation: 500 });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid scale', () => {
      const result = validateWatermarkOptions({ scale: -1 });
      expect(result.valid).toBe(false);
    });
  });

  describe('mergeWatermarkOptions', () => {
    it('should merge with defaults', () => {
      const options = mergeWatermarkOptions({ content: 'TEST' });

      expect(options.content).toBe('TEST');
      expect(options.opacity).toBeDefined();
      expect(options.rotation).toBeDefined();
      expect(options.font).toBeDefined();
    });

    it('should override defaults', () => {
      const options = mergeWatermarkOptions({
        content: 'TEST',
        opacity: 0.8,
        rotation: 30,
      });

      expect(options.opacity).toBe(0.8);
      expect(options.rotation).toBe(30);
    });
  });

  describe('createWatermarkOperationData', () => {
    it('should create operation data for text watermark', () => {
      const options: WatermarkOptions = {
        type: 'text',
        content: 'DRAFT',
        position: { preset: 'center' },
        opacity: 0.5,
        rotation: -45,
        scale: 1,
        layer: 'over',
        pages: { type: 'all' },
        font: { family: 'Helvetica', size: 72, color: '#888888' },
      };

      const data = createWatermarkOperationData(options, 612, 792);

      expect(data.content).toBe('DRAFT');
      expect(data.positions.length).toBeGreaterThan(0);
      expect(data.rotation).toBe(-45);
      expect(data.opacity).toBe(0.5);
    });

    it('should generate tile positions when tiling is enabled', () => {
      const options: WatermarkOptions = {
        type: 'text',
        content: 'DRAFT',
        position: { tile: true, tileSpacing: 100 },
        opacity: 0.3,
        rotation: -45,
        scale: 1,
        layer: 'over',
        pages: { type: 'all' },
      };

      const data = createWatermarkOperationData(options, 612, 792);

      expect(data.positions.length).toBeGreaterThan(1);
    });
  });

  describe('createCustomTemplate', () => {
    it('should create a custom template', () => {
      const template = createCustomTemplate('My Template', { content: 'CUSTOM' });

      expect(template.id).toContain('custom-');
      expect(template.name).toBe('My Template');
      expect(template.options.content).toBe('CUSTOM');
    });
  });
});
