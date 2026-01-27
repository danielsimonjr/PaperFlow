import { describe, it, expect } from 'vitest';
import { getFontFallback, getWebSafeFonts } from '@lib/fonts/fontFallback';

describe('fontFallback', () => {
  describe('getFontFallback', () => {
    it('should return Arial for Helvetica fonts', () => {
      const result = getFontFallback('Helvetica');
      expect(result.fontFamily).toBe('Arial');
      expect(result.genericFamily).toBe('sans-serif');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return Arial for Helvetica-Bold', () => {
      const result = getFontFallback('Helvetica-Bold');
      expect(result.fontFamily).toBe('Arial');
      expect(result.genericFamily).toBe('sans-serif');
    });

    it('should return Times New Roman for Times fonts', () => {
      const result = getFontFallback('Times-Roman');
      expect(result.fontFamily).toBe('Times New Roman');
      expect(result.genericFamily).toBe('serif');
    });

    it('should return Courier New for Courier fonts', () => {
      const result = getFontFallback('Courier');
      expect(result.fontFamily).toBe('Courier New');
      expect(result.genericFamily).toBe('monospace');
    });

    it('should handle font names with subset prefixes', () => {
      const result = getFontFallback('ABCDEF+Helvetica');
      expect(result.fontFamily).toBe('Arial');
    });

    it('should handle font names with suffixes', () => {
      const result = getFontFallback('ArialMT');
      expect(result.fontFamily).toBe('Arial');
    });

    it('should return default for unknown fonts', () => {
      const result = getFontFallback('UnknownFont123');
      expect(result.fontFamily).toBe('Arial');
      expect(result.genericFamily).toBe('sans-serif');
      expect(result.confidence).toBe(0);
    });

    it('should handle empty string', () => {
      const result = getFontFallback('');
      expect(result.fontFamily).toBe('Arial');
      expect(result.confidence).toBe(0);
    });

    it('should handle case-insensitive matching', () => {
      const result1 = getFontFallback('HELVETICA');
      const result2 = getFontFallback('helvetica');
      expect(result1.fontFamily).toBe(result2.fontFamily);
    });

    it('should match partial font names', () => {
      const result = getFontFallback('HelveticaNeue-Light');
      expect(result.fontFamily).toBe('Arial');
    });

    it('should categorize by keywords', () => {
      const sansResult = getFontFallback('MySansFont');
      expect(sansResult.genericFamily).toBe('sans-serif');

      const serifResult = getFontFallback('MySerifFont');
      expect(serifResult.genericFamily).toBe('serif');

      const monoResult = getFontFallback('MyMonoFont');
      expect(monoResult.genericFamily).toBe('monospace');
    });
  });

  describe('getWebSafeFonts', () => {
    it('should return an array of fonts', () => {
      const fonts = getWebSafeFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
    });

    it('should include common fonts', () => {
      const fonts = getWebSafeFonts();
      const fontNames = fonts.map((f) => f.name);

      expect(fontNames).toContain('Arial');
      expect(fontNames).toContain('Times New Roman');
      expect(fontNames).toContain('Courier New');
      expect(fontNames).toContain('Georgia');
      expect(fontNames).toContain('Verdana');
    });

    it('should have proper structure for each font', () => {
      const fonts = getWebSafeFonts();

      for (const font of fonts) {
        expect(font).toHaveProperty('name');
        expect(font).toHaveProperty('family');
        expect(font).toHaveProperty('generic');
        expect(typeof font.name).toBe('string');
        expect(typeof font.family).toBe('string');
        expect(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy']).toContain(
          font.generic
        );
      }
    });
  });
});
