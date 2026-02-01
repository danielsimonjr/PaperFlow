/**
 * Tests for Batch OCR Controller
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchOCRController, createBatchOCRController } from '@/lib/ocr/batchOCR';

// Mock the OCR engine
vi.mock('@/lib/ocr/ocrEngine', () => ({
  OCREngine: class MockOCREngine {
    initialize = vi.fn().mockResolvedValue(undefined);
    recognize = vi.fn().mockResolvedValue({
      text: 'Mock OCR text',
      confidence: 95,
      blocks: [],
      lines: [],
      words: [],
      processingTime: 100,
    });
    terminate = vi.fn().mockResolvedValue(undefined);
  },
}));

// Mock the image preprocessor
vi.mock('@/lib/ocr/imagePreprocessor', () => ({
  renderPageToCanvas: vi.fn().mockResolvedValue(document.createElement('canvas')),
  preprocessImage: vi.fn().mockReturnValue(document.createElement('canvas')),
}));

describe('BatchOCRController', () => {
  let controller: BatchOCRController;

  beforeEach(() => {
    controller = new BatchOCRController();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create controller with default config', () => {
      const ctrl = new BatchOCRController();
      expect(ctrl).toBeInstanceOf(BatchOCRController);
    });

    it('should accept custom config', () => {
      const ctrl = new BatchOCRController({
        parallelism: 2,
        continueOnError: false,
        language: 'fra',
      });
      expect(ctrl).toBeInstanceOf(BatchOCRController);
    });
  });

  describe('createBatchOCRController', () => {
    it('should create controller with factory function', () => {
      const ctrl = createBatchOCRController();
      expect(ctrl).toBeInstanceOf(BatchOCRController);
    });

    it('should accept config via factory', () => {
      const ctrl = createBatchOCRController({ parallelism: 3 });
      expect(ctrl).toBeInstanceOf(BatchOCRController);
    });
  });

  describe('getProgress', () => {
    it('should return initial progress state', () => {
      const progress = controller.getProgress();

      expect(progress.totalPages).toBe(0);
      expect(progress.completedPages).toBe(0);
      expect(progress.status).toBe('idle');
    });
  });

  describe('callbacks', () => {
    it('should accept progress callback', () => {
      const callback = vi.fn();
      controller.onProgress(callback);
      // No error should be thrown
      expect(callback).not.toHaveBeenCalled();
    });

    it('should accept page complete callback', () => {
      const callback = vi.fn();
      controller.onPageComplete(callback);
      // No error should be thrown
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('pause/resume/cancel', () => {
    it('should not throw when pausing idle controller', () => {
      expect(() => controller.pause()).not.toThrow();
    });

    it('should not throw when resuming idle controller', () => {
      expect(() => controller.resume()).not.toThrow();
    });

    it('should cancel and update progress', () => {
      controller.cancel();
      const progress = controller.getProgress();
      expect(progress.status).toBe('cancelled');
    });
  });
});

describe('BatchOCRController Integration', () => {
  // Skip integration tests that require actual PDF pages
  describe.skip('processBatch', () => {
    it('should process pages sequentially', async () => {
      // Would require mock PDF pages
    });

    it('should call progress callback', async () => {
      // Would require mock PDF pages
    });

    it('should handle errors gracefully', async () => {
      // Would require mock PDF pages
    });
  });
});
