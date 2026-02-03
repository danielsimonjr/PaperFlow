/**
 * Image Compression
 *
 * Compression utilities for scanned images to reduce PDF file size
 * while maintaining quality.
 */

/**
 * Compression options
 */
export interface CompressionOptions {
  /** JPEG quality (0-100) */
  quality?: number;
  /** Maximum dimension (width or height) */
  maxDimension?: number;
  /** Target file size in bytes */
  targetSize?: number;
  /** Enable grayscale conversion */
  grayscale?: boolean;
  /** Downsampling factor (1-4) */
  downsample?: number;
}

/**
 * Compression result
 */
export interface CompressionResult {
  /** Compressed image as data URL */
  dataUrl: string;
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio */
  ratio: number;
  /** Final dimensions */
  width: number;
  height: number;
}

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  quality: 85,
  maxDimension: 4096,
  grayscale: false,
  downsample: 1,
};

/**
 * Image compression service
 */
export class ImageCompression {
  /**
   * Compress an image for PDF embedding
   */
  static async compress(
    dataUrl: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = this.estimateDataUrlSize(dataUrl);

    // Load image
    const img = await this.loadImage(dataUrl);

    // Calculate output dimensions
    const { width, height } = this.calculateDimensions(
      img.width,
      img.height,
      opts.maxDimension!,
      opts.downsample!
    );

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Enable image smoothing for better downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Apply grayscale if requested
    if (opts.grayscale) {
      this.applyGrayscale(ctx, width, height);
    }

    // Compress
    const quality = opts.quality! / 100;
    let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

    // If target size specified, adjust quality
    if (opts.targetSize) {
      compressedDataUrl = await this.compressToTargetSize(
        canvas,
        opts.targetSize,
        quality
      );
    }

    const compressedSize = this.estimateDataUrlSize(compressedDataUrl);

    return {
      dataUrl: compressedDataUrl,
      originalSize,
      compressedSize,
      ratio: originalSize / compressedSize,
      width,
      height,
    };
  }

  /**
   * Compress multiple images in batch
   */
  static async compressBatch(
    dataUrls: string[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    return Promise.all(dataUrls.map((url) => this.compress(url, options)));
  }

  /**
   * Load image from data URL
   */
  private static loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Calculate output dimensions with constraints
   */
  private static calculateDimensions(
    width: number,
    height: number,
    maxDimension: number,
    downsample: number
  ): { width: number; height: number } {
    // Apply downsampling
    width = Math.round(width / downsample);
    height = Math.round(height / downsample);

    // Constrain to max dimension
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    return { width, height };
  }

  /**
   * Apply grayscale conversion
   */
  private static applyGrayscale(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Compress to target file size using binary search
   */
  private static async compressToTargetSize(
    canvas: HTMLCanvasElement,
    targetSize: number,
    initialQuality: number
  ): Promise<string> {
    let minQuality = 0.1;
    let maxQuality = initialQuality;
    let result = canvas.toDataURL('image/jpeg', maxQuality);
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      const currentSize = this.estimateDataUrlSize(result);

      if (Math.abs(currentSize - targetSize) < targetSize * 0.1) {
        break; // Within 10% of target
      }

      const midQuality = (minQuality + maxQuality) / 2;
      result = canvas.toDataURL('image/jpeg', midQuality);
      const midSize = this.estimateDataUrlSize(result);

      if (midSize > targetSize) {
        maxQuality = midQuality;
      } else {
        minQuality = midQuality;
      }

      iterations++;
    }

    return result;
  }

  /**
   * Estimate size of data URL in bytes
   */
  private static estimateDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.round((base64.length * 3) / 4);
  }

  /**
   * Get optimal compression settings for scan type
   */
  static getOptimalSettings(
    scanType: 'document' | 'photo' | 'receipt' | 'drawing'
  ): CompressionOptions {
    switch (scanType) {
      case 'document':
        return {
          quality: 85,
          maxDimension: 3300, // ~11" at 300 DPI
          grayscale: false,
        };
      case 'photo':
        return {
          quality: 92,
          maxDimension: 4096,
          grayscale: false,
        };
      case 'receipt':
        return {
          quality: 75,
          maxDimension: 2400,
          grayscale: true,
        };
      case 'drawing':
        return {
          quality: 70,
          maxDimension: 2400,
          grayscale: true,
        };
      default:
        return DEFAULT_OPTIONS;
    }
  }

  /**
   * Apply document-specific enhancements
   */
  static async enhanceDocument(dataUrl: string): Promise<string> {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase contrast
    const contrast = 1.2;
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 128;
      const g = data[i + 1] ?? 128;
      const b = data[i + 2] ?? 128;
      data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  /**
   * Convert to black and white (1-bit) for documents
   */
  static async convertToBlackAndWhite(
    dataUrl: string,
    threshold: number = 128
  ): Promise<string> {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      const bw = gray > threshold ? 255 : 0;
      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  /**
   * Apply adaptive thresholding for better B&W conversion
   */
  static async adaptiveThreshold(
    dataUrl: string,
    blockSize: number = 15,
    constant: number = 10
  ): Promise<string> {
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height, data } = imageData;

    // Convert to grayscale first
    const gray = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      gray[i / 4] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    }

    // Compute integral image for fast mean calculation
    const integral = new Float64Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const grayVal = gray[y * width + x] ?? 0;
        const top = integral[y * (width + 1) + (x + 1)] ?? 0;
        const left = integral[(y + 1) * (width + 1) + x] ?? 0;
        const topLeft = integral[y * (width + 1) + x] ?? 0;
        integral[(y + 1) * (width + 1) + (x + 1)] = grayVal + top + left - topLeft;
      }
    }

    // Apply adaptive threshold
    const halfBlock = Math.floor(blockSize / 2);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - halfBlock);
        const y1 = Math.max(0, y - halfBlock);
        const x2 = Math.min(width - 1, x + halfBlock);
        const y2 = Math.min(height - 1, y + halfBlock);

        const count = (x2 - x1 + 1) * (y2 - y1 + 1);
        const br = integral[(y2 + 1) * (width + 1) + (x2 + 1)] ?? 0;
        const tr = integral[y1 * (width + 1) + (x2 + 1)] ?? 0;
        const bl = integral[(y2 + 1) * (width + 1) + x1] ?? 0;
        const tl = integral[y1 * (width + 1) + x1] ?? 0;
        const sum = br - tr - bl + tl;

        const localThreshold = sum / count - constant;
        const idx = (y * width + x) * 4;
        const grayVal = gray[y * width + x] ?? 0;
        const bw = grayVal > localThreshold ? 255 : 0;

        data[idx] = bw;
        data[idx + 1] = bw;
        data[idx + 2] = bw;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  }
}

export default ImageCompression;
