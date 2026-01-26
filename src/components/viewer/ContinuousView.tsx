import { useRef, useCallback, useState, useEffect } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useDynamicVirtualization } from '@hooks/useVirtualization';

interface ContinuousViewProps {
  renderer: PDFRenderer;
  pageCount: number;
  currentPage: number;
  zoom: number;
  onPageChange?: (page: number) => void;
  onWheel?: (e: React.WheelEvent) => void;
}

// Base page height for estimation (will be updated with actual measurements)
const ESTIMATED_PAGE_HEIGHT = 800;
const PAGE_GAP = 16;

export function ContinuousView({
  renderer,
  pageCount,
  currentPage,
  zoom,
  onPageChange,
  onWheel,
}: ContinuousViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const [pageHeights, setPageHeights] = useState<Map<number, number>>(new Map());

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate item height based on zoom and measured heights
  const getItemHeight = useCallback(
    (index: number): number => {
      const baseHeight = pageHeights.get(index + 1) ?? ESTIMATED_PAGE_HEIGHT;
      return baseHeight * (zoom / 100) + PAGE_GAP;
    },
    [pageHeights, zoom]
  );

  const {
    virtualItems,
    totalHeight,
    scrollToIndex,
    handleScroll: onScroll,
  } = useDynamicVirtualization({
    totalItems: pageCount,
    estimatedItemHeight: ESTIMATED_PAGE_HEIGHT * (zoom / 100) + PAGE_GAP,
    containerHeight,
    overscan: 2,
    getItemHeight,
  });

  // Scroll to page when currentPage changes externally
  useEffect(() => {
    scrollToIndex(currentPage - 1, 'smooth');
  }, [currentPage, scrollToIndex]);

  // Update current page based on scroll position
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e);

      // Find which page is most visible
      const viewportCenter = e.currentTarget.scrollTop + containerHeight / 2;
      let currentOffset = 0;

      for (let i = 0; i < pageCount; i++) {
        const pageHeight = getItemHeight(i);
        if (viewportCenter < currentOffset + pageHeight) {
          const newPage = i + 1;
          if (newPage !== currentPage) {
            onPageChange?.(newPage);
          }
          break;
        }
        currentOffset += pageHeight;
      }
    },
    [onScroll, containerHeight, pageCount, getItemHeight, currentPage, onPageChange]
  );

  const handlePageRendered = useCallback(
    (pageNumber: number, result: { width: number; height: number }) => {
      setPageHeights((prev) => {
        const next = new Map(prev);
        next.set(pageNumber, result.height);
        return next;
      });
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-gray-200 dark:bg-gray-800"
      onScroll={handleScroll}
      onWheel={onWheel}
    >
      {/* Spacer for total scroll height */}
      <div
        className="relative w-full"
        style={{ height: totalHeight }}
      >
        {/* Render only visible pages */}
        {virtualItems.map((item) => {
          const pageNumber = item.index + 1;
          return (
            <div
              key={pageNumber}
              className="absolute left-0 right-0 flex justify-center"
              style={{
                top: item.start,
                height: item.size - PAGE_GAP,
                paddingBottom: PAGE_GAP,
              }}
            >
              <PageCanvas
                renderer={renderer}
                pageNumber={pageNumber}
                scale={zoom}
                onPageRendered={(result) => handlePageRendered(pageNumber, result)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
