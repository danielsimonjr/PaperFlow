/**
 * Image Preprocessor for OCR
 * Provides image enhancement functions to improve OCR accuracy.
 */

import type { PreprocessingOptions } from './types';

/**
 * Preprocesses an image for better OCR results
 * @param source Source canvas or image element
 * @param options Preprocessing options
 * @returns Processed canvas ready for OCR
 */
export function preprocessImage(
  source: HTMLCanvasElement | HTMLImageElement | ImageData,
  options: PreprocessingOptions = {}
): HTMLCanvasElement {
  // Create canvas from source
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let width: number;
  let height: number;

  if (source instanceof HTMLCanvasElement) {
    width = source.width;
    height = source.height;
  } else if (source instanceof HTMLImageElement) {
    width = source.naturalWidth || source.width;
    height = source.naturalHeight || source.height;
  } else {
    // ImageData
    width = source.width;
    height = source.height;
  }

  // Apply scaling
  const scale = options.scale ?? 1.0;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  // Draw source to canvas
  if (source instanceof ImageData) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(source, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  // Get image data for pixel manipulation
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Apply preprocessing steps
  if (options.grayscale) {
    imageData = applyGrayscale(imageData);
  }

  if (options.invert) {
    imageData = applyInvert(imageData);
  }

  if (options.denoise) {
    imageData = applyDenoise(imageData);
  }

  if (options.binarize) {
    const threshold = options.threshold ?? 128;
    imageData = applyBinarize(imageData, threshold);
  } else if (options.adaptiveThreshold) {
    imageData = applyAdaptiveThreshold(imageData);
  }

  // Put processed image data back
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

/**
 * Converts image to grayscale
 */
function applyGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Use luminance formula for perceptually accurate grayscale
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    data[i] = gray; // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha unchanged
  }

  return imageData;
}

/**
 * Inverts image colors
 */
function applyInvert(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    data[i] = 255 - r; // R
    data[i + 1] = 255 - g; // G
    data[i + 2] = 255 - b; // B
    // Alpha unchanged
  }

  return imageData;
}

/**
 * Applies binary thresholding
 */
function applyBinarize(imageData: ImageData, threshold: number): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Calculate grayscale value
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const value = gray > threshold ? 255 : 0;
    data[i] = value; // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
  }

  return imageData;
}

/**
 * Applies adaptive thresholding using local mean
 */
function applyAdaptiveThreshold(imageData: ImageData, blockSize: number = 11): ImageData {
  const { width, height, data } = imageData;
  const grayscale = new Uint8Array(width * height);

  // Convert to grayscale array
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    grayscale[idx] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  }

  // Calculate integral image for fast local mean
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += grayscale[y * width + x] ?? 0;
      const currIdx = (y + 1) * (width + 1) + (x + 1);
      const prevIdx = y * (width + 1) + (x + 1);
      integral[currIdx] = rowSum + (integral[prevIdx] ?? 0);
    }
  }

  // Apply adaptive threshold
  const halfBlock = Math.floor(blockSize / 2);
  const offset = 10; // Constant subtracted from mean

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate block bounds
      const x1 = Math.max(0, x - halfBlock);
      const y1 = Math.max(0, y - halfBlock);
      const x2 = Math.min(width - 1, x + halfBlock);
      const y2 = Math.min(height - 1, y + halfBlock);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      // Calculate sum using integral image
      const sum =
        (integral[(y2 + 1) * (width + 1) + (x2 + 1)] ?? 0) -
        (integral[(y2 + 1) * (width + 1) + x1] ?? 0) -
        (integral[y1 * (width + 1) + (x2 + 1)] ?? 0) +
        (integral[y1 * (width + 1) + x1] ?? 0);

      const mean = sum / count;
      const localThreshold = mean - offset;

      const idx = (y * width + x) * 4;
      const grayValue = grayscale[y * width + x] ?? 0;
      const value = grayValue > localThreshold ? 255 : 0;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }

  return imageData;
}

/**
 * Applies simple noise reduction using median filter
 */
function applyDenoise(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);
  const half = Math.floor(kernelSize / 2);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      const rValues: number[] = [];
      const gValues: number[] = [];
      const bValues: number[] = [];

      // Collect neighboring pixel values
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          rValues.push(data[idx] ?? 0);
          gValues.push(data[idx + 1] ?? 0);
          bValues.push(data[idx + 2] ?? 0);
        }
      }

      // Sort and get median
      rValues.sort((a, b) => a - b);
      gValues.sort((a, b) => a - b);
      bValues.sort((a, b) => a - b);

      const medianIdx = Math.floor(rValues.length / 2);
      const idx = (y * width + x) * 4;
      result[idx] = rValues[medianIdx] ?? 0;
      result[idx + 1] = gValues[medianIdx] ?? 0;
      result[idx + 2] = bValues[medianIdx] ?? 0;
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Renders a PDF page to canvas for OCR processing
 * @param page PDF.js page proxy
 * @param scale Render scale (higher = better OCR but slower)
 * @returns Canvas with rendered page
 */
export async function renderPageToCanvas(
  page: {
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (context: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  },
  scale: number = 2.0
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas;
}

/**
 * Calculates optimal scale for OCR based on image dimensions
 * Tesseract works best with images around 300 DPI
 * @param _width Image width (unused, for API consistency)
 * @param _height Image height (unused, for API consistency)
 * @param targetDPI Target DPI for OCR (default 300)
 */
export function calculateOptimalScale(
  _width: number,
  _height: number,
  targetDPI: number = 300
): number {
  // Assume source is 72 DPI (screen resolution)
  const sourceDPI = 72;
  return targetDPI / sourceDPI;
}

/**
 * Detects if an image is likely to benefit from inversion
 * (e.g., white text on dark background)
 */
export function shouldInvertImage(imageData: ImageData): boolean {
  const data = imageData.data;
  let darkPixels = 0;
  let lightPixels = 0;

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    if (gray < 128) {
      darkPixels++;
    } else {
      lightPixels++;
    }
  }

  // If more than 60% of pixels are dark, suggest inversion
  return darkPixels > lightPixels * 1.5;
}
