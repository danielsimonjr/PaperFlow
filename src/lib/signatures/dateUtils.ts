/**
 * Date formatting utilities for signature date stamps
 */

const DATE_FORMATS = {
  short: { month: '2-digit', day: '2-digit', year: 'numeric' } as const,
  medium: { month: 'short', day: 'numeric', year: 'numeric' } as const,
  long: { month: 'long', day: 'numeric', year: 'numeric' } as const,
  iso: undefined,
};

/**
 * Get date format options for settings
 */
export const DATE_FORMAT_OPTIONS = [
  { value: 'short', label: 'MM/DD/YYYY', example: '01/15/2024' },
  { value: 'medium', label: 'Jan 15, 2024', example: 'Jan 15, 2024' },
  { value: 'long', label: 'January 15, 2024', example: 'January 15, 2024' },
  { value: 'iso', label: 'YYYY-MM-DD', example: '2024-01-15' },
] as const;

/**
 * Get date position options for settings
 */
export const DATE_POSITION_OPTIONS = [
  { value: 'below', label: 'Below signature' },
  { value: 'right', label: 'Right of signature' },
  { value: 'left', label: 'Left of signature' },
] as const;

/**
 * Format a date string based on format type
 */
export function formatDate(date: Date, format: 'short' | 'medium' | 'long' | 'iso'): string {
  if (format === 'iso') {
    return date.toISOString().split('T')[0] ?? '';
  }
  return date.toLocaleDateString('en-US', DATE_FORMATS[format]);
}

/**
 * Render date stamp to canvas for PDF embedding
 */
export function renderDateStampToCanvas(date: Date, format: 'short' | 'medium' | 'long' | 'iso', fontSize: number = 10): HTMLCanvasElement {
  const text = formatDate(date, format);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Measure text
  ctx.font = `${fontSize}px Arial, sans-serif`;
  const metrics = ctx.measureText(text);
  const width = Math.ceil(metrics.width) + 4;
  const height = fontSize + 4;

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Draw text
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = '#374151'; // gray-700
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 2, height / 2);

  return canvas;
}
