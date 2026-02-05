import { useCallback, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface EllipseToolProps {
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
  /** Whether ellipse tool is active */
  isActive: boolean;
}

interface DragState {
  centerX: number;
  centerY: number;
  currentX: number;
  currentY: number;
}

/**
 * Ellipse/Circle drawing tool with Shift key constraint for circles.
 * Draws from center point outward.
 */
export function EllipseTool({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
}: EllipseToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const activeFillColor = useAnnotationStore((state) => state.activeFillColor);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Calculate ellipse dimensions from drag state
  const calculateEllipse = useCallback(
    (state: DragState, constrainCircle: boolean) => {
      let rx = Math.abs(state.currentX - state.centerX);
      let ry = Math.abs(state.currentY - state.centerY);

      if (constrainCircle) {
        const radius = Math.max(rx, ry);
        rx = radius;
        ry = radius;
      }

      return {
        cx: state.centerX,
        cy: state.centerY,
        rx,
        ry,
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

      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragState({
        centerX: x,
        centerY: y,
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

      const ellipse = calculateEllipse(dragState, e.shiftKey);

      // Only create annotation if it has meaningful size
      if (ellipse.rx > 3 && ellipse.ry > 3) {
        // Convert to PDF bounds (bounding box of ellipse)
        const bounds = {
          x: (ellipse.cx - ellipse.rx) / scale,
          y: pageHeight - (ellipse.cy + ellipse.ry) / scale,
          width: (ellipse.rx * 2) / scale,
          height: (ellipse.ry * 2) / scale,
        };

        addAnnotation({
          type: 'shape',
          pageIndex,
          rects: [],
          color: activeColor,
          opacity: 1,
          shapeType: 'ellipse',
          bounds,
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
      calculateEllipse,
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

  const previewEllipse = dragState
    ? calculateEllipse(dragState, isShiftPressed)
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
      {/* Preview ellipse while dragging */}
      {previewEllipse && (
        <ellipse
          cx={previewEllipse.cx}
          cy={previewEllipse.cy}
          rx={previewEllipse.rx}
          ry={previewEllipse.ry}
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
