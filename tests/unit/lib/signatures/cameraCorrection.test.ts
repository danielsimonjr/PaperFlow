import { describe, expect, it } from 'vitest';
import { mirrorPixels } from '@/lib/signatures/cameraCorrection';

describe('mirrorPixels', () => {
  it('reverses each row and leaves the top row on top', () => {
    const width = 2;
    const height = 2;
    const pixels = new Uint8ClampedArray([
      10, 0, 0, 255, 20, 0, 0, 255,
      30, 0, 0, 255, 40, 0, 0, 255,
    ]);

    const mirrored = mirrorPixels(pixels, width, height);

    expect(Array.from(mirrored)).toEqual([
      20, 0, 0, 255, 10, 0, 0, 255,
      40, 0, 0, 255, 30, 0, 0, 255,
    ]);
  });
});
