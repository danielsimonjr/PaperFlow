/**
 * Tests for Redaction Engine
 */

import { describe, it, expect } from 'vitest';
import {
  createAreaMark,
  createTextMark,
  createPatternMarks,
  updateMarkOptions,
  markAsApplied,
  groupMarksByPage,
  sortMarksByPosition,
  rectsOverlap,
  mergeOverlappingMarks,
  createAuditEntry,
  generateReport,
  exportMarksToJSON,
  importMarksFromJSON,
  calculateMarkStatistics,
} from '@/lib/redaction/redactionEngine';

describe('Redaction Engine', () => {
  describe('createAreaMark', () => {
    it('should create an area redaction mark', () => {
      const mark = createAreaMark(0, { x: 100, y: 200, width: 50, height: 20 });

      expect(mark.id).toBeDefined();
      expect(mark.pageIndex).toBe(0);
      expect(mark.type).toBe('area');
      expect(mark.status).toBe('marked');
      expect(mark.bounds).toEqual({ x: 100, y: 200, width: 50, height: 20 });
    });

    it('should apply custom options', () => {
      const mark = createAreaMark(
        0,
        { x: 100, y: 200, width: 50, height: 20 },
        { overlayColor: '#FF0000', overlayText: 'REDACTED' }
      );

      expect(mark.overlayColor).toBe('#FF0000');
      expect(mark.overlayText).toBe('REDACTED');
    });
  });

  describe('createTextMark', () => {
    it('should create a text redaction mark', () => {
      const mark = createTextMark(1, { x: 50, y: 100, width: 80, height: 15 }, 'John Doe');

      expect(mark.type).toBe('text');
      expect(mark.matchedText).toBe('John Doe');
      expect(mark.pageIndex).toBe(1);
    });
  });

  describe('createPatternMarks', () => {
    it('should create multiple pattern marks', () => {
      const matches = [
        { text: '123-45-6789', bounds: { x: 10, y: 10, width: 100, height: 15 } },
        { text: '987-65-4321', bounds: { x: 10, y: 30, width: 100, height: 15 } },
      ];

      const marks = createPatternMarks(0, matches, '\\d{3}-\\d{2}-\\d{4}', 'SSN');

      expect(marks).toHaveLength(2);
      expect(marks[0]?.type).toBe('pattern');
      expect(marks[0]?.pattern).toBe('\\d{3}-\\d{2}-\\d{4}');
      expect(marks[0]?.patternName).toBe('SSN');
      expect(marks[0]?.matchedText).toBe('123-45-6789');
    });
  });

  describe('updateMarkOptions', () => {
    it('should update mark options', () => {
      const mark = createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 });
      const updated = updateMarkOptions(mark, {
        overlayColor: '#0000FF',
        overlayText: 'HIDDEN',
      });

      expect(updated.overlayColor).toBe('#0000FF');
      expect(updated.overlayText).toBe('HIDDEN');
      expect(updated.id).toBe(mark.id);
    });
  });

  describe('markAsApplied', () => {
    it('should mark all as applied', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createTextMark(0, { x: 20, y: 0, width: 10, height: 10 }, 'test'),
      ];

      const applied = markAsApplied(marks);

      expect(applied).toHaveLength(2);
      expect(applied.every((m) => m.status === 'applied')).toBe(true);
    });
  });

  describe('groupMarksByPage', () => {
    it('should group marks by page', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createAreaMark(1, { x: 0, y: 0, width: 10, height: 10 }),
        createAreaMark(0, { x: 20, y: 0, width: 10, height: 10 }),
      ];

      const grouped = groupMarksByPage(marks);

      expect(grouped.get(0)?.length).toBe(2);
      expect(grouped.get(1)?.length).toBe(1);
    });
  });

  describe('sortMarksByPosition', () => {
    it('should sort marks by position', () => {
      const marks = [
        createAreaMark(0, { x: 100, y: 200, width: 10, height: 10 }),
        createAreaMark(0, { x: 50, y: 100, width: 10, height: 10 }),
        createAreaMark(0, { x: 150, y: 100, width: 10, height: 10 }),
      ];

      const sorted = sortMarksByPosition(marks);

      expect(sorted[0]?.bounds.y).toBe(100);
      expect(sorted[0]?.bounds.x).toBe(50);
      expect(sorted[1]?.bounds.x).toBe(150);
      expect(sorted[2]?.bounds.y).toBe(200);
    });

    it('should sort by page first', () => {
      const marks = [
        createAreaMark(1, { x: 0, y: 0, width: 10, height: 10 }),
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
      ];

      const sorted = sortMarksByPosition(marks);

      expect(sorted[0]?.pageIndex).toBe(0);
      expect(sorted[1]?.pageIndex).toBe(1);
    });
  });

  describe('rectsOverlap', () => {
    it('should detect overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 20, height: 20 };
      const b = { x: 10, y: 10, width: 20, height: 20 };

      expect(rectsOverlap(a, b)).toBe(true);
    });

    it('should detect non-overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 20, y: 20, width: 10, height: 10 };

      expect(rectsOverlap(a, b)).toBe(false);
    });

    it('should detect touching rectangles as overlapping', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 10, y: 0, width: 10, height: 10 };

      expect(rectsOverlap(a, b)).toBe(true); // Edge touching is considered overlap for merging
    });
  });

  describe('mergeOverlappingMarks', () => {
    it('should merge overlapping marks', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 20, height: 20 }),
        createAreaMark(0, { x: 10, y: 10, width: 20, height: 20 }),
      ];

      const merged = mergeOverlappingMarks(marks);

      expect(merged).toHaveLength(1);
      expect(merged[0]?.bounds).toEqual({ x: 0, y: 0, width: 30, height: 30 });
    });

    it('should not merge non-overlapping marks', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createAreaMark(0, { x: 50, y: 50, width: 10, height: 10 }),
      ];

      const merged = mergeOverlappingMarks(marks);

      expect(merged).toHaveLength(2);
    });

    it('should not merge marks on different pages', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 20, height: 20 }),
        createAreaMark(1, { x: 10, y: 10, width: 20, height: 20 }),
      ];

      const merged = mergeOverlappingMarks(marks);

      expect(merged).toHaveLength(2);
    });
  });

  describe('createAuditEntry', () => {
    it('should create audit entry', () => {
      const entry = createAuditEntry('mark', {
        markId: 'test-123',
        pageIndex: 0,
      });

      expect(entry.action).toBe('mark');
      expect(entry.markId).toBe('test-123');
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate redaction report', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createTextMark(1, { x: 0, y: 0, width: 10, height: 10 }, 'test'),
        createPatternMarks(0, [{ text: '123-45-6789', bounds: { x: 0, y: 20, width: 80, height: 15 } }], 'ssn', 'SSN')[0]!,
      ];

      const auditLog = [
        createAuditEntry('mark', { markId: marks[0]!.id }),
        createAuditEntry('apply', { markId: marks[0]!.id }),
      ];

      const report = generateReport('test.pdf', marks, auditLog);

      expect(report.documentName).toBe('test.pdf');
      expect(report.totalMarks).toBe(3);
      expect(report.marksByType.area).toBe(1);
      expect(report.marksByType.text).toBe(1);
      expect(report.marksByType.pattern).toBe(1);
      expect(report.marksByPage[0]).toBe(2);
      expect(report.marksByPage[1]).toBe(1);
      expect(report.patternsUsed).toContain('SSN');
    });
  });

  describe('exportMarksToJSON / importMarksFromJSON', () => {
    it('should export and import marks', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createTextMark(1, { x: 0, y: 0, width: 10, height: 10 }, 'test'),
      ];

      const json = exportMarksToJSON(marks);
      const imported = importMarksFromJSON(json);

      expect(imported).toHaveLength(2);
      expect(imported[0]?.type).toBe('area');
      expect(imported[1]?.type).toBe('text');
    });

    it('should throw on invalid JSON', () => {
      expect(() => importMarksFromJSON('invalid')).toThrow();
    });

    it('should throw on invalid format', () => {
      expect(() => importMarksFromJSON('{"not": "array"}')).toThrow();
    });
  });

  describe('calculateMarkStatistics', () => {
    it('should calculate statistics', () => {
      const marks = [
        createAreaMark(0, { x: 0, y: 0, width: 10, height: 10 }),
        createTextMark(0, { x: 20, y: 0, width: 10, height: 10 }, 'test'),
        createAreaMark(1, { x: 0, y: 0, width: 10, height: 10 }),
      ];

      // Apply one mark
      marks[0] = { ...marks[0]!, status: 'applied' };

      const stats = calculateMarkStatistics(marks);

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(2);
      expect(stats.applied).toBe(1);
      expect(stats.byType.area).toBe(2);
      expect(stats.byType.text).toBe(1);
      expect(stats.pageCount).toBe(2);
    });
  });
});
