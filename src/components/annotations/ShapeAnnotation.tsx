import { useMemo } from 'react';
import type { Annotation } from '@/types';

interface ShapeAnnotationProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * Renders a saved shape annotation (rectangle, ellipse, arrow, line).
 */
export function ShapeAnnotation({
  annotation,
  isSelected,
  scale,
  pageHeight,
  onSelect,
  onDelete,
}: ShapeAnnotationProps) {
  const strokeWidth = annotation.strokeWidth ?? 2;
  const shapeType = annotation.shapeType ?? 'rectangle';

  // Convert bounds from PDF coordinates to screen coordinates
  const screenBounds = useMemo(() => {
    if (!annotation.bounds) return null;
    return {
      x: annotation.bounds.x * scale,
      y: (pageHeight - annotation.bounds.y - annotation.bounds.height) * scale,
      width: annotation.bounds.width * scale,
      height: annotation.bounds.height * scale,
    };
  }, [annotation.bounds, scale, pageHeight]);

  // Convert line/arrow points from PDF coordinates to screen coordinates
  const screenPoints = useMemo(() => {
    if (!annotation.startPoint || !annotation.endPoint) return null;
    return {
      startX: annotation.startPoint.x * scale,
      startY: (pageHeight - annotation.startPoint.y) * scale,
      endX: annotation.endPoint.x * scale,
      endY: (pageHeight - annotation.endPoint.y) * scale,
    };
  }, [annotation.startPoint, annotation.endPoint, scale, pageHeight]);

  // Handle keyboard events for deletion
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
      e.preventDefault();
      onDelete();
    }
  };

  // Calculate arrowhead points
  const renderArrowhead = (startX: number, startY: number, endX: number, endY: number) => {
    const angle = Math.atan2(endY - startY, endX - startX);
    const headSize = Math.min(15, Math.max(8, strokeWidth * 3));

    const point1X = endX - headSize * Math.cos(angle - Math.PI / 6);
    const point1Y = endY - headSize * Math.sin(angle - Math.PI / 6);
    const point2X = endX - headSize * Math.cos(angle + Math.PI / 6);
    const point2Y = endY - headSize * Math.sin(angle + Math.PI / 6);

    return `${endX},${endY} ${point1X},${point1Y} ${point2X},${point2Y}`;
  };

  const renderShape = () => {
    switch (shapeType) {
      case 'rectangle':
        if (!screenBounds) return null;
        return (
          <>
            {/* Selection highlight */}
            {isSelected && (
              <rect
                x={screenBounds.x - 2}
                y={screenBounds.y - 2}
                width={screenBounds.width + 4}
                height={screenBounds.height + 4}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
            <rect
              x={screenBounds.x}
              y={screenBounds.y}
              width={screenBounds.width}
              height={screenBounds.height}
              fill={annotation.fillColor || 'none'}
              stroke={annotation.color}
              strokeWidth={strokeWidth}
              opacity={annotation.opacity}
            />
          </>
        );

      case 'ellipse':
        if (!screenBounds) return null;
        const cx = screenBounds.x + screenBounds.width / 2;
        const cy = screenBounds.y + screenBounds.height / 2;
        const rx = screenBounds.width / 2;
        const ry = screenBounds.height / 2;
        return (
          <>
            {/* Selection highlight */}
            {isSelected && (
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx + 2}
                ry={ry + 2}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
            )}
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={annotation.fillColor || 'none'}
              stroke={annotation.color}
              strokeWidth={strokeWidth}
              opacity={annotation.opacity}
            />
          </>
        );

      case 'line':
        if (!screenPoints) return null;
        return (
          <>
            {/* Selection highlight */}
            {isSelected && (
              <line
                x1={screenPoints.startX}
                y1={screenPoints.startY}
                x2={screenPoints.endX}
                y2={screenPoints.endY}
                stroke="#3B82F6"
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
                opacity={0.5}
              />
            )}
            <line
              x1={screenPoints.startX}
              y1={screenPoints.startY}
              x2={screenPoints.endX}
              y2={screenPoints.endY}
              stroke={annotation.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={annotation.opacity}
            />
          </>
        );

      case 'arrow':
        if (!screenPoints) return null;
        return (
          <g opacity={annotation.opacity}>
            {/* Selection highlight */}
            {isSelected && (
              <line
                x1={screenPoints.startX}
                y1={screenPoints.startY}
                x2={screenPoints.endX}
                y2={screenPoints.endY}
                stroke="#3B82F6"
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
                opacity={0.5}
              />
            )}
            <line
              x1={screenPoints.startX}
              y1={screenPoints.startY}
              x2={screenPoints.endX}
              y2={screenPoints.endY}
              stroke={annotation.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <polygon
              points={renderArrowhead(
                screenPoints.startX,
                screenPoints.startY,
                screenPoints.endX,
                screenPoints.endY
              )}
              fill={annotation.color}
            />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${shapeType} annotation`}
    >
      {renderShape()}
    </g>
  );
}
