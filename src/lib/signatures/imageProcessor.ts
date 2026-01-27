/**
 * Image processing utilities for signature images.
 * Handles background removal, auto-cropping, and format conversion.
 */

interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
}

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  removeBackground?: boolean;
  autoCrop?: boolean;
  threshold?: number;
}

const DEFAULT_OPTIONS: Required<ProcessImageOptions> = {
  maxWidth: 400,
  maxHeight: 150,
  removeBackground: true,
  autoCrop: true,
  threshold: 240,
};

/**
 * Load an image from a File object
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    image.src = url;
  });
}

/**
 * Load an image from a data URL
 */
export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image from data URL'));

    image.src = dataUrl;
  });
}

/**
 * Remove white/light background from image data
 */
export function removeWhiteBackground(imageData: ImageData, threshold: number = 240): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;

    // Check if pixel is white/light
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0; // Make transparent
    }
  }

  return imageData;
}

/**
 * Find content bounds in image (non-transparent pixels)
 */
export function findContentBounds(
  imageData: ImageData,
  width: number,
  height: number
): { left: number; top: number; right: number; bottom: number } | null {
  const data = imageData.data;

  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] ?? 0;

      if (a > 10) {
        hasContent = true;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (!hasContent) return null;

  return { left, top, right, bottom };
}

/**
 * Crop image to content bounds with optional padding
 */
export function cropToContent(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  bounds: { left: number; top: number; right: number; bottom: number },
  padding: number = 5
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const left = Math.max(0, bounds.left - padding);
  const top = Math.max(0, bounds.top - padding);
  const right = Math.min(imageData.width - 1, bounds.right + padding);
  const bottom = Math.min(imageData.height - 1, bounds.bottom + padding);

  const width = right - left + 1;
  const height = bottom - top + 1;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = width;
  croppedCanvas.height = height;

  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx) {
    croppedCtx.putImageData(ctx.getImageData(left, top, width, height), 0, 0);
  }

  return { canvas: croppedCanvas, width, height };
}

/**
 * Process a signature image with background removal and auto-cropping
 */
export async function processSignatureImage(file: File, options: ProcessImageOptions = {}): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const img = await loadImage(file);

  // Create canvas
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;

  // Scale down if needed
  const scale = Math.min(1, opts.maxWidth / width, opts.maxHeight / height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Get image data
  let imageData = ctx.getImageData(0, 0, width, height);

  // Remove white background if enabled
  if (opts.removeBackground) {
    imageData = removeWhiteBackground(imageData, opts.threshold);
    ctx.putImageData(imageData, 0, 0);
  }

  // Auto-crop if enabled
  let finalCanvas = canvas;
  let finalWidth = width;
  let finalHeight = height;

  if (opts.autoCrop) {
    const bounds = findContentBounds(imageData, width, height);

    if (bounds) {
      const cropped = cropToContent(ctx, imageData, bounds);
      finalCanvas = cropped.canvas;
      finalWidth = cropped.width;
      finalHeight = cropped.height;
    }
  }

  return {
    dataUrl: finalCanvas.toDataURL('image/png'),
    width: finalWidth,
    height: finalHeight,
  };
}

/**
 * Validate image file type
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  return validTypes.includes(file.type);
}

/**
 * Convert canvas to Blob for storage
 */
export async function canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/:(.*?);/);
  const mimeType = mimeMatch?.[1] ?? 'image/png';
  const binary = atob(base64 ?? '');
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mimeType });
}

/**
 * Convert Blob to data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}
