/**
 * Scan Preview Component
 *
 * Real-time scan preview with crop selection, rotation,
 * and enhancement options.
 */

import { useState, useRef, useCallback } from 'react';
import { useScannerStore } from '@stores/scannerStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface ScanPreviewProps {
  className?: string;
  onAccept?: (dataUrl: string) => void;
  onRescan?: () => void;
}

export function ScanPreview({ className, onAccept, onRescan }: ScanPreviewProps) {
  const { previewUrl, currentScanResult, isScanning } = useScannerStore();
  const imageRef = useRef<HTMLImageElement>(null);

  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);

  // Rotation handlers
  const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  // Reset all adjustments
  const resetAdjustments = () => {
    setRotation(0);
    setCrop(null);
  };

  // Handle crop start
  const handleCropStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCropStart({ x, y });
    setCrop(null);
  }, [isCropping]);

  // Handle crop move
  const handleCropMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCrop({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      width: Math.abs(x - cropStart.x),
      height: Math.abs(y - cropStart.y),
    });
  }, [isCropping, cropStart]);

  // Handle crop end
  const handleCropEnd = useCallback(() => {
    setCropStart(null);
  }, []);

  // Apply adjustments and accept
  const handleAccept = () => {
    if (previewUrl) {
      // In a real implementation, we'd apply rotation and crop
      // For now, just pass the original URL
      onAccept?.(previewUrl);
    }
  };

  if (isScanning) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Scanning...</p>
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-gray-400', className)}>
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No scan preview</p>
        <p className="text-sm">Scan a document to see preview</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={rotateLeft} title="Rotate left">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={rotateRight} title="Rotate right">
            <svg className="w-4 h-4 transform scale-x-[-1]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button
            variant={isCropping ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setIsCropping(!isCropping)}
            title="Crop"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAdjustments} title="Reset">
            Reset
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          {currentScanResult?.width}x{currentScanResult?.height} px
          {rotation !== 0 && ` (rotated ${rotation}deg)`}
        </div>
      </div>

      {/* Preview area */}
      <div
        className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900"
        onMouseDown={handleCropStart}
        onMouseMove={handleCropMove}
        onMouseUp={handleCropEnd}
        onMouseLeave={handleCropEnd}
      >
        <div className="relative inline-block mx-auto">
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Scan preview"
            className="max-w-full h-auto shadow-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              cursor: isCropping ? 'crosshair' : 'default',
            }}
            draggable={false}
          />

          {/* Crop overlay */}
          {crop && (
            <div
              className="absolute border-2 border-primary-500 bg-primary-500/20"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 dark:bg-gray-800">
        <Button variant="secondary" onClick={onRescan}>
          Rescan
        </Button>
        <Button variant="primary" onClick={handleAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

export default ScanPreview;
