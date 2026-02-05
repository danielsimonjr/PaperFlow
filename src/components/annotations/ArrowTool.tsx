import { useCallback, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface ArrowToolProps {
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
  /** Whether arrow tool is active */
  isActive: boolean;
}

interface DragState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Arrow drawing tool with Shift key constraint for 45° angle increments.
 */
export function ArrowTool({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
}: ArrowToolProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Calculate arrow endpoints with optional angle constraint
  const calculateEndpoint = useCallback(
    (state: DragState, constrainAngle: boolean) => {
      let endX = state.endX;
      let endY = state.endY;

      if (constrainAngle) {
        const dx = state.endX - state.startX;
        const dy = state.endY - state.startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);

        // Snap to 45° increments (0, 45, 90, 135, 180, 225, 270, 315)
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

        endX = state.startX + length * Math.cos(snappedAngle);
        endY = state.startY + length * Math.sin(snappedAngle);
      }

      return { endX, endY };
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
        startX: x,
        startY: y,
        endX: x,
        endY: y,
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
        prev ? { ...prev, endX: x, endY: y } : null
      );
      setIsShiftPressed(e.shiftKey);
    },
    [isDragging, dragState]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragState) return;

      const { endX, endY } = calculateEndpoint(dragState, e.shiftKey);
      const length = Math.sqrt(
        (endX - dragState.startX) ** 2 + (endY - dragState.startY) ** 2
      );

      // Only create annotation if it has meaningful length
      if (length > 10) {
        // Calculate bounding box
        const minX = Math.min(dragState.startX, endX);
        const minY = Math.min(dragState.startY, endY);
        const maxX = Math.max(dragState.startX, endX);
        const maxY = Math.max(dragState.startY, endY);

        // Convert to PDF coordinates
        const bounds = {
          x: minX / scale,
          y: pageHeight - maxY / scale,
          width: (maxX - minX) / scale,
          height: (maxY - minY) / scale,
        };

        addAnnotation({
          type: 'shape',
          pageIndex,
          rects: [],
          color: activeColor,
          opacity: 1,
          shapeType: 'arrow',
          bounds,
          strokeWidth: activeStrokeWidth,
          // Store arrow direction info
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

  // Calculate arrowhead points
  const renderArrowhead = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const angle = Math.atan2(endY - startY, endX - startX);
    const headSize = Math.min(15, Math.max(8, activeStrokeWidth * 3));

    const point1X = endX - headSize * Math.cos(angle - Math.PI / 6);
    const point1Y = endY - headSize * Math.sin(angle - Math.PI / 6);
    const point2X = endX - headSize * Math.cos(angle + Math.PI / 6);
    const point2Y = endY - headSize * Math.sin(angle + Math.PI / 6);

    return `${endX},${endY} ${point1X},${point1Y} ${point2X},${point2Y}`;
  };

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
      tabIndex={0}
    >
      {/* Preview arrow while dragging */}
      {dragState && previewEnd && (
        <g opacity={0.7}>
          <line
            x1={dragState.startX}
            y1={dragState.startY}
            x2={previewEnd.endX}
            y2={previewEnd.endY}
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            strokeDasharray="4 2"
          />
          <polygon
            points={renderArrowhead(
              dragState.startX,
              dragState.startY,
              previewEnd.endX,
              previewEnd.endY
            )}
            fill={activeColor}
          />
        </g>
      )}
    </svg>
  );
}
