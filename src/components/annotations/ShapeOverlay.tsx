import { useCallback, useMemo } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import type { Annotation, AnnotationRect } from '@/types';
import { ResizeHandles } from './ResizeHandles';
import { RotationHandle } from './RotationHandle';

interface ShapeOverlayProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Overlay width in pixels */
  width: number;
  /** Overlay height in pixels */
  height: number;
  /** Current zoom scale */
  scale: number;
  /** Page height in PDF points for coordinate conversion */
  pageHeight: number;
}

interface ShapeAnnotation extends Annotation {
  shapeType: 'rectangle' | 'ellipse' | 'arrow' | 'line';
  bounds: AnnotationRect;
  strokeWidth: number;
  fillColor?: string;
  rotation?: number;
}

/**
 * SVG overlay for rendering shape annotations (rectangles, ellipses, arrows, lines).
 */
export function ShapeOverlay({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
}: ShapeOverlayProps) {
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  // Filter shape annotations for this page
  const shapeAnnotations = useMemo(() => {
    return annotations.filter(
      (a) => a.type === 'shape' && a.pageIndex === pageIndex
    ) as ShapeAnnotation[];
  }, [annotations, pageIndex]);

  // Convert PDF coordinates to screen coordinates
  const pdfToScreen = useCallback(
    (pdfX: number, pdfY: number) => {
      return {
        x: pdfX * scale,
        y: (pageHeight - pdfY) * scale,
      };
    },
    [scale, pageHeight]
  );

  // Handle shape selection
  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectAnnotation(id);
    },
    [selectAnnotation]
  );

  // Handle resize
  const handleResize = useCallback(
    (id: string, newBounds: AnnotationRect) => {
      updateAnnotation(id, { bounds: newBounds } as Partial<Annotation>);
    },
    [updateAnnotation]
  );

  // Handle rotation
  const handleRotate = useCallback(
    (id: string, rotation: number) => {
      updateAnnotation(id, { rotation } as Partial<Annotation>);
    },
    [updateAnnotation]
  );

  // Render individual shape
  const renderShape = useCallback(
    (shape: ShapeAnnotation) => {
      const isSelected = shape.id === selectedId;
      const bounds = shape.bounds;
      const topLeft = pdfToScreen(bounds.x, bounds.y + bounds.height);
      const screenWidth = bounds.width * scale;
      const screenHeight = bounds.height * scale;

      const rotation = shape.rotation || 0;
      const centerX = topLeft.x + screenWidth / 2;
      const centerY = topLeft.y + screenHeight / 2;

      const transform = rotation
        ? `rotate(${rotation} ${centerX} ${centerY})`
        : undefined;

      const commonProps = {
        stroke: shape.color,
        strokeWidth: shape.strokeWidth,
        fill: shape.fillColor || 'none',
        opacity: shape.opacity,
        cursor: 'pointer',
        onClick: (e: React.MouseEvent) => handleSelect(shape.id, e),
      };

      let shapeElement: React.ReactNode;

      switch (shape.shapeType) {
        case 'rectangle':
          shapeElement = (
            <rect
              x={topLeft.x}
              y={topLeft.y}
              width={screenWidth}
              height={screenHeight}
              transform={transform}
              {...commonProps}
            />
          );
          break;

        case 'ellipse':
          shapeElement = (
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={screenWidth / 2}
              ry={screenHeight / 2}
              transform={transform}
              {...commonProps}
            />
          );
          break;

        case 'arrow': {
          // Arrow from top-left to bottom-right of bounds
          const arrowEnd = { x: topLeft.x + screenWidth, y: topLeft.y + screenHeight };
          const arrowHeadSize = Math.min(15, screenWidth / 4, screenHeight / 4);
          const angle = Math.atan2(screenHeight, screenWidth);

          shapeElement = (
            <g transform={transform}>
              <line
                x1={topLeft.x}
                y1={topLeft.y}
                x2={arrowEnd.x}
                y2={arrowEnd.y}
                {...commonProps}
              />
              {/* Arrowhead */}
              <polygon
                points={`
                  ${arrowEnd.x},${arrowEnd.y}
                  ${arrowEnd.x - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${arrowEnd.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)}
                  ${arrowEnd.x - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${arrowEnd.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)}
                `}
                fill={shape.color}
                stroke="none"
              />
            </g>
          );
          break;
        }

        case 'line':
          shapeElement = (
            <line
              x1={topLeft.x}
              y1={topLeft.y}
              x2={topLeft.x + screenWidth}
              y2={topLeft.y + screenHeight}
              transform={transform}
              {...commonProps}
              fill="none"
            />
          );
          break;

        default:
          return null;
      }

      return (
        <g key={shape.id}>
          {shapeElement}

          {/* Selection indicator and handles */}
          {isSelected && (
            <>
              {/* Selection outline */}
              <rect
                x={topLeft.x - 2}
                y={topLeft.y - 2}
                width={screenWidth + 4}
                height={screenHeight + 4}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={1}
                strokeDasharray="4 2"
                transform={transform}
                pointerEvents="none"
              />

              {/* Resize handles */}
              <ResizeHandles
                bounds={{
                  x: topLeft.x,
                  y: topLeft.y,
                  width: screenWidth,
                  height: screenHeight,
                }}
                rotation={rotation}
                onResize={(newBounds) => {
                  // Convert back to PDF coordinates
                  const pdfBounds: AnnotationRect = {
                    x: newBounds.x / scale,
                    y: pageHeight - (newBounds.y + newBounds.height) / scale,
                    width: newBounds.width / scale,
                    height: newBounds.height / scale,
                  };
                  handleResize(shape.id, pdfBounds);
                }}
              />

              {/* Rotation handle */}
              <RotationHandle
                centerX={centerX}
                centerY={centerY}
                bounds={{
                  x: topLeft.x,
                  y: topLeft.y,
                  width: screenWidth,
                  height: screenHeight,
                }}
                currentRotation={rotation}
                onRotate={(newRotation) => handleRotate(shape.id, newRotation)}
              />

              {/* Delete button */}
              <g
                className="cursor-pointer"
                transform={`translate(${topLeft.x + screenWidth + 5}, ${topLeft.y - 5})`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnnotation(shape.id);
                }}
              >
                <circle r={8} fill="#EF4444" />
                <path
                  d="M-3,-3 L3,3 M-3,3 L3,-3"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            </>
          )}
        </g>
      );
    },
    [
      selectedId,
      scale,
      pageHeight,
      pdfToScreen,
      handleSelect,
      handleResize,
      handleRotate,
      deleteAnnotation,
    ]
  );

  // Handle click on empty space to deselect
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectAnnotation(null);
      }
    },
    [selectAnnotation]
  );

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
      onClick={handleBackgroundClick}
    >
      <g className="pointer-events-auto">{shapeAnnotations.map(renderShape)}</g>
    </svg>
  );
}
