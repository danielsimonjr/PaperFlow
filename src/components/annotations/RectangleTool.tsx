import { useCallback, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface RectangleToolProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current zoom scale */
  scale: number;
  /** Page height in PDF points */
  pageHeight: number;
  /** Whether rectangle tool is active */
  isActive: boolean;
}

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Rectangle drawing tool with Shift key constraint for squares.
 */
export function RectangleTool({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
}: RectangleToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const activeFillColor = useAnnotationStore((state) => state.activeFillColor);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Calculate rectangle bounds from drag state
  const calculateBounds = useCallback(
    (state: DragState, constrainSquare: boolean) => {
      let rectWidth = state.currentX - state.startX;
      let rectHeight = state.currentY - state.startY;

      if (constrainSquare) {
        const size = Math.max(Math.abs(rectWidth), Math.abs(rectHeight));
        rectWidth = rectWidth >= 0 ? size : -size;
        rectHeight = rectHeight >= 0 ? size : -size;
      }

      const x = rectWidth >= 0 ? state.startX : state.startX + rectWidth;
      const y = rectHeight >= 0 ? state.startY : state.startY + rectHeight;

      return {
        x,
        y,
        width: Math.abs(rectWidth),
        height: Math.abs(rectHeight),
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Capture pointer for reliable drag tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragState({
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      setIsShiftPressed(e.shiftKey);
    },
    [isActive]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragState) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragState((prev) =>
        prev ? { ...prev, currentX: x, currentY: y } : null
      );
      setIsShiftPressed(e.shiftKey);
    },
    [isDragging, dragState]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragState) return;

      const bounds = calculateBounds(dragState, e.shiftKey);

      // Only create annotation if it has meaningful size
      if (bounds.width > 5 && bounds.height > 5) {
        // Convert to PDF coordinates
        const pdfBounds = {
          x: bounds.x / scale,
          y: pageHeight - (bounds.y + bounds.height) / scale,
          width: bounds.width / scale,
          height: bounds.height / scale,
        };

        addAnnotation({
          type: 'shape',
          pageIndex,
          rects: [],
          color: activeColor,
          opacity: 1,
          shapeType: 'rectangle',
          bounds: pdfBounds,
          strokeWidth: activeStrokeWidth,
          fillColor: activeFillColor,
        });
      }

      setIsDragging(false);
      setDragState(null);
    },
    [
      isDragging,
      dragState,
      calculateBounds,
      scale,
      pageHeight,
      pageIndex,
      activeColor,
      activeStrokeWidth,
      activeFillColor,
      addAnnotation,
    ]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  }, []);

  if (!isActive) {
    return null;
  }

  const previewBounds = dragState
    ? calculateBounds(dragState, isShiftPressed)
    : null;

  return (
    <svg
      className="absolute left-0 top-0 cursor-crosshair touch-none"
      style={{ zIndex: 20 }}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
    >
      {/* Preview rectangle while dragging */}
      {previewBounds && (
        <rect
          x={previewBounds.x}
          y={previewBounds.y}
          width={previewBounds.width}
          height={previewBounds.height}
          fill={activeFillColor || 'none'}
          stroke={activeColor}
          strokeWidth={activeStrokeWidth}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}
    </svg>
  );
}
