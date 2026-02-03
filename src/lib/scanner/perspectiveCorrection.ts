/**
 * Perspective Correction
 *
 * Applies perspective correction to scanned documents using
 * detected corner points.
 */

import type { Point } from './types';

/**
 * Matrix operations for perspective transform
 */
class Matrix {
  private data: number[][];

  constructor(rows: number, cols: number, initial?: number[][]) {
    if (initial) {
      this.data = initial;
    } else {
      this.data = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(0));
    }
  }

  get(row: number, col: number): number {
    return this.data[row]?.[col] ?? 0;
  }

  set(row: number, col: number, value: number): void {
    const rowData = this.data[row];
    if (rowData) {
      rowData[col] = value;
    }
  }

  getRows(): number {
    return this.data.length;
  }

  getCols(): number {
    return this.data[0]?.length || 0;
  }

  /**
   * Matrix multiplication
   */
  multiply(other: Matrix): Matrix {
    const result = new Matrix(this.getRows(), other.getCols());
    for (let i = 0; i < this.getRows(); i++) {
      for (let j = 0; j < other.getCols(); j++) {
        let sum = 0;
        for (let k = 0; k < this.getCols(); k++) {
          sum += this.get(i, k) * other.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }

  /**
   * Gaussian elimination for solving linear systems
   */
  static solve(A: Matrix, b: number[]): number[] {
    const n = A.getRows();
    const augmented = new Matrix(n, n + 1);

    // Create augmented matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        augmented.set(i, j, A.get(i, j));
      }
      augmented.set(i, n, b[i] ?? 0);
    }

    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented.get(row, col)) > Math.abs(augmented.get(maxRow, col))) {
          maxRow = row;
        }
      }

      // Swap rows
      for (let j = 0; j <= n; j++) {
        const temp = augmented.get(col, j);
        augmented.set(col, j, augmented.get(maxRow, j));
        augmented.set(maxRow, j, temp);
      }

      // Eliminate
      for (let row = col + 1; row < n; row++) {
        const factor = augmented.get(row, col) / augmented.get(col, col);
        for (let j = col; j <= n; j++) {
          augmented.set(row, j, augmented.get(row, j) - factor * augmented.get(col, j));
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      let sum = augmented.get(row, n);
      for (let j = row + 1; j < n; j++) {
        sum -= augmented.get(row, j) * x[j];
      }
      x[row] = sum / augmented.get(row, row);
    }

    return x;
  }
}

/**
 * Perspective transformation matrix
 */
export interface PerspectiveMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
}

/**
 * Perspective correction service
 */
export class PerspectiveCorrection {
  /**
   * Calculate perspective transform matrix from source to destination points
   */
  static calculateTransform(
    src: [Point, Point, Point, Point],
    dst: [Point, Point, Point, Point]
  ): PerspectiveMatrix {
    // Build system of equations for perspective transform
    // Using the equations:
    // x' = (ax + by + c) / (gx + hy + 1)
    // y' = (dx + ey + f) / (gx + hy + 1)

    const A = new Matrix(8, 8);
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
      const srcPoint = src[i];
      const dstPoint = dst[i];
      if (!srcPoint || !dstPoint) continue;
      const sx = srcPoint.x;
      const sy = srcPoint.y;
      const dx = dstPoint.x;
      const dy = dstPoint.y;

      // First equation for each point
      A.set(i * 2, 0, sx);
      A.set(i * 2, 1, sy);
      A.set(i * 2, 2, 1);
      A.set(i * 2, 3, 0);
      A.set(i * 2, 4, 0);
      A.set(i * 2, 5, 0);
      A.set(i * 2, 6, -sx * dx);
      A.set(i * 2, 7, -sy * dx);
      b.push(dx);

      // Second equation for each point
      A.set(i * 2 + 1, 0, 0);
      A.set(i * 2 + 1, 1, 0);
      A.set(i * 2 + 1, 2, 0);
      A.set(i * 2 + 1, 3, sx);
      A.set(i * 2 + 1, 4, sy);
      A.set(i * 2 + 1, 5, 1);
      A.set(i * 2 + 1, 6, -sx * dy);
      A.set(i * 2 + 1, 7, -sy * dy);
      b.push(dy);
    }

    const solution = Matrix.solve(A, b);

    return {
      a: solution[0] ?? 0,
      b: solution[1] ?? 0,
      c: solution[2] ?? 0,
      d: solution[3] ?? 0,
      e: solution[4] ?? 0,
      f: solution[5] ?? 0,
      g: solution[6] ?? 0,
      h: solution[7] ?? 0,
    };
  }

  /**
   * Apply perspective transform to a point
   */
  static transformPoint(point: Point, matrix: PerspectiveMatrix): Point {
    const { a, b, c, d, e, f, g, h } = matrix;
    const denominator = g * point.x + h * point.y + 1;

    return {
      x: (a * point.x + b * point.y + c) / denominator,
      y: (d * point.x + e * point.y + f) / denominator,
    };
  }

  /**
   * Calculate inverse transform matrix
   */
  static invertTransform(matrix: PerspectiveMatrix): PerspectiveMatrix {
    const { a, b, c, d, e, f, g, h } = matrix;

    // Calculate determinants for inverse
    const det = a * e - b * d - a * f * h + b * f * g + c * d * h - c * e * g;

    if (Math.abs(det) < 1e-10) {
      throw new Error('Transform matrix is not invertible');
    }

    return {
      a: (e - f * h) / det,
      b: (c * h - b) / det,
      c: (b * f - c * e) / det,
      d: (f * g - d) / det,
      e: (a - c * g) / det,
      f: (c * d - a * f) / det,
      g: (d * h - e * g) / det,
      h: (b * g - a * h) / det,
    };
  }

  /**
   * Correct perspective of an image
   */
  static async correctPerspective(
    imageData: ImageData,
    corners: [Point, Point, Point, Point],
    outputWidth?: number,
    outputHeight?: number
  ): Promise<ImageData> {
    // Calculate output dimensions based on document aspect ratio
    const width1 = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
    const width2 = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
    const height1 = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
    const height2 = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

    const avgWidth = (width1 + width2) / 2;
    const avgHeight = (height1 + height2) / 2;

    const outWidth = outputWidth || Math.round(avgWidth);
    const outHeight = outputHeight || Math.round(avgHeight);

    // Destination corners (rectangle)
    const dstCorners: [Point, Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: outWidth - 1, y: 0 },
      { x: outWidth - 1, y: outHeight - 1 },
      { x: 0, y: outHeight - 1 },
    ];

    // Calculate inverse transform (dst to src)
    const forwardMatrix = this.calculateTransform(corners, dstCorners);
    const inverseMatrix = this.invertTransform(forwardMatrix);

    // Create output image
    const output = new ImageData(outWidth, outHeight);

    // Apply transform with bilinear interpolation
    for (let y = 0; y < outHeight; y++) {
      for (let x = 0; x < outWidth; x++) {
        const srcPoint = this.transformPoint({ x, y }, inverseMatrix);
        const color = this.bilinearInterpolate(imageData, srcPoint.x, srcPoint.y);

        const idx = (y * outWidth + x) * 4;
        output.data[idx] = color.r;
        output.data[idx + 1] = color.g;
        output.data[idx + 2] = color.b;
        output.data[idx + 3] = color.a;
      }
    }

    return output;
  }

  /**
   * Bilinear interpolation for smooth sampling
   */
  private static bilinearInterpolate(
    imageData: ImageData,
    x: number,
    y: number
  ): { r: number; g: number; b: number; a: number } {
    const { width, height, data } = imageData;

    // Clamp coordinates
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);

    const xFrac = x - x0;
    const yFrac = y - y0;

    const getPixel = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return {
        r: data[idx] ?? 0,
        g: data[idx + 1] ?? 0,
        b: data[idx + 2] ?? 0,
        a: data[idx + 3] ?? 255,
      };
    };

    const p00 = getPixel(x0, y0);
    const p10 = getPixel(x1, y0);
    const p01 = getPixel(x0, y1);
    const p11 = getPixel(x1, y1);

    const interpolate = (c00: number, c10: number, c01: number, c11: number) => {
      const top = c00 * (1 - xFrac) + c10 * xFrac;
      const bottom = c01 * (1 - xFrac) + c11 * xFrac;
      return Math.round(top * (1 - yFrac) + bottom * yFrac);
    };

    return {
      r: interpolate(p00.r, p10.r, p01.r, p11.r),
      g: interpolate(p00.g, p10.g, p01.g, p11.g),
      b: interpolate(p00.b, p10.b, p01.b, p11.b),
      a: interpolate(p00.a, p10.a, p01.a, p11.a),
    };
  }

  /**
   * Auto-correct document to standard sizes
   */
  static async autoCorrectToStandardSize(
    imageData: ImageData,
    corners: [Point, Point, Point, Point],
    targetDpi: number = 300
  ): Promise<{ imageData: ImageData; paperSize: string }> {
    // Calculate document dimensions in pixels
    const width1 = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
    const width2 = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
    const height1 = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
    const height2 = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);

    const avgWidth = (width1 + width2) / 2;
    const avgHeight = (height1 + height2) / 2;
    const aspectRatio = avgWidth / avgHeight;

    // Common paper sizes (width x height in inches)
    const paperSizes: Record<string, { width: number; height: number }> = {
      letter: { width: 8.5, height: 11 },
      legal: { width: 8.5, height: 14 },
      a4: { width: 8.27, height: 11.69 },
      a5: { width: 5.83, height: 8.27 },
    };

    // Find closest paper size
    let closestSize = 'letter';
    let closestDiff = Infinity;

    for (const [name, size] of Object.entries(paperSizes)) {
      const sizeRatio = size.width / size.height;
      const diff = Math.abs(aspectRatio - sizeRatio);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestSize = name;
      }
    }

    // Calculate output dimensions at target DPI
    const paper = paperSizes[closestSize] ?? { width: 8.5, height: 11 };
    const outWidth = Math.round(paper.width * targetDpi);
    const outHeight = Math.round(paper.height * targetDpi);

    const corrected = await this.correctPerspective(imageData, corners, outWidth, outHeight);

    return {
      imageData: corrected,
      paperSize: closestSize,
    };
  }

  /**
   * Estimate if perspective correction is needed
   */
  static needsCorrection(corners: [Point, Point, Point, Point]): boolean {
    // Calculate angles at corners
    const angles: number[] = [];

    for (let i = 0; i < 4; i++) {
      const prev = corners[(i + 3) % 4];
      const curr = corners[i];
      const next = corners[(i + 1) % 4];

      if (!prev || !curr || !next) continue;

      const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      const dot = v1.x * v2.x + v1.y * v2.y;
      const cross = v1.x * v2.y - v1.y * v2.x;
      const angle = Math.abs(Math.atan2(cross, dot) * (180 / Math.PI));

      angles.push(angle);
    }

    // If any angle deviates more than 5 degrees from 90, correction is needed
    return angles.some((angle) => Math.abs(angle - 90) > 5);
  }
}

export default PerspectiveCorrection;
