/**
 * Tests for Header/Footer Module
 */

import { describe, it, expect } from 'vitest';
import {
  formatPageNumber,
  toRomanNumeral,
  toLetterNumeral,
  substituteVariables,
  createVariableContext,
  calculateSectionPosition,
  validateHeaderFooterOptions,
  mergeHeaderFooterOptions,
  shouldApplyToPage,
  approximateTextWidth,
  createHeaderFooterOperationData,
  parsePageRangeString,
  createPreset,
} from '@/lib/batch/headerFooter';
import type { PageNumberFormat } from '@/lib/batch/types';

describe('Header/Footer Module', () => {
  describe('formatPageNumber', () => {
    it('should format arabic numbers', () => {
      expect(formatPageNumber(1, 'arabic')).toBe('1');
      expect(formatPageNumber(42, 'arabic')).toBe('42');
    });

    it('should format roman numerals (lowercase)', () => {
      expect(formatPageNumber(1, 'roman-lower')).toBe('i');
      expect(formatPageNumber(4, 'roman-lower')).toBe('iv');
      expect(formatPageNumber(9, 'roman-lower')).toBe('ix');
    });

    it('should format roman numerals (uppercase)', () => {
      expect(formatPageNumber(1, 'roman-upper')).toBe('I');
      expect(formatPageNumber(10, 'roman-upper')).toBe('X');
      expect(formatPageNumber(50, 'roman-upper')).toBe('L');
    });

    it('should format letter numerals (lowercase)', () => {
      expect(formatPageNumber(1, 'letter-lower')).toBe('a');
      expect(formatPageNumber(26, 'letter-lower')).toBe('z');
      expect(formatPageNumber(27, 'letter-lower')).toBe('aa');
    });

    it('should format letter numerals (uppercase)', () => {
      expect(formatPageNumber(1, 'letter-upper')).toBe('A');
      expect(formatPageNumber(2, 'letter-upper')).toBe('B');
    });
  });

  describe('toRomanNumeral', () => {
    it('should convert basic numbers', () => {
      expect(toRomanNumeral(1)).toBe('I');
      expect(toRomanNumeral(5)).toBe('V');
      expect(toRomanNumeral(10)).toBe('X');
      expect(toRomanNumeral(50)).toBe('L');
      expect(toRomanNumeral(100)).toBe('C');
      expect(toRomanNumeral(500)).toBe('D');
      expect(toRomanNumeral(1000)).toBe('M');
    });

    it('should handle subtractive notation', () => {
      expect(toRomanNumeral(4)).toBe('IV');
      expect(toRomanNumeral(9)).toBe('IX');
      expect(toRomanNumeral(40)).toBe('XL');
      expect(toRomanNumeral(90)).toBe('XC');
      expect(toRomanNumeral(400)).toBe('CD');
      expect(toRomanNumeral(900)).toBe('CM');
    });

    it('should handle complex numbers', () => {
      expect(toRomanNumeral(1994)).toBe('MCMXCIV');
      expect(toRomanNumeral(2024)).toBe('MMXXIV');
    });

    it('should handle edge cases', () => {
      expect(toRomanNumeral(0)).toBe('0');
      expect(toRomanNumeral(-1)).toBe('-1');
      expect(toRomanNumeral(4000)).toBe('4000');
    });
  });

  describe('toLetterNumeral', () => {
    it('should convert single letters', () => {
      expect(toLetterNumeral(1)).toBe('A');
      expect(toLetterNumeral(26)).toBe('Z');
    });

    it('should convert double letters', () => {
      expect(toLetterNumeral(27)).toBe('AA');
      expect(toLetterNumeral(28)).toBe('AB');
      expect(toLetterNumeral(52)).toBe('AZ');
    });

    it('should handle edge cases', () => {
      expect(toLetterNumeral(0)).toBe('0');
      expect(toLetterNumeral(-1)).toBe('-1');
    });
  });

  describe('substituteVariables', () => {
    it('should substitute single variable', () => {
      const result = substituteVariables('Page {{page}}', { page: '5' });
      expect(result).toBe('Page 5');
    });

    it('should substitute multiple variables', () => {
      const result = substituteVariables('Page {{page}} of {{total}}', {
        page: '3',
        total: '10',
      });
      expect(result).toBe('Page 3 of 10');
    });

    it('should leave unknown variables unchanged', () => {
      const result = substituteVariables('{{unknown}} text', {});
      expect(result).toBe('{{unknown}} text');
    });

    it('should handle empty text', () => {
      const result = substituteVariables('', { page: '1' });
      expect(result).toBe('');
    });
  });

  describe('createVariableContext', () => {
    it('should create context with all variables', () => {
      const context = createVariableContext(5, 20, 'document.pdf', 'John Doe');

      expect(context.page).toBe('5');
      expect(context.total).toBe('20');
      expect(context.filename).toBe('document.pdf');
      expect(context.author).toBe('John Doe');
      expect(context.date).toBeDefined();
      expect(context.time).toBeDefined();
    });

    it('should format page number according to format', () => {
      const context = createVariableContext(5, 20, 'doc.pdf', '', 'roman-lower');
      expect(context.page).toBe('v');
    });
  });

  describe('calculateSectionPosition', () => {
    const pageWidth = 612;
    const pageHeight = 792;
    const textWidth = 50;
    const margins = { top: 40, bottom: 40, left: 50, right: 50 };
    const fontSize = 12;

    it('should calculate left header position', () => {
      const pos = calculateSectionPosition('left', 'header', pageWidth, pageHeight, textWidth, margins, fontSize);
      expect(pos.x).toBe(margins.left);
      expect(pos.y).toBe(pageHeight - margins.top);
    });

    it('should calculate center footer position', () => {
      const pos = calculateSectionPosition('center', 'footer', pageWidth, pageHeight, textWidth, margins, fontSize);
      expect(pos.y).toBeLessThan(pageHeight / 2);
    });

    it('should calculate right position correctly', () => {
      const pos = calculateSectionPosition('right', 'header', pageWidth, pageHeight, textWidth, margins, fontSize);
      expect(pos.x).toBe(pageWidth - margins.right - textWidth);
    });
  });

  describe('validateHeaderFooterOptions', () => {
    it('should validate valid options', () => {
      const result = validateHeaderFooterOptions({
        startPage: 1,
        font: { family: 'Helvetica', size: 12, color: '#000' },
      });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid start page', () => {
      const result = validateHeaderFooterOptions({ startPage: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Start page must be at least 1');
    });

    it('should reject invalid font size', () => {
      const result = validateHeaderFooterOptions({
        font: { family: 'Helvetica', size: 0, color: '#000' },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('mergeHeaderFooterOptions', () => {
    it('should merge with defaults', () => {
      const options = mergeHeaderFooterOptions({
        footer: { center: '{{page}}' },
      });

      expect(options.footer?.center).toBe('{{page}}');
      expect(options.font).toBeDefined();
      expect(options.margins).toBeDefined();
      expect(options.startPage).toBe(1);
    });
  });

  describe('shouldApplyToPage', () => {
    it('should not apply before start page', () => {
      const result = shouldApplyToPage(2, 5, { type: 'all' }, 10);
      expect(result).toBe(false);
    });

    it('should apply at and after start page', () => {
      const result = shouldApplyToPage(4, 5, { type: 'all' }, 10);
      expect(result).toBe(true);
    });

    it('should respect page range', () => {
      const result = shouldApplyToPage(1, 1, { type: 'odd' }, 10);
      expect(result).toBe(false); // Page 2 (index 1) is even
    });
  });

  describe('approximateTextWidth', () => {
    it('should calculate width based on text length and font size', () => {
      const width = approximateTextWidth('Hello', {
        family: 'Helvetica',
        size: 12,
        color: '#000',
      });

      expect(width).toBeGreaterThan(0);
      expect(width).toBe(5 * 12 * 0.6); // 5 chars * fontSize * factor
    });
  });

  describe('createHeaderFooterOperationData', () => {
    it('should create operation data with substituted variables', () => {
      const options = mergeHeaderFooterOptions({
        header: { center: '{{filename}}' },
        footer: { center: 'Page {{page}} of {{total}}' },
      });

      const data = createHeaderFooterOperationData(
        options,
        0, // pageIndex
        612, 792, // page dimensions
        'document.pdf',
        'Author',
        10, // totalPages
        'arabic'
      );

      expect(data.header.center).toBe('document.pdf');
      expect(data.footer.center).toBe('Page 1 of 10');
    });

    it('should include positions for each section', () => {
      const options = mergeHeaderFooterOptions({
        footer: { left: 'L', center: 'C', right: 'R' },
      });

      const data = createHeaderFooterOperationData(
        options, 0, 612, 792, 'doc.pdf', '', 1
      );

      expect(data.footer.positions.left).toBeDefined();
      expect(data.footer.positions.center).toBeDefined();
      expect(data.footer.positions.right).toBeDefined();
    });
  });

  describe('parsePageRangeString', () => {
    it('should parse single pages', () => {
      const pages = parsePageRangeString('1, 3, 5');
      expect(pages).toEqual([1, 3, 5]);
    });

    it('should parse ranges', () => {
      const pages = parsePageRangeString('1-5');
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse mixed format', () => {
      const pages = parsePageRangeString('1-3, 5, 7-9');
      expect(pages).toEqual([1, 2, 3, 5, 7, 8, 9]);
    });

    it('should deduplicate pages', () => {
      const pages = parsePageRangeString('1-3, 2-4');
      expect(pages).toEqual([1, 2, 3, 4]);
    });

    it('should sort pages', () => {
      const pages = parsePageRangeString('5, 1, 3');
      expect(pages).toEqual([1, 3, 5]);
    });
  });

  describe('createPreset', () => {
    it('should create page-number-center preset', () => {
      const preset = createPreset('page-number-center');
      expect(preset.footer?.center).toBe('{{page}}');
    });

    it('should create page-number-right preset', () => {
      const preset = createPreset('page-number-right');
      expect(preset.footer?.right).toContain('{{page}}');
      expect(preset.footer?.right).toContain('{{total}}');
    });

    it('should create date-left-page-right preset', () => {
      const preset = createPreset('date-left-page-right');
      expect(preset.footer?.left).toBe('{{date}}');
      expect(preset.footer?.right).toContain('{{page}}');
    });

    it('should create filename-center preset', () => {
      const preset = createPreset('filename-center');
      expect(preset.header?.center).toBe('{{filename}}');
      expect(preset.footer?.center).toBe('{{page}}');
    });
  });
});
