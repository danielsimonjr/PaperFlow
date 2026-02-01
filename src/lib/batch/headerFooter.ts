/**
 * Header/Footer Module
 * Applies headers and footers with variable substitution.
 */

import type {
  HeaderFooterOptions,
  HeaderFooterSection,
  PageNumberFormat,
  PageRange,
  FontConfig,
  Position,
} from './types';
import { DEFAULT_HEADER_FOOTER_OPTIONS, DEFAULT_FONT_CONFIG } from './types';
import { getApplicablePages, parseColor } from './watermark';

/**
 * Variable pattern for substitution
 */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Format page number according to format type
 */
export function formatPageNumber(
  pageNumber: number,
  format: PageNumberFormat
): string {
  switch (format) {
    case 'arabic':
      return String(pageNumber);
    case 'roman-lower':
      return toRomanNumeral(pageNumber).toLowerCase();
    case 'roman-upper':
      return toRomanNumeral(pageNumber);
    case 'letter-lower':
      return toLetterNumeral(pageNumber).toLowerCase();
    case 'letter-upper':
      return toLetterNumeral(pageNumber);
    default:
      return String(pageNumber);
  }
}

/**
 * Convert number to Roman numeral
 */
export function toRomanNumeral(num: number): string {
  if (num <= 0 || num > 3999) return String(num);

  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  let remaining = num;

  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}

/**
 * Convert number to letter numeral (A, B, C... Z, AA, AB...)
 */
export function toLetterNumeral(num: number): string {
  if (num <= 0) return String(num);

  let result = '';
  let remaining = num;

  while (remaining > 0) {
    remaining--;
    result = String.fromCharCode(65 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }

  return result;
}

/**
 * Substitute variables in text
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(VARIABLE_PATTERN, (match, varName) => {
    return variables[varName] ?? match;
  });
}

/**
 * Create variable context for a page
 */
export function createVariableContext(
  pageNumber: number,
  totalPages: number,
  filename: string,
  author: string = '',
  format: PageNumberFormat = 'arabic'
): Record<string, string> {
  const now = new Date();

  return {
    page: formatPageNumber(pageNumber, format),
    total: String(totalPages),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    filename,
    author,
  };
}

/**
 * Calculate text position in header/footer
 */
export function calculateSectionPosition(
  section: 'left' | 'center' | 'right',
  location: 'header' | 'footer',
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  margins: { top: number; bottom: number; left: number; right: number },
  fontSize: number
): Position {
  const usableWidth = pageWidth - margins.left - margins.right;
  let x: number;

  switch (section) {
    case 'left':
      x = margins.left;
      break;
    case 'center':
      x = margins.left + (usableWidth - textWidth) / 2;
      break;
    case 'right':
      x = pageWidth - margins.right - textWidth;
      break;
    default:
      x = margins.left;
  }

  const y = location === 'header'
    ? pageHeight - margins.top
    : margins.bottom - fontSize;

  return { x, y };
}

/**
 * Validate header/footer options
 */
export function validateHeaderFooterOptions(
  options: Partial<HeaderFooterOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.startPage !== undefined && options.startPage < 1) {
    errors.push('Start page must be at least 1');
  }

  if (options.font?.size !== undefined && options.font.size <= 0) {
    errors.push('Font size must be greater than 0');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge header/footer options with defaults
 */
export function mergeHeaderFooterOptions(
  options: Partial<HeaderFooterOptions>
): HeaderFooterOptions {
  return {
    ...DEFAULT_HEADER_FOOTER_OPTIONS,
    ...options,
    font: {
      ...DEFAULT_HEADER_FOOTER_OPTIONS.font,
      ...(options.font || {}),
    },
    margins: {
      ...DEFAULT_HEADER_FOOTER_OPTIONS.margins,
      ...(options.margins || {}),
    },
    pages: {
      ...DEFAULT_HEADER_FOOTER_OPTIONS.pages,
      ...(options.pages || {}),
    },
  };
}

/**
 * Check if page should have header/footer
 */
export function shouldApplyToPage(
  pageIndex: number,
  startPage: number,
  pageRange: PageRange,
  totalPages: number
): boolean {
  // Check start page (1-indexed)
  if (pageIndex + 1 < startPage) {
    return false;
  }

  const applicablePages = getApplicablePages(pageRange, totalPages);
  return applicablePages.includes(pageIndex);
}

/**
 * Calculate approximate text width
 */
export function approximateTextWidth(text: string, font: FontConfig): number {
  // Average character width is approximately 0.6 of font size for proportional fonts
  return text.length * font.size * 0.6;
}

/**
 * Create header/footer operation data
 */
export function createHeaderFooterOperationData(
  options: HeaderFooterOptions,
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  filename: string,
  author: string = '',
  totalPages: number = 1,
  format: PageNumberFormat = 'arabic'
): {
  header: { left?: string; center?: string; right?: string; positions: Record<string, Position> };
  footer: { left?: string; center?: string; right?: string; positions: Record<string, Position> };
  font: FontConfig;
  color: { r: number; g: number; b: number };
} {
  const variables = createVariableContext(
    pageIndex + 1,
    totalPages,
    filename,
    author,
    format
  );

  const font = options.font || DEFAULT_FONT_CONFIG;
  const margins = options.margins || DEFAULT_HEADER_FOOTER_OPTIONS.margins;

  const processSection = (
    section: HeaderFooterSection | undefined,
    location: 'header' | 'footer'
  ): { left?: string; center?: string; right?: string; positions: Record<string, Position> } => {
    if (!section) {
      return { positions: {} };
    }

    const result: { left?: string; center?: string; right?: string; positions: Record<string, Position> } = {
      positions: {},
    };

    if (section.left) {
      result.left = substituteVariables(section.left, variables);
      result.positions.left = calculateSectionPosition(
        'left',
        location,
        pageWidth,
        pageHeight,
        approximateTextWidth(result.left, font),
        margins,
        font.size
      );
    }

    if (section.center) {
      result.center = substituteVariables(section.center, variables);
      result.positions.center = calculateSectionPosition(
        'center',
        location,
        pageWidth,
        pageHeight,
        approximateTextWidth(result.center, font),
        margins,
        font.size
      );
    }

    if (section.right) {
      result.right = substituteVariables(section.right, variables);
      result.positions.right = calculateSectionPosition(
        'right',
        location,
        pageWidth,
        pageHeight,
        approximateTextWidth(result.right, font),
        margins,
        font.size
      );
    }

    return result;
  };

  return {
    header: processSection(options.header, 'header'),
    footer: processSection(options.footer, 'footer'),
    font,
    color: parseColor(font.color),
  };
}

/**
 * Parse page range string (e.g., "1-5, 7, 9-12")
 */
export function parsePageRangeString(rangeString: string): number[] {
  const pages: number[] = [];
  const parts = rangeString.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(start!) && !isNaN(end!)) {
        for (let i = start!; i <= end!; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && !pages.includes(page)) {
        pages.push(page);
      }
    }
  }

  return pages.sort((a, b) => a - b);
}

/**
 * Create common header/footer presets
 */
export function createPreset(
  type: 'page-number-center' | 'page-number-right' | 'date-left-page-right' | 'filename-center'
): HeaderFooterOptions {
  switch (type) {
    case 'page-number-center':
      return mergeHeaderFooterOptions({
        footer: { center: '{{page}}' },
      });
    case 'page-number-right':
      return mergeHeaderFooterOptions({
        footer: { right: 'Page {{page}} of {{total}}' },
      });
    case 'date-left-page-right':
      return mergeHeaderFooterOptions({
        footer: {
          left: '{{date}}',
          right: 'Page {{page}} of {{total}}',
        },
      });
    case 'filename-center':
      return mergeHeaderFooterOptions({
        header: { center: '{{filename}}' },
        footer: { center: '{{page}}' },
      });
    default:
      return mergeHeaderFooterOptions({});
  }
}
