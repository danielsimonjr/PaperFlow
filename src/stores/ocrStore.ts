/**
 * OCR Store
 * Manages OCR state including results, progress, and settings.
 */

import { create } from 'zustand';
import type { OCRResult, OCRProgress, PreprocessingOptions } from '@/lib/ocr/types';

interface OCRState {
  // Results
  results: Map<number, OCRResult>;

  // Processing state
  isProcessing: boolean;
  progress: OCRProgress | null;
  currentPage: number;
  totalPages: number;

  // Settings
  language: string;
  preprocessingOptions: PreprocessingOptions;

  // Error state
  error: string | null;

  // Actions
  setLanguage: (language: string) => void;
  setPreprocessingOptions: (options: PreprocessingOptions) => void;
  startProcessing: (totalPages: number) => void;
  updateProgress: (progress: OCRProgress) => void;
  setCurrentPage: (page: number) => void;
  addResult: (pageIndex: number, result: OCRResult) => void;
  updateWordText: (pageIndex: number, wordIndex: number, newText: string) => void;
  clearResults: () => void;
  stopProcessing: () => void;
  setError: (error: string | null) => void;
  cancelOCR: () => void;
  reset: () => void;
}

const initialPreprocessingOptions: PreprocessingOptions = {
  grayscale: true,
  binarize: false,
  adaptiveThreshold: false,
  deskew: false,
  denoise: false,
  scale: 2.0,
  invert: false,
};

export const useOCRStore = create<OCRState>((set, get) => ({
  // Initial state
  results: new Map(),
  isProcessing: false,
  progress: null,
  currentPage: 0,
  totalPages: 0,
  language: 'eng',
  preprocessingOptions: initialPreprocessingOptions,
  error: null,

  // Actions
  setLanguage: (language) => {
    set({ language });
  },

  setPreprocessingOptions: (options) => {
    set({ preprocessingOptions: options });
  },

  startProcessing: (totalPages) => {
    set({
      isProcessing: true,
      totalPages,
      currentPage: 0,
      progress: { status: 'loading', progress: 0 },
      error: null,
    });
  },

  updateProgress: (progress) => {
    set({ progress });
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  addResult: (pageIndex, result) => {
    const results = new Map(get().results);
    results.set(pageIndex, result);
    set({ results });
  },

  updateWordText: (pageIndex, wordIndex, newText) => {
    const results = new Map(get().results);
    const pageResult = results.get(pageIndex);
    const existingWord = pageResult?.words[wordIndex];

    if (pageResult && existingWord) {
      const updatedWords = [...pageResult.words];
      updatedWords[wordIndex] = { ...existingWord, text: newText };

      // Rebuild full text
      const fullText = updatedWords.map(w => w.text).join(' ');

      results.set(pageIndex, {
        ...pageResult,
        words: updatedWords,
        text: fullText,
      });

      set({ results });
    }
  },

  clearResults: () => {
    set({ results: new Map() });
  },

  stopProcessing: () => {
    set({
      isProcessing: false,
      progress: { status: 'complete', progress: 1 },
    });
  },

  setError: (error) => {
    set({ error, isProcessing: false });
  },

  cancelOCR: () => {
    set({
      isProcessing: false,
      progress: { status: 'idle', progress: 0 },
    });
  },

  reset: () => {
    set({
      results: new Map(),
      isProcessing: false,
      progress: null,
      currentPage: 0,
      totalPages: 0,
      error: null,
    });
  },
}));

// Selectors
export const selectHasResults = (state: OCRState) => state.results.size > 0;
export const selectResultForPage = (pageIndex: number) => (state: OCRState) =>
  state.results.get(pageIndex);
