/**
 * Tests for OCR Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOCRStore, selectHasResults, selectResultForPage } from '@/stores/ocrStore';
import type { OCRResult, OCRProgress, PreprocessingOptions } from '@/lib/ocr/types';

describe('OCR Store', () => {
  const initialPreprocessingOptions: PreprocessingOptions = {
    grayscale: true,
    binarize: false,
    adaptiveThreshold: false,
    deskew: false,
    denoise: false,
    scale: 2.0,
    invert: false,
  };

  const mockOCRResult: OCRResult = {
    text: 'Sample OCR text from page',
    words: [
      { text: 'Sample', bounds: { x: 10, y: 10, width: 50, height: 12 }, confidence: 0.95 },
      { text: 'OCR', bounds: { x: 65, y: 10, width: 30, height: 12 }, confidence: 0.98 },
      { text: 'text', bounds: { x: 100, y: 10, width: 30, height: 12 }, confidence: 0.92 },
      { text: 'from', bounds: { x: 135, y: 10, width: 35, height: 12 }, confidence: 0.90 },
      { text: 'page', bounds: { x: 175, y: 10, width: 35, height: 12 }, confidence: 0.94 },
    ],
    confidence: 0.94,
  };

  beforeEach(() => {
    // Reset store state before each test
    useOCRStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useOCRStore.getState();
      expect(state.results.size).toBe(0);
      expect(state.isProcessing).toBe(false);
      expect(state.progress).toBeNull();
      expect(state.currentPage).toBe(0);
      expect(state.totalPages).toBe(0);
      expect(state.language).toBe('eng');
      expect(state.preprocessingOptions).toEqual(initialPreprocessingOptions);
      expect(state.error).toBeNull();
    });
  });

  describe('language selection', () => {
    it('should set language', () => {
      const store = useOCRStore.getState();

      store.setLanguage('fra');

      expect(useOCRStore.getState().language).toBe('fra');
    });

    it('should set language to German', () => {
      const store = useOCRStore.getState();

      store.setLanguage('deu');

      expect(useOCRStore.getState().language).toBe('deu');
    });

    it('should support multiple languages', () => {
      const store = useOCRStore.getState();

      store.setLanguage('eng+fra+deu');

      expect(useOCRStore.getState().language).toBe('eng+fra+deu');
    });
  });

  describe('preprocessing options', () => {
    it('should set preprocessing options', () => {
      const store = useOCRStore.getState();
      const newOptions: PreprocessingOptions = {
        grayscale: true,
        binarize: true,
        adaptiveThreshold: true,
        deskew: true,
        denoise: true,
        scale: 3.0,
        invert: false,
      };

      store.setPreprocessingOptions(newOptions);

      expect(useOCRStore.getState().preprocessingOptions).toEqual(newOptions);
    });

    it('should update individual preprocessing option', () => {
      const store = useOCRStore.getState();
      const updatedOptions = {
        ...store.preprocessingOptions,
        deskew: true,
        scale: 1.5,
      };

      store.setPreprocessingOptions(updatedOptions);

      const state = useOCRStore.getState();
      expect(state.preprocessingOptions.deskew).toBe(true);
      expect(state.preprocessingOptions.scale).toBe(1.5);
      expect(state.preprocessingOptions.grayscale).toBe(true);
    });
  });

  describe('processing state', () => {
    it('should start processing', () => {
      const store = useOCRStore.getState();

      store.startProcessing(5);

      const state = useOCRStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.totalPages).toBe(5);
      expect(state.currentPage).toBe(0);
      expect(state.progress).toEqual({ status: 'loading', progress: 0 });
      expect(state.error).toBeNull();
    });

    it('should update progress', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);
      const progress: OCRProgress = { status: 'recognizing', progress: 0.5 };

      store.updateProgress(progress);

      expect(useOCRStore.getState().progress).toEqual(progress);
    });

    it('should set current page', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);

      store.setCurrentPage(3);

      expect(useOCRStore.getState().currentPage).toBe(3);
    });

    it('should stop processing', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);

      store.stopProcessing();

      const state = useOCRStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.progress).toEqual({ status: 'complete', progress: 1 });
    });
  });

  describe('OCR results', () => {
    it('should add OCR result for a page', () => {
      const store = useOCRStore.getState();

      store.addResult(0, mockOCRResult);

      const state = useOCRStore.getState();
      expect(state.results.size).toBe(1);
      expect(state.results.get(0)).toEqual(mockOCRResult);
    });

    it('should add results for multiple pages', () => {
      const store = useOCRStore.getState();
      const secondResult: OCRResult = {
        text: 'Page 2 content',
        words: [{ text: 'Page', bounds: { x: 10, y: 10, width: 40, height: 12 }, confidence: 0.95 }],
        confidence: 0.95,
      };

      store.addResult(0, mockOCRResult);
      store.addResult(1, secondResult);

      const state = useOCRStore.getState();
      expect(state.results.size).toBe(2);
      expect(state.results.get(0)).toEqual(mockOCRResult);
      expect(state.results.get(1)).toEqual(secondResult);
    });

    it('should overwrite existing result for a page', () => {
      const store = useOCRStore.getState();
      const updatedResult: OCRResult = {
        text: 'Updated OCR text',
        words: [{ text: 'Updated', bounds: { x: 10, y: 10, width: 60, height: 12 }, confidence: 0.99 }],
        confidence: 0.99,
      };

      store.addResult(0, mockOCRResult);
      store.addResult(0, updatedResult);

      const state = useOCRStore.getState();
      expect(state.results.size).toBe(1);
      expect(state.results.get(0)).toEqual(updatedResult);
    });

    it('should clear all results', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);
      store.addResult(1, mockOCRResult);

      store.clearResults();

      expect(useOCRStore.getState().results.size).toBe(0);
    });
  });

  describe('word text editing', () => {
    it('should update word text', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      store.updateWordText(0, 0, 'Modified');

      const state = useOCRStore.getState();
      const result = state.results.get(0);
      expect(result?.words[0]?.text).toBe('Modified');
    });

    it('should rebuild full text after word update', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      store.updateWordText(0, 0, 'Changed');

      const state = useOCRStore.getState();
      const result = state.results.get(0);
      expect(result?.text).toBe('Changed OCR text from page');
    });

    it('should not update word for non-existent page', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      store.updateWordText(1, 0, 'Modified');

      const state = useOCRStore.getState();
      expect(state.results.get(0)?.words[0]?.text).toBe('Sample');
    });

    it('should not update non-existent word index', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      store.updateWordText(0, 100, 'Modified');

      const state = useOCRStore.getState();
      const result = state.results.get(0);
      expect(result?.text).toBe('Sample OCR text from page');
    });
  });

  describe('error handling', () => {
    it('should set error', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);

      store.setError('OCR processing failed');

      const state = useOCRStore.getState();
      expect(state.error).toBe('OCR processing failed');
      expect(state.isProcessing).toBe(false);
    });

    it('should clear error', () => {
      const store = useOCRStore.getState();
      store.setError('Some error');

      store.setError(null);

      expect(useOCRStore.getState().error).toBeNull();
    });
  });

  describe('OCR cancellation', () => {
    it('should cancel OCR', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);
      store.updateProgress({ status: 'recognizing', progress: 0.5 });

      store.cancelOCR();

      const state = useOCRStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.progress).toEqual({ status: 'idle', progress: 0 });
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useOCRStore.getState();
      store.startProcessing(5);
      store.addResult(0, mockOCRResult);
      store.setLanguage('fra');
      store.setError('Some error');

      store.reset();

      const state = useOCRStore.getState();
      expect(state.results.size).toBe(0);
      expect(state.isProcessing).toBe(false);
      expect(state.progress).toBeNull();
      expect(state.currentPage).toBe(0);
      expect(state.totalPages).toBe(0);
      expect(state.error).toBeNull();
      // Note: language and preprocessingOptions are not reset
    });
  });

  describe('selectors', () => {
    it('selectHasResults should return false when no results', () => {
      const state = useOCRStore.getState();
      expect(selectHasResults(state)).toBe(false);
    });

    it('selectHasResults should return true when results exist', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      const state = useOCRStore.getState();
      expect(selectHasResults(state)).toBe(true);
    });

    it('selectResultForPage should return result for specific page', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      const state = useOCRStore.getState();
      const selector = selectResultForPage(0);
      expect(selector(state)).toEqual(mockOCRResult);
    });

    it('selectResultForPage should return undefined for non-existent page', () => {
      const store = useOCRStore.getState();
      store.addResult(0, mockOCRResult);

      const state = useOCRStore.getState();
      const selector = selectResultForPage(1);
      expect(selector(state)).toBeUndefined();
    });
  });

  describe('full workflow', () => {
    it('should handle complete OCR workflow', () => {
      const store = useOCRStore.getState();

      // Configure
      store.setLanguage('eng');
      store.setPreprocessingOptions({ ...initialPreprocessingOptions, deskew: true });

      // Start processing
      store.startProcessing(3);
      expect(useOCRStore.getState().isProcessing).toBe(true);

      // Process pages
      store.setCurrentPage(0);
      store.updateProgress({ status: 'recognizing', progress: 0.33 });
      store.addResult(0, mockOCRResult);

      store.setCurrentPage(1);
      store.updateProgress({ status: 'recognizing', progress: 0.66 });
      store.addResult(1, mockOCRResult);

      store.setCurrentPage(2);
      store.updateProgress({ status: 'recognizing', progress: 1 });
      store.addResult(2, mockOCRResult);

      // Complete
      store.stopProcessing();

      const state = useOCRStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.results.size).toBe(3);
      expect(state.progress?.status).toBe('complete');
    });

    it('should handle OCR workflow with error', () => {
      const store = useOCRStore.getState();

      // Start processing
      store.startProcessing(3);
      store.setCurrentPage(0);
      store.addResult(0, mockOCRResult);

      // Error on page 2
      store.setCurrentPage(1);
      store.setError('Failed to process page 2');

      const state = useOCRStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.error).toBe('Failed to process page 2');
      expect(state.results.size).toBe(1);
    });
  });
});
