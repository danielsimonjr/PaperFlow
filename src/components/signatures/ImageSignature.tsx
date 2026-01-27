import { useState, useCallback, useRef } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface ImageSignatureProps {
  onSignatureChange: (dataUrl: string | null) => void;
  isInitials?: boolean;
}

interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Component for uploading and processing signature images.
 * Supports background removal and auto-cropping.
 */
export function ImageSignature({ onSignatureChange, isInitials = false }: ImageSignatureProps) {
  const [preview, setPreview] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [autoCrop, setAutoCrop] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<File | null>(null);

  const maxWidth = isInitials ? 200 : 400;
  const maxHeight = isInitials ? 100 : 150;

  const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    return validTypes.includes(file.type);
  };

  const processImage = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);

      try {
        // Load image
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
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

        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Remove white background if enabled
        if (removeBackground) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const threshold = 240;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] ?? 0;
            const g = data[i + 1] ?? 0;
            const b = data[i + 2] ?? 0;

            // Check if pixel is white/light
            if (r > threshold && g > threshold && b > threshold) {
              data[i + 3] = 0; // Make transparent
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Auto-crop if enabled
        let finalCanvas = canvas;
        let finalWidth = width;
        let finalHeight = height;

        if (autoCrop) {
          const imageData = ctx.getImageData(0, 0, width, height);
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

          if (hasContent) {
            const padding = 5;
            left = Math.max(0, left - padding);
            top = Math.max(0, top - padding);
            right = Math.min(width - 1, right + padding);
            bottom = Math.min(height - 1, bottom + padding);

            finalWidth = right - left + 1;
            finalHeight = bottom - top + 1;

            finalCanvas = document.createElement('canvas');
            finalCanvas.width = finalWidth;
            finalCanvas.height = finalHeight;

            const finalCtx = finalCanvas.getContext('2d');
            if (finalCtx) {
              finalCtx.putImageData(ctx.getImageData(left, top, finalWidth, finalHeight), 0, 0);
            }
          }
        }

        const dataUrl = finalCanvas.toDataURL('image/png');
        setPreview({ dataUrl, width: finalWidth, height: finalHeight });
        onSignatureChange(dataUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process image');
        onSignatureChange(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [maxWidth, maxHeight, removeBackground, autoCrop, onSignatureChange]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!isValidImageFile(file)) {
        setError('Please upload a PNG, JPG, or SVG file');
        return;
      }

      originalFileRef.current = file;
      await processImage(file);
    },
    [processImage]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!isValidImageFile(file)) {
        setError('Please upload a PNG, JPG, or SVG file');
        return;
      }

      originalFileRef.current = file;
      await processImage(file);
    },
    [processImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    originalFileRef.current = null;
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onSignatureChange]);

  const handleReprocess = useCallback(async () => {
    const file = originalFileRef.current;
    if (file) {
      await processImage(file);
    }
  }, [processImage]);

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-primary-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-primary-500 dark:hover:bg-gray-700"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing ? (
              <RefreshCw size={32} className="animate-spin text-primary-500" />
            ) : (
              <Upload size={32} className="text-gray-400" />
            )}
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isProcessing ? 'Processing...' : 'Click or drag to upload signature image'}
            </p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG, or SVG</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={handleClear}
              className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              title="Remove"
            >
              <X size={16} />
            </button>

            <div className="mb-2 text-xs text-gray-500">Preview</div>
            <div className="flex items-center justify-center">
              <img
                src={preview.dataUrl}
                alt="Signature preview"
                className="max-h-32 max-w-full object-contain"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                }}
              />
            </div>
            <div className="mt-2 text-center text-xs text-gray-400">
              {preview.width} x {preview.height} px
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleClear}>
            Choose different image
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Processing options */}
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(e) => {
              setRemoveBackground(e.target.checked);
              if (originalFileRef.current) {
                handleReprocess();
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Remove white background</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoCrop}
            onChange={(e) => {
              setAutoCrop(e.target.checked);
              if (originalFileRef.current) {
                handleReprocess();
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Auto-crop to signature bounds</span>
        </label>
      </div>
    </div>
  );
}
