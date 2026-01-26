import { useMemo } from 'react';
import type { Annotation, AnnotationRect } from '@/types';

interface HighlightProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
}

/**
 * SVG component for rendering text highlight annotations.
 * Uses multiply blend mode to show text through the highlight.
 */
export function Highlight({
  annotation,
  isSelected,
  scale,
  pageHeight,
  onSelect,
  onDelete,
}: HighlightProps) {
  // Convert PDF rects to screen rects
  const screenRects = useMemo(() => {
    return annotation.rects.map((rect: AnnotationRect) => ({
      x: rect.x * scale,
      y: (pageHeight - rect.y - rect.height) * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    }));
  }, [annotation.rects, scale, pageHeight]);

  // Handle keyboard delete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete();
    }
  };

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
      aria-label={`Highlight annotation${annotation.content ? `: ${annotation.content}` : ''}`}
    >
      {screenRects.map((rect, index) => (
        <rect
          key={index}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={annotation.color}
          fillOpacity={annotation.opacity}
          style={{ mixBlendMode: 'multiply' }}
          className={`transition-all duration-150 ${
            isSelected
              ? 'stroke-primary-500 stroke-2'
              : 'hover:stroke-gray-400 hover:stroke-1'
          }`}
        />
      ))}
    </g>
  );
}
