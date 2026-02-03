/**
 * Crop Tool Component
 *
 * Interactive crop tool with handles and aspect ratio constraints.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@utils/cn';

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropToolProps {
  imageUrl: string;
  initialCrop?: CropRegion;
  aspectRatio?: number;
  minSize?: number;
  onCropChange?: (crop: CropRegion) => void;
  onCropComplete?: (crop: CropRegion) => void;
  className?: string;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export function CropTool({
  imageUrl,
  initialCrop,
  aspectRatio,
  minSize = 50,
  onCropChange,
  onCropComplete,
  className,
}: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<CropRegion>(
    initialCrop || { x: 10, y: 10, width: 80, height: 80 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<HandlePosition | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropRegion | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
      setCropStart({ ...crop });
    },
    [crop]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragHandle || !cropStart || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newCrop = { ...cropStart };
      const minSizePercent = (minSize / rect.width) * 100;

      switch (dragHandle) {
        case 'move':
          newCrop.x = Math.max(0, Math.min(100 - cropStart.width, cropStart.x + deltaX));
          newCrop.y = Math.max(0, Math.min(100 - cropStart.height, cropStart.y + deltaY));
          break;

        case 'nw':
          newCrop.x = Math.max(0, cropStart.x + deltaX);
          newCrop.y = Math.max(0, cropStart.y + deltaY);
          newCrop.width = Math.max(minSizePercent, cropStart.width - deltaX);
          newCrop.height = Math.max(minSizePercent, cropStart.height - deltaY);
          break;

        case 'ne':
          newCrop.y = Math.max(0, cropStart.y + deltaY);
          newCrop.width = Math.max(minSizePercent, cropStart.width + deltaX);
          newCrop.height = Math.max(minSizePercent, cropStart.height - deltaY);
          break;

        case 'se':
          newCrop.width = Math.max(minSizePercent, cropStart.width + deltaX);
          newCrop.height = Math.max(minSizePercent, cropStart.height + deltaY);
          break;

        case 'sw':
          newCrop.x = Math.max(0, cropStart.x + deltaX);
          newCrop.width = Math.max(minSizePercent, cropStart.width - deltaX);
          newCrop.height = Math.max(minSizePercent, cropStart.height + deltaY);
          break;

        case 'n':
          newCrop.y = Math.max(0, cropStart.y + deltaY);
          newCrop.height = Math.max(minSizePercent, cropStart.height - deltaY);
          break;

        case 's':
          newCrop.height = Math.max(minSizePercent, cropStart.height + deltaY);
          break;

        case 'e':
          newCrop.width = Math.max(minSizePercent, cropStart.width + deltaX);
          break;

        case 'w':
          newCrop.x = Math.max(0, cropStart.x + deltaX);
          newCrop.width = Math.max(minSizePercent, cropStart.width - deltaX);
          break;
      }

      // Apply aspect ratio constraint
      if (aspectRatio && dragHandle !== 'move') {
        const currentRatio = newCrop.width / newCrop.height;
        if (currentRatio > aspectRatio) {
          newCrop.width = newCrop.height * aspectRatio;
        } else {
          newCrop.height = newCrop.width / aspectRatio;
        }
      }

      // Constrain to bounds
      newCrop.width = Math.min(newCrop.width, 100 - newCrop.x);
      newCrop.height = Math.min(newCrop.height, 100 - newCrop.y);

      setCrop(newCrop);
      onCropChange?.(newCrop);
    },
    [isDragging, dragHandle, cropStart, dragStart, minSize, aspectRatio, onCropChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragHandle(null);
      onCropComplete?.(crop);
    }
  }, [isDragging, crop, onCropComplete]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStyle = 'w-3 h-3 bg-white border-2 border-primary-500 rounded-full absolute transform';

  return (
    <div ref={containerRef} className={cn('relative select-none', className)}>
      {/* Image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Crop preview"
        className="w-full h-auto"
        draggable={false}
      />

      {/* Darkened overlay outside crop */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top */}
        <div
          className="absolute bg-black/50"
          style={{
            left: 0,
            top: 0,
            right: 0,
            height: `${crop.y}%`,
          }}
        />
        {/* Bottom */}
        <div
          className="absolute bg-black/50"
          style={{
            left: 0,
            top: `${crop.y + crop.height}%`,
            right: 0,
            bottom: 0,
          }}
        />
        {/* Left */}
        <div
          className="absolute bg-black/50"
          style={{
            left: 0,
            top: `${crop.y}%`,
            width: `${crop.x}%`,
            height: `${crop.height}%`,
          }}
        />
        {/* Right */}
        <div
          className="absolute bg-black/50"
          style={{
            left: `${crop.x + crop.width}%`,
            top: `${crop.y}%`,
            right: 0,
            height: `${crop.height}%`,
          }}
        />
      </div>

      {/* Crop box */}
      <div
        className="absolute border-2 border-primary-500"
        style={{
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
          cursor: isDragging && dragHandle === 'move' ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Grid lines (rule of thirds) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Resize handles */}
        {/* Corners */}
        <div
          className={cn(handleStyle, '-left-1.5 -top-1.5 cursor-nw-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
          className={cn(handleStyle, '-right-1.5 -top-1.5 cursor-ne-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className={cn(handleStyle, '-right-1.5 -bottom-1.5 cursor-se-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />
        <div
          className={cn(handleStyle, '-left-1.5 -bottom-1.5 cursor-sw-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />

        {/* Edges */}
        <div
          className={cn(handleStyle, 'left-1/2 -translate-x-1/2 -top-1.5 cursor-n-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className={cn(handleStyle, 'left-1/2 -translate-x-1/2 -bottom-1.5 cursor-s-resize')}
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
        <div
          className={cn(handleStyle, '-left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
        <div
          className={cn(handleStyle, '-right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize')}
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />
      </div>

      {/* Dimensions display */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {Math.round(crop.width)}% x {Math.round(crop.height)}%
      </div>
    </div>
  );
}

export default CropTool;
