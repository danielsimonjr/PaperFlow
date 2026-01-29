import { describe, it, expect } from 'vitest';
import { calculatePrintScale, getOrientationCSS } from '@lib/print/executePrint';

describe('executePrint', () => {
  describe('calculatePrintScale', () => {
    it('returns 1.0 for fit scale type', () => {
      expect(calculatePrintScale('fit', 100)).toBe(1.0);
    });

    it('returns 1.0 for actual scale type', () => {
      expect(calculatePrintScale('actual', 100)).toBe(1.0);
    });

    it('converts custom percentage to decimal', () => {
      expect(calculatePrintScale('custom', 150)).toBe(1.5);
    });

    it('handles custom scale of 50%', () => {
      expect(calculatePrintScale('custom', 50)).toBe(0.5);
    });

    it('handles custom scale of 200%', () => {
      expect(calculatePrintScale('custom', 200)).toBe(2.0);
    });
  });

  describe('getOrientationCSS', () => {
    it('returns portrait CSS for portrait', () => {
      const css = getOrientationCSS('portrait');
      expect(css).toContain('portrait');
    });

    it('returns landscape CSS for landscape', () => {
      const css = getOrientationCSS('landscape');
      expect(css).toContain('landscape');
    });

    it('returns auto CSS for auto orientation', () => {
      const css = getOrientationCSS('auto');
      expect(css).toContain('auto');
    });
  });
});
