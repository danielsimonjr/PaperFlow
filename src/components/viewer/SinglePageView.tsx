import { useRef, useCallback, useEffect, useState } from 'react';
import { PageCanvas } from './PageCanvas';
import { PDFRenderer } from '@lib/pdf/renderer';
import { useUIStore } from '@stores/uiStore';
import { cn } from '@utils/cn';

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
  const activeTool = useUIStore((state) => state.activeTool);

  // Pan state for hand tool
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  // Hand tool panning handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === 'hand' && containerRef.current) {
        setIsPanning(true);
        setPanStart({
          x: e.clientX + containerRef.current.scrollLeft,
          y: e.clientY + containerRef.current.scrollTop,
        });
        e.preventDefault();
      }
    },
    [activeTool]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning && containerRef.current) {
        containerRef.current.scrollLeft = panStart.x - e.clientX;
        containerRef.current.scrollTop = panStart.y - e.clientY;
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full items-center justify-center overflow-auto bg-gray-200 p-8 dark:bg-gray-800",
        activeTool === 'hand' && "cursor-grab",
        activeTool === 'hand' && isPanning && "cursor-grabbing"
      )}
      onWheel={onWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
