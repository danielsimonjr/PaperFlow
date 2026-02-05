import { useMemo } from 'react';
import type { Annotation } from '@/types';

interface DrawingAnnotationProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * Renders a saved drawing annotation as SVG paths.
 */
export function DrawingAnnotation({
  annotation,
  isSelected,
  scale,
  pageHeight,
  onSelect,
  onDelete,
}: DrawingAnnotationProps) {
  // Convert paths to SVG path data
  const pathData = useMemo(() => {
    if (!annotation.paths || annotation.paths.length === 0) return [];

    return annotation.paths.map((path) => {
      if (path.points.length === 0) return '';
      if (path.points.length === 1) {
        // Single point - draw a dot
        const p = path.points[0]!;
        const x = p.x * scale;
        const y = (pageHeight - p.y) * scale;
        return `M ${x} ${y} L ${x} ${y}`;
      }

      // Multiple points - draw a path
      const pathParts: string[] = [];
      path.points.forEach((p, i) => {
        const x = p.x * scale;
        const y = (pageHeight - p.y) * scale;
        if (i === 0) {
          pathParts.push(`M ${x} ${y}`);
        } else {
          pathParts.push(`L ${x} ${y}`);
        }
      });

      return pathParts.join(' ');
    });
  }, [annotation.paths, scale, pageHeight]);

  const strokeWidth = annotation.strokeWidth ?? 2;

  // Handle keyboard events for deletion
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
      e.preventDefault();
      onDelete();
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
      aria-label="Drawing annotation"
    >
      {/* Selection highlight */}
      {isSelected && pathData.map((d, i) => (
        <path
          key={`selection-${i}`}
          d={d}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />
      ))}

      {/* Drawing paths */}
      {pathData.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={annotation.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={annotation.opacity}
        />
      ))}
    </g>
  );
}
