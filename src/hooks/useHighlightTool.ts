import { useCallback } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import type { AnnotationRect, Annotation } from '@/types';

/**
 * Hook for using highlight tool functionality programmatically.
 * Creates highlight annotations with undo/redo support.
 */
export function useHighlightTool() {
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);
  const pushHistory = useHistoryStore((state) => state.push);

  const createHighlight = useCallback(
    (
      pageIndex: number,
      rects: AnnotationRect[],
      options?: {
        color?: string;
        opacity?: number;
        text?: string;
      }
    ) => {
      if (!rects || rects.length === 0) {
        return null;
      }

      const annotationData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'highlight',
        pageIndex,
        rects,
        color: options?.color || activeColor,
        opacity: options?.opacity ?? activeOpacity,
        content: options?.text,
      };

      const id = addAnnotation(annotationData);

      pushHistory({
        action: 'add_highlight',
        undo: () => deleteAnnotation(id),
        redo: () => addAnnotation(annotationData),
      });

      return id;
    },
    [activeColor, activeOpacity, addAnnotation, deleteAnnotation, pushHistory]
  );

  return { createHighlight };
}
