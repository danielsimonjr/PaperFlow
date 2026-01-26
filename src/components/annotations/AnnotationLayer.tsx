import { useCallback, useMemo } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { Highlight } from './Highlight';
import { Underline } from './Underline';
import { Strikethrough } from './Strikethrough';
import { StickyNote } from './StickyNote';
import type { Annotation } from '@/types';

interface AnnotationLayerProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Page width in pixels at current scale */
  width: number;
  /** Page height in pixels at current scale */
  height: number;
  /** Current zoom scale (1.0 = 100%) */
  scale: number;
  /** Page height in PDF points for coordinate conversion */
  pageHeight: number;
}

/**
 * SVG overlay component for rendering annotations on a PDF page.
 * Positioned absolutely over the page canvas.
 */
export function AnnotationLayer({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
}: AnnotationLayerProps) {
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);

  // Filter annotations for this page
  const pageAnnotations = useMemo(() => {
    return annotations.filter((a) => a.pageIndex === pageIndex);
  }, [annotations, pageIndex]);

  // Handle annotation selection
  const handleSelect = useCallback(
    (id: string) => {
      selectAnnotation(id);
    },
    [selectAnnotation]
  );

  // Handle annotation deletion
  const handleDelete = useCallback(
    (id: string) => {
      deleteAnnotation(id);
    },
    [deleteAnnotation]
  );

  // Handle annotation update (for moving notes, etc.)
  const handleUpdate = useCallback(
    (id: string, updates: Partial<Annotation>) => {
      updateAnnotation(id, updates);
    },
    [updateAnnotation]
  );

  // Render individual annotation based on type
  const renderAnnotation = useCallback(
    (annotation: Annotation) => {
      const isSelected = annotation.id === selectedId;

      switch (annotation.type) {
        case 'highlight':
          return (
            <Highlight
              key={annotation.id}
              annotation={annotation}
              isSelected={isSelected}
              scale={scale}
              pageHeight={pageHeight}
              onSelect={() => handleSelect(annotation.id)}
              onDelete={() => handleDelete(annotation.id)}
            />
          );

        case 'underline':
          return (
            <Underline
              key={annotation.id}
              annotation={annotation}
              isSelected={isSelected}
              scale={scale}
              pageHeight={pageHeight}
              onSelect={() => handleSelect(annotation.id)}
              onDelete={() => handleDelete(annotation.id)}
            />
          );

        case 'strikethrough':
          return (
            <Strikethrough
              key={annotation.id}
              annotation={annotation}
              isSelected={isSelected}
              scale={scale}
              pageHeight={pageHeight}
              onSelect={() => handleSelect(annotation.id)}
              onDelete={() => handleDelete(annotation.id)}
            />
          );

        case 'note':
          return (
            <StickyNote
              key={annotation.id}
              annotation={annotation}
              isSelected={isSelected}
              scale={scale}
              pageHeight={pageHeight}
              onSelect={() => handleSelect(annotation.id)}
              onDelete={() => handleDelete(annotation.id)}
              onUpdate={(updates) => handleUpdate(annotation.id, updates)}
            />
          );

        default:
          return null;
      }
    },
    [selectedId, scale, pageHeight, handleSelect, handleDelete, handleUpdate]
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
      {/* Render all annotations for this page */}
      <g className="pointer-events-auto">
        {pageAnnotations.map(renderAnnotation)}
      </g>
    </svg>
  );
}
