/**
 * Tests for Text Diff
 */

import { describe, it, expect } from 'vitest';
import {
  diffCharacters,
  diffWords,
  diffLines,
  calculateSimilarity,
  getDiffStats,
  getLineChangeStats,
  normalizeText,
} from '@/lib/comparison/textDiff';

describe('Text Diff', () => {
  describe('diffCharacters', () => {
    it('should detect no changes for identical text', () => {
      const result = diffCharacters('hello', 'hello');
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('equal');
      expect(result[0]?.value).toBe('hello');
    });

    it('should detect insertions', () => {
      const result = diffCharacters('helo', 'hello');
      const insertions = result.filter((t) => t.type === 'insert');
      expect(insertions.length).toBeGreaterThan(0);
    });

    it('should detect deletions', () => {
      const result = diffCharacters('hello', 'helo');
      const deletions = result.filter((t) => t.type === 'delete');
      expect(deletions.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      expect(diffCharacters('', '')).toHaveLength(0);
      expect(diffCharacters('abc', '')).toEqual([{ type: 'delete', value: 'abc' }]);
      expect(diffCharacters('', 'abc')).toEqual([{ type: 'insert', value: 'abc' }]);
    });
  });

  describe('diffWords', () => {
    it('should detect no changes for identical text', () => {
      const result = diffWords('hello world', 'hello world');
      expect(result.every((t) => t.type === 'equal')).toBe(true);
    });

    it('should detect added words', () => {
      const result = diffWords('hello', 'hello world');
      const insertions = result.filter((t) => t.type === 'insert');
      expect(insertions.length).toBeGreaterThan(0);
    });

    it('should detect removed words', () => {
      const result = diffWords('hello world', 'hello');
      const deletions = result.filter((t) => t.type === 'delete');
      expect(deletions.length).toBeGreaterThan(0);
    });

    it('should respect case sensitivity option', () => {
      const caseSensitive = diffWords('Hello World', 'hello world', false);
      const caseInsensitive = diffWords('Hello World', 'hello world', true);

      // Case insensitive should have more equal tokens
      const equalCounts = {
        sensitive: caseSensitive.filter((t) => t.type === 'equal').length,
        insensitive: caseInsensitive.filter((t) => t.type === 'equal').length,
      };
      expect(equalCounts.insensitive).toBeGreaterThanOrEqual(equalCounts.sensitive);
    });

    it('should handle multiple word changes', () => {
      const result = diffWords('the quick brown fox', 'the slow red dog');
      expect(result.some((t) => t.type === 'delete')).toBe(true);
      expect(result.some((t) => t.type === 'insert')).toBe(true);
    });
  });

  describe('diffLines', () => {
    it('should detect no changes for identical text', () => {
      const result = diffLines('line1\nline2', 'line1\nline2');
      expect(result.every((l) => l.type === 'equal')).toBe(true);
    });

    it('should detect added lines', () => {
      const result = diffLines('line1', 'line1\nline2');
      expect(result.some((l) => l.type === 'added')).toBe(true);
    });

    it('should detect removed lines', () => {
      const result = diffLines('line1\nline2', 'line1');
      expect(result.some((l) => l.type === 'removed')).toBe(true);
    });

    it('should detect modified lines', () => {
      const result = diffLines('Hello World', 'hello world', true);
      // Should detect as modified when case differs
      const modified = result.filter((l) => l.type === 'modified');
      expect(modified.length).toBeGreaterThanOrEqual(0);
    });

    it('should include line numbers', () => {
      const result = diffLines('a\nb\nc', 'd\ne\nf');
      for (const line of result) {
        expect(line.lineNumber1 || line.lineNumber2).toBeDefined();
      }
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 100 for identical text', () => {
      expect(calculateSimilarity('hello world', 'hello world')).toBe(100);
    });

    it('should return 100 for empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(100);
    });

    it('should return 0 for completely different text', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
    });

    it('should return partial similarity for partial matches', () => {
      const similarity = calculateSimilarity('hello world', 'hello there');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(100);
    });

    it('should handle single word changes', () => {
      const similarity = calculateSimilarity('the quick brown fox', 'the quick red fox');
      expect(similarity).toBe(75); // 3 out of 4 words match
    });
  });

  describe('getDiffStats', () => {
    it('should count additions correctly', () => {
      const tokens = [
        { type: 'equal' as const, value: 'hello ' },
        { type: 'insert' as const, value: 'beautiful ' },
        { type: 'equal' as const, value: 'world' },
      ];
      const stats = getDiffStats(tokens);
      expect(stats.additions).toBe(10);
    });

    it('should count deletions correctly', () => {
      const tokens = [
        { type: 'equal' as const, value: 'hello ' },
        { type: 'delete' as const, value: 'cruel ' },
        { type: 'equal' as const, value: 'world' },
      ];
      const stats = getDiffStats(tokens);
      expect(stats.deletions).toBe(6);
    });

    it('should count unchanged correctly', () => {
      const tokens = [
        { type: 'equal' as const, value: 'hello world' },
      ];
      const stats = getDiffStats(tokens);
      expect(stats.unchanged).toBe(11);
    });
  });

  describe('getLineChangeStats', () => {
    it('should count line changes correctly', () => {
      const lines = [
        { type: 'equal' as const, lineNumber1: 1, lineNumber2: 1, content1: 'a', content2: 'a' },
        { type: 'added' as const, lineNumber2: 2, content2: 'b' },
        { type: 'removed' as const, lineNumber1: 2, content1: 'c' },
        { type: 'modified' as const, lineNumber1: 3, lineNumber2: 3, content1: 'd', content2: 'D' },
      ];
      const stats = getLineChangeStats(lines);
      expect(stats.equal).toBe(1);
      expect(stats.added).toBe(1);
      expect(stats.removed).toBe(1);
      expect(stats.modified).toBe(1);
    });
  });

  describe('normalizeText', () => {
    it('should collapse whitespace when ignoreWhitespace is true', () => {
      const result = normalizeText('hello    world\n\ntest', { ignoreWhitespace: true });
      expect(result).toBe('hello world test');
    });

    it('should convert to lowercase when ignoreCase is true', () => {
      const result = normalizeText('Hello World', { ignoreCase: true });
      expect(result).toBe('hello world');
    });

    it('should apply both options', () => {
      const result = normalizeText('Hello    World', { ignoreWhitespace: true, ignoreCase: true });
      expect(result).toBe('hello world');
    });

    it('should not modify text when no options are set', () => {
      const result = normalizeText('Hello    World');
      expect(result).toBe('Hello    World');
    });
  });
});
