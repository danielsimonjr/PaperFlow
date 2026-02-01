/**
 * Tests for Redaction Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRedactionStore } from '@/stores/redactionStore';
import type { RedactionMark, RedactionPattern, PatternMatch, VerificationResult } from '@/lib/redaction/types';

// Mock the redaction library functions
vi.mock('@/lib/redaction', () => ({
  DEFAULT_REDACTION_OPTIONS: {
    overlayText: '',
    overlayColor: '#000000',
    overlayOpacity: 1,
  },
  createAreaMark: vi.fn((pageIndex, bounds, options) => ({
    id: `mark-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'area',
    pageIndex,
    bounds,
    status: 'marked',
    overlayText: options?.overlayText || '',
    overlayColor: options?.overlayColor || '#000000',
  })),
  createTextMark: vi.fn((pageIndex, bounds, matchedText, options) => ({
    id: `mark-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type: 'text',
    pageIndex,
    bounds,
    matchedText,
    status: 'marked',
    overlayText: options?.overlayText || '',
    overlayColor: options?.overlayColor || '#000000',
  })),
  createPatternMarks: vi.fn((pageIndex, matches, regex, patternName, options) =>
    matches.map((match: { text: string; bounds: { x: number; y: number; width: number; height: number } }) => ({
      id: `mark-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'pattern',
      pageIndex,
      bounds: match.bounds,
      matchedText: match.text,
      pattern: patternName,
      status: 'marked',
      overlayText: options?.overlayText || '',
      overlayColor: options?.overlayColor || '#000000',
    }))
  ),
  markAsApplied: vi.fn((marks) =>
    marks.map((mark: RedactionMark) =>
      mark.status === 'marked' ? { ...mark, status: 'applied' } : mark
    )
  ),
  createAuditEntry: vi.fn((action, details) => ({
    id: `audit-${Date.now()}`,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  })),
  calculateMarkStatistics: vi.fn((marks) => ({
    total: marks.length,
    pending: marks.filter((m: RedactionMark) => m.status === 'marked').length,
    applied: marks.filter((m: RedactionMark) => m.status === 'applied').length,
    byPage: new Map(),
    byType: { area: 0, text: 0, pattern: 0 },
  })),
  findPatternMatches: vi.fn((text, pattern, pageIndex) => [
    { text: '123-45-6789', bounds: { x: 100, y: 100, width: 80, height: 12 }, pageIndex },
    { text: '987-65-4321', bounds: { x: 100, y: 120, width: 80, height: 12 }, pageIndex },
  ]),
}));

describe('Redaction Store', () => {
  const mockMark: RedactionMark = {
    id: 'test-mark-1',
    type: 'area',
    pageIndex: 0,
    bounds: { x: 100, y: 100, width: 200, height: 50 },
    status: 'marked',
    overlayText: '',
    overlayColor: '#000000',
  };

  const mockTextMark: RedactionMark = {
    id: 'test-mark-2',
    type: 'text',
    pageIndex: 0,
    bounds: { x: 150, y: 200, width: 100, height: 20 },
    matchedText: 'Sensitive Info',
    status: 'marked',
    overlayText: '',
    overlayColor: '#000000',
  };

  const mockPattern: RedactionPattern = {
    id: 'ssn-pattern',
    name: 'Social Security Number',
    regex: /\d{3}-\d{2}-\d{4}/,
    description: 'US SSN pattern',
  };

  beforeEach(() => {
    // Reset store state before each test
    useRedactionStore.setState({
      marks: [],
      selectedMarkIds: [],
      activePatternId: null,
      searchResults: [],
      options: {
        overlayText: '',
        overlayColor: '#000000',
        overlayOpacity: 1,
      },
      isApplying: false,
      verificationResult: null,
      auditLog: [],
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useRedactionStore.getState();
      expect(state.marks).toEqual([]);
      expect(state.selectedMarkIds).toEqual([]);
      expect(state.activePatternId).toBeNull();
      expect(state.searchResults).toEqual([]);
      expect(state.options).toEqual({
        overlayText: '',
        overlayColor: '#000000',
        overlayOpacity: 1,
      });
      expect(state.isApplying).toBe(false);
      expect(state.verificationResult).toBeNull();
      expect(state.auditLog).toEqual([]);
    });
  });

  describe('mark management', () => {
    it('should add a single mark', () => {
      const store = useRedactionStore.getState();

      store.addMark(mockMark);

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(1);
      expect(state.marks[0]).toEqual(mockMark);
      expect(state.auditLog).toHaveLength(1);
    });

    it('should add multiple marks', () => {
      const store = useRedactionStore.getState();

      store.addMarks([mockMark, mockTextMark]);

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(2);
      expect(state.auditLog).toHaveLength(2);
    });

    it('should remove a mark', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);

      store.removeMark(mockMark.id);

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(1);
      expect(state.marks[0]?.id).toBe(mockTextMark.id);
    });

    it('should add audit entry when removing mark', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);

      store.removeMark(mockMark.id);

      const state = useRedactionStore.getState();
      expect(state.auditLog).toHaveLength(2); // One for add, one for remove
      expect(state.auditLog[1]?.action).toBe('unmark');
    });

    it('should remove multiple marks', () => {
      const store = useRedactionStore.getState();
      const mark3: RedactionMark = { ...mockMark, id: 'test-mark-3' };
      store.addMarks([mockMark, mockTextMark, mark3]);

      store.removeMarks([mockMark.id, mockTextMark.id]);

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(1);
      expect(state.marks[0]?.id).toBe('test-mark-3');
    });

    it('should clear all marks', () => {
      const store = useRedactionStore.getState();
      store.addMarks([mockMark, mockTextMark]);
      store.selectMarks([mockMark.id]);

      store.clearMarks();

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(0);
      expect(state.selectedMarkIds).toHaveLength(0);
      expect(state.searchResults).toHaveLength(0);
    });
  });

  describe('mark selection', () => {
    it('should select marks', () => {
      const store = useRedactionStore.getState();
      store.addMarks([mockMark, mockTextMark]);

      store.selectMarks([mockMark.id, mockTextMark.id]);

      const state = useRedactionStore.getState();
      expect(state.selectedMarkIds).toEqual([mockMark.id, mockTextMark.id]);
    });

    it('should clear selection', () => {
      const store = useRedactionStore.getState();
      store.addMarks([mockMark, mockTextMark]);
      store.selectMarks([mockMark.id]);

      store.clearSelection();

      expect(useRedactionStore.getState().selectedMarkIds).toEqual([]);
    });

    it('should clear selection when selected mark is removed', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.selectMarks([mockMark.id]);

      store.removeMark(mockMark.id);

      expect(useRedactionStore.getState().selectedMarkIds).toEqual([]);
    });
  });

  describe('mark options update', () => {
    it('should update mark overlay options', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);

      store.updateMarkOptions(mockMark.id, {
        overlayText: 'REDACTED',
        overlayColor: '#FF0000',
      });

      const state = useRedactionStore.getState();
      expect(state.marks[0]?.overlayText).toBe('REDACTED');
      expect(state.marks[0]?.overlayColor).toBe('#FF0000');
    });

    it('should not update non-existent mark', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);

      store.updateMarkOptions('non-existent', { overlayText: 'TEST' });

      const state = useRedactionStore.getState();
      expect(state.marks[0]?.overlayText).toBe('');
    });
  });

  describe('redaction options', () => {
    it('should set partial options', () => {
      const store = useRedactionStore.getState();

      store.setOptions({ overlayText: '[REDACTED]', overlayOpacity: 0.8 });

      const state = useRedactionStore.getState();
      expect(state.options.overlayText).toBe('[REDACTED]');
      expect(state.options.overlayOpacity).toBe(0.8);
      expect(state.options.overlayColor).toBe('#000000');
    });
  });

  describe('area redaction', () => {
    it('should add area redaction', () => {
      const store = useRedactionStore.getState();
      const bounds = { x: 50, y: 50, width: 100, height: 30 };

      const id = store.addAreaRedaction(0, bounds);

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(1);
      expect(state.marks[0]?.type).toBe('area');
      expect(state.marks[0]?.pageIndex).toBe(0);
      expect(typeof id).toBe('string');
    });
  });

  describe('text redaction', () => {
    it('should add text redaction', () => {
      const store = useRedactionStore.getState();
      const bounds = { x: 100, y: 100, width: 80, height: 20 };

      const id = store.addTextRedaction(0, bounds, 'Secret Text');

      const state = useRedactionStore.getState();
      expect(state.marks).toHaveLength(1);
      expect(state.marks[0]?.type).toBe('text');
      expect(state.marks[0]?.matchedText).toBe('Secret Text');
      expect(typeof id).toBe('string');
    });
  });

  describe('pattern redaction', () => {
    it('should search with pattern', () => {
      const store = useRedactionStore.getState();
      const text = 'SSN: 123-45-6789 and 987-65-4321';

      const matches = store.searchWithPattern(text, mockPattern, 0);

      expect(matches).toHaveLength(2);
      expect(useRedactionStore.getState().searchResults).toHaveLength(2);
    });

    it('should add pattern redactions', () => {
      const store = useRedactionStore.getState();
      const matches = [
        { text: '123-45-6789', bounds: { x: 100, y: 100, width: 80, height: 12 } },
        { text: '987-65-4321', bounds: { x: 100, y: 120, width: 80, height: 12 } },
      ];

      const ids = store.addPatternRedactions(0, matches, mockPattern);

      const state = useRedactionStore.getState();
      expect(ids).toHaveLength(2);
      expect(state.marks).toHaveLength(2);
      expect(state.marks[0]?.type).toBe('pattern');
    });

    it('should set active pattern', () => {
      const store = useRedactionStore.getState();

      store.setActivePattern('ssn-pattern');

      expect(useRedactionStore.getState().activePatternId).toBe('ssn-pattern');
    });

    it('should set search results', () => {
      const store = useRedactionStore.getState();
      const results: PatternMatch[] = [
        { text: '123-45-6789', bounds: { x: 100, y: 100, width: 80, height: 12 }, pageIndex: 0 },
      ];

      store.setSearchResults(results);

      expect(useRedactionStore.getState().searchResults).toEqual(results);
    });

    it('should clear search results', () => {
      const store = useRedactionStore.getState();
      store.setActivePattern('ssn-pattern');
      store.setSearchResults([
        { text: '123-45-6789', bounds: { x: 100, y: 100, width: 80, height: 12 }, pageIndex: 0 },
      ]);

      store.clearSearchResults();

      const state = useRedactionStore.getState();
      expect(state.searchResults).toEqual([]);
      expect(state.activePatternId).toBeNull();
    });
  });

  describe('apply redactions', () => {
    it('should apply selected redactions', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);
      store.selectMarks([mockMark.id]);

      store.applyRedactions();

      const state = useRedactionStore.getState();
      expect(state.marks[0]?.status).toBe('applied');
      expect(state.marks[1]?.status).toBe('marked');
    });

    it('should apply specific redactions by id', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);

      store.applyRedactions([mockTextMark.id]);

      const state = useRedactionStore.getState();
      expect(state.marks[0]?.status).toBe('marked');
      expect(state.marks[1]?.status).toBe('applied');
    });

    it('should apply all redactions', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);

      store.applyAllRedactions();

      const state = useRedactionStore.getState();
      expect(state.marks.every((m) => m.status === 'applied')).toBe(true);
    });

    it('should add audit entries when applying redactions', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      const initialAuditCount = useRedactionStore.getState().auditLog.length;

      store.applyAllRedactions();

      const state = useRedactionStore.getState();
      expect(state.auditLog.length).toBeGreaterThan(initialAuditCount);
    });
  });

  describe('verification', () => {
    it('should set verification result', () => {
      const store = useRedactionStore.getState();
      const verificationResult: VerificationResult = {
        passed: true,
        checks: [
          { name: 'Text extraction', passed: true },
          { name: 'Metadata check', passed: true },
        ],
      };

      store.setVerificationResult(verificationResult);

      const state = useRedactionStore.getState();
      expect(state.verificationResult).toEqual(verificationResult);
      expect(state.auditLog.some((e) => e.action === 'verify')).toBe(true);
    });

    it('should clear verification result', () => {
      const store = useRedactionStore.getState();
      store.setVerificationResult({ passed: true, checks: [] });

      store.setVerificationResult(null);

      expect(useRedactionStore.getState().verificationResult).toBeNull();
    });
  });

  describe('audit log', () => {
    it('should get audit log', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.removeMark(mockMark.id);

      const log = store.getAuditLog();

      expect(log).toHaveLength(2);
    });
  });

  describe('statistics', () => {
    it('should get mark statistics', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);

      const stats = store.getStatistics();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('applied');
    });
  });

  describe('getter methods', () => {
    it('should get marks by page', () => {
      const store = useRedactionStore.getState();
      const page1Mark: RedactionMark = { ...mockMark, pageIndex: 1, id: 'page1-mark' };
      store.addMark(mockMark);
      store.addMark(page1Mark);

      const page0Marks = store.getMarksByPage(0);
      const page1Marks = store.getMarksByPage(1);

      expect(page0Marks).toHaveLength(1);
      expect(page0Marks[0]?.id).toBe(mockMark.id);
      expect(page1Marks).toHaveLength(1);
      expect(page1Marks[0]?.id).toBe('page1-mark');
    });

    it('should get pending marks', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);
      store.applyRedactions([mockMark.id]);

      const pending = store.getPendingMarks();

      expect(pending).toHaveLength(1);
      expect(pending[0]?.id).toBe(mockTextMark.id);
    });

    it('should get applied marks', () => {
      const store = useRedactionStore.getState();
      store.addMark(mockMark);
      store.addMark(mockTextMark);
      store.applyRedactions([mockMark.id]);

      const applied = store.getAppliedMarks();

      expect(applied).toHaveLength(1);
      expect(applied[0]?.id).toBe(mockMark.id);
    });
  });

  describe('full workflow', () => {
    it('should handle complete redaction workflow', () => {
      const store = useRedactionStore.getState();

      // Configure options
      store.setOptions({ overlayText: '[REDACTED]', overlayColor: '#000000' });

      // Add area redaction
      const areaId = store.addAreaRedaction(0, { x: 50, y: 50, width: 100, height: 30 });

      // Add text redaction
      const textId = store.addTextRedaction(0, { x: 100, y: 100, width: 80, height: 20 }, 'Secret');

      // Search for patterns
      store.searchWithPattern('SSN: 123-45-6789', mockPattern, 0);

      // Add pattern redactions
      store.addPatternRedactions(
        0,
        [{ text: '123-45-6789', bounds: { x: 100, y: 150, width: 80, height: 12 } }],
        mockPattern
      );

      // Select and apply some
      store.selectMarks([areaId, textId]);
      store.applyRedactions();

      // Apply all remaining
      store.applyAllRedactions();

      // Verify
      store.setVerificationResult({ passed: true, checks: [] });

      const state = useRedactionStore.getState();
      expect(state.marks.length).toBeGreaterThan(0);
      expect(state.marks.every((m) => m.status === 'applied')).toBe(true);
      expect(state.verificationResult?.passed).toBe(true);
      expect(state.auditLog.length).toBeGreaterThan(0);
    });
  });
});
