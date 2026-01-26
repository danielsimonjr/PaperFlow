import { useState, useCallback, useEffect } from 'react';
import type { AnnotationRect } from '@/types';

export interface TextSelectionData {
  /** Selected text content */
  text: string;
  /** Selection rectangles in screen coordinates */
  screenRects: AnnotationRect[];
  /** Selection rectangles in PDF coordinates */
  pdfRects: AnnotationRect[];
  /** Page index (0-based) */
  pageIndex: number;
  /** Position for popup menu */
  popupPosition: { x: number; y: number };
}

interface UseTextSelectionOptions {
  /** Scale factor (1.0 = 100%) */
  scale: number;
  /** Page height in PDF points */
  pageHeight: number;
  /** Page index (0-based) */
  pageIndex: number;
  /** Container element ref */
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * Hook for capturing and managing text selections.
 * Converts selection rectangles between screen and PDF coordinates.
 */
export function useTextSelection({
  scale,
  pageHeight,
  pageIndex,
  containerRef,
}: UseTextSelectionOptions) {
  const [selection, setSelection] = useState<TextSelectionData | null>(null);

  // Convert screen rect to PDF coordinates
  const screenToPdfRect = useCallback(
    (rect: AnnotationRect): AnnotationRect => {
      return {
        x: rect.x / scale,
        y: pageHeight - (rect.y + rect.height) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
    },
    [scale, pageHeight]
  );

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    const windowSelection = window.getSelection();

    if (!windowSelection || windowSelection.isCollapsed) {
      setSelection(null);
      return;
    }

    const text = windowSelection.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }

    // Check if selection is within our container
    const container = containerRef.current;
    if (!container) {
      setSelection(null);
      return;
    }

    const range = windowSelection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    // Get selection rectangles
    const clientRects = range.getClientRects();
    if (clientRects.length === 0) {
      setSelection(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();

    // Convert to container-relative screen coordinates
    const screenRects: AnnotationRect[] = Array.from(clientRects)
      .map((rect) => ({
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
      }))
      .filter((rect) => rect.width > 0 && rect.height > 0);

    if (screenRects.length === 0) {
      setSelection(null);
      return;
    }

    // Normalize rects (merge adjacent ones on same line)
    const normalizedScreenRects = normalizeRects(screenRects);

    // Convert to PDF coordinates
    const pdfRects = normalizedScreenRects.map(screenToPdfRect);

    // Calculate popup position (at the end of the last rect)
    const lastRect = normalizedScreenRects[normalizedScreenRects.length - 1];
    if (!lastRect) {
      setSelection(null);
      return;
    }
    const popupPosition = {
      x: lastRect.x + lastRect.width / 2,
      y: lastRect.y,
    };

    setSelection({
      text,
      screenRects: normalizedScreenRects,
      pdfRects,
      pageIndex,
      popupPosition,
    });
  }, [containerRef, pageIndex, screenToPdfRect]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  // Listen for mouseup events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small delay to let the selection finalize
      setTimeout(handleSelectionChange, 10);
    };

    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleSelectionChange]);

  // Listen for selection changes (for keyboard selection)
  useEffect(() => {
    const handleSelectionChangeEvent = () => {
      // Debounce the selection change handling
      setTimeout(handleSelectionChange, 10);
    };

    document.addEventListener('selectionchange', handleSelectionChangeEvent);

    return () => {
      document.removeEventListener(
        'selectionchange',
        handleSelectionChangeEvent
      );
    };
  }, [handleSelectionChange]);

  return {
    selection,
    clearSelection,
    hasSelection: selection !== null,
  };
}

/**
 * Normalize rectangles by merging adjacent ones on the same line.
 */
function normalizeRects(rects: AnnotationRect[]): AnnotationRect[] {
  if (rects.length === 0) return [];

  const tolerance = 3;
  const sorted = [...rects].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > tolerance) return yDiff;
    return a.x - b.x;
  });

  const firstRect = sorted[0];
  if (!firstRect) return [];

  const result: AnnotationRect[] = [];
  let current: AnnotationRect = { ...firstRect };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (!next) continue;

    const sameLine = Math.abs(next.y - current.y) <= tolerance;
    const adjacent = next.x <= current.x + current.width + tolerance;

    if (sameLine && adjacent) {
      const newRight = Math.max(current.x + current.width, next.x + next.width);
      current.width = newRight - current.x;
      current.height = Math.max(current.height, next.height);
    } else {
      result.push(current);
      current = { ...next };
    }
  }

  result.push(current);
  return result;
}
