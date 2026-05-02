import { useCallback } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import type { AnnotationRect, Annotation } from '@/types';

/**
 * Hook for using highlight tool functionality programmatically.
 *
 * `addAnnotation` already pushes to the history store with action
 * `'add_highlight'` — see `annotationStore.addAnnotation`. We deliberately do
 * NOT push a second history entry here, because that would duplicate every
 * highlight in the undo stack (one user action would require two undos).
 */
export function useHighlightTool() {
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);

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

      return addAnnotation(annotationData);
    },
    [activeColor, activeOpacity, addAnnotation]
  );

  return { createHighlight };
}
