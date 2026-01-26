import { useRef, useCallback, useEffect } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';

interface SinglePageViewProps {
  renderer: PDFRenderer;
  currentPage: number;
  zoom: number;
  onWheel?: (e: React.WheelEvent) => void;
}

export function SinglePageView({
  renderer,
  currentPage,
  zoom,
  onWheel,
}: SinglePageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to center when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        left: 0,
      });
    }
  }, [currentPage]);

  const handlePageRendered = useCallback(
    (result: { width: number; height: number }) => {
      // Could be used for fit-to-width calculations
      console.debug('Page rendered:', result);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="flex h-full items-center justify-center overflow-auto bg-gray-200 p-8 dark:bg-gray-800"
      onWheel={onWheel}
    >
      <PageCanvas
        renderer={renderer}
        pageNumber={currentPage}
        scale={zoom}
        onPageRendered={handlePageRendered}
      />
    </div>
  );
}
