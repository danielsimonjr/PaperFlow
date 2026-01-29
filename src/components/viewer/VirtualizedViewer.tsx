import { useEffect, useRef, useMemo } from 'react';
import { PageCanvas } from './PageCanvas';
import { PageSkeleton } from './PageSkeleton';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useVisiblePages } from '@hooks/useVisiblePages';
import { CanvasDisposer } from '@lib/performance/memoryManager';

interface VirtualizedViewerProps {
  renderer: PDFRenderer;
  pageCount: number;
  currentPage: number;
  zoom: number;
  onPageChange?: (page: number) => void;
  onWheel?: (e: React.WheelEvent) => void;
}

const PAGE_GAP = 16;
const DEFAULT_PAGE_WIDTH = 612;
const DEFAULT_PAGE_HEIGHT = 792;

/**
 * Virtualized viewer that only renders visible pages plus a buffer.
 * Uses IntersectionObserver for efficient visibility detection.
 */
export function VirtualizedViewer({
  renderer,
  pageCount,
  currentPage,
  zoom,
  onPageChange,
  onWheel,
}: VirtualizedViewerProps) {
  const {
    visiblePages,
    currentVisiblePage,
    registerPageElement,
    containerRef,
  } = useVisiblePages({
    pageCount,
    bufferSize: 2,
  });

  // Canvas disposer for memory management
  const canvasDisposerRef = useRef<CanvasDisposer>(new CanvasDisposer());
  const previousVisibleRef = useRef<Set<number>>(new Set());

  // Notify parent of page changes via useEffect (not during render)
  useEffect(() => {
    if (currentVisiblePage !== currentPage) {
      onPageChange?.(currentVisiblePage);
    }
  }, [currentVisiblePage, currentPage, onPageChange]);

  // Dispose canvases that are no longer visible
  const currentVisibleSet = useMemo(
    () => new Set(visiblePages.map((p) => p.pageNumber)),
    [visiblePages]
  );

  useEffect(() => {
    const disposer = canvasDisposerRef.current;
    const previousSet = previousVisibleRef.current;

    // Find pages that were visible but are no longer
    for (const pageNumber of previousSet) {
      if (!currentVisibleSet.has(pageNumber)) {
        disposer.dispose(`page-${pageNumber}`);
      }
    }

    // Update previous visible set
    previousVisibleRef.current = new Set(currentVisibleSet);
  }, [currentVisibleSet]);

  // Cleanup on unmount
  useEffect(() => {
    const disposer = canvasDisposerRef.current;
    return () => {
      disposer.disposeAll();
    };
  }, []);

  const scaledWidth = DEFAULT_PAGE_WIDTH * (zoom / 100);
  const scaledHeight = DEFAULT_PAGE_HEIGHT * (zoom / 100);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-gray-200 dark:bg-gray-800"
      onWheel={onWheel}
      role="document"
      aria-label="PDF document"
    >
      <div className="flex flex-col items-center py-4">
        {Array.from({ length: pageCount }, (_, i) => {
          const pageNumber = i + 1;
          const shouldRender = currentVisibleSet.has(pageNumber);

          return (
            <div
              key={pageNumber}
              ref={(el) => registerPageElement(pageNumber, el)}
              className="flex justify-center"
              style={{ marginBottom: PAGE_GAP }}
              data-page-number={pageNumber}
              aria-label={`Page ${pageNumber}`}
            >
              {shouldRender ? (
                <PageCanvas
                  renderer={renderer}
                  pageNumber={pageNumber}
                  scale={zoom}
                />
              ) : (
                <PageSkeleton
                  width={scaledWidth}
                  height={scaledHeight}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
