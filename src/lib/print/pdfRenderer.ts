/**
 * PDF Renderer for Printing
 *
 * High-fidelity PDF rendering for printing with proper color management
 * and resolution handling.
 */

import type { PDFPageProxy } from 'pdfjs-dist';

/**
 * Render options
 */
export interface PrintRenderOptions {
  /** DPI for rendering (default: 300) */
  dpi?: number;
  /** Whether to use grayscale (default: false) */
  grayscale?: boolean;
  /** Scale factor (default: 1) */
  scale?: number;
  /** Quality setting */
  quality?: 'draft' | 'normal' | 'high';
  /** Whether to render backgrounds (default: true) */
  renderBackground?: boolean;
}

/**
 * Rendered page result
 */
export interface RenderedPage {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width: number;
  height: number;
  dpi: number;
  dataUrl?: string;
}

/**
 * DPI settings for quality levels
 */
const QUALITY_DPI: Record<string, number> = {
  draft: 150,
  normal: 300,
  high: 600,
};

/**
 * Print PDF Renderer
 */
export class PrintPDFRenderer {
  private useOffscreenCanvas: boolean;

  constructor() {
    this.useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  }

  /**
   * Render a page for printing
   */
  async renderPage(
    page: PDFPageProxy,
    options: PrintRenderOptions = {}
  ): Promise<RenderedPage> {
    const {
      dpi = options.quality ? QUALITY_DPI[options.quality] : 300,
      grayscale = false,
      scale = 1,
      renderBackground = true,
    } = options;

    // Calculate scale based on DPI
    // PDF points are at 72 DPI, so we scale up
    const effectiveDpi = dpi ?? 300;
    const dpiScale = (effectiveDpi / 72) * scale;

    // Get page viewport
    const viewport = page.getViewport({ scale: dpiScale });

    // Create canvas
    const canvas = this.createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Clear canvas
    if (renderBackground) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, viewport.width, viewport.height);
    }

    // Render page
    await page.render({
      canvasContext: context as CanvasRenderingContext2D,
      viewport,
      background: renderBackground ? 'white' : 'transparent',
    }).promise;

    // Apply grayscale if needed
    if (grayscale) {
      this.applyGrayscale(context, viewport.width, viewport.height);
    }

    return {
      canvas,
      width: viewport.width,
      height: viewport.height,
      dpi: effectiveDpi,
    };
  }

  /**
   * Render page to data URL
   */
  async renderPageToDataUrl(
    page: PDFPageProxy,
    options: PrintRenderOptions = {},
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality?: number
  ): Promise<string> {
    const result = await this.renderPage(page, options);

    if (result.canvas instanceof HTMLCanvasElement) {
      return result.canvas.toDataURL(format, quality);
    } else {
      // OffscreenCanvas
      const blob = await result.canvas.convertToBlob({ type: format, quality });
      return URL.createObjectURL(blob);
    }
  }

  /**
   * Render page to blob
   */
  async renderPageToBlob(
    page: PDFPageProxy,
    options: PrintRenderOptions = {},
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality?: number
  ): Promise<Blob> {
    const result = await this.renderPage(page, options);

    if (result.canvas instanceof HTMLCanvasElement) {
      return new Promise((resolve, reject) => {
        (result.canvas as HTMLCanvasElement).toBlob(
          (blob: Blob | null) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      });
    } else {
      return result.canvas.convertToBlob({ type: format, quality });
    }
  }

  /**
   * Render multiple pages
   */
  async renderPages(
    pages: PDFPageProxy[],
    options: PrintRenderOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<RenderedPage[]> {
    const results: RenderedPage[] = [];
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      if (page) {
        const rendered = await this.renderPage(page, options);
        results.push(rendered);
      }
      onProgress?.(i + 1, total);
    }

    return results;
  }

  /**
   * Create canvas (uses OffscreenCanvas if available)
   */
  private createCanvas(
    width: number,
    height: number
  ): HTMLCanvasElement | OffscreenCanvas {
    if (this.useOffscreenCanvas) {
      return new OffscreenCanvas(width, height);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Apply grayscale filter to canvas
   */
  private applyGrayscale(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // ITU-R BT.709 formula for luminance
      const gray =
        (data[i] ?? 0) * 0.2126 + (data[i + 1] ?? 0) * 0.7152 + (data[i + 2] ?? 0) * 0.0722;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    context.putImageData(imageData, 0, 0);
  }

  /**
   * Calculate optimal DPI based on printer capabilities and quality
   */
  static calculateOptimalDPI(
    printerMaxDPI: number,
    quality: 'draft' | 'normal' | 'high'
  ): number {
    const targetDPI = QUALITY_DPI[quality] ?? 300;
    return Math.min(targetDPI, printerMaxDPI);
  }

  /**
   * Calculate memory usage for rendering
   */
  static estimateMemoryUsage(
    width: number,
    height: number,
    dpi: number
  ): number {
    // Scale dimensions by DPI
    const scaledWidth = (width * dpi) / 72;
    const scaledHeight = (height * dpi) / 72;

    // RGBA = 4 bytes per pixel
    return scaledWidth * scaledHeight * 4;
  }

  /**
   * Check if rendering at given DPI is feasible
   */
  static canRenderAtDPI(
    pageWidth: number,
    pageHeight: number,
    dpi: number,
    maxMemoryMB: number = 512
  ): boolean {
    const memoryUsage = this.estimateMemoryUsage(pageWidth, pageHeight, dpi);
    const maxMemory = maxMemoryMB * 1024 * 1024;
    return memoryUsage <= maxMemory;
  }
}

export default PrintPDFRenderer;
