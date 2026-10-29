import type { DrawingPath } from '@/types';

/**
 * Move every point of a drawing by a PDF-space delta.
 */
export function translateDrawingPaths(
  paths: DrawingPath[],
  dx: number,
  dy: number
): DrawingPath[] {
  return paths.map((path) => ({
    points: path.points.map((point) => ({
      ...point,
      x: point.x + dx,
      y: point.y + dy,
    })),
  }));
}

/**
 * Convert a screen drag into PDF units.
 * Screen Y grows downward, and PDF Y grows upward.
 */
export function screenDeltaToPdf(
  dx: number,
  dy: number,
  scale: number
): { dx: number; dy: number } {
  const safeScale = scale === 0 ? 1 : scale;
  return { dx: dx / safeScale, dy: -dy / safeScale };
}
