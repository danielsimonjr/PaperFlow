import { useCallback } from 'react';
import { PageCanvas } from './PageCanvas';
import { PageSkeleton } from './PageSkeleton';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useVisiblePages } from '@hooks/useVisiblePages';

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

  // Notify parent of page changes
  const handlePageVisible = useCallback(() => {
    if (currentVisiblePage !== currentPage) {
      onPageChange?.(currentVisiblePage);
    }
  }, [currentVisiblePage, currentPage, onPageChange]);

  // Call page change on visibility updates
  if (currentVisiblePage !== currentPage) {
    handlePageVisible();
  }

  const scaledWidth = DEFAULT_PAGE_WIDTH * (zoom / 100);
  const scaledHeight = DEFAULT_PAGE_HEIGHT * (zoom / 100);

  // Create set of page numbers that should render full content
  const renderSet = new Set(visiblePages.map((p) => p.pageNumber));

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
          const shouldRender = renderSet.has(pageNumber);

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
