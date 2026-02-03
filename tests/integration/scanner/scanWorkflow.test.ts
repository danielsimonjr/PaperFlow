/**
 * Scanner Workflow Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { ScanToPDF } from '@lib/scanner/scanToPdf';
import { ImageCompression } from '@lib/scanner/imageCompression';
import { PerspectiveCorrection } from '@lib/scanner/perspectiveCorrection';
import type { ScanResult } from '@lib/scanner/types';

// Create a minimal valid PNG data URL for testing
// Note: width and height are provided for API compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTestDataUrl = (width: number = 100, height: number = 100): string => {
  // Minimal 1x1 PNG for testing
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

describe('Scanner Workflow Integration', () => {
  describe('ScanToPDF', () => {
    it('should convert single scan to PDF', async () => {
      const scan: ScanResult = {
        success: true,
        dataUrl: createTestDataUrl(),
        width: 100,
        height: 100,
        resolution: 300,
        colorMode: 'color',
        timestamp: Date.now(),
      };

      const pdfBytes = await ScanToPDF.convertSingle(scan, {
        title: 'Test Document',
        author: 'Test Author',
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(0);

      // Check PDF header
      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('should convert multiple scans to single PDF', async () => {
      const scans: ScanResult[] = [
        {
          success: true,
          dataUrl: createTestDataUrl(),
          width: 100,
          height: 100,
          resolution: 300,
          colorMode: 'color',
          timestamp: Date.now(),
        },
        {
          success: true,
          dataUrl: createTestDataUrl(),
          width: 100,
          height: 100,
          resolution: 300,
          colorMode: 'color',
          timestamp: Date.now() + 1000,
        },
      ];

      const pdfBytes = await ScanToPDF.convertMultiple(scans);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(0);
    });

    it('should throw error for empty scans array', async () => {
      await expect(ScanToPDF.convertMultiple([])).rejects.toThrow('No scans to convert');
    });

    it('should throw error for invalid scan result', async () => {
      const invalidScan: ScanResult = {
        success: false,
        errorMessage: 'Scan failed',
        timestamp: Date.now(),
      };

      await expect(ScanToPDF.convertSingle(invalidScan)).rejects.toThrow('Invalid scan result');
    });

    it('should estimate output size', () => {
      const scans: ScanResult[] = [
        {
          success: true,
          dataUrl: createTestDataUrl(),
          width: 2550, // Letter at 300 DPI
          height: 3300,
          resolution: 300,
          colorMode: 'color',
          timestamp: Date.now(),
        },
      ];

      const estimate = ScanToPDF.estimateSize(scans, { quality: 85 });

      expect(estimate).toBeGreaterThan(0);
      expect(typeof estimate).toBe('number');
    });

    it('should return recommended quality for usage types', () => {
      expect(ScanToPDF.getRecommendedQuality('archive')).toBe(95);
      expect(ScanToPDF.getRecommendedQuality('print')).toBe(90);
      expect(ScanToPDF.getRecommendedQuality('email')).toBe(75);
      expect(ScanToPDF.getRecommendedQuality('web')).toBe(60);
    });
  });

  describe('ImageCompression', () => {
    it('should return optimal settings for different scan types', () => {
      const documentSettings = ImageCompression.getOptimalSettings('document');
      expect(documentSettings.quality).toBeDefined();
      expect(documentSettings.maxDimension).toBeDefined();

      const photoSettings = ImageCompression.getOptimalSettings('photo');
      expect(photoSettings.quality).toBeGreaterThan(documentSettings.quality!);

      const receiptSettings = ImageCompression.getOptimalSettings('receipt');
      expect(receiptSettings.grayscale).toBe(true);
    });
  });

  describe('PerspectiveCorrection', () => {
    it('should calculate perspective transform matrix', () => {
      const src: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 10, y: 10 },
        { x: 90, y: 15 },
        { x: 85, y: 90 },
        { x: 15, y: 85 },
      ];

      const dst: [
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

      const matrix = PerspectiveCorrection.calculateTransform(src, dst);

      expect(matrix).toBeDefined();
      expect(typeof matrix.a).toBe('number');
      expect(typeof matrix.b).toBe('number');
    });

    it('should transform point using matrix', () => {
      const src: [
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

      const dst: [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
      ] = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 200 },
        { x: 0, y: 200 },
      ];

      const matrix = PerspectiveCorrection.calculateTransform(src, dst);
      const transformed = PerspectiveCorrection.transformPoint({ x: 50, y: 50 }, matrix);

      // Should scale by 2x
      expect(transformed.x).toBeCloseTo(100, 0);
      expect(transformed.y).toBeCloseTo(100, 0);
    });

    it('should detect if correction is needed', () => {
      const needsCorrection = PerspectiveCorrection.needsCorrection([
        { x: 10, y: 10 },
        { x: 90, y: 15 }, // Tilted
        { x: 85, y: 90 },
        { x: 15, y: 85 },
      ]);

      expect(needsCorrection).toBe(true);

      const perfectRectangle = PerspectiveCorrection.needsCorrection([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);

      expect(perfectRectangle).toBe(false);
    });
  });

  describe('Full Workflow', () => {
    it('should complete full scan-to-PDF workflow', async () => {
      // 1. Create mock scan result
      const scan: ScanResult = {
        success: true,
        dataUrl: createTestDataUrl(),
        width: 100,
        height: 100,
        resolution: 300,
        colorMode: 'grayscale',
        timestamp: Date.now(),
      };

      // 2. Check if perspective correction needed (in this case, no corners)
      // Skip for this test

      // 3. Convert to PDF
      const pdfBytes = await ScanToPDF.convertSingle(scan, {
        title: 'Scanned Document',
        author: 'PaperFlow',
        quality: 85,
      });

      // 4. Verify PDF
      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(100);

      // Check PDF structure
      const pdfString = new TextDecoder().decode(pdfBytes.slice(0, 100));
      expect(pdfString).toContain('%PDF');
    });
  });
});
