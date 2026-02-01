/**
 * Bates Numbering Module
 * Adds sequential Bates numbers to PDF pages for legal document management.
 */

import type { PageRange, FontConfig, Margins } from './types';
import { DEFAULT_FONT_CONFIG, DEFAULT_MARGINS } from './types';

/**
 * Bates number position on page
 */
export type BatesPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Bates numbering options
 */
export interface BatesNumberOptions {
  prefix: string;
  suffix: string;
  startNumber: number;
  digits: number; // Minimum number of digits (zero-padded)
  increment: number;
  position: BatesPosition;
  font: FontConfig;
  margins: Margins;
  pages: PageRange;
}

/**
 * Default Bates number options
 */
export const DEFAULT_BATES_OPTIONS: BatesNumberOptions = {
  prefix: '',
  suffix: '',
  startNumber: 1,
  digits: 6,
  increment: 1,
  position: 'bottom-right',
  font: { ...DEFAULT_FONT_CONFIG, size: 10 },
  margins: { ...DEFAULT_MARGINS },
  pages: { type: 'all' },
};

/**
 * Bates number state for tracking across pages
 */
export interface BatesState {
  currentNumber: number;
  processedPages: number;
  startNumber: number;
}

/**
 * Format a Bates number with prefix, suffix, and zero-padding
 */
export function formatBatesNumber(
  number: number,
  prefix: string,
  suffix: string,
  digits: number
): string {
  const paddedNumber = String(number).padStart(digits, '0');
  return `${prefix}${paddedNumber}${suffix}`;
}

/**
 * Get the next Bates number based on current state
 */
export function getNextBatesNumber(state: BatesState, increment: number): BatesState {
  return {
    ...state,
    currentNumber: state.currentNumber + increment,
    processedPages: state.processedPages + 1,
  };
}

/**
 * Create initial Bates state
 */
export function createBatesState(startNumber: number): BatesState {
  return {
    currentNumber: startNumber,
    processedPages: 0,
    startNumber,
  };
}

/**
 * Reset Bates state to starting number
 */
export function resetBatesState(state: BatesState): BatesState {
  return {
    ...state,
    currentNumber: state.startNumber,
    processedPages: 0,
  };
}

/**
 * Calculate position coordinates for Bates number
 */
export function calculateBatesPosition(
  position: BatesPosition,
  pageWidth: number,
  pageHeight: number,
  margins: Margins,
  textWidth: number,
  textHeight: number
): { x: number; y: number } {
  let x: number;
  let y: number;

  // Calculate horizontal position
  switch (position) {
    case 'top-left':
    case 'bottom-left':
      x = margins.left;
      break;
    case 'top-center':
    case 'bottom-center':
      x = (pageWidth - textWidth) / 2;
      break;
    case 'top-right':
    case 'bottom-right':
      x = pageWidth - margins.right - textWidth;
      break;
  }

  // Calculate vertical position
  switch (position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      y = pageHeight - margins.top - textHeight;
      break;
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      y = margins.bottom;
      break;
  }

  return { x, y };
}

/**
 * Estimate text dimensions for Bates number
 */
export function estimateBatesTextDimensions(
  text: string,
  fontSize: number
): { width: number; height: number } {
  // Approximate character width based on font size
  const avgCharWidth = fontSize * 0.6;
  const width = text.length * avgCharWidth;
  const height = fontSize * 1.2;

  return { width, height };
}

/**
 * Validate Bates number options
 */
export function validateBatesOptions(
  options: Partial<BatesNumberOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.startNumber !== undefined && options.startNumber < 0) {
    errors.push('Start number must be non-negative');
  }

  if (options.digits !== undefined && (options.digits < 1 || options.digits > 20)) {
    errors.push('Digits must be between 1 and 20');
  }

  if (options.increment !== undefined && options.increment === 0) {
    errors.push('Increment cannot be zero');
  }

  if (options.prefix !== undefined && options.prefix.length > 50) {
    errors.push('Prefix is too long (max 50 characters)');
  }

  if (options.suffix !== undefined && options.suffix.length > 50) {
    errors.push('Suffix is too long (max 50 characters)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge Bates options with defaults
 */
export function mergeBatesOptions(
  options: Partial<BatesNumberOptions>
): BatesNumberOptions {
  return {
    ...DEFAULT_BATES_OPTIONS,
    ...options,
    font: {
      ...DEFAULT_BATES_OPTIONS.font,
      ...options.font,
    },
    margins: {
      ...DEFAULT_BATES_OPTIONS.margins,
      ...options.margins,
    },
    pages: options.pages || DEFAULT_BATES_OPTIONS.pages,
  };
}

/**
 * Generate a preview of Bates numbers for a range of pages
 */
export function generateBatesPreview(
  options: BatesNumberOptions,
  pageCount: number,
  previewCount: number = 5
): string[] {
  const preview: string[] = [];
  let number = options.startNumber;

  const count = Math.min(pageCount, previewCount);
  for (let i = 0; i < count; i++) {
    preview.push(
      formatBatesNumber(number, options.prefix, options.suffix, options.digits)
    );
    number += options.increment;
  }

  return preview;
}

/**
 * Calculate the last Bates number for a document
 */
export function calculateLastBatesNumber(
  startNumber: number,
  pageCount: number,
  increment: number
): number {
  return startNumber + (pageCount - 1) * increment;
}

/**
 * Parse a Bates number string back to its components
 */
export function parseBatesNumber(
  batesString: string,
  prefix: string,
  suffix: string
): number | null {
  // Remove prefix and suffix
  let numberPart = batesString;

  if (prefix && batesString.startsWith(prefix)) {
    numberPart = numberPart.slice(prefix.length);
  }

  if (suffix && batesString.endsWith(suffix)) {
    numberPart = numberPart.slice(0, -suffix.length);
  }

  const parsed = parseInt(numberPart, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Create Bates number operation data for a specific page
 */
export function createBatesOperationData(
  options: BatesNumberOptions,
  _pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  state: BatesState
): {
  text: string;
  position: { x: number; y: number };
  font: FontConfig;
  nextState: BatesState;
} {
  const batesText = formatBatesNumber(
    state.currentNumber,
    options.prefix,
    options.suffix,
    options.digits
  );

  const dimensions = estimateBatesTextDimensions(batesText, options.font.size);

  const position = calculateBatesPosition(
    options.position,
    pageWidth,
    pageHeight,
    options.margins,
    dimensions.width,
    dimensions.height
  );

  return {
    text: batesText,
    position,
    font: options.font,
    nextState: getNextBatesNumber(state, options.increment),
  };
}

/**
 * Common Bates number presets
 */
export const BATES_PRESETS = {
  legal: {
    prefix: 'ABC',
    suffix: '',
    digits: 6,
    position: 'bottom-right' as BatesPosition,
  },
  confidential: {
    prefix: 'CONF-',
    suffix: '',
    digits: 4,
    position: 'bottom-center' as BatesPosition,
  },
  exhibit: {
    prefix: 'EX-',
    suffix: '',
    digits: 3,
    position: 'bottom-right' as BatesPosition,
  },
  production: {
    prefix: 'PROD',
    suffix: '',
    digits: 8,
    position: 'bottom-left' as BatesPosition,
  },
};

/**
 * Get a Bates preset by name
 */
export function getBatesPreset(
  name: keyof typeof BATES_PRESETS
): Partial<BatesNumberOptions> {
  return BATES_PRESETS[name];
}

/**
 * Check if a page should receive a Bates number based on page range
 */
export function shouldApplyBatesToPage(
  pageIndex: number, // 0-indexed
  pageRange: PageRange,
  _totalPages: number
): boolean {
  const pageNumber = pageIndex + 1; // Convert to 1-indexed

  switch (pageRange.type) {
    case 'all':
      return true;

    case 'even':
      return pageNumber % 2 === 0;

    case 'odd':
      return pageNumber % 2 === 1;

    case 'custom':
      if (pageRange.pages) {
        return pageRange.pages.includes(pageNumber);
      }
      if (pageRange.start !== undefined && pageRange.end !== undefined) {
        return pageNumber >= pageRange.start && pageNumber <= pageRange.end;
      }
      return false;

    default:
      return true;
  }
}
