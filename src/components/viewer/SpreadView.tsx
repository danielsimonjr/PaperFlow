import { useRef, useCallback, useEffect } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';

interface SpreadViewProps {
  renderer: PDFRenderer;
  currentPage: number;
  pageCount: number;
  zoom: number;
  coverMode?: boolean; // First page alone on right side
  onWheel?: (e: React.WheelEvent) => void;
}

export function SpreadView({
  renderer,
  currentPage,
  pageCount,
  zoom,
  coverMode = true,
  onWheel,
}: SpreadViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when spread changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        left: 0,
      });
    }
  }, [currentPage]);

  // Calculate which pages to show
  const getSpreadPages = useCallback((): { left: number | null; right: number | null } => {
    if (coverMode) {
      // In cover mode, first page is alone on the right
      if (currentPage === 1) {
        return { left: null, right: 1 };
      }

      // After first page, even pages are on left, odd on right
      const isEven = currentPage % 2 === 0;
      if (isEven) {
        return {
          left: currentPage,
          right: currentPage + 1 <= pageCount ? currentPage + 1 : null,
        };
      } else {
        return {
          left: currentPage - 1,
          right: currentPage,
        };
      }
    } else {
      // Without cover mode, odd pages on left, even on right
      const isOdd = currentPage % 2 === 1;
      if (isOdd) {
        return {
          left: currentPage,
          right: currentPage + 1 <= pageCount ? currentPage + 1 : null,
        };
      } else {
        return {
          left: currentPage - 1,
          right: currentPage,
        };
      }
    }
  }, [currentPage, pageCount, coverMode]);

  const { left, right } = getSpreadPages();

  return (
    <div
      ref={containerRef}
      className="flex h-full items-start justify-center gap-4 overflow-auto bg-gray-200 p-8 dark:bg-gray-800"
      onWheel={onWheel}
    >
      {/* Left page or placeholder */}
      <div className="flex items-center justify-center">
        {left ? (
          <PageCanvas
            renderer={renderer}
            pageNumber={left}
            scale={zoom}
          />
        ) : (
          // Placeholder for single-page spread
          <div
            className="bg-gray-300 dark:bg-gray-700"
            style={{
              width: 595 * (zoom / 100),
              height: 842 * (zoom / 100),
            }}
          />
        )}
      </div>

      {/* Right page or placeholder */}
      <div className="flex items-center justify-center">
        {right ? (
          <PageCanvas
            renderer={renderer}
            pageNumber={right}
            scale={zoom}
          />
        ) : (
          // Placeholder for incomplete spread
          <div
            className="bg-gray-300 dark:bg-gray-700"
            style={{
              width: 595 * (zoom / 100),
              height: 842 * (zoom / 100),
            }}
          />
        )}
      </div>
    </div>
  );
}
