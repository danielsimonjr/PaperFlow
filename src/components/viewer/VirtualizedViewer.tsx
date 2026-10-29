import { useEffect, useRef, useState } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useUIStore } from '@stores/uiStore';
import { cn } from '@utils/cn';
import {
  spreadPlaceholderSize,
  spreadSlots,
  type PagePoints,
  type ViewerLayout,
} from './viewLayout';

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

interface MeasuredPages {
  renderer: PDFRenderer;
  pageCount: number;
  heights: number[];
  widths: number[];
}

function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) return 1;
  return Math.min(pageCount, Math.max(1, page));
}

/**
 * PDF height in points. Unknown pages use a US Letter estimate until the
 * renderer reports the real size.
 */
function pdfHeight(measured: MeasuredPages | null, pageCount: number, pageNumber: number): number {
  if (!measured || measured.pageCount !== pageCount) return DEFAULT_PAGE_HEIGHT;
  const height = measured.heights[pageNumber - 1];
  return height && height > 0 ? height : DEFAULT_PAGE_HEIGHT;
}

/** Distance from the top of the scroll content to the top of a 1-based page. */
function pageOffset(
  pageNumber: number,
  zoom: number,
  measured: MeasuredPages | null,
  pageCount: number
): number {
  const scale = zoom / 100;
  let top = 0;
  for (let page = 1; page < pageNumber; page += 1) {
    top += pdfHeight(measured, pageCount, page) * scale + PAGE_GAP;
  }
  return top;
}

function pageSlot(pageNumber: number, zoom: number, measured: MeasuredPages | null, pageCount: number) {
  const scale = zoom / 100;
  return {
    top: pageOffset(pageNumber, zoom, measured, pageCount),
    height: pdfHeight(measured, pageCount, pageNumber) * scale,
  };
}

/**
 * The page at the top of the viewport. Keyboard and thumbnail navigation scroll
 * a page to that edge, so the probe stays on the page they asked for.
 * A zero height falls back to one page, which is what jsdom reports before layout.
 */
function pageAtScroll(
  scrollTop: number,
  viewport: number,
  zoom: number,
  pageCount: number,
  measured: MeasuredPages | null
): number {
  const scale = zoom / 100;
  const firstStride = pdfHeight(measured, pageCount, 1) * scale + PAGE_GAP;
  const view = viewport > 0 ? viewport : firstStride;
  const probe = scrollTop + Math.min(24, view / 2);
  let top = 0;
  for (let page = 1; page <= pageCount; page += 1) {
    const stride = pdfHeight(measured, pageCount, page) * scale + PAGE_GAP;
    if (probe < top + stride) return page;
    top += stride;
  }
  return clampPage(pageCount, pageCount);
}

/**
 * One viewer for single, continuous, and spread layouts.
 * Continuous mode mounts the pages near the viewport, plus a two-page buffer.
 * Each slot uses that page's PDF height, so a page that is not US Letter does
 * not overlap the next one. Scrolling reports the page at the top of the
 * viewport. A page change from the keyboard or the thumbnail sidebar scrolls
 * to that page and does not get overwritten. The hand tool pans the scroll area.
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
  const [scrollTop, setScrollTop] = useState(() => (currentPage - 1) * (DEFAULT_PAGE_HEIGHT * (zoom / 100) + PAGE_GAP));
  const [viewportHeight, setViewportHeight] = useState(0);
  const [measured, setMeasured] = useState<MeasuredPages | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const fromScroll = useRef(false);
  const positioning = useRef(false);
  const pageHeights = measured?.renderer === renderer && measured.pageCount === pageCount ? measured : null;

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
    if (layout !== 'continuous' && layout !== 'spread') return;
    if (pageCount < 1 || typeof renderer.getPageInfo !== 'function') return;
    let cancelled = false;
    void Promise.all(
      Array.from({ length: pageCount }, (_, index) =>
        renderer
          .getPageInfo(index + 1)
          .then((info) => ({
            width: info.width > 0 ? info.width : 0,
            height: info.height > 0 ? info.height : DEFAULT_PAGE_HEIGHT,
          }))
          .catch(() => ({ width: 0, height: DEFAULT_PAGE_HEIGHT }))
      )
    ).then((sizes) => {
      if (!cancelled) {
        setMeasured({
          renderer,
          pageCount,
          heights: sizes.map((s) => s.height),
          widths: sizes.map((s) => s.width),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [layout, renderer, pageCount]);

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
    const top = pageOffset(clampPage(currentPage, pageCount), zoom, pageHeights, pageCount);
    positioning.current = true;
    setScrollTop(top);
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top, left: 0 });
    } else {
      container.scrollTop = top;
    }
    positioning.current = false;
  }, [layout, currentPage, pageCount, zoom, pageHeights]);

  const noteScroll = (top: number, viewport: number) => {
    if (positioning.current) return;
    setScrollTop(top);
    if (layout !== 'continuous') return;
    const page = pageAtScroll(top, viewport, zoom, pageCount, pageHeights);
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
    const slots = spreadSlots(currentPage, pageCount, true);
    const { left, right } = slots;
    const sameMeasured =
      measured?.renderer === renderer && measured.pageCount === pageCount ? measured : null;
    const spreadPages: (PagePoints | null)[] = Array.from({ length: pageCount }, (_, index) => {
      if (!sameMeasured) return null;
      const width = sameMeasured.widths[index];
      const height = sameMeasured.heights[index];
      if (width > 0 && height > 0) return { width, height };
      return null;
    });
    const placeholderSize = spreadPlaceholderSize(slots, spreadPages);
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
        <SpreadSide
          renderer={renderer}
          pageNumber={left}
          zoom={zoom}
          placeholderSize={placeholderSize}
        />
        <SpreadSide
          renderer={renderer}
          pageNumber={right}
          zoom={zoom}
          placeholderSize={placeholderSize}
        />
      </div>
    );
  }

  const anchor = pageAtScroll(scrollTop, viewportHeight, zoom, pageCount, pageHeights);
  const start = Math.max(1, anchor - PAGE_BUFFER);
  const end = Math.min(pageCount, anchor + PAGE_BUFFER);
  const pagesToDraw: number[] = [];
  for (let page = start; page <= end; page += 1) pagesToDraw.push(page);
  const contentHeight = pageOffset(pageCount + 1, zoom, pageHeights, pageCount);

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
      <div className="relative w-full" style={{ height: contentHeight }}>
        {pagesToDraw.map((pageNumber) => {
          const slot = pageSlot(pageNumber, zoom, pageHeights, pageCount);
          return (
            <div
              key={pageNumber}
              className="absolute left-0 right-0 flex justify-center"
              style={{ top: slot.top, height: slot.height }}
              data-page-number={pageNumber}
              aria-label={`Page ${pageNumber}`}
            >
              <PageCanvas renderer={renderer} pageNumber={pageNumber} scale={zoom} />
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
  placeholderSize,
}: {
  renderer: PDFRenderer;
  pageNumber: number | null;
  zoom: number;
  placeholderSize: PagePoints | null;
}) {
  if (!pageNumber) {
    const scale = zoom / 100;
    const style =
      placeholderSize !== null
        ? {
            width: placeholderSize.width * scale,
            height: placeholderSize.height * scale,
          }
        : undefined;
    return (
      <div
        data-testid="spread-placeholder"
        className="bg-gray-300 dark:bg-gray-700"
        style={style}
      />
    );
  }
  return <PageCanvas renderer={renderer} pageNumber={pageNumber} scale={zoom} />;
}
