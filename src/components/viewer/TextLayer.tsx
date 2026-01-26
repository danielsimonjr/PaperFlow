import { useEffect, useRef, useCallback } from 'react';
import type { PDFRenderer } from '@lib/pdf/renderer';

interface TextLayerProps {
  renderer: PDFRenderer;
  pageNumber: number;
  scale: number;
  width: number;
  height: number;
  onTextSelected?: (selection: TextSelection | null) => void;
}

export interface TextSelection {
  text: string;
  rects: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  pageIndex: number;
}

/**
 * Text layer component that enables text selection on PDF pages.
 * Renders the PDF.js text layer over the canvas.
 */
export function TextLayer({
  renderer,
  pageNumber,
  scale,
  width,
  height,
  onTextSelected,
}: TextLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  // Render text layer
  useEffect(() => {
    const container = containerRef.current;
    const textLayer = textLayerRef.current;
    if (!container || !textLayer) return;

    let cancelled = false;

    const renderTextLayer = async () => {
      try {
        // Clear existing content
        textLayer.innerHTML = '';

        // Get text content from renderer
        const textContent = await renderer.getTextContent(pageNumber);
        if (cancelled || !textContent) return;

        // Get viewport for this page
        const page = await renderer.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: scale / 100 });

        // Import PDF.js text layer builder dynamically
        const pdfjsLib = await import('pdfjs-dist');

        // Set up the text layer div
        textLayer.style.setProperty('--scale-factor', String(scale / 100));

        // Render text layer
        const textLayerBuilder = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayer,
          viewport,
        });

        await textLayerBuilder.render();

        if (cancelled) {
          textLayer.innerHTML = '';
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to render text layer:', error);
        }
      }
    };

    renderTextLayer();

    return () => {
      cancelled = true;
    };
  }, [renderer, pageNumber, scale]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onTextSelected?.(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      onTextSelected?.(null);
      return;
    }

    // Get selection rectangles
    const range = selection.getRangeAt(0);
    const clientRects = range.getClientRects();
    const container = containerRef.current;

    if (!container || clientRects.length === 0) {
      onTextSelected?.(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();

    // Convert client rects to container-relative coordinates
    const rects = Array.from(clientRects).map((rect) => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));

    // Normalize and merge overlapping rects
    const normalizedRects = normalizeRects(rects);

    onTextSelected?.({
      text,
      rects: normalizedRects,
      pageIndex: pageNumber - 1, // Convert to 0-based index
    });
  }, [onTextSelected, pageNumber]);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-0"
      style={{ width, height }}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={textLayerRef}
        className="textLayer absolute left-0 top-0"
        style={{
          width,
          height,
          // PDF.js text layer styles
          lineHeight: 1,
          textSizeAdjust: 'none',
        }}
      />
    </div>
  );
}

type RectShape = { x: number; y: number; width: number; height: number };

/**
 * Normalize rectangles by merging those on the same line.
 */
function normalizeRects(rects: RectShape[]): RectShape[] {
  if (rects.length === 0) return [];

  const tolerance = 3; // pixels
  const sorted = [...rects].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > tolerance) return yDiff;
    return a.x - b.x;
  });

  const firstRect = sorted[0];
  if (!firstRect) return [];

  const result: RectShape[] = [];
  let current: RectShape = { ...firstRect };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (!next) continue;

    // Check if on the same line and adjacent/overlapping
    const sameLine = Math.abs(next.y - current.y) <= tolerance;
    const adjacent = next.x <= current.x + current.width + tolerance;

    if (sameLine && adjacent) {
      // Merge rectangles
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
