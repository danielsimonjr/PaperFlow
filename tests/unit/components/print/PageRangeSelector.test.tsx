import { describe, it, expect } from 'vitest';
import { parsePageRange } from '@lib/print/pageRange';

describe('PageRangeSelector', () => {
  describe('parsePageRange', () => {
    it('parses single page number', () => {
      expect(parsePageRange('5', 10)).toEqual([5]);
    });

    it('parses page range', () => {
      expect(parsePageRange('1-3', 10)).toEqual([1, 2, 3]);
    });

    it('parses comma-separated pages', () => {
      expect(parsePageRange('1, 3, 5', 10)).toEqual([1, 3, 5]);
    });

    it('parses mixed ranges and pages', () => {
      expect(parsePageRange('1-3, 5, 8-10', 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
    });

    it('deduplicates overlapping ranges', () => {
      expect(parsePageRange('1-5, 3-7', 10)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('clamps to max pages', () => {
      expect(parsePageRange('1-100', 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('ignores invalid numbers', () => {
      expect(parsePageRange('abc, 2', 10)).toEqual([2]);
    });

    it('ignores zero and negative numbers', () => {
      expect(parsePageRange('0, -1, 2', 10)).toEqual([2]);
    });

    it('returns empty array for empty string', () => {
      expect(parsePageRange('', 10)).toEqual([]);
    });

    it('handles spaces around ranges', () => {
      expect(parsePageRange(' 1 - 3 , 5 ', 10)).toEqual([1, 2, 3, 5]);
    });

    it('sorts results in ascending order', () => {
      expect(parsePageRange('5, 2, 8, 1', 10)).toEqual([1, 2, 5, 8]);
    });
  });
});
