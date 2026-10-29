import { describe, expect, it } from 'vitest';
import { screenDeltaToPdf, translateDrawingPaths } from '@/lib/annotations/drawingGeometry';

describe('drawing geometry', () => {
  it('moves every point by the PDF delta', () => {
    const moved = translateDrawingPaths(
      [{ points: [{ x: 1, y: 2, pressure: 0.5 }] }],
      4,
      -3
    );
    expect(moved[0]?.points[0]).toEqual({ x: 5, y: -1, pressure: 0.5 });
  });

  it('flips the screen Y axis into PDF space', () => {
    expect(screenDeltaToPdf(10, 4, 2)).toEqual({ dx: 5, dy: -2 });
  });
});
