/**
 * Tests for Form Field Formatting
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  parseFormattedNumber,
  formatDate,
  parseFormattedDate,
  formatText,
  applyMask,
  removeMask,
  PHONE_MASK,
  SSN_MASK,
  DATE_MASK,
  CREDIT_CARD_MASK,
} from '@/lib/forms/formatting';

describe('Form Formatting', () => {
  describe('formatNumber', () => {
    it('should format decimal number', () => {
      expect(formatNumber(1234.56, { format: 'decimal' })).toBe('1,234.56');
    });

    it('should format integer', () => {
      expect(formatNumber(1234.56, { format: 'integer' })).toBe('1,235');
    });

    it('should format currency', () => {
      expect(formatNumber(1234.56, { format: 'currency' })).toBe('$1,234.56');
    });

    it('should format currency with symbol after', () => {
      expect(formatNumber(100, { format: 'currency', currencySymbol: '€', currencyPosition: 'after' })).toBe('100.00€');
    });

    it('should format percentage', () => {
      expect(formatNumber(0.25, { format: 'percentage' })).toBe('25.00%');
    });

    it('should handle custom decimal places', () => {
      expect(formatNumber(123.456789, { format: 'decimal', decimalPlaces: 4 })).toBe('123.4568');
    });

    it('should handle custom separators', () => {
      expect(formatNumber(1234.56, {
        format: 'decimal',
        thousandsSeparator: '.',
        decimalSeparator: ','
      })).toBe('1.234,56');
    });

    it('should handle negative numbers with minus', () => {
      expect(formatNumber(-1234.56, { format: 'decimal', negativeFormat: 'minus' })).toBe('-1,234.56');
    });

    it('should handle negative numbers with parentheses', () => {
      expect(formatNumber(-1234.56, { format: 'decimal', negativeFormat: 'parentheses' })).toBe('(1,234.56)');
    });

    it('should handle string input', () => {
      expect(formatNumber('$1,234.56', { format: 'decimal' })).toBe('1,234.56');
    });

    it('should return empty string for invalid input', () => {
      expect(formatNumber('invalid', { format: 'decimal' })).toBe('');
    });
  });

  describe('parseFormattedNumber', () => {
    it('should parse decimal number', () => {
      expect(parseFormattedNumber('1,234.56', { format: 'decimal' })).toBe(1234.56);
    });

    it('should parse currency', () => {
      expect(parseFormattedNumber('$1,234.56', { format: 'currency' })).toBe(1234.56);
    });

    it('should parse percentage', () => {
      expect(parseFormattedNumber('25%', { format: 'percentage' })).toBe(0.25);
    });

    it('should parse negative with parentheses', () => {
      expect(parseFormattedNumber('(100)', { format: 'decimal' })).toBe(-100);
    });
  });

  describe('formatDate', () => {
    it('should format date as MM/DD/YYYY', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date, { format: 'MM/DD/YYYY' })).toBe('01/15/2024');
    });

    it('should format date as DD/MM/YYYY', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date, { format: 'DD/MM/YYYY' })).toBe('15/01/2024');
    });

    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date, { format: 'YYYY-MM-DD' })).toBe('2024-01-15');
    });

    it('should format date as MMMM D, YYYY', () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date, { format: 'MMMM D, YYYY' })).toBe('January 15, 2024');
    });

    it('should handle string date input', () => {
      // Use Date object to avoid timezone issues with string parsing
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(formatDate(date.toISOString(), { format: 'MM/DD/YYYY' })).toBe('06/15/2024');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid', { format: 'MM/DD/YYYY' })).toBe('');
    });
  });

  describe('parseFormattedDate', () => {
    it('should parse MM/DD/YYYY format', () => {
      const date = parseFormattedDate('01/15/2024', 'MM/DD/YYYY');
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should parse DD/MM/YYYY format', () => {
      const date = parseFormattedDate('15/01/2024', 'DD/MM/YYYY');
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should parse YYYY-MM-DD format', () => {
      const date = parseFormattedDate('2024-01-15', 'YYYY-MM-DD');
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should return null for invalid date', () => {
      expect(parseFormattedDate('invalid', 'MM/DD/YYYY')).toBeNull();
    });

    it('should return null for invalid date components', () => {
      expect(parseFormattedDate('13/32/2024', 'MM/DD/YYYY')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseFormattedDate('', 'MM/DD/YYYY')).toBeNull();
    });
  });

  describe('formatText', () => {
    it('should convert to uppercase', () => {
      expect(formatText('hello world', { case: 'upper' })).toBe('HELLO WORLD');
    });

    it('should convert to lowercase', () => {
      expect(formatText('HELLO WORLD', { case: 'lower' })).toBe('hello world');
    });

    it('should convert to title case', () => {
      expect(formatText('hello world', { case: 'title' })).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      expect(formatText('  hello  ', { trim: true })).toBe('hello');
    });

    it('should truncate to max length', () => {
      expect(formatText('hello world', { maxLength: 5 })).toBe('hello');
    });

    it('should apply multiple formatting options', () => {
      expect(formatText('  hello world  ', { trim: true, case: 'upper' })).toBe('HELLO WORLD');
    });
  });

  describe('applyMask', () => {
    it('should apply phone mask', () => {
      expect(applyMask('5551234567', PHONE_MASK)).toBe('(555) 123-4567');
    });

    it('should apply SSN mask', () => {
      expect(applyMask('123456789', SSN_MASK)).toBe('123-45-6789');
    });

    it('should apply date mask', () => {
      expect(applyMask('01152024', DATE_MASK)).toBe('01/15/2024');
    });

    it('should apply credit card mask', () => {
      expect(applyMask('1234567890123456', CREDIT_CARD_MASK)).toBe('1234 5678 9012 3456');
    });

    it('should skip non-matching characters', () => {
      expect(applyMask('abc123def456', '999-999')).toBe('123-456');
    });

    it('should handle incomplete input', () => {
      // With partial input, mask only applies up to the available characters
      expect(applyMask('555', PHONE_MASK)).toBe('(555');
      // With more input, more formatting is applied
      expect(applyMask('5551234567', PHONE_MASK)).toBe('(555) 123-4567');
    });

    it('should apply letter mask', () => {
      expect(applyMask('ABC123', 'AAA-999')).toBe('ABC-123');
    });

    it('should apply alphanumeric mask', () => {
      expect(applyMask('A1B2C3', '***-***')).toBe('A1B-2C3');
    });
  });

  describe('removeMask', () => {
    it('should remove phone mask', () => {
      expect(removeMask('(555) 123-4567', PHONE_MASK)).toBe('5551234567');
    });

    it('should remove SSN mask', () => {
      expect(removeMask('123-45-6789', SSN_MASK)).toBe('123456789');
    });

    it('should remove date mask', () => {
      expect(removeMask('01/15/2024', DATE_MASK)).toBe('01152024');
    });
  });
});
