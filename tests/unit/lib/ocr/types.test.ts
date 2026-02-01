/**
 * Tests for OCR type definitions
 */

import { describe, it, expect } from 'vitest';
import {
  PageSegmentationMode,
  OCREngineMode,
  SUPPORTED_LANGUAGES,
} from '@/lib/ocr/types';

describe('OCR Types', () => {
  describe('PageSegmentationMode', () => {
    it('should have all expected values', () => {
      expect(PageSegmentationMode.OSD_ONLY).toBe(0);
      expect(PageSegmentationMode.AUTO_OSD).toBe(1);
      expect(PageSegmentationMode.AUTO_ONLY).toBe(2);
      expect(PageSegmentationMode.AUTO).toBe(3);
      expect(PageSegmentationMode.SINGLE_COLUMN).toBe(4);
      expect(PageSegmentationMode.SINGLE_BLOCK_VERT_TEXT).toBe(5);
      expect(PageSegmentationMode.SINGLE_BLOCK).toBe(6);
      expect(PageSegmentationMode.SINGLE_LINE).toBe(7);
      expect(PageSegmentationMode.SINGLE_WORD).toBe(8);
      expect(PageSegmentationMode.CIRCLE_WORD).toBe(9);
      expect(PageSegmentationMode.SINGLE_CHAR).toBe(10);
      expect(PageSegmentationMode.SPARSE_TEXT).toBe(11);
      expect(PageSegmentationMode.SPARSE_TEXT_OSD).toBe(12);
      expect(PageSegmentationMode.RAW_LINE).toBe(13);
    });
  });

  describe('OCREngineMode', () => {
    it('should have all expected values', () => {
      expect(OCREngineMode.TESSERACT_ONLY).toBe(0);
      expect(OCREngineMode.LSTM_ONLY).toBe(1);
      expect(OCREngineMode.TESSERACT_LSTM_COMBINED).toBe(2);
      expect(OCREngineMode.DEFAULT).toBe(3);
    });
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('should contain English', () => {
      const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'eng');
      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
    });

    it('should contain common languages', () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      expect(codes).toContain('fra'); // French
      expect(codes).toContain('deu'); // German
      expect(codes).toContain('spa'); // Spanish
      expect(codes).toContain('jpn'); // Japanese
      expect(codes).toContain('chi_sim'); // Chinese Simplified
    });

    it('should have at least 10 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid structure for all languages', () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang.code).toBeTruthy();
        expect(lang.name).toBeTruthy();
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
      }
    });
  });
});
