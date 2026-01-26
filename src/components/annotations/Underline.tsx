import { useMemo } from 'react';
import type { Annotation, AnnotationRect } from '@/types';

interface UnderlineProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * SVG component for rendering underline annotations.
 * Draws a line below the text.
 */
export function Underline({
  annotation,
  isSelected,
  scale,
  pageHeight,
  onSelect,
  onDelete,
}: UnderlineProps) {
  // Convert PDF rects to screen coordinates and create lines
  const lines = useMemo(() => {
    return annotation.rects.map((rect: AnnotationRect) => {
      const screenY = (pageHeight - rect.y - rect.height) * scale;
      const lineY = screenY + rect.height * scale; // Bottom of the text

      return {
        x1: rect.x * scale,
        y1: lineY,
        x2: (rect.x + rect.width) * scale,
        y2: lineY,
      };
    });
  }, [annotation.rects, scale, pageHeight]);

  // Handle keyboard delete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete();
    }
  };

  // Line width scales with zoom
  const strokeWidth = Math.max(1, 2 * scale);

  return (
    <g
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={handleKeyDown}
      className="cursor-pointer outline-none focus:outline-none"
      aria-label="Underline annotation"
    >
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={annotation.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`transition-all duration-150 ${
            isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'
          }`}
        />
      ))}
      {/* Selection indicator */}
      {isSelected &&
        lines.map((line, index) => (
          <line
            key={`selection-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#3B82F6"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            opacity={0.3}
          />
        ))}
    </g>
  );
}
