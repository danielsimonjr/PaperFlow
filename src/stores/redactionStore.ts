/**
 * Redaction Store
 * Manages state for redaction marks and operations.
 */

import { create } from 'zustand';
import type {
  RedactionMark,
  RedactionPattern,
  PatternMatch,
  RedactionOptions,
  VerificationResult,
  AuditLogEntry,
} from '@/lib/redaction/types';
import {
  DEFAULT_REDACTION_OPTIONS,
  createAreaMark,
  createTextMark,
  createPatternMarks,
  markAsApplied,
  createAuditEntry,
  calculateMarkStatistics,
  findPatternMatches,
} from '@/lib/redaction';

interface RedactionState {
  // State
  marks: RedactionMark[];
  selectedMarkIds: string[];
  activePatternId: string | null;
  searchResults: PatternMatch[];
  options: RedactionOptions;
  isApplying: boolean;
  verificationResult: VerificationResult | null;
  auditLog: AuditLogEntry[];

  // Actions
  addMark: (mark: RedactionMark) => void;
  addMarks: (marks: RedactionMark[]) => void;
  removeMark: (id: string) => void;
  removeMarks: (ids: string[]) => void;
  clearMarks: () => void;
  selectMarks: (ids: string[]) => void;
  clearSelection: () => void;
  updateMarkOptions: (id: string, options: Partial<Pick<RedactionMark, 'overlayText' | 'overlayColor'>>) => void;
  setOptions: (options: Partial<RedactionOptions>) => void;

  // Area redaction
  addAreaRedaction: (pageIndex: number, bounds: { x: number; y: number; width: number; height: number }) => string;

  // Text redaction
  addTextRedaction: (pageIndex: number, bounds: { x: number; y: number; width: number; height: number }, matchedText: string) => string;

  // Pattern redaction
  searchWithPattern: (text: string, pattern: RedactionPattern, pageIndex: number) => PatternMatch[];
  addPatternRedactions: (pageIndex: number, matches: Array<{ text: string; bounds: { x: number; y: number; width: number; height: number } }>, pattern: RedactionPattern) => string[];
  setActivePattern: (patternId: string | null) => void;
  setSearchResults: (results: PatternMatch[]) => void;
  clearSearchResults: () => void;

  // Apply redactions
  applyRedactions: (markIds?: string[]) => void;
  applyAllRedactions: () => void;

  // Verification
  setVerificationResult: (result: VerificationResult | null) => void;

  // Audit
  getAuditLog: () => AuditLogEntry[];

  // Statistics
  getStatistics: () => ReturnType<typeof calculateMarkStatistics>;

  // Helpers
  getMarksByPage: (pageIndex: number) => RedactionMark[];
  getPendingMarks: () => RedactionMark[];
  getAppliedMarks: () => RedactionMark[];
}

export const useRedactionStore = create<RedactionState>((set, get) => ({
  marks: [],
  selectedMarkIds: [],
  activePatternId: null,
  searchResults: [],
  options: { ...DEFAULT_REDACTION_OPTIONS },
  isApplying: false,
  verificationResult: null,
  auditLog: [],

  addMark: (mark) => {
    set((state) => {
      const entry = createAuditEntry('mark', {
        markId: mark.id,
        pageIndex: mark.pageIndex,
        pattern: mark.pattern,
        details: mark.matchedText,
      });

      return {
        marks: [...state.marks, mark],
        auditLog: [...state.auditLog, entry],
      };
    });
  },

  addMarks: (marks) => {
    set((state) => {
      const entries = marks.map((mark) =>
        createAuditEntry('mark', {
          markId: mark.id,
          pageIndex: mark.pageIndex,
          pattern: mark.pattern,
        })
      );

      return {
        marks: [...state.marks, ...marks],
        auditLog: [...state.auditLog, ...entries],
      };
    });
  },

  removeMark: (id) => {
    set((state) => {
      const mark = state.marks.find((m) => m.id === id);
      if (!mark) return state;

      const entry = createAuditEntry('unmark', {
        markId: id,
        pageIndex: mark.pageIndex,
      });

      return {
        marks: state.marks.filter((m) => m.id !== id),
        selectedMarkIds: state.selectedMarkIds.filter((sid) => sid !== id),
        auditLog: [...state.auditLog, entry],
      };
    });
  },

  removeMarks: (ids) => {
    set((state) => {
      const idSet = new Set(ids);
      const entries = state.marks
        .filter((m) => idSet.has(m.id))
        .map((m) =>
          createAuditEntry('unmark', {
            markId: m.id,
            pageIndex: m.pageIndex,
          })
        );

      return {
        marks: state.marks.filter((m) => !idSet.has(m.id)),
        selectedMarkIds: state.selectedMarkIds.filter((sid) => !idSet.has(sid)),
        auditLog: [...state.auditLog, ...entries],
      };
    });
  },

  clearMarks: () => {
    set({
      marks: [],
      selectedMarkIds: [],
      searchResults: [],
    });
  },

  selectMarks: (ids) => {
    set({ selectedMarkIds: ids });
  },

  clearSelection: () => {
    set({ selectedMarkIds: [] });
  },

  updateMarkOptions: (id, options) => {
    set((state) => ({
      marks: state.marks.map((m) =>
        m.id === id ? { ...m, ...options } : m
      ),
    }));
  },

  setOptions: (options) => {
    set((state) => ({
      options: { ...state.options, ...options },
    }));
  },

  addAreaRedaction: (pageIndex, bounds) => {
    const { options } = get();
    const mark = createAreaMark(pageIndex, bounds, options);
    get().addMark(mark);
    return mark.id;
  },

  addTextRedaction: (pageIndex, bounds, matchedText) => {
    const { options } = get();
    const mark = createTextMark(pageIndex, bounds, matchedText, options);
    get().addMark(mark);
    return mark.id;
  },

  searchWithPattern: (text, pattern, pageIndex) => {
    const matches = findPatternMatches(text, pattern, pageIndex);
    set({ searchResults: matches });
    return matches;
  },

  addPatternRedactions: (pageIndex, matches, pattern) => {
    const { options } = get();
    const marks = createPatternMarks(
      pageIndex,
      matches,
      pattern.regex,
      pattern.name,
      options
    );
    get().addMarks(marks);
    return marks.map((m) => m.id);
  },

  setActivePattern: (patternId) => {
    set({ activePatternId: patternId });
  },

  setSearchResults: (results) => {
    set({ searchResults: results });
  },

  clearSearchResults: () => {
    set({ searchResults: [], activePatternId: null });
  },

  applyRedactions: (markIds) => {
    set((state) => {
      const idsToApply = markIds || state.selectedMarkIds;
      const idSet = new Set(idsToApply);

      const updatedMarks = state.marks.map((m) =>
        idSet.has(m.id) && m.status === 'marked'
          ? { ...m, status: 'applied' as const }
          : m
      );

      const entries = state.marks
        .filter((m) => idSet.has(m.id) && m.status === 'marked')
        .map((m) =>
          createAuditEntry('apply', {
            markId: m.id,
            pageIndex: m.pageIndex,
          })
        );

      return {
        marks: updatedMarks,
        auditLog: [...state.auditLog, ...entries],
      };
    });
  },

  applyAllRedactions: () => {
    set((state) => {
      const updatedMarks = markAsApplied(state.marks);

      const entries = state.marks
        .filter((m) => m.status === 'marked')
        .map((m) =>
          createAuditEntry('apply', {
            markId: m.id,
            pageIndex: m.pageIndex,
          })
        );

      return {
        marks: updatedMarks,
        auditLog: [...state.auditLog, ...entries],
      };
    });
  },

  setVerificationResult: (result) => {
    set((state) => {
      if (result) {
        const entry = createAuditEntry('verify', {
          details: result.passed ? 'Verification passed' : 'Verification failed',
        });
        return {
          verificationResult: result,
          auditLog: [...state.auditLog, entry],
        };
      }
      return { verificationResult: result };
    });
  },

  getAuditLog: () => {
    return get().auditLog;
  },

  getStatistics: () => {
    return calculateMarkStatistics(get().marks);
  },

  getMarksByPage: (pageIndex) => {
    return get().marks.filter((m) => m.pageIndex === pageIndex);
  },

  getPendingMarks: () => {
    return get().marks.filter((m) => m.status === 'marked');
  },

  getAppliedMarks: () => {
    return get().marks.filter((m) => m.status === 'applied');
  },
}));
