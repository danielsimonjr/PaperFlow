/**
 * Font matching utilities for extracting and matching fonts from PDF text.
 */

import { getFontFallback, type FontFallbackResult } from './fontFallback';

export interface PDFTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

export interface FontInfo {
  /** Original PDF font name */
  pdfFontName: string;
  /** Resolved web-safe font family */
  fontFamily: string;
  /** Generic font category */
  genericFamily: FontFallbackResult['genericFamily'];
  /** Font size in points */
  fontSize: number;
  /** Whether the font is bold */
  isBold: boolean;
  /** Whether the font is italic */
  isItalic: boolean;
  /** Match confidence */
  confidence: number;
}

/**
 * Common PDF font name patterns for detecting weight and style.
 */
const boldPatterns = [
  /bold/i,
  /black/i,
  /heavy/i,
  /demi/i,
  /semibold/i,
  /extrabold/i,
  /ultrabold/i,
  /-?bd$/i,
  /-?b$/i,
];

const italicPatterns = [
  /italic/i,
  /oblique/i,
  /inclined/i,
  /-?it$/i,
  /-?i$/i,
  /ital$/i,
];

/**
 * Extract font information from a PDF text item.
 *
 * @param textItem - The PDF.js text item
 * @returns Extracted font information
 */
export function extractFontInfo(textItem: PDFTextItem): FontInfo {
  const { fontName, transform } = textItem;

  // Extract font size from transform matrix
  // The transform is [scaleX, skewX, skewY, scaleY, translateX, translateY]
  // Font size is typically derived from scaleY
  const fontSize = Math.abs(transform[3] || transform[0] || 12);

  // Get font fallback
  const fallback = getFontFallback(fontName);

  // Detect bold and italic from font name
  const isBold = boldPatterns.some((pattern) => pattern.test(fontName));
  const isItalic = italicPatterns.some((pattern) => pattern.test(fontName));

  return {
    pdfFontName: fontName,
    fontFamily: fallback.fontFamily,
    genericFamily: fallback.genericFamily,
    fontSize: Math.round(fontSize * 10) / 10, // Round to 1 decimal
    isBold,
    isItalic,
    confidence: fallback.confidence,
  };
}

/**
 * Get CSS font properties from font info.
 */
export function getFontCSSProperties(fontInfo: FontInfo): {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
} {
  return {
    fontFamily: `"${fontInfo.fontFamily}", ${fontInfo.genericFamily}`,
    fontSize: `${fontInfo.fontSize}pt`,
    fontWeight: fontInfo.isBold ? 'bold' : 'normal',
    fontStyle: fontInfo.isItalic ? 'italic' : 'normal',
  };
}

/**
 * Calculate text position from PDF transform matrix.
 *
 * @param transform - The PDF transform matrix
 * @param pageHeight - The page height in PDF points
 * @returns Position in PDF coordinates (origin at bottom-left)
 */
export function getTextPosition(
  transform: number[],
  pageHeight: number
): { x: number; y: number } {
  // Transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
  const x = transform[4] || 0;
  const y = transform[5] || 0;

  // PDF coordinates have origin at bottom-left
  // Convert to screen coordinates (top-left origin) if needed
  return {
    x,
    y: pageHeight - y, // Flip Y axis for screen coordinates
  };
}

/**
 * Group text items by their approximate line position.
 *
 * @param textItems - Array of PDF text items
 * @param tolerance - Y position tolerance for line grouping
 * @returns Array of line groups
 */
export function groupTextItemsByLine(
  textItems: PDFTextItem[],
  tolerance: number = 3
): PDFTextItem[][] {
  if (textItems.length === 0) return [];

  const sorted = [...textItems].sort((a, b) => {
    const yDiff = (b.transform[5] || 0) - (a.transform[5] || 0);
    if (Math.abs(yDiff) > tolerance) return yDiff;
    return (a.transform[4] || 0) - (b.transform[4] || 0);
  });

  const lines: PDFTextItem[][] = [];
  let currentLine: PDFTextItem[] = [];
  let currentY = sorted[0]?.transform[5] || 0;

  for (const item of sorted) {
    const itemY = item.transform[5] || 0;

    if (Math.abs(itemY - currentY) <= tolerance) {
      currentLine.push(item);
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [item];
      currentY = itemY;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Estimate the bounding box for a text item.
 */
export function estimateTextBounds(
  textItem: PDFTextItem,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  const position = getTextPosition(textItem.transform, pageHeight);
  const fontSize = Math.abs(textItem.transform[3] || textItem.transform[0] || 12);

  return {
    x: position.x,
    y: position.y - fontSize, // Adjust for baseline
    width: textItem.width,
    height: fontSize * 1.2, // Add line height factor
  };
}

/**
 * Find the dominant font in a collection of text items.
 */
export function findDominantFont(textItems: PDFTextItem[]): FontInfo | null {
  if (textItems.length === 0) return null;

  const fontCounts = new Map<string, { count: number; item: PDFTextItem }>();

  for (const item of textItems) {
    const key = `${item.fontName}-${Math.round(Math.abs(item.transform[3] || item.transform[0] || 12))}`;
    const existing = fontCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      fontCounts.set(key, { count: 1, item });
    }
  }

  let maxCount = 0;
  let dominantItem: PDFTextItem | null = null;

  for (const { count, item } of fontCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      dominantItem = item;
    }
  }

  return dominantItem ? extractFontInfo(dominantItem) : null;
}
