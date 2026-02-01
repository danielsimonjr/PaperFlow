/**
 * Comparison Store
 * Manages state for document comparison.
 */

import { create } from 'zustand';
import type {
  ComparisonResult,
  ComparisonOptions,
  ComparisonViewMode,
  TextChange,
  DocumentInfo,
  ComparisonReport,
} from '@/lib/comparison/types';
import {
  DEFAULT_COMPARISON_OPTIONS,
  compareDocuments,
  getAdjacentChange,
  getAllChanges,
  getPagesWithChanges,
  generateReport,
} from '@/lib/comparison';

interface ComparisonState {
  // State
  document1: DocumentInfo | null;
  document2: DocumentInfo | null;
  document1Text: string[];
  document2Text: string[];
  result: ComparisonResult | null;
  isComparing: boolean;
  error: string | null;
  options: ComparisonOptions;
  viewMode: ComparisonViewMode;
  selectedChangeId: string | null;
  synchronizedScroll: boolean;
  synchronizedZoom: boolean;
  zoom: number;

  // Actions
  setDocument1: (info: DocumentInfo, pageTexts: string[]) => void;
  setDocument2: (info: DocumentInfo, pageTexts: string[]) => void;
  clearDocuments: () => void;
  runComparison: () => void;
  clearComparison: () => void;
  setOptions: (options: Partial<ComparisonOptions>) => void;
  setViewMode: (mode: ComparisonViewMode) => void;
  selectChange: (id: string | null) => void;
  nextChange: () => void;
  previousChange: () => void;
  toggleSynchronizedScroll: () => void;
  toggleSynchronizedZoom: () => void;
  setZoom: (zoom: number) => void;

  // Getters
  getSelectedChange: () => TextChange | undefined;
  getAllChanges: () => TextChange[];
  getPagesWithChanges: () => number[];
  generateReport: () => ComparisonReport | null;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  // Initial state
  document1: null,
  document2: null,
  document1Text: [],
  document2Text: [],
  result: null,
  isComparing: false,
  error: null,
  options: { ...DEFAULT_COMPARISON_OPTIONS },
  viewMode: 'side-by-side',
  selectedChangeId: null,
  synchronizedScroll: true,
  synchronizedZoom: true,
  zoom: 1,

  setDocument1: (info, pageTexts) => {
    set({
      document1: info,
      document1Text: pageTexts,
      result: null,
      error: null,
    });
  },

  setDocument2: (info, pageTexts) => {
    set({
      document2: info,
      document2Text: pageTexts,
      result: null,
      error: null,
    });
  },

  clearDocuments: () => {
    set({
      document1: null,
      document2: null,
      document1Text: [],
      document2Text: [],
      result: null,
      error: null,
      selectedChangeId: null,
    });
  },

  runComparison: () => {
    const { document1, document2, document1Text, document2Text, options } = get();

    if (!document1 || !document2) {
      set({ error: 'Both documents must be loaded to compare' });
      return;
    }

    set({ isComparing: true, error: null });

    try {
      const result = compareDocuments(
        document1Text,
        document2Text,
        document1,
        document2,
        options
      );

      set({
        result,
        isComparing: false,
        selectedChangeId: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Comparison failed',
        isComparing: false,
      });
    }
  },

  clearComparison: () => {
    set({
      result: null,
      error: null,
      selectedChangeId: null,
    });
  },

  setOptions: (options) => {
    set((state) => ({
      options: { ...state.options, ...options },
    }));
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  selectChange: (id) => {
    set({ selectedChangeId: id });
  },

  nextChange: () => {
    const { result, selectedChangeId } = get();
    if (!result) return;

    const nextChange = getAdjacentChange(result, selectedChangeId, 'next');
    if (nextChange) {
      set({ selectedChangeId: nextChange.id });
    }
  },

  previousChange: () => {
    const { result, selectedChangeId } = get();
    if (!result) return;

    const prevChange = getAdjacentChange(result, selectedChangeId, 'previous');
    if (prevChange) {
      set({ selectedChangeId: prevChange.id });
    }
  },

  toggleSynchronizedScroll: () => {
    set((state) => ({ synchronizedScroll: !state.synchronizedScroll }));
  },

  toggleSynchronizedZoom: () => {
    set((state) => ({ synchronizedZoom: !state.synchronizedZoom }));
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.25, Math.min(4, zoom)) });
  },

  getSelectedChange: () => {
    const { result, selectedChangeId } = get();
    if (!result || !selectedChangeId) return undefined;

    const allChanges = getAllChanges(result);
    return allChanges.find((c) => c.id === selectedChangeId);
  },

  getAllChanges: () => {
    const { result } = get();
    if (!result) return [];
    return getAllChanges(result);
  },

  getPagesWithChanges: () => {
    const { result } = get();
    if (!result) return [];
    return getPagesWithChanges(result);
  },

  generateReport: () => {
    const { result } = get();
    if (!result) return null;
    return generateReport(result);
  },
}));
