import { useEffect, useMemo, useRef, useState } from 'react';
import { PageCanvas } from './PageCanvas';
import { PageSkeleton } from './PageSkeleton';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useVisiblePages } from '@hooks/useVisiblePages';
import { CanvasDisposer } from '@lib/performance/memoryManager';
import { useUIStore } from '@stores/uiStore';
import { cn } from '@utils/cn';
import { spreadSlots, type ViewerLayout } from './viewLayout';

interface VirtualizedViewerProps {
  layout: ViewerLayout;
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
 * One viewer for single, continuous, and spread layouts.
 * Continuous mode draws the pages near the viewport. The other layouts draw the current page or pair.
 * The hand tool pans the scroll area.
 */
export function VirtualizedViewer({
  layout,
  renderer,
  pageCount,
  currentPage,
  zoom,
  onPageChange,
  onWheel,
}: VirtualizedViewerProps) {
  const activeTool = useUIStore((state) => state.activeTool);
  const ownRef = useRef<HTMLDivElement>(null);
  const {
    visiblePages,
    currentVisiblePage,
    registerPageElement,
    containerRef,
  } = useVisiblePages({
    pageCount,
    bufferSize: 2,
  });
  const scrollRef = layout === 'continuous' ? containerRef : ownRef;
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const fromScroll = useRef(false);
  const canvasDisposerRef = useRef(new CanvasDisposer());
  const previousVisibleRef = useRef<Set<number>>(new Set());
  const currentVisibleSet = useMemo(
    () => new Set(visiblePages.map((page) => page.pageNumber)),
    [visiblePages]
  );

  useEffect(() => {
    if (layout !== 'continuous') return;
    const disposer = canvasDisposerRef.current;
    for (const pageNumber of previousVisibleRef.current) {
      if (!currentVisibleSet.has(pageNumber)) {
        disposer.dispose(`page-${pageNumber}`);
      }
    }
    previousVisibleRef.current = new Set(currentVisibleSet);
  }, [layout, currentVisibleSet]);

  useEffect(() => {
    const disposer = canvasDisposerRef.current;
    return () => {
      disposer.disposeAll();
    };
  }, []);

  useEffect(() => {
    if (layout !== 'continuous') return;
    if (currentVisiblePage !== currentPage) {
      fromScroll.current = true;
      onPageChange?.(currentVisiblePage);
    }
  }, [layout, currentVisiblePage, currentPage, onPageChange]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (layout === 'continuous') {
      if (fromScroll.current) {
        fromScroll.current = false;
        return;
      }
      const page = container.querySelector<HTMLElement>(
        `[data-page-number="${currentPage}"]`
      );
      page?.scrollIntoView?.({ block: 'start' });
      return;
    }
    container.scrollTo?.({ top: 0, left: 0 });
  }, [layout, currentPage, scrollRef]);

  const panClass = cn(
    activeTool === 'hand' && 'cursor-grab',
    activeTool === 'hand' && isPanning && 'cursor-grabbing'
  );

  const onMouseDown = (event: React.MouseEvent) => {
    if (activeTool !== 'hand' || !scrollRef.current) return;
    setIsPanning(true);
    panStart.current = {
      x: event.clientX + scrollRef.current.scrollLeft,
      y: event.clientY + scrollRef.current.scrollTop,
    };
    event.preventDefault();
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (!isPanning || !scrollRef.current) return;
    scrollRef.current.scrollLeft = panStart.current.x - event.clientX;
    scrollRef.current.scrollTop = panStart.current.y - event.clientY;
  };

  const stopPan = () => setIsPanning(false);

  if (layout === 'single') {
    return (
      <div
        ref={ownRef}
        data-testid="view-mode"
        data-mode="single"
        className={cn(
          'flex h-full items-center justify-center overflow-auto bg-gray-200 p-8 dark:bg-gray-800',
          panClass
        )}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <PageCanvas renderer={renderer} pageNumber={currentPage} scale={zoom} />
      </div>
    );
  }

  if (layout === 'spread') {
    const { left, right } = spreadSlots(currentPage, pageCount, true);
    return (
      <div
        ref={ownRef}
        data-testid="view-mode"
        data-mode="spread"
        className={cn(
          'flex h-full items-start justify-center gap-4 overflow-auto bg-gray-200 p-8 dark:bg-gray-800',
          panClass
        )}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <SpreadSide renderer={renderer} pageNumber={left} zoom={zoom} />
        <SpreadSide renderer={renderer} pageNumber={right} zoom={zoom} />
      </div>
    );
  }

  const scaledWidth = DEFAULT_PAGE_WIDTH * (zoom / 100);
  const scaledHeight = DEFAULT_PAGE_HEIGHT * (zoom / 100);

  return (
    <div
      ref={containerRef}
      data-testid="view-mode"
      data-mode="continuous"
      className={cn('h-full overflow-auto bg-gray-200 dark:bg-gray-800', panClass)}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      role="document"
      aria-label="PDF document"
    >
      <div className="flex flex-col items-center py-4">
        {Array.from({ length: pageCount }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <div
              key={pageNumber}
              ref={(element) => registerPageElement(pageNumber, element)}
              className="flex justify-center"
              style={{ marginBottom: PAGE_GAP }}
              data-page-number={pageNumber}
              aria-label={`Page ${pageNumber}`}
            >
              {currentVisibleSet.has(pageNumber) ? (
                <PageCanvas renderer={renderer} pageNumber={pageNumber} scale={zoom} />
              ) : (
                <PageSkeleton width={scaledWidth} height={scaledHeight} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One side of a spread: the page, or an empty slot when that side has no page.
 */
function SpreadSide({
  renderer,
  pageNumber,
  zoom,
}: {
  renderer: PDFRenderer;
  pageNumber: number | null;
  zoom: number;
}) {
  if (!pageNumber) {
    return (
      <div
        data-testid="spread-placeholder"
        className="bg-gray-300 dark:bg-gray-700"
        style={{ width: 595 * (zoom / 100), height: 842 * (zoom / 100) }}
      />
    );
  }
  return <PageCanvas renderer={renderer} pageNumber={pageNumber} scale={zoom} />;
}
