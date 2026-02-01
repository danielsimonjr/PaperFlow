/**
 * Tests for Comparison Engine
 */

import { describe, it, expect } from 'vitest';
import {
  compareDocuments,
  comparePage,
  calculateSummary,
  getPageChanges,
  getAllChanges,
  filterChangesByType,
  getAdjacentChange,
  areDocumentsIdentical,
  getPagesWithChanges,
} from '@/lib/comparison/comparisonEngine';
import { DEFAULT_COMPARISON_OPTIONS } from '@/lib/comparison/types';
import type { DocumentInfo, PageComparison, TextChange } from '@/lib/comparison/types';

describe('Comparison Engine', () => {
  const doc1Info: DocumentInfo = { name: 'doc1.pdf', pageCount: 2 };
  const doc2Info: DocumentInfo = { name: 'doc2.pdf', pageCount: 2 };

  describe('compareDocuments', () => {
    it('should compare identical documents', () => {
      const doc1Text = ['page 1 content', 'page 2 content'];
      const doc2Text = ['page 1 content', 'page 2 content'];

      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      expect(result.id).toBeDefined();
      expect(result.document1.name).toBe('doc1.pdf');
      expect(result.document2.name).toBe('doc2.pdf');
      expect(result.pages).toHaveLength(2);
      expect(result.summary.overallSimilarity).toBe(100);
      expect(result.summary.totalTextChanges).toBe(0);
    });

    it('should detect text changes', () => {
      const doc1Text = ['Hello World'];
      const doc2Text = ['Hello Universe'];

      const result = compareDocuments(
        doc1Text,
        doc2Text,
        { name: 'doc1.pdf', pageCount: 1 },
        { name: 'doc2.pdf', pageCount: 1 }
      );

      expect(result.summary.totalTextChanges).toBeGreaterThan(0);
    });

    it('should handle documents with different page counts', () => {
      const doc1Text = ['page 1'];
      const doc2Text = ['page 1', 'page 2'];

      const result = compareDocuments(
        doc1Text,
        doc2Text,
        { name: 'doc1.pdf', pageCount: 1 },
        { name: 'doc2.pdf', pageCount: 2 }
      );

      expect(result.pages).toHaveLength(2);
    });

    it('should respect comparison options', () => {
      const doc1Text = ['Hello World'];
      const doc2Text = ['hello world'];

      const caseSensitiveResult = compareDocuments(
        doc1Text,
        doc2Text,
        doc1Info,
        doc2Info,
        { ignoreCase: false }
      );

      const caseInsensitiveResult = compareDocuments(
        doc1Text,
        doc2Text,
        doc1Info,
        doc2Info,
        { ignoreCase: true }
      );

      // Case insensitive should have fewer changes
      expect(caseInsensitiveResult.summary.totalTextChanges).toBeLessThanOrEqual(
        caseSensitiveResult.summary.totalTextChanges
      );
    });

    it('should include comparedAt timestamp', () => {
      const before = Date.now();
      const result = compareDocuments(['text'], ['text'], doc1Info, doc2Info);
      const after = Date.now();

      expect(result.comparedAt).toBeGreaterThanOrEqual(before);
      expect(result.comparedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('comparePage', () => {
    it('should compare identical page text', () => {
      const result = comparePage('Hello World', 'Hello World', 0, DEFAULT_COMPARISON_OPTIONS);

      expect(result.pageNumber).toBe(1);
      expect(result.textChanges).toHaveLength(0);
      expect(result.similarity).toBe(100);
    });

    it('should detect page text changes', () => {
      const result = comparePage('Hello', 'Goodbye', 0, DEFAULT_COMPARISON_OPTIONS);

      expect(result.textChanges.length).toBeGreaterThan(0);
      expect(result.similarity).toBeLessThan(100);
    });

    it('should include location information', () => {
      const result = comparePage('Hello World', 'Hello Universe', 0, DEFAULT_COMPARISON_OPTIONS);

      for (const change of result.textChanges) {
        expect(change.location).toBeDefined();
        expect(change.location.x).toBeDefined();
        expect(change.location.y).toBeDefined();
        expect(change.location.width).toBeDefined();
        expect(change.location.height).toBeDefined();
      }
    });

    it('should preserve original texts', () => {
      const result = comparePage('text1', 'text2', 0, DEFAULT_COMPARISON_OPTIONS);

      expect(result.text1).toBe('text1');
      expect(result.text2).toBe('text2');
    });
  });

  describe('calculateSummary', () => {
    it('should calculate summary for empty pages', () => {
      const pages: PageComparison[] = [];
      const summary = calculateSummary(pages, 0, 0);

      expect(summary.pagesCompared).toBe(0);
      expect(summary.totalTextChanges).toBe(0);
      expect(summary.overallSimilarity).toBe(100);
    });

    it('should count changes by type', () => {
      const pages: PageComparison[] = [
        {
          pageNumber: 1,
          textChanges: [
            { id: '1', type: 'added', text: 'a', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
            { id: '2', type: 'removed', text: 'b', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
            { id: '3', type: 'modified', text: 'c', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
          ],
          visualChanges: [],
          similarity: 70,
          text1: '',
          text2: '',
        },
      ];

      const summary = calculateSummary(pages, 1, 1);

      expect(summary.addedCount).toBe(1);
      expect(summary.removedCount).toBe(1);
      expect(summary.modifiedCount).toBe(1);
      expect(summary.totalTextChanges).toBe(3);
    });

    it('should calculate average similarity', () => {
      const pages: PageComparison[] = [
        { pageNumber: 1, textChanges: [], visualChanges: [], similarity: 80, text1: '', text2: '' },
        { pageNumber: 2, textChanges: [], visualChanges: [], similarity: 60, text1: '', text2: '' },
      ];

      const summary = calculateSummary(pages, 2, 2);

      expect(summary.overallSimilarity).toBe(70);
    });
  });

  describe('getPageChanges', () => {
    it('should get changes for specific page', () => {
      const doc1Text = ['page 1 text', 'page 2 text'];
      const doc2Text = ['page 1 changed', 'page 2 text'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const page0Changes = getPageChanges(result, 0);
      const page1Changes = getPageChanges(result, 1);

      expect(page0Changes.length).toBeGreaterThan(0);
      expect(page1Changes).toHaveLength(0);
    });

    it('should return empty array for non-existent page', () => {
      const result = compareDocuments(['text'], ['text'], doc1Info, doc2Info);
      const changes = getPageChanges(result, 999);

      expect(changes).toHaveLength(0);
    });
  });

  describe('getAllChanges', () => {
    it('should get all changes from all pages', () => {
      const doc1Text = ['page 1', 'page 2'];
      const doc2Text = ['PAGE 1', 'PAGE 2'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const allChanges = getAllChanges(result);

      expect(allChanges.length).toBeGreaterThan(0);
    });
  });

  describe('filterChangesByType', () => {
    it('should filter changes by type', () => {
      const changes: TextChange[] = [
        { id: '1', type: 'added', text: 'a', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
        { id: '2', type: 'removed', text: 'b', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
        { id: '3', type: 'added', text: 'c', location: { x: 0, y: 0, width: 10, height: 10 }, pageIndex: 0 },
      ];

      const added = filterChangesByType(changes, 'added');
      const removed = filterChangesByType(changes, 'removed');

      expect(added).toHaveLength(2);
      expect(removed).toHaveLength(1);
    });
  });

  describe('getAdjacentChange', () => {
    it('should get next change', () => {
      const doc1Text = ['a b c'];
      const doc2Text = ['x y z'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const allChanges = getAllChanges(result);
      if (allChanges.length > 1) {
        const firstChange = allChanges[0]!;
        const nextChange = getAdjacentChange(result, firstChange.id, 'next');

        expect(nextChange).toBeDefined();
        expect(nextChange!.id).not.toBe(firstChange.id);
      }
    });

    it('should get previous change', () => {
      const doc1Text = ['a b c'];
      const doc2Text = ['x y z'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const allChanges = getAllChanges(result);
      if (allChanges.length > 1) {
        const lastChange = allChanges[allChanges.length - 1]!;
        const prevChange = getAdjacentChange(result, lastChange.id, 'previous');

        expect(prevChange).toBeDefined();
        expect(prevChange!.id).not.toBe(lastChange.id);
      }
    });

    it('should return first change when no current change selected', () => {
      const doc1Text = ['a'];
      const doc2Text = ['b'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const change = getAdjacentChange(result, null, 'next');
      const allChanges = getAllChanges(result);

      if (allChanges.length > 0) {
        expect(change).toBeDefined();
        expect(change!.id).toBe(allChanges[0]!.id);
      }
    });

    it('should wrap around when reaching end', () => {
      const doc1Text = ['a b'];
      const doc2Text = ['x y'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const allChanges = getAllChanges(result);
      if (allChanges.length > 1) {
        const lastChange = allChanges[allChanges.length - 1]!;
        const nextChange = getAdjacentChange(result, lastChange.id, 'next');

        expect(nextChange!.id).toBe(allChanges[0]!.id);
      }
    });
  });

  describe('areDocumentsIdentical', () => {
    it('should return true for identical documents', () => {
      const result = compareDocuments(['text'], ['text'], doc1Info, doc2Info);
      expect(areDocumentsIdentical(result)).toBe(true);
    });

    it('should return false for different documents', () => {
      const result = compareDocuments(['text1'], ['text2'], doc1Info, doc2Info);
      expect(areDocumentsIdentical(result)).toBe(false);
    });
  });

  describe('getPagesWithChanges', () => {
    it('should return pages that have changes', () => {
      const doc1Text = ['same', 'different'];
      const doc2Text = ['same', 'changed'];
      const result = compareDocuments(doc1Text, doc2Text, doc1Info, doc2Info);

      const pagesWithChanges = getPagesWithChanges(result);

      expect(pagesWithChanges).toContain(2); // Page 2 has changes
    });

    it('should return empty array for identical documents', () => {
      const result = compareDocuments(['text'], ['text'], doc1Info, doc2Info);
      const pagesWithChanges = getPagesWithChanges(result);

      expect(pagesWithChanges).toHaveLength(0);
    });
  });
});
