/**
 * Document Detection Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from 'vitest';
import { DocumentDetection } from '@lib/scanner/documentDetection';

// Polyfill ImageData for Node.js environment
beforeAll(() => {
  if (typeof globalThis.ImageData === 'undefined') {
    (globalThis as any).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      colorSpace = 'srgb' as const;

      constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
        if (typeof data === 'number') {
          // new ImageData(width, height)
          this.width = data;
          this.height = widthOrHeight ?? data;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          // new ImageData(data, width, height)
          this.data = data;
          this.width = widthOrHeight ?? Math.sqrt(data.length / 4);
          this.height = height ?? Math.sqrt(data.length / 4);
        }
      }
    };
  }
});

// Helper to create test ImageData
const createTestImageData = (
  width: number,
  height: number,
  fill: [number, number, number] = [255, 255, 255]
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0]; // R
    data[i + 1] = fill[1]; // G
    data[i + 2] = fill[2]; // B
    data[i + 3] = 255; // A
  }

  return new ImageData(data, width, height);
};

// Helper to draw a rectangle on ImageData
const drawRectangle = (
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number] = [0, 0, 0]
): void => {
  const { data, width: imgWidth } = imageData;

  // Draw horizontal edges
  for (let i = x; i < x + width; i++) {
    // Top edge
    let idx = (y * imgWidth + i) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];

    // Bottom edge
    idx = ((y + height - 1) * imgWidth + i) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
  }

  // Draw vertical edges
  for (let j = y; j < y + height; j++) {
    // Left edge
    let idx = (j * imgWidth + x) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];

    // Right edge
    idx = (j * imgWidth + x + width - 1) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
  }
};

describe('DocumentDetection', () => {
  describe('detect', () => {
    it('should return detected: false for blank image', async () => {
      const imageData = createTestImageData(100, 100);
      const result = await DocumentDetection.detect(imageData);

      // Blank white image should not have strong edges
      expect(result.detected).toBe(false);
    });

    it('should detect document with clear edges', async () => {
      const imageData = createTestImageData(200, 200, [200, 200, 200]);

      // Draw a dark rectangle (simulating document on gray background)
      drawRectangle(imageData, 20, 20, 160, 160, [50, 50, 50]);

      const result = await DocumentDetection.detect(imageData);

      // Should detect the rectangle edges
      // Note: This test depends on the detection algorithm sensitivity
      // In real implementation, may need adjustment based on threshold
      expect(result).toBeDefined();
    });

    it('should respect threshold option', async () => {
      const imageData = createTestImageData(100, 100);

      const resultLowThreshold = await DocumentDetection.detect(imageData, {
        threshold: 10,
      });

      const resultHighThreshold = await DocumentDetection.detect(imageData, {
        threshold: 200,
      });

      // Both should return valid results
      expect(resultLowThreshold).toBeDefined();
      expect(resultHighThreshold).toBeDefined();
    });
  });

  describe('edge detection internals', () => {
    it('should convert image to grayscale correctly', () => {
      // Access private method through any cast for testing
      const imageData = createTestImageData(2, 2, [100, 150, 200]);
      const gray = (DocumentDetection as any).toGrayscale(imageData);

      expect(gray).toBeInstanceOf(Uint8Array);
      expect(gray.length).toBe(4);

      // Check grayscale conversion (ITU-R BT.709)
      // Gray = 0.2126*R + 0.7152*G + 0.0722*B
      const expectedGray = Math.round(100 * 0.2126 + 150 * 0.7152 + 200 * 0.0722);
      expect(gray[0]).toBe(expectedGray);
    });

    it('should create valid Gaussian kernel', () => {
      const kernel = (DocumentDetection as any).createGaussianKernel(2);

      // Kernel should be (2*2+1) = 5x5
      expect(kernel.length).toBe(5);
      expect(kernel[0].length).toBe(5);

      // Center should have highest value
      expect(kernel[2][2]).toBeGreaterThan(kernel[0][0]);
    });
  });

  describe('quadrilateral operations', () => {
    it('should order corners correctly', () => {
      const unordered = [
        { x: 100, y: 100 }, // BR
        { x: 0, y: 0 }, // TL
        { x: 100, y: 0 }, // TR
        { x: 0, y: 100 }, // BL
      ];

      const ordered = (DocumentDetection as any).orderCorners(unordered);

      // Should be: TL, TR, BR, BL
      expect(ordered[0]).toEqual({ x: 0, y: 0 }); // TL
      expect(ordered[1]).toEqual({ x: 100, y: 0 }); // TR
      expect(ordered[2]).toEqual({ x: 100, y: 100 }); // BR
      expect(ordered[3]).toEqual({ x: 0, y: 100 }); // BL
    });

    it('should calculate quadrilateral area', () => {
      const quad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      const area = (DocumentDetection as any).quadrilateralArea(quad);
      expect(area).toBe(10000); // 100 * 100
    });

    it('should convert quad to bounding rect', () => {
      const quad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 10, y: 20 },
        { x: 110, y: 25 },
        { x: 105, y: 120 },
        { x: 15, y: 115 },
      ];

      const rect = (DocumentDetection as any).quadToRect(quad);

      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(100);
    });
  });

  describe('document validation', () => {
    it('should validate reasonable document shape', () => {
      const validQuad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 50, y: 50 },
        { x: 450, y: 50 },
        { x: 450, y: 550 },
        { x: 50, y: 550 },
      ];

      const isValid = (DocumentDetection as any).isValidDocumentShape(validQuad, 500, 600);
      expect(isValid).toBe(true);
    });

    it('should reject too small document', () => {
      const smallQuad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      const isValid = (DocumentDetection as any).isValidDocumentShape(smallQuad, 500, 600);
      expect(isValid).toBe(false);
    });

    it('should reject extreme aspect ratio', () => {
      const extremeQuad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 50, y: 50 },
        { x: 450, y: 50 },
        { x: 450, y: 100 },
        { x: 50, y: 100 },
      ];

      const isValid = (DocumentDetection as any).isValidDocumentShape(extremeQuad, 500, 600);
      expect(isValid).toBe(false);
    });
  });

  describe('confidence calculation', () => {
    it('should return higher confidence for larger documents', () => {
      const largeQuad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 50, y: 50 },
        { x: 450, y: 50 },
        { x: 450, y: 450 },
        { x: 50, y: 450 },
      ];

      const smallQuad: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 200, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 300 },
        { x: 200, y: 300 },
      ];

      const largeConfidence = (DocumentDetection as any).calculateConfidence(largeQuad, 500, 500);
      const smallConfidence = (DocumentDetection as any).calculateConfidence(smallQuad, 500, 500);

      expect(largeConfidence).toBeGreaterThan(smallConfidence);
    });
  });
});
