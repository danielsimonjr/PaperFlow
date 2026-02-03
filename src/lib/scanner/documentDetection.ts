/**
 * Document Detection
 *
 * Edge detection and perspective correction to automatically
 * detect and crop document boundaries.
 */

import type { Point, Rectangle, DocumentDetectionResult } from './types';

/**
 * Edge detection options
 */
interface EdgeDetectionOptions {
  /** Minimum edge strength (0-255) */
  threshold?: number;
  /** Canny low threshold */
  cannyLow?: number;
  /** Canny high threshold */
  cannyHigh?: number;
  /** Blur radius for noise reduction */
  blurRadius?: number;
}

/**
 * Default edge detection options
 */
const DEFAULT_OPTIONS: EdgeDetectionOptions = {
  threshold: 50,
  cannyLow: 50,
  cannyHigh: 150,
  blurRadius: 2,
};

/**
 * Document detection service
 */
export class DocumentDetection {
  /**
   * Detect document in image
   */
  static async detect(
    imageData: ImageData,
    options: EdgeDetectionOptions = {}
  ): Promise<DocumentDetectionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      // Convert to grayscale
      const gray = this.toGrayscale(imageData);

      // Apply Gaussian blur for noise reduction
      const blurred = this.gaussianBlur(gray, imageData.width, imageData.height, opts.blurRadius!);

      // Apply Canny edge detection
      const edges = this.cannyEdgeDetection(
        blurred,
        imageData.width,
        imageData.height,
        opts.cannyLow!,
        opts.cannyHigh!
      );

      // Find contours
      const contours = this.findContours(edges, imageData.width, imageData.height);

      // Find the largest quadrilateral
      const quad = this.findLargestQuadrilateral(contours, imageData.width, imageData.height);

      if (quad) {
        return {
          detected: true,
          corners: quad,
          cropRect: this.quadToRect(quad),
          confidence: this.calculateConfidence(quad, imageData.width, imageData.height),
        };
      }

      return { detected: false };
    } catch (error) {
      console.error('Document detection error:', error);
      return { detected: false };
    }
  }

  /**
   * Convert image data to grayscale
   */
  private static toGrayscale(imageData: ImageData): Uint8Array {
    const gray = new Uint8Array(imageData.width * imageData.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i] ?? 0;
      const g = imageData.data[i + 1] ?? 0;
      const b = imageData.data[i + 2] ?? 0;
      // ITU-R BT.709 formula
      gray[i / 4] = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
    }

    return gray;
  }

  /**
   * Apply Gaussian blur
   */
  private static gaussianBlur(
    data: Uint8Array,
    width: number,
    height: number,
    radius: number
  ): Uint8Array {
    const result = new Uint8Array(data.length);
    const kernel = this.createGaussianKernel(radius);
    const halfKernel = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const kernelRow = kernel[ky + halfKernel];
            const weight = kernelRow?.[kx + halfKernel] ?? 0;
            const dataValue = data[py * width + px] ?? 0;
            sum += dataValue * weight;
            weightSum += weight;
          }
        }

        result[y * width + x] = Math.round(sum / weightSum);
      }
    }

    return result;
  }

  /**
   * Create Gaussian kernel
   */
  private static createGaussianKernel(radius: number): number[][] {
    const size = radius * 2 + 1;
    const kernel: number[][] = [];
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;

    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      kernel[y] = row;
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        row[x] = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquare);
      }
    }

    return kernel;
  }

  /**
   * Apply Canny edge detection
   */
  private static cannyEdgeDetection(
    data: Uint8Array,
    width: number,
    height: number,
    lowThreshold: number,
    highThreshold: number
  ): Uint8Array {
    // Simplified Canny: Sobel gradients + thresholding
    const sobelX = this.sobelX(data, width, height);
    const sobelY = this.sobelY(data, width, height);

    const magnitude = new Uint8Array(data.length);
    const edges = new Uint8Array(data.length);

    // Calculate gradient magnitude
    for (let i = 0; i < data.length; i++) {
      const sx = sobelX[i] ?? 0;
      const sy = sobelY[i] ?? 0;
      magnitude[i] = Math.min(255, Math.round(Math.sqrt(sx * sx + sy * sy)));
    }

    // Apply thresholds
    for (let i = 0; i < data.length; i++) {
      const mag = magnitude[i] ?? 0;
      if (mag >= highThreshold) {
        edges[i] = 255;
      } else if (mag >= lowThreshold) {
        // Hysteresis: check if connected to strong edge
        const x = i % width;
        const y = Math.floor(i / width);
        let hasStrongNeighbor = false;

        for (let dy = -1; dy <= 1 && !hasStrongNeighbor; dy++) {
          for (let dx = -1; dx <= 1 && !hasStrongNeighbor; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborMag = magnitude[ny * width + nx] ?? 0;
              if (neighborMag >= highThreshold) {
                hasStrongNeighbor = true;
              }
            }
          }
        }

        edges[i] = hasStrongNeighbor ? 255 : 0;
      } else {
        edges[i] = 0;
      }
    }

    return edges;
  }

  /**
   * Sobel X gradient
   */
  private static sobelX(data: Uint8Array, width: number, height: number): Int16Array {
    const result = new Int16Array(data.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        result[idx] =
          -(data[(y - 1) * width + (x - 1)] ?? 0) +
          (data[(y - 1) * width + (x + 1)] ?? 0) -
          2 * (data[y * width + (x - 1)] ?? 0) +
          2 * (data[y * width + (x + 1)] ?? 0) -
          (data[(y + 1) * width + (x - 1)] ?? 0) +
          (data[(y + 1) * width + (x + 1)] ?? 0);
      }
    }

    return result;
  }

  /**
   * Sobel Y gradient
   */
  private static sobelY(data: Uint8Array, width: number, height: number): Int16Array {
    const result = new Int16Array(data.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        result[idx] =
          -(data[(y - 1) * width + (x - 1)] ?? 0) -
          2 * (data[(y - 1) * width + x] ?? 0) -
          (data[(y - 1) * width + (x + 1)] ?? 0) +
          (data[(y + 1) * width + (x - 1)] ?? 0) +
          2 * (data[(y + 1) * width + x] ?? 0) +
          (data[(y + 1) * width + (x + 1)] ?? 0);
      }
    }

    return result;
  }

  /**
   * Find contours (simplified)
   */
  private static findContours(
    edges: Uint8Array,
    width: number,
    height: number
  ): Point[][] {
    const contours: Point[][] = [];
    const visited = new Set<number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] === 255 && !visited.has(idx)) {
          const contour = this.traceContour(edges, width, height, x, y, visited);
          if (contour.length > 50) {
            // Minimum contour size
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  /**
   * Trace a contour
   */
  private static traceContour(
    edges: Uint8Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Set<number>
  ): Point[] {
    const contour: Point[] = [];
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0 && contour.length < 10000) {
      const point = stack.pop()!;
      const idx = point.y * width + point.x;

      if (visited.has(idx)) continue;
      visited.add(idx);
      contour.push(point);

      // Check neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = point.x + dx;
          const ny = point.y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            if (edges[nidx] === 255 && !visited.has(nidx)) {
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    return contour;
  }

  /**
   * Find largest quadrilateral
   */
  private static findLargestQuadrilateral(
    contours: Point[][],
    width: number,
    height: number
  ): [Point, Point, Point, Point] | null {
    let largestArea = 0;
    let largestQuad: [Point, Point, Point, Point] | null = null;

    for (const contour of contours) {
      // Simplify contour
      const simplified = this.simplifyContour(contour, 10);

      // Try to find 4 corners
      const corners = this.findCorners(simplified);
      if (corners.length >= 4) {
        const quad = this.orderCorners(corners.slice(0, 4));
        const area = this.quadrilateralArea(quad);

        // Check if it's a reasonable document shape
        if (area > largestArea && this.isValidDocumentShape(quad, width, height)) {
          largestArea = area;
          largestQuad = quad;
        }
      }
    }

    return largestQuad;
  }

  /**
   * Simplify contour using Douglas-Peucker algorithm
   */
  private static simplifyContour(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points;

    const first = points[0];
    const last = points[points.length - 1];

    if (!first || !last) return points;

    // Find point with maximum distance
    let maxDist = 0;
    let maxIdx = 0;

    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];
      if (point) {
        const dist = this.pointToLineDistance(point, first, last);
        if (dist > maxDist) {
          maxDist = dist;
          maxIdx = i;
        }
      }
    }

    if (maxDist > epsilon) {
      const left = this.simplifyContour(points.slice(0, maxIdx + 1), epsilon);
      const right = this.simplifyContour(points.slice(maxIdx), epsilon);
      return left.slice(0, -1).concat(right);
    }

    return [first, last];
  }

  /**
   * Calculate point to line distance
   */
  private static pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      );
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)
      )
    );

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    return Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2));
  }

  /**
   * Find corners in simplified contour
   */
  private static findCorners(points: Point[]): Point[] {
    // For simplicity, return the points as potential corners
    // In a real implementation, we'd use more sophisticated corner detection
    return points;
  }

  /**
   * Order corners clockwise starting from top-left
   */
  private static orderCorners(points: Point[]): [Point, Point, Point, Point] {
    const sorted = [...points].sort((a, b) => a.y - b.y);
    const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);

    // Provide defaults for safety, though this should never happen with valid input
    const topLeft: Point = top[0] ?? { x: 0, y: 0 };
    const topRight: Point = top[1] ?? { x: 0, y: 0 };
    const bottomRight: Point = bottom[1] ?? { x: 0, y: 0 };
    const bottomLeft: Point = bottom[0] ?? { x: 0, y: 0 };

    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  /**
   * Calculate quadrilateral area
   */
  private static quadrilateralArea(quad: [Point, Point, Point, Point]): number {
    // Shoelace formula
    let area = 0;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const pi = quad[i];
      const pj = quad[j];
      if (pi && pj) {
        area += pi.x * pj.y;
        area -= pj.x * pi.y;
      }
    }
    return Math.abs(area) / 2;
  }

  /**
   * Check if shape is a valid document
   */
  private static isValidDocumentShape(
    quad: [Point, Point, Point, Point],
    width: number,
    height: number
  ): boolean {
    const area = this.quadrilateralArea(quad);
    const imageArea = width * height;

    // Document should cover at least 10% of image
    if (area < imageArea * 0.1) return false;

    // Document shouldn't cover more than 95%
    if (area > imageArea * 0.95) return false;

    // Check aspect ratio (documents are usually between 1:2 and 2:1)
    const qWidth =
      Math.max(
        Math.hypot(quad[1].x - quad[0].x, quad[1].y - quad[0].y),
        Math.hypot(quad[2].x - quad[3].x, quad[2].y - quad[3].y)
      );
    const qHeight =
      Math.max(
        Math.hypot(quad[3].x - quad[0].x, quad[3].y - quad[0].y),
        Math.hypot(quad[2].x - quad[1].x, quad[2].y - quad[1].y)
      );

    const aspectRatio = Math.max(qWidth, qHeight) / Math.min(qWidth, qHeight);
    if (aspectRatio > 3) return false;

    return true;
  }

  /**
   * Convert quadrilateral to bounding rectangle
   */
  private static quadToRect(quad: [Point, Point, Point, Point]): Rectangle {
    const minX = Math.min(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
    const maxX = Math.max(quad[0].x, quad[1].x, quad[2].x, quad[3].x);
    const minY = Math.min(quad[0].y, quad[1].y, quad[2].y, quad[3].y);
    const maxY = Math.max(quad[0].y, quad[1].y, quad[2].y, quad[3].y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(
    quad: [Point, Point, Point, Point],
    width: number,
    height: number
  ): number {
    const area = this.quadrilateralArea(quad);
    const imageArea = width * height;

    // Base confidence on area ratio
    const areaRatio = area / imageArea;
    let confidence = Math.min(areaRatio * 2, 1);

    // Reduce confidence for very skewed shapes
    const qWidth = Math.hypot(quad[1].x - quad[0].x, quad[1].y - quad[0].y);
    const qHeight = Math.hypot(quad[3].x - quad[0].x, quad[3].y - quad[0].y);
    const aspectRatio = Math.max(qWidth, qHeight) / Math.min(qWidth, qHeight);

    if (aspectRatio > 2) {
      confidence *= 0.8;
    }

    return confidence;
  }
}

export default DocumentDetection;
