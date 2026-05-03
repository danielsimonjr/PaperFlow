import { useCallback, useEffect } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import type { AnnotationRect, Annotation } from '@/types';

// Highlight color presets (same as SelectionPopup)
export const HIGHLIGHT_TOOL_COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Orange', value: '#FF9800' },
] as const;

export interface HighlightToolProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Whether the highlight tool is active */
  isActive: boolean;
  /** Selection rectangles in PDF coordinates */
  selectionRects?: AnnotationRect[];
  /** Selected text content */
  selectedText?: string;
  /** Called when a highlight is created */
  onHighlightCreated?: (annotationId: string) => void;
  /** Called after creating highlight to clear selection */
  onClearSelection?: () => void;
}

/**
 * HighlightTool component for creating text highlights.
 * Connects text selection to highlight annotation creation.
 * Integrates with annotationStore for color/opacity and historyStore for undo/redo.
 */
export function HighlightTool({
  pageIndex,
  isActive,
  selectionRects,
  selectedText,
  onHighlightCreated,
  onClearSelection,
}: HighlightToolProps) {
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);

  /**
   * Create a highlight annotation from the current selection.
   *
   * `addAnnotation` already pushes a history entry (`action: 'add_highlight'`).
   * We deliberately do NOT push a second one here — duplicating the entry would
   * force the user to undo twice to back out a single highlight.
   */
  const createHighlight = useCallback(
    (color?: string, opacity?: number) => {
      if (!selectionRects || selectionRects.length === 0) {
        return null;
      }

      const annotationData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'highlight',
        pageIndex,
        rects: selectionRects,
        color: color || activeColor,
        opacity: opacity ?? activeOpacity,
        content: selectedText,
      };

      const id = addAnnotation(annotationData);

      onHighlightCreated?.(id);
      onClearSelection?.();

      return id;
    },
    [
      pageIndex,
      selectionRects,
      selectedText,
      activeColor,
      activeOpacity,
      addAnnotation,
      onHighlightCreated,
      onClearSelection,
    ]
  );

  /**
   * Handle keyboard shortcut to create highlight
   * When highlight tool is active and there's a selection,
   * pressing Enter or H creates the highlight
   */
  useEffect(() => {
    if (!isActive || !selectionRects || selectionRects.length === 0) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter or H key creates highlight when tool is active
      if (e.key === 'Enter' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey)) {
        // Don't trigger if user is typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        createHighlight();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, selectionRects, createHighlight]);

  // This is a non-visual tool component
  // The actual UI is handled by SelectionPopup or AnnotationToolbar
  return null;
}
