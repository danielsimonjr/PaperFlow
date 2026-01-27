import { useState, useCallback, useEffect, useRef } from 'react';
import { useSignatureStore } from '@stores/signatureStore';

interface SignaturePlacerProps {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
}

/**
 * Overlay component for placing signatures on a PDF page.
 * Shows signature preview following cursor and places on click.
 */
export function SignaturePlacer({ pageIndex, pageWidth, pageHeight, scale }: SignaturePlacerProps) {
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlacingSignature = useSignatureStore((state) => state.isPlacingSignature);
  const signatureToPlace = useSignatureStore((state) => state.signatureToPlace);
  const placeSignature = useSignatureStore((state) => state.placeSignature);
  const cancelPlacing = useSignatureStore((state) => state.cancelPlacing);

  // Default signature size
  const signatureWidth = 150;
  const signatureHeight = 50;

  // Handle mouse move to update cursor position
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      setCursorPosition({ x, y });
    },
    [scale]
  );

  // Handle click to place signature
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!signatureToPlace || !cursorPosition) return;

      e.preventDefault();
      e.stopPropagation();

      // Calculate position (center signature on cursor)
      const x = cursorPosition.x - signatureWidth / 2;
      const y = cursorPosition.y - signatureHeight / 2;

      // Clamp to page bounds
      const clampedX = Math.max(0, Math.min(pageWidth - signatureWidth, x));
      const clampedY = Math.max(0, Math.min(pageHeight - signatureHeight, y));

      placeSignature(signatureToPlace, pageIndex, { x: clampedX, y: clampedY }, { width: signatureWidth, height: signatureHeight });
    },
    [signatureToPlace, cursorPosition, pageWidth, pageHeight, pageIndex, placeSignature]
  );

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlacingSignature) {
        cancelPlacing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlacingSignature, cancelPlacing]);

  if (!isPlacingSignature || !signatureToPlace) {
    return null;
  }

  // Calculate preview position
  const previewX = cursorPosition ? (cursorPosition.x - signatureWidth / 2) * scale : 0;
  const previewY = cursorPosition ? (cursorPosition.y - signatureHeight / 2) * scale : 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 cursor-crosshair"
      style={{ width: pageWidth * scale, height: pageHeight * scale }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Signature preview following cursor */}
      {cursorPosition && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: previewX,
            top: previewY,
            width: signatureWidth * scale,
            height: signatureHeight * scale,
          }}
        >
          <img
            src={signatureToPlace.data}
            alt="Signature preview"
            className="h-full w-full object-contain opacity-70"
          />
          <div className="absolute inset-0 rounded border-2 border-dashed border-primary-500" />
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-2 text-sm text-white">
        Click to place • Escape to cancel
      </div>
    </div>
  );
}
