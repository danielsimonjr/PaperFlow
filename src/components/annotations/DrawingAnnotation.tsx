import { useMemo, useRef } from 'react';
import type { Annotation, DrawingPath } from '@/types';
import { screenDeltaToPdf, translateDrawingPaths } from '@lib/annotations/drawingGeometry';
import { useHistoryStore } from '@stores/historyStore';
import { useUIStore } from '@stores/uiStore';

function clonePaths(paths: DrawingPath[]): DrawingPath[] {
  return paths.map((path) => ({
    points: path.points.map((point) => ({ ...point })),
  }));
}

interface DrawingAnnotationProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
  onPathsChange?: (paths: DrawingPath[]) => void;
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
  onPathsChange,
}: DrawingAnnotationProps) {
  const pushHistory = useHistoryStore((state) => state.push);
  const activeTool = useUIStore((state) => state.activeTool);
  const dragRef = useRef<{
    origin: DrawingPath[];
    x: number;
    y: number;
    moved: boolean;
    latest: DrawingPath[];
  } | null>(null);
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

  const handlePointerDown = (event: React.PointerEvent<SVGGElement>) => {
    if (activeTool === 'hand' || !annotation.paths || !onPathsChange) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect();
    const origin = clonePaths(annotation.paths);
    dragRef.current = {
      origin,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      latest: origin,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag || !onPathsChange) return;
    const delta = screenDeltaToPdf(event.clientX - drag.x, event.clientY - drag.y, scale);
    if (Math.abs(event.clientX - drag.x) < 2 && Math.abs(event.clientY - drag.y) < 2) return;
    drag.moved = true;
    drag.latest = translateDrawingPaths(drag.origin, delta.dx, delta.dy);
    onPathsChange(drag.latest);
  };

  const finishDrag = (commit: boolean) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved || !onPathsChange) return;
    if (!commit) {
      onPathsChange(drag.origin);
      return;
    }
    const start = drag.origin;
    const end = drag.latest;
    pushHistory({
      action: 'move_drawing',
      undo: () => onPathsChange(start),
      redo: () => onPathsChange(end),
    });
  };

  const handlePointerUp = () => finishDrag(true);
  const handlePointerCancel = () => finishDrag(false);

  return (
    <g
      className="cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Drawing annotation"
      data-testid="drawing-annotation"
    >
      {pathData.map((d, i) => (
        <path
          key={`hit-${i}`}
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(strokeWidth + 10, 16)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

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
