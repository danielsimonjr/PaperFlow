import { useState, useCallback, useRef, useEffect } from 'react';
import { useSignatureStore, type PlacedSignature } from '@stores/signatureStore';

interface SignatureResizeProps {
  signature: PlacedSignature;
  scale: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

const MIN_SIZE = 30;
const HANDLE_SIZE = 10;

/**
 * Component for displaying and resizing placed signatures.
 * Maintains aspect ratio during resize.
 */
export function SignatureResize({ signature, scale }: SignatureResizeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const startPosRef = useRef<{ x: number; y: number; sigX: number; sigY: number; width: number; height: number } | null>(null);

  const selectedPlacedId = useSignatureStore((state) => state.selectedPlacedId);
  const selectPlacedSignature = useSignatureStore((state) => state.selectPlacedSignature);
  const updatePlacedSignature = useSignatureStore((state) => state.updatePlacedSignature);
  const deletePlacedSignature = useSignatureStore((state) => state.deletePlacedSignature);

  const isSelected = selectedPlacedId === signature.id;
  const aspectRatio = signature.size.width / signature.size.height;

  // Handle selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      selectPlacedSignature(signature.id);

      setIsDragging(true);
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        sigX: signature.position.x,
        sigY: signature.position.y,
        width: signature.size.width,
        height: signature.size.height,
      };
    },
    [signature, selectPlacedSignature]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeHandle(handle);
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        sigX: signature.position.x,
        sigY: signature.position.y,
        width: signature.size.width,
        height: signature.size.height,
      };
    },
    [signature]
  );

  // Handle mouse move for drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPosRef.current) return;

      const deltaX = (e.clientX - startPosRef.current.x) / scale;
      const deltaY = (e.clientY - startPosRef.current.y) / scale;

      if (isDragging) {
        // Move signature
        updatePlacedSignature(signature.id, {
          position: {
            x: startPosRef.current.sigX + deltaX,
            y: startPosRef.current.sigY + deltaY,
          },
        });
      } else if (isResizing && resizeHandle) {
        // Resize signature
        let newWidth = startPosRef.current.width;
        let newHeight = startPosRef.current.height;
        let newX = startPosRef.current.sigX;
        let newY = startPosRef.current.sigY;

        // Calculate new size based on handle
        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(MIN_SIZE, startPosRef.current.width + deltaX);
            newHeight = newWidth / aspectRatio;
            break;
          case 'sw':
            newWidth = Math.max(MIN_SIZE, startPosRef.current.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = startPosRef.current.sigX + (startPosRef.current.width - newWidth);
            break;
          case 'ne':
            newWidth = Math.max(MIN_SIZE, startPosRef.current.width + deltaX);
            newHeight = newWidth / aspectRatio;
            newY = startPosRef.current.sigY + (startPosRef.current.height - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(MIN_SIZE, startPosRef.current.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = startPosRef.current.sigX + (startPosRef.current.width - newWidth);
            newY = startPosRef.current.sigY + (startPosRef.current.height - newHeight);
            break;
        }

        updatePlacedSignature(signature.id, {
          position: { x: newX, y: newY },
          size: { width: newWidth, height: newHeight },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      startPosRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, signature.id, scale, aspectRatio, updatePlacedSignature]);

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
        deletePlacedSignature(signature.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, signature.id, deletePlacedSignature]);

  // Calculate scaled position and size
  const x = signature.position.x * scale;
  const y = signature.position.y * scale;
  const width = signature.size.width * scale;
  const height = signature.size.height * scale;

  return (
    <div
      className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: signature.rotation ? `rotate(${signature.rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Signature image */}
      <img src={signature.signatureData} alt="Signature" className="pointer-events-none h-full w-full object-contain" draggable={false} />

      {/* Selection border */}
      {isSelected && <div className="absolute inset-0 rounded border-2 border-primary-500" />}

      {/* Resize handles */}
      {isSelected && (
        <>
          {/* NW */}
          <div
            className="absolute -left-1 -top-1 cursor-nw-resize rounded-sm bg-white shadow"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, border: '2px solid #3B82F6' }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          {/* NE */}
          <div
            className="absolute -right-1 -top-1 cursor-ne-resize rounded-sm bg-white shadow"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, border: '2px solid #3B82F6' }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          {/* SW */}
          <div
            className="absolute -bottom-1 -left-1 cursor-sw-resize rounded-sm bg-white shadow"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, border: '2px solid #3B82F6' }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          {/* SE */}
          <div
            className="absolute -bottom-1 -right-1 cursor-se-resize rounded-sm bg-white shadow"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, border: '2px solid #3B82F6' }}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}
    </div>
  );
}
