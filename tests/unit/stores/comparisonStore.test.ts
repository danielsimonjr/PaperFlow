/**
 * Tests for Comparison Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useComparisonStore } from '@/stores/comparisonStore';
import type { DocumentInfo, ComparisonResult, TextChange } from '@/lib/comparison/types';

// Mock the comparison library functions
const mockChanges: TextChange[] = [
  { id: 'change-1', type: 'added', page: 1, text: 'New text', position: { x: 100, y: 100 } },
  { id: 'change-2', type: 'deleted', page: 1, text: 'Old text', position: { x: 100, y: 150 } },
  { id: 'change-3', type: 'modified', page: 2, text: 'Changed text', position: { x: 100, y: 200 } },
];

const mockResult: ComparisonResult = {
  document1Info: { name: 'doc1.pdf', pageCount: 3 },
  document2Info: { name: 'doc2.pdf', pageCount: 3 },
  changes: mockChanges,
  statistics: { added: 1, deleted: 1, modified: 1, total: 3 },
};

vi.mock('@/lib/comparison', () => ({
  DEFAULT_COMPARISON_OPTIONS: {
    ignoreWhitespace: false,
    ignoreCase: false,
    ignoreFormatting: false,
    threshold: 0.8,
  },
  compareDocuments: vi.fn(() => mockResult),
  getAdjacentChange: vi.fn((result, currentId, direction) => {
    const changes = result.changes;
    const currentIndex = changes.findIndex((c: TextChange) => c.id === currentId);
    if (direction === 'next') {
      return changes[currentIndex + 1] || null;
    }
    return changes[currentIndex - 1] || null;
  }),
  getAllChanges: vi.fn((result) => result.changes),
  getPagesWithChanges: vi.fn((result) => {
    const pages = new Set(result.changes.map((c: TextChange) => c.page));
    return Array.from(pages);
  }),
  generateReport: vi.fn((result) => ({
    generatedAt: new Date().toISOString(),
    document1: result.document1Info.name,
    document2: result.document2Info.name,
    totalChanges: result.changes.length,
    summary: 'Comparison report',
  })),
}));

describe('Comparison Store', () => {
  const mockDoc1Info: DocumentInfo = { name: 'document1.pdf', pageCount: 3 };
  const mockDoc2Info: DocumentInfo = { name: 'document2.pdf', pageCount: 3 };
  const mockDoc1Text = ['Page 1 text', 'Page 2 text', 'Page 3 text'];
  const mockDoc2Text = ['Page 1 modified', 'Page 2 text', 'Page 3 new text'];

  beforeEach(() => {
    // Reset store state before each test
    useComparisonStore.setState({
      document1: null,
      document2: null,
      document1Text: [],
      document2Text: [],
      result: null,
      isComparing: false,
      error: null,
      options: {
        ignoreWhitespace: false,
        ignoreCase: false,
        ignoreFormatting: false,
        threshold: 0.8,
      },
      viewMode: 'side-by-side',
      selectedChangeId: null,
      synchronizedScroll: true,
      synchronizedZoom: true,
      zoom: 1,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useComparisonStore.getState();
      expect(state.document1).toBeNull();
      expect(state.document2).toBeNull();
      expect(state.document1Text).toEqual([]);
      expect(state.document2Text).toEqual([]);
      expect(state.result).toBeNull();
      expect(state.isComparing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.viewMode).toBe('side-by-side');
      expect(state.selectedChangeId).toBeNull();
      expect(state.synchronizedScroll).toBe(true);
      expect(state.synchronizedZoom).toBe(true);
      expect(state.zoom).toBe(1);
    });
  });

  describe('document loading', () => {
    it('should set document 1', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);

      const state = useComparisonStore.getState();
      expect(state.document1).toEqual(mockDoc1Info);
      expect(state.document1Text).toEqual(mockDoc1Text);
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should set document 2', () => {
      const store = useComparisonStore.getState();
      store.setDocument2(mockDoc2Info, mockDoc2Text);

      const state = useComparisonStore.getState();
      expect(state.document2).toEqual(mockDoc2Info);
      expect(state.document2Text).toEqual(mockDoc2Text);
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should clear previous result when setting new document', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);
      store.runComparison();

      store.setDocument1({ name: 'new-doc.pdf', pageCount: 2 }, ['New page']);

      const state = useComparisonStore.getState();
      expect(state.result).toBeNull();
    });

    it('should clear all documents', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);
      store.runComparison();
      useComparisonStore.setState({ selectedChangeId: 'change-1' });

      store.clearDocuments();

      const state = useComparisonStore.getState();
      expect(state.document1).toBeNull();
      expect(state.document2).toBeNull();
      expect(state.document1Text).toEqual([]);
      expect(state.document2Text).toEqual([]);
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
      expect(state.selectedChangeId).toBeNull();
    });
  });

  describe('comparison execution', () => {
    it('should run comparison when both documents are loaded', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);

      store.runComparison();

      const state = useComparisonStore.getState();
      expect(state.result).not.toBeNull();
      expect(state.isComparing).toBe(false);
      expect(state.selectedChangeId).toBeNull();
    });

    it('should set error when document 1 is missing', () => {
      const store = useComparisonStore.getState();
      store.setDocument2(mockDoc2Info, mockDoc2Text);

      store.runComparison();

      const state = useComparisonStore.getState();
      expect(state.error).toBe('Both documents must be loaded to compare');
      expect(state.result).toBeNull();
    });

    it('should set error when document 2 is missing', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);

      store.runComparison();

      const state = useComparisonStore.getState();
      expect(state.error).toBe('Both documents must be loaded to compare');
      expect(state.result).toBeNull();
    });

    it('should clear comparison results', () => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);
      store.runComparison();
      useComparisonStore.setState({ selectedChangeId: 'change-1' });

      store.clearComparison();

      const state = useComparisonStore.getState();
      expect(state.result).toBeNull();
      expect(state.error).toBeNull();
      expect(state.selectedChangeId).toBeNull();
    });
  });

  describe('comparison options', () => {
    it('should set partial options', () => {
      const store = useComparisonStore.getState();

      store.setOptions({ ignoreWhitespace: true, ignoreCase: true });

      const state = useComparisonStore.getState();
      expect(state.options.ignoreWhitespace).toBe(true);
      expect(state.options.ignoreCase).toBe(true);
      expect(state.options.ignoreFormatting).toBe(false);
      expect(state.options.threshold).toBe(0.8);
    });

    it('should update threshold option', () => {
      const store = useComparisonStore.getState();

      store.setOptions({ threshold: 0.9 });

      const state = useComparisonStore.getState();
      expect(state.options.threshold).toBe(0.9);
    });
  });

  describe('view mode', () => {
    it('should set view mode to side-by-side', () => {
      const store = useComparisonStore.getState();

      store.setViewMode('side-by-side');

      expect(useComparisonStore.getState().viewMode).toBe('side-by-side');
    });

    it('should set view mode to overlay', () => {
      const store = useComparisonStore.getState();

      store.setViewMode('overlay');

      expect(useComparisonStore.getState().viewMode).toBe('overlay');
    });

    it('should set view mode to unified', () => {
      const store = useComparisonStore.getState();

      store.setViewMode('unified');

      expect(useComparisonStore.getState().viewMode).toBe('unified');
    });
  });

  describe('change navigation', () => {
    beforeEach(() => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);
      store.runComparison();
    });

    it('should select a change', () => {
      const store = useComparisonStore.getState();

      store.selectChange('change-1');

      expect(useComparisonStore.getState().selectedChangeId).toBe('change-1');
    });

    it('should clear change selection', () => {
      const store = useComparisonStore.getState();
      store.selectChange('change-1');

      store.selectChange(null);

      expect(useComparisonStore.getState().selectedChangeId).toBeNull();
    });

    it('should navigate to next change', () => {
      const store = useComparisonStore.getState();
      store.selectChange('change-1');

      store.nextChange();

      expect(useComparisonStore.getState().selectedChangeId).toBe('change-2');
    });

    it('should navigate to previous change', () => {
      const store = useComparisonStore.getState();
      store.selectChange('change-2');

      store.previousChange();

      expect(useComparisonStore.getState().selectedChangeId).toBe('change-1');
    });

    it('should not navigate when no result', () => {
      const store = useComparisonStore.getState();
      store.clearComparison();

      store.nextChange();

      expect(useComparisonStore.getState().selectedChangeId).toBeNull();
    });
  });

  describe('synchronized view', () => {
    it('should toggle synchronized scroll', () => {
      const store = useComparisonStore.getState();
      expect(store.synchronizedScroll).toBe(true);

      store.toggleSynchronizedScroll();
      expect(useComparisonStore.getState().synchronizedScroll).toBe(false);

      store.toggleSynchronizedScroll();
      expect(useComparisonStore.getState().synchronizedScroll).toBe(true);
    });

    it('should toggle synchronized zoom', () => {
      const store = useComparisonStore.getState();
      expect(store.synchronizedZoom).toBe(true);

      store.toggleSynchronizedZoom();
      expect(useComparisonStore.getState().synchronizedZoom).toBe(false);

      store.toggleSynchronizedZoom();
      expect(useComparisonStore.getState().synchronizedZoom).toBe(true);
    });
  });

  describe('zoom', () => {
    it('should set zoom level', () => {
      const store = useComparisonStore.getState();

      store.setZoom(1.5);

      expect(useComparisonStore.getState().zoom).toBe(1.5);
    });

    it('should clamp zoom to minimum 0.25', () => {
      const store = useComparisonStore.getState();

      store.setZoom(0.1);

      expect(useComparisonStore.getState().zoom).toBe(0.25);
    });

    it('should clamp zoom to maximum 4', () => {
      const store = useComparisonStore.getState();

      store.setZoom(5);

      expect(useComparisonStore.getState().zoom).toBe(4);
    });
  });

  describe('getter methods', () => {
    beforeEach(() => {
      const store = useComparisonStore.getState();
      store.setDocument1(mockDoc1Info, mockDoc1Text);
      store.setDocument2(mockDoc2Info, mockDoc2Text);
      store.runComparison();
    });

    it('should get selected change', () => {
      const store = useComparisonStore.getState();
      store.selectChange('change-1');

      const selectedChange = store.getSelectedChange();

      expect(selectedChange).toBeDefined();
      expect(selectedChange?.id).toBe('change-1');
    });

    it('should return undefined when no change is selected', () => {
      const store = useComparisonStore.getState();

      const selectedChange = store.getSelectedChange();

      expect(selectedChange).toBeUndefined();
    });

    it('should get all changes', () => {
      const store = useComparisonStore.getState();

      const allChanges = store.getAllChanges();

      expect(allChanges).toHaveLength(3);
    });

    it('should return empty array when no result', () => {
      const store = useComparisonStore.getState();
      store.clearComparison();

      const allChanges = store.getAllChanges();

      expect(allChanges).toEqual([]);
    });

    it('should get pages with changes', () => {
      const store = useComparisonStore.getState();

      const pages = store.getPagesWithChanges();

      expect(pages).toContain(1);
      expect(pages).toContain(2);
    });

    it('should generate comparison report', () => {
      const store = useComparisonStore.getState();

      const report = store.generateReport();

      expect(report).not.toBeNull();
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('document1');
      expect(report).toHaveProperty('document2');
      expect(report).toHaveProperty('totalChanges');
    });

    it('should return null report when no result', () => {
      const store = useComparisonStore.getState();
      store.clearComparison();

      const report = store.generateReport();

      expect(report).toBeNull();
    });
  });
});
