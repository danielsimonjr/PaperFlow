import { describe, it, expect } from 'vitest';
import {
  extractFontInfo,
  getFontCSSProperties,
  getTextPosition,
  groupTextItemsByLine,
  estimateTextBounds,
  findDominantFont,
  type PDFTextItem,
} from '@lib/fonts/fontMatcher';

describe('fontMatcher', () => {
  describe('extractFontInfo', () => {
    it('should extract basic font info from text item', () => {
      const textItem: PDFTextItem = {
        str: 'Hello',
        dir: 'ltr',
        width: 50,
        height: 12,
        transform: [12, 0, 0, 12, 100, 500],
        fontName: 'Helvetica',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.pdfFontName).toBe('Helvetica');
      expect(fontInfo.fontFamily).toBe('Arial');
      expect(fontInfo.fontSize).toBe(12);
      expect(fontInfo.isBold).toBe(false);
      expect(fontInfo.isItalic).toBe(false);
    });

    it('should detect bold from font name', () => {
      const textItem: PDFTextItem = {
        str: 'Bold',
        dir: 'ltr',
        width: 50,
        height: 14,
        transform: [14, 0, 0, 14, 100, 500],
        fontName: 'Helvetica-Bold',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.isBold).toBe(true);
    });

    it('should detect italic from font name', () => {
      const textItem: PDFTextItem = {
        str: 'Italic',
        dir: 'ltr',
        width: 50,
        height: 12,
        transform: [12, 0, 0, 12, 100, 500],
        fontName: 'Times-Italic',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.isItalic).toBe(true);
    });

    it('should detect oblique as italic', () => {
      const textItem: PDFTextItem = {
        str: 'Oblique',
        dir: 'ltr',
        width: 50,
        height: 12,
        transform: [12, 0, 0, 12, 100, 500],
        fontName: 'Helvetica-Oblique',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.isItalic).toBe(true);
    });

    it('should extract font size from transform matrix', () => {
      const textItem: PDFTextItem = {
        str: 'Size',
        dir: 'ltr',
        width: 50,
        height: 24,
        transform: [24, 0, 0, 24, 100, 500],
        fontName: 'Arial',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.fontSize).toBe(24);
    });

    it('should handle negative scale values', () => {
      const textItem: PDFTextItem = {
        str: 'Negative',
        dir: 'ltr',
        width: 50,
        height: 12,
        transform: [12, 0, 0, -12, 100, 500],
        fontName: 'Arial',
        hasEOL: false,
      };

      const fontInfo = extractFontInfo(textItem);

      expect(fontInfo.fontSize).toBe(12);
    });
  });

  describe('getFontCSSProperties', () => {
    it('should return correct CSS properties', () => {
      const fontInfo = {
        pdfFontName: 'Helvetica-Bold',
        fontFamily: 'Arial',
        genericFamily: 'sans-serif' as const,
        fontSize: 14,
        isBold: true,
        isItalic: false,
        confidence: 1,
      };

      const css = getFontCSSProperties(fontInfo);

      expect(css.fontFamily).toBe('"Arial", sans-serif');
      expect(css.fontSize).toBe('14pt');
      expect(css.fontWeight).toBe('bold');
      expect(css.fontStyle).toBe('normal');
    });

    it('should handle italic style', () => {
      const fontInfo = {
        pdfFontName: 'Times-Italic',
        fontFamily: 'Times New Roman',
        genericFamily: 'serif' as const,
        fontSize: 12,
        isBold: false,
        isItalic: true,
        confidence: 1,
      };

      const css = getFontCSSProperties(fontInfo);

      expect(css.fontStyle).toBe('italic');
      expect(css.fontWeight).toBe('normal');
    });
  });

  describe('getTextPosition', () => {
    it('should convert transform to position', () => {
      const transform = [12, 0, 0, 12, 100, 500];
      const pageHeight = 792;

      const position = getTextPosition(transform, pageHeight);

      expect(position.x).toBe(100);
      expect(position.y).toBe(792 - 500);
    });

    it('should handle zero values', () => {
      const transform = [12, 0, 0, 12, 0, 0];
      const pageHeight = 792;

      const position = getTextPosition(transform, pageHeight);

      expect(position.x).toBe(0);
      expect(position.y).toBe(792);
    });
  });

  describe('groupTextItemsByLine', () => {
    it('should group items on same line', () => {
      const items: PDFTextItem[] = [
        {
          str: 'Hello',
          dir: 'ltr',
          width: 30,
          height: 12,
          transform: [12, 0, 0, 12, 100, 500],
          fontName: 'Arial',
          hasEOL: false,
        },
        {
          str: 'World',
          dir: 'ltr',
          width: 35,
          height: 12,
          transform: [12, 0, 0, 12, 135, 500],
          fontName: 'Arial',
          hasEOL: false,
        },
      ];

      const lines = groupTextItemsByLine(items);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toHaveLength(2);
    });

    it('should separate items on different lines', () => {
      const items: PDFTextItem[] = [
        {
          str: 'Line 1',
          dir: 'ltr',
          width: 40,
          height: 12,
          transform: [12, 0, 0, 12, 100, 500],
          fontName: 'Arial',
          hasEOL: true,
        },
        {
          str: 'Line 2',
          dir: 'ltr',
          width: 40,
          height: 12,
          transform: [12, 0, 0, 12, 100, 480],
          fontName: 'Arial',
          hasEOL: false,
        },
      ];

      const lines = groupTextItemsByLine(items);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toHaveLength(1);
      expect(lines[1]).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const lines = groupTextItemsByLine([]);
      expect(lines).toHaveLength(0);
    });
  });

  describe('estimateTextBounds', () => {
    it('should estimate bounds for text item', () => {
      const textItem: PDFTextItem = {
        str: 'Test',
        dir: 'ltr',
        width: 40,
        height: 12,
        transform: [12, 0, 0, 12, 100, 500],
        fontName: 'Arial',
        hasEOL: false,
      };

      const bounds = estimateTextBounds(textItem, 792);

      expect(bounds.x).toBe(100);
      expect(bounds.width).toBe(40);
      expect(bounds.height).toBeGreaterThan(0);
    });
  });

  describe('findDominantFont', () => {
    it('should find most common font', () => {
      const items: PDFTextItem[] = [
        {
          str: 'A',
          dir: 'ltr',
          width: 10,
          height: 12,
          transform: [12, 0, 0, 12, 100, 500],
          fontName: 'Arial',
          hasEOL: false,
        },
        {
          str: 'B',
          dir: 'ltr',
          width: 10,
          height: 12,
          transform: [12, 0, 0, 12, 110, 500],
          fontName: 'Arial',
          hasEOL: false,
        },
        {
          str: 'C',
          dir: 'ltr',
          width: 10,
          height: 12,
          transform: [12, 0, 0, 12, 120, 500],
          fontName: 'Arial',
          hasEOL: false,
        },
        {
          str: 'D',
          dir: 'ltr',
          width: 10,
          height: 14,
          transform: [14, 0, 0, 14, 130, 500],
          fontName: 'Georgia',
          hasEOL: false,
        },
      ];

      const dominant = findDominantFont(items);

      expect(dominant?.fontFamily).toBe('Arial');
      expect(dominant?.fontSize).toBe(12);
    });

    it('should return null for empty array', () => {
      const dominant = findDominantFont([]);
      expect(dominant).toBeNull();
    });
  });
});
