import { describe, it, expect } from 'vitest';
import { dpiToScale } from '@lib/export/imageExport';

describe('imageExport', () => {
  describe('dpiToScale', () => {
    it('returns 1.0 for 72 DPI', () => {
      expect(dpiToScale(72)).toBe(1);
    });

    it('returns approximately 2.08 for 150 DPI', () => {
      expect(dpiToScale(150)).toBeCloseTo(2.083, 2);
    });

    it('returns approximately 4.17 for 300 DPI', () => {
      expect(dpiToScale(300)).toBeCloseTo(4.167, 2);
    });
  });
});
