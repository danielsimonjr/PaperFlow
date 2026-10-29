import { useEffect, useRef, useState } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';
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
const PAGE_BUFFER = 2;
const DEFAULT_PAGE_HEIGHT = 792;

function pageStride(zoom: number): number {
  return DEFAULT_PAGE_HEIGHT * (zoom / 100) + PAGE_GAP;
}

function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) return 1;
  return Math.min(pageCount, Math.max(1, page));
}

/**
 * The page at the middle of the viewport. A zero height falls back to one page,
 * which is what jsdom reports before layout.
 */
function pageAtScroll(
  scrollTop: number,
  viewport: number,
  zoom: number,
  pageCount: number
): number {
  const stride = pageStride(zoom);
  const view = viewport > 0 ? viewport : stride;
  const center = scrollTop + view / 2;
  return clampPage(Math.floor(center / stride) + 1, pageCount);
}

/**
 * One viewer for single, continuous, and spread layouts.
 * Continuous mode mounts the pages near the viewport, plus a two-page buffer.
 * Scrolling reports the page at the center. A page change from the keyboard or
 * the thumbnail sidebar scrolls to that page and does not get overwritten.
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(() => (currentPage - 1) * pageStride(zoom));
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const fromScroll = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || layout !== 'continuous' || typeof ResizeObserver === 'undefined') return;
    const update = () => setViewportHeight(container.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [layout]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (layout !== 'continuous') {
      container.scrollTo?.({ top: 0, left: 0 });
      return;
    }
    if (fromScroll.current) {
      fromScroll.current = false;
      return;
    }
    const top = (clampPage(currentPage, pageCount) - 1) * pageStride(zoom);
    setScrollTop(top);
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top, left: 0 });
    } else {
      container.scrollTop = top;
    }
  }, [layout, currentPage, pageCount, zoom]);

  const noteScroll = (top: number, viewport: number) => {
    setScrollTop(top);
    if (layout !== 'continuous') return;
    const page = pageAtScroll(top, viewport, zoom, pageCount);
    if (page !== currentPage) {
      fromScroll.current = true;
      onPageChange?.(page);
    }
  };

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    noteScroll(event.currentTarget.scrollTop, event.currentTarget.clientHeight);
  };

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
    const container = scrollRef.current;
    container.scrollLeft = panStart.current.x - event.clientX;
    container.scrollTop = panStart.current.y - event.clientY;
    noteScroll(container.scrollTop, container.clientHeight);
  };

  const stopPan = () => setIsPanning(false);

  if (layout === 'single') {
    return (
      <div
        ref={scrollRef}
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
        ref={scrollRef}
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

  const stride = pageStride(zoom);
  const anchor = pageAtScroll(scrollTop, viewportHeight, zoom, pageCount);
  const start = Math.max(1, anchor - PAGE_BUFFER);
  const end = Math.min(pageCount, anchor + PAGE_BUFFER);
  const pagesToDraw: number[] = [];
  for (let page = start; page <= end; page += 1) pagesToDraw.push(page);

  return (
    <div
      ref={scrollRef}
      data-testid="view-mode"
      data-mode="continuous"
      className={cn('h-full overflow-auto bg-gray-200 dark:bg-gray-800', panClass)}
      onWheel={onWheel}
      onScroll={onScroll}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopPan}
      onMouseLeave={stopPan}
      role="document"
      aria-label="PDF document"
    >
      <div className="relative w-full" style={{ height: Math.max(pageCount, 0) * stride }}>
        {pagesToDraw.map((pageNumber) => (
          <div
            key={pageNumber}
            className="absolute left-0 right-0 flex justify-center"
            style={{ top: (pageNumber - 1) * stride, height: stride - PAGE_GAP }}
            data-page-number={pageNumber}
            aria-label={`Page ${pageNumber}`}
          >
            <PageCanvas renderer={renderer} pageNumber={pageNumber} scale={zoom} />
          </div>
        ))}
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
