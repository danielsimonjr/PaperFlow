import { useCallback, useRef, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface EraserToolProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current zoom scale */
  scale: number;
  /** Whether eraser mode is active */
  isActive: boolean;
}

/**
 * Eraser tool that removes drawing strokes on contact.
 */
export function EraserTool({
  pageIndex,
  width,
  height,
  scale,
  isActive,
}: EraserToolProps) {
  const [isErasing, setIsErasing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const eraserSize = 20; // Eraser cursor size in pixels
  const containerRef = useRef<HTMLDivElement>(null);

  const annotations = useAnnotationStore((state) => state.annotations);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  // Check if point is near any drawing annotation
  const findAnnotationAtPoint = useCallback(
    (x: number, y: number) => {
      const pdfX = x / scale;
      const pdfY = y / scale;
      const threshold = eraserSize / scale;

      return annotations.find((annotation) => {
        if (annotation.type !== 'drawing' || annotation.pageIndex !== pageIndex) {
          return false;
        }

        // Check if eraser position is close to any point in the drawing paths
        const drawingAnnotation = annotation as { paths?: { points: { x: number; y: number }[] }[] };
        return drawingAnnotation.paths?.some((path) =>
          path.points.some((point) => {
            const dx = point.x - pdfX;
            const dy = point.y - pdfY;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
          })
        );
      });
    },
    [annotations, pageIndex, scale, eraserSize]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsErasing(true);
      setCursorPosition({ x, y });

      // Check for annotation at point and erase
      const annotation = findAnnotationAtPoint(x, y);
      if (annotation) {
        deleteAnnotation(annotation.id);
      }

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isActive, findAnnotationAtPoint, deleteAnnotation]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCursorPosition({ x, y });

      if (isErasing) {
        const annotation = findAnnotationAtPoint(x, y);
        if (annotation) {
          deleteAnnotation(annotation.id);
        }
      }
    },
    [isErasing, findAnnotationAtPoint, deleteAnnotation]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsErasing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    setCursorPosition(null);
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-0 touch-none"
      style={{
        width,
        height,
        cursor: 'none', // Hide default cursor, show custom eraser cursor
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {/* Custom eraser cursor */}
      {cursorPosition && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-gray-500 bg-white/50"
          style={{
            width: eraserSize,
            height: eraserSize,
            left: cursorPosition.x - eraserSize / 2,
            top: cursorPosition.y - eraserSize / 2,
            transition: isErasing ? 'none' : 'transform 0.05s ease-out',
          }}
        />
      )}
    </div>
  );
}
