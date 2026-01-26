import { useCallback, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface LineToolProps {
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
  /** Whether line tool is active */
  isActive: boolean;
}

interface DragState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Line drawing tool with Shift key constraint for 45° angle increments.
 */
export function LineTool({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
}: LineToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Calculate line endpoint with optional angle constraint
  const calculateEndpoint = useCallback(
    (state: DragState, constrainAngle: boolean) => {
      let endX = state.endX;
      let endY = state.endY;

      if (constrainAngle) {
        const dx = state.endX - state.startX;
        const dy = state.endY - state.startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);

        // Snap to 45° increments
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

        endX = state.startX + length * Math.cos(snappedAngle);
        endY = state.startY + length * Math.sin(snappedAngle);
      }

      return { endX, endY };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragState({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
      setIsShiftPressed(e.shiftKey);
    },
    [isActive]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragState) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragState((prev) =>
        prev ? { ...prev, endX: x, endY: y } : null
      );
      setIsShiftPressed(e.shiftKey);
    },
    [isDragging, dragState]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragState) return;

      const { endX, endY } = calculateEndpoint(dragState, e.shiftKey);
      const length = Math.sqrt(
        (endX - dragState.startX) ** 2 + (endY - dragState.startY) ** 2
      );

      // Only create annotation if it has meaningful length
      if (length > 5) {
        // Calculate bounding box
        const minX = Math.min(dragState.startX, endX);
        const minY = Math.min(dragState.startY, endY);
        const maxX = Math.max(dragState.startX, endX);
        const maxY = Math.max(dragState.startY, endY);

        // Convert to PDF coordinates
        const bounds = {
          x: minX / scale,
          y: pageHeight - maxY / scale,
          width: Math.max((maxX - minX) / scale, 1), // Ensure non-zero width
          height: Math.max((maxY - minY) / scale, 1), // Ensure non-zero height
        };

        addAnnotation({
          type: 'shape',
          pageIndex,
          rects: [],
          color: activeColor,
          opacity: 1,
          shapeType: 'line',
          bounds,
          strokeWidth: activeStrokeWidth,
          // Store line endpoints
          startPoint: {
            x: dragState.startX / scale,
            y: pageHeight - dragState.startY / scale,
          },
          endPoint: {
            x: endX / scale,
            y: pageHeight - endY / scale,
          },
        });
      }

      setIsDragging(false);
      setDragState(null);
    },
    [
      isDragging,
      dragState,
      calculateEndpoint,
      scale,
      pageHeight,
      pageIndex,
      activeColor,
      activeStrokeWidth,
      addAnnotation,
    ]
  );

  if (!isActive) {
    return null;
  }

  const previewEnd = dragState
    ? calculateEndpoint(dragState, isShiftPressed)
    : null;

  return (
    <svg
      className="absolute left-0 top-0 cursor-crosshair"
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      tabIndex={0}
    >
      {/* Preview line while dragging */}
      {dragState && previewEnd && (
        <line
          x1={dragState.startX}
          y1={dragState.startY}
          x2={previewEnd.endX}
          y2={previewEnd.endY}
          stroke={activeColor}
          strokeWidth={activeStrokeWidth}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}
    </svg>
  );
}
