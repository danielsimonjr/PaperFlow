/**
 * Mirror camera pixels left to right so signature ink reads correctly.
 * A sheet held toward the lens is backwards. This reverse fixes that axis.
 */
export function mirrorPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = (y * width + x) * 4;
      const to = (y * width + (width - 1 - x)) * 4;
      out[to] = pixels[from] ?? 0;
      out[to + 1] = pixels[from + 1] ?? 0;
      out[to + 2] = pixels[from + 2] ?? 0;
      out[to + 3] = pixels[from + 3] ?? 0;
    }
  }
  return out;
}
