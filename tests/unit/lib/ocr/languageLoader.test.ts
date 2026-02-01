/**
 * Tests for OCR Language Loader
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageLoader, checkOCRSupport } from '@/lib/ocr/languageLoader';
import { SUPPORTED_LANGUAGES } from '@/lib/ocr/types';

describe('Language Loader', () => {
  let loader: LanguageLoader;

  beforeEach(() => {
    loader = new LanguageLoader();
  });

  describe('getLanguageName', () => {
    it('should return English name for eng code', () => {
      expect(loader.getLanguageName('eng')).toBe('English');
    });

    it('should return French name for fra code', () => {
      expect(loader.getLanguageName('fra')).toBe('French');
    });

    it('should return code for unknown language', () => {
      expect(loader.getLanguageName('xyz')).toBe('xyz');
    });
  });

  describe('isValidLanguageCode', () => {
    it('should return true for supported languages', () => {
      expect(loader.isValidLanguageCode('eng')).toBe(true);
      expect(loader.isValidLanguageCode('fra')).toBe(true);
      expect(loader.isValidLanguageCode('deu')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(loader.isValidLanguageCode('xyz')).toBe(false);
      expect(loader.isValidLanguageCode('')).toBe(false);
      expect(loader.isValidLanguageCode('english')).toBe(false);
    });
  });

  describe('combineLanguages', () => {
    it('should combine valid language codes', () => {
      expect(loader.combineLanguages(['eng', 'fra'])).toBe('eng+fra');
      expect(loader.combineLanguages(['eng', 'fra', 'deu'])).toBe('eng+fra+deu');
    });

    it('should filter out invalid codes', () => {
      expect(loader.combineLanguages(['eng', 'xyz', 'fra'])).toBe('eng+fra');
    });

    it('should return single language without plus', () => {
      expect(loader.combineLanguages(['eng'])).toBe('eng');
    });

    it('should return empty string for no valid languages', () => {
      expect(loader.combineLanguages(['xyz', 'abc'])).toBe('');
    });
  });

  describe('parseLanguages', () => {
    it('should parse combined language string', () => {
      expect(loader.parseLanguages('eng+fra')).toEqual(['eng', 'fra']);
      expect(loader.parseLanguages('eng+fra+deu')).toEqual(['eng', 'fra', 'deu']);
    });

    it('should parse single language', () => {
      expect(loader.parseLanguages('eng')).toEqual(['eng']);
    });

    it('should filter out invalid languages', () => {
      expect(loader.parseLanguages('eng+xyz+fra')).toEqual(['eng', 'fra']);
    });
  });

  describe('estimateDownloadSize', () => {
    it('should return larger size for CJK languages', () => {
      const japaneseSize = loader.estimateDownloadSize('jpn');
      const englishSize = loader.estimateDownloadSize('eng');
      expect(japaneseSize).toBeGreaterThan(englishSize);
    });

    it('should return reasonable sizes', () => {
      const size = loader.estimateDownloadSize('eng');
      // Should be between 5MB and 30MB
      expect(size).toBeGreaterThan(5 * 1024 * 1024);
      expect(size).toBeLessThan(30 * 1024 * 1024);
    });
  });
});

describe('checkOCRSupport', () => {
  it('should return support status object', () => {
    const support = checkOCRSupport();
    expect(support).toHaveProperty('webWorkers');
    expect(support).toHaveProperty('indexedDB');
    expect(support).toHaveProperty('webAssembly');
    expect(support).toHaveProperty('canvas');
  });

  it('should return boolean values', () => {
    const support = checkOCRSupport();
    expect(typeof support.webWorkers).toBe('boolean');
    expect(typeof support.indexedDB).toBe('boolean');
    expect(typeof support.webAssembly).toBe('boolean');
    expect(typeof support.canvas).toBe('boolean');
  });
});
