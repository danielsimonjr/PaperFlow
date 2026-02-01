/**
 * Watermark Module
 * Applies text and image watermarks to PDF pages.
 */

import type {
  WatermarkOptions,
  Position,
  PositionPreset,
  PageRange,
  FontConfig,
} from './types';
import { DEFAULT_WATERMARK_OPTIONS } from './types';

/**
 * Calculate position from preset
 */
export function calculatePositionFromPreset(
  preset: PositionPreset,
  pageWidth: number,
  pageHeight: number,
  contentWidth: number,
  contentHeight: number
): Position {
  const centerX = (pageWidth - contentWidth) / 2;
  const centerY = (pageHeight - contentHeight) / 2;

  switch (preset) {
    case 'top-left':
      return { x: 50, y: pageHeight - 50 - contentHeight };
    case 'top-center':
      return { x: centerX, y: pageHeight - 50 - contentHeight };
    case 'top-right':
      return { x: pageWidth - 50 - contentWidth, y: pageHeight - 50 - contentHeight };
    case 'center-left':
      return { x: 50, y: centerY };
    case 'center':
      return { x: centerX, y: centerY };
    case 'center-right':
      return { x: pageWidth - 50 - contentWidth, y: centerY };
    case 'bottom-left':
      return { x: 50, y: 50 };
    case 'bottom-center':
      return { x: centerX, y: 50 };
    case 'bottom-right':
      return { x: pageWidth - 50 - contentWidth, y: 50 };
    default:
      return { x: centerX, y: centerY };
  }
}

/**
 * Get pages to apply watermark based on page range
 */
export function getApplicablePages(pageRange: PageRange, totalPages: number): number[] {
  const pages: number[] = [];

  switch (pageRange.type) {
    case 'all':
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
      break;
    case 'even':
      for (let i = 1; i < totalPages; i += 2) {
        pages.push(i);
      }
      break;
    case 'odd':
      for (let i = 0; i < totalPages; i += 2) {
        pages.push(i);
      }
      break;
    case 'custom':
      if (pageRange.pages) {
        // Convert from 1-indexed to 0-indexed and filter valid pages
        pages.push(
          ...pageRange.pages
            .map((p) => p - 1)
            .filter((p) => p >= 0 && p < totalPages)
        );
      } else if (pageRange.start !== undefined && pageRange.end !== undefined) {
        for (let i = pageRange.start - 1; i < Math.min(pageRange.end, totalPages); i++) {
          if (i >= 0) {
            pages.push(i);
          }
        }
      }
      break;
  }

  return pages;
}

/**
 * Calculate text dimensions (approximate)
 */
export function calculateTextDimensions(
  text: string,
  font: FontConfig
): { width: number; height: number } {
  // Approximate character width based on font size
  const avgCharWidth = font.size * 0.6;
  const width = text.length * avgCharWidth;
  const height = font.size * 1.2;

  return { width, height };
}

/**
 * Generate tile positions for watermark
 */
export function generateTilePositions(
  pageWidth: number,
  pageHeight: number,
  contentWidth: number,
  contentHeight: number,
  spacing: number = 100
): Position[] {
  const positions: Position[] = [];
  const stepX = contentWidth + spacing;
  const stepY = contentHeight + spacing;

  for (let y = 50; y < pageHeight - 50; y += stepY) {
    for (let x = 50; x < pageWidth - 50; x += stepX) {
      positions.push({ x, y });
    }
  }

  return positions;
}

/**
 * Apply rotation to position
 */
export function applyRotation(
  position: Position,
  rotation: number,
  centerX: number,
  centerY: number
): Position {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const dx = position.x - centerX;
  const dy = position.y - centerY;

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

/**
 * Parse color to RGB values
 */
export function parseColor(color: string): { r: number; g: number; b: number } {
  let hex = color;

  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

/**
 * Validate watermark options
 */
export function validateWatermarkOptions(
  options: Partial<WatermarkOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.content !== undefined && options.content.trim() === '') {
    errors.push('Watermark content cannot be empty');
  }

  if (options.opacity !== undefined && (options.opacity < 0 || options.opacity > 1)) {
    errors.push('Opacity must be between 0 and 1');
  }

  if (options.rotation !== undefined && (options.rotation < -360 || options.rotation > 360)) {
    errors.push('Rotation must be between -360 and 360 degrees');
  }

  if (options.scale !== undefined && options.scale <= 0) {
    errors.push('Scale must be greater than 0');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge watermark options with defaults
 */
export function mergeWatermarkOptions(
  options: Partial<WatermarkOptions>
): WatermarkOptions {
  return {
    ...DEFAULT_WATERMARK_OPTIONS,
    ...options,
    position: {
      ...DEFAULT_WATERMARK_OPTIONS.position,
      ...(options.position || {}),
    },
    font: {
      ...DEFAULT_WATERMARK_OPTIONS.font!,
      ...(options.font || {}),
    },
    pages: {
      ...DEFAULT_WATERMARK_OPTIONS.pages,
      ...(options.pages || {}),
    },
  };
}

/**
 * Create watermark operation data for pdf-lib
 * This prepares the data structure that will be used by the PDF manipulation code
 */
export function createWatermarkOperationData(
  options: WatermarkOptions,
  pageWidth: number,
  pageHeight: number
): {
  content: string;
  positions: Position[];
  rotation: number;
  opacity: number;
  scale: number;
  font: FontConfig;
  color: { r: number; g: number; b: number };
} {
  const font = options.font || DEFAULT_WATERMARK_OPTIONS.font!;
  const { width, height } = calculateTextDimensions(options.content, font);

  let positions: Position[];

  if (options.position.tile) {
    positions = generateTilePositions(
      pageWidth,
      pageHeight,
      width * options.scale,
      height * options.scale,
      options.position.tileSpacing || 100
    );
  } else if (options.position.preset) {
    positions = [
      calculatePositionFromPreset(
        options.position.preset,
        pageWidth,
        pageHeight,
        width * options.scale,
        height * options.scale
      ),
    ];
  } else if (options.position.custom) {
    positions = [options.position.custom];
  } else {
    positions = [{ x: pageWidth / 2, y: pageHeight / 2 }];
  }

  return {
    content: options.content,
    positions,
    rotation: options.rotation,
    opacity: options.opacity,
    scale: options.scale,
    font,
    color: parseColor(font.color),
  };
}

/**
 * Get watermark template by ID
 */
export function getWatermarkTemplate(
  templates: Array<{ id: string; options: WatermarkOptions }>,
  id: string
): WatermarkOptions | undefined {
  const template = templates.find((t) => t.id === id);
  return template?.options;
}

/**
 * Create custom watermark template
 */
export function createCustomTemplate(
  name: string,
  options: Partial<WatermarkOptions>
): { id: string; name: string; options: WatermarkOptions } {
  return {
    id: `custom-${Date.now()}`,
    name,
    options: mergeWatermarkOptions(options),
  };
}
