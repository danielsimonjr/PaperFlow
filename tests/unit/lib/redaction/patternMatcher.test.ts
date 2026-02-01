/**
 * Tests for Pattern Matcher
 */

import { describe, it, expect } from 'vitest';
import {
  getAllPatterns,
  getPatternsByCategory,
  getPatternById,
  createCustomPattern,
  validatePattern,
  findPatternMatches,
  findAllPatternMatches,
  findTextMatches,
  getMatchStatistics,
  BUILT_IN_PATTERNS,
} from '@/lib/redaction/patternMatcher';

describe('Pattern Matcher', () => {
  describe('getAllPatterns', () => {
    it('should return all built-in patterns', () => {
      const patterns = getAllPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toEqual(expect.arrayContaining(BUILT_IN_PATTERNS));
    });
  });

  describe('getPatternsByCategory', () => {
    it('should return patterns by category', () => {
      const piiPatterns = getPatternsByCategory('pii');
      expect(piiPatterns.length).toBeGreaterThan(0);
      expect(piiPatterns.every((p) => p.category === 'pii')).toBe(true);
    });

    it('should return contact patterns', () => {
      const contactPatterns = getPatternsByCategory('contact');
      expect(contactPatterns.length).toBeGreaterThan(0);
      expect(contactPatterns.every((p) => p.category === 'contact')).toBe(true);
    });

    it('should return financial patterns', () => {
      const financialPatterns = getPatternsByCategory('financial');
      expect(financialPatterns.length).toBeGreaterThan(0);
      expect(financialPatterns.every((p) => p.category === 'financial')).toBe(true);
    });
  });

  describe('getPatternById', () => {
    it('should return pattern by ID', () => {
      const pattern = getPatternById('ssn');
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe('ssn');
    });

    it('should return undefined for unknown ID', () => {
      const pattern = getPatternById('unknown');
      expect(pattern).toBeUndefined();
    });
  });

  describe('createCustomPattern', () => {
    it('should create custom pattern', () => {
      const pattern = createCustomPattern('Test Pattern', '\\d+');
      expect(pattern.id).toContain('custom-');
      expect(pattern.name).toBe('Test Pattern');
      expect(pattern.regex).toBe('\\d+');
      expect(pattern.category).toBe('custom');
    });

    it('should accept custom options', () => {
      const pattern = createCustomPattern('Custom', '\\w+', {
        caseSensitive: true,
        wholeWord: true,
        description: 'My description',
      });
      expect(pattern.caseSensitive).toBe(true);
      expect(pattern.wholeWord).toBe(true);
      expect(pattern.description).toBe('My description');
    });
  });

  describe('validatePattern', () => {
    it('should validate correct regex', () => {
      const result = validatePattern('\\d{3}-\\d{2}-\\d{4}');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid regex', () => {
      const result = validatePattern('[invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('findPatternMatches', () => {
    it('should find SSN matches', () => {
      const pattern = getPatternById('ssn')!;
      const text = 'John Doe SSN: 123-45-6789, Jane Doe: 987-65-4321';
      const matches = findPatternMatches(text, pattern);

      expect(matches).toHaveLength(2);
      expect(matches[0]?.text).toBe('123-45-6789');
      expect(matches[1]?.text).toBe('987-65-4321');
    });

    it('should find email matches', () => {
      const pattern = getPatternById('email')!;
      const text = 'Contact: john@example.com or support@company.org';
      const matches = findPatternMatches(text, pattern);

      expect(matches).toHaveLength(2);
      expect(matches[0]?.text).toBe('john@example.com');
      expect(matches[1]?.text).toBe('support@company.org');
    });

    it('should find phone matches', () => {
      const pattern = getPatternById('phone-us')!;
      const text = 'Call (555) 123-4567 or 555-987-6543';
      const matches = findPatternMatches(text, pattern);

      expect(matches).toHaveLength(2);
    });

    it('should find credit card matches', () => {
      const pattern = getPatternById('credit-card')!;
      const text = 'Card: 4111-1111-1111-1111 and 5500 0000 0000 0004';
      const matches = findPatternMatches(text, pattern);

      expect(matches).toHaveLength(2);
    });

    it('should respect case sensitivity', () => {
      const patternSensitive = createCustomPattern('Test', 'HELLO', { caseSensitive: true });
      const patternInsensitive = createCustomPattern('Test', 'HELLO', { caseSensitive: false });

      const text = 'Hello HELLO hello';

      const sensMatches = findPatternMatches(text, patternSensitive);
      const insensMatches = findPatternMatches(text, patternInsensitive);

      expect(sensMatches).toHaveLength(1);
      expect(insensMatches).toHaveLength(3);
    });

    it('should respect whole word matching', () => {
      const patternWholeWord = createCustomPattern('Test', 'test', { wholeWord: true });
      const patternPartial = createCustomPattern('Test', 'test', { wholeWord: false });

      const text = 'test testing testify';

      const wholeMatches = findPatternMatches(text, patternWholeWord);
      const partialMatches = findPatternMatches(text, patternPartial);

      expect(wholeMatches).toHaveLength(1);
      expect(partialMatches).toHaveLength(3);
    });

    it('should include page index', () => {
      const pattern = getPatternById('ssn')!;
      const text = 'SSN: 123-45-6789';
      const matches = findPatternMatches(text, pattern, 5);

      expect(matches[0]?.pageIndex).toBe(5);
    });
  });

  describe('findAllPatternMatches', () => {
    it('should find matches for multiple patterns', () => {
      const patterns = [getPatternById('ssn')!, getPatternById('email')!];
      const text = 'SSN: 123-45-6789, Email: test@example.com';

      const matches = findAllPatternMatches(text, patterns);

      expect(matches).toHaveLength(2);
    });

    it('should sort matches by position', () => {
      const patterns = [getPatternById('ssn')!, getPatternById('email')!];
      const text = 'Email: test@example.com, SSN: 123-45-6789';

      const matches = findAllPatternMatches(text, patterns);

      expect(matches[0]?.pattern.id).toBe('email');
      expect(matches[1]?.pattern.id).toBe('ssn');
    });

    it('should remove overlapping matches', () => {
      const patterns = [
        createCustomPattern('Full', '123-45-6789'),
        createCustomPattern('Partial', '123-45'),
      ];
      const text = 'Number: 123-45-6789';

      const matches = findAllPatternMatches(text, patterns);

      expect(matches).toHaveLength(1);
    });
  });

  describe('findTextMatches', () => {
    it('should find simple text matches', () => {
      const text = 'Hello world, hello universe';
      const matches = findTextMatches(text, 'hello', { caseSensitive: false });

      expect(matches).toHaveLength(2);
    });

    it('should be case sensitive when specified', () => {
      const text = 'Hello world, hello universe';
      const matches = findTextMatches(text, 'hello', { caseSensitive: true });

      expect(matches).toHaveLength(1);
    });

    it('should escape special regex characters', () => {
      const text = 'The regex [a-z]+ matches letters';
      const matches = findTextMatches(text, '[a-z]+');

      expect(matches).toHaveLength(1);
      expect(matches[0]?.text).toBe('[a-z]+');
    });
  });

  describe('getMatchStatistics', () => {
    it('should calculate statistics', () => {
      const ssnPattern = getPatternById('ssn')!;
      const emailPattern = getPatternById('email')!;

      const matches = [
        ...findPatternMatches('123-45-6789', ssnPattern, 0),
        ...findPatternMatches('987-65-4321', ssnPattern, 1),
        ...findPatternMatches('test@example.com', emailPattern, 0),
      ];

      const stats = getMatchStatistics(matches);

      expect(stats.total).toBe(3);
      expect(stats.byPattern['ssn']).toBe(2);
      expect(stats.byPattern['email']).toBe(1);
      expect(stats.byPage[0]).toBe(2);
      expect(stats.byPage[1]).toBe(1);
      expect(stats.byCategory['pii']).toBe(2);
      expect(stats.byCategory['contact']).toBe(1);
    });
  });
});
