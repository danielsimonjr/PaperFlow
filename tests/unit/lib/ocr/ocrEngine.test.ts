/**
 * Tests for OCR Engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCREngine, createOCREngine, PageSegmentationMode, OCREngineMode } from '@/lib/ocr/ocrEngine';
import type { OCRProgress } from '@/lib/ocr/types';

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  default: {
    createWorker: vi.fn(),
  },
}));

describe('OCR Engine', () => {
  let engine: OCREngine;
  let progressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    progressCallback = vi.fn();
    engine = new OCREngine(progressCallback);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create engine instance', () => {
      expect(engine).toBeInstanceOf(OCREngine);
    });

    it('should not be ready initially', () => {
      expect(engine.isReady()).toBe(false);
    });

    it('should have default language', () => {
      expect(engine.getLanguage()).toBe('eng');
    });
  });

  describe('createOCREngine', () => {
    it('should create engine with factory function', () => {
      const newEngine = createOCREngine();
      expect(newEngine).toBeInstanceOf(OCREngine);
    });

    it('should accept progress callback', () => {
      const callback = vi.fn();
      const newEngine = createOCREngine(callback);
      expect(newEngine).toBeInstanceOf(OCREngine);
    });

    it('should accept config', () => {
      const newEngine = createOCREngine(undefined, {
        langPath: '/custom/path',
      });
      expect(newEngine).toBeInstanceOf(OCREngine);
    });
  });

  describe('recognize without initialization', () => {
    it('should throw error if not initialized', async () => {
      const canvas = {} as HTMLCanvasElement;
      await expect(engine.recognize(canvas)).rejects.toThrow(
        'OCR engine not initialized'
      );
    });
  });

  describe('terminate', () => {
    it('should handle terminate when no worker exists', async () => {
      await expect(engine.terminate()).resolves.toBeUndefined();
    });
  });

  describe('getLanguage', () => {
    it('should return current language', () => {
      expect(engine.getLanguage()).toBe('eng');
    });
  });

  describe('isReady', () => {
    it('should return false when not initialized', () => {
      expect(engine.isReady()).toBe(false);
    });
  });

  describe('exports', () => {
    it('should export PageSegmentationMode', () => {
      expect(PageSegmentationMode).toBeDefined();
      expect(PageSegmentationMode.AUTO).toBe(3);
    });

    it('should export OCREngineMode', () => {
      expect(OCREngineMode).toBeDefined();
      expect(OCREngineMode.DEFAULT).toBe(3);
    });
  });
});

// Integration tests that require actual Tesseract.js would go here
describe.skip('OCR Engine Integration', () => {
  it('should initialize with language', async () => {
    // Would test actual initialization
  });

  it('should recognize text from image', async () => {
    // Would test actual OCR
  });
});
