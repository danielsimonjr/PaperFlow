/**
 * Enhanced Print Preview Component
 *
 * Displays an accurate print preview with actual paper size rendering,
 * margin visualization, and page layout options.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePrintStore } from '@stores/printStore';
import { useDocumentStore } from '@stores/documentStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

/**
 * Paper dimensions in points (1/72 inch)
 */
const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
  A3: { width: 842, height: 1191 },
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 },
  B4: { width: 709, height: 1001 },
  B5: { width: 499, height: 709 },
};

interface PrintPreviewEnhancedProps {
  className?: string;
  showMargins?: boolean;
  showGrid?: boolean;
  onPageChange?: (page: number) => void;
}

export function PrintPreviewEnhanced({
  className,
  showMargins = true,
  showGrid = false,
  onPageChange,
}: PrintPreviewEnhancedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { settings } = usePrintStore();
  const { renderer, pageCount, currentPage } = useDocumentStore();

  const [previewPage, setPreviewPage] = useState(currentPage);
  const [scale, setScale] = useState(1);
  const [isRendering, setIsRendering] = useState(false);

  // Get paper dimensions
  const paperDimensions = useMemo(() => {
    const size = PAPER_SIZES[settings.paperSize] ?? PAPER_SIZES.Letter!;
    return settings.landscape
      ? { width: size.height, height: size.width }
      : size;
  }, [settings.paperSize, settings.landscape]);

  // Calculate scale to fit container
  const calculateScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 1;

    const containerRect = container.getBoundingClientRect();
    const padding = 40;
    const availableWidth = containerRect.width - padding * 2;
    const availableHeight = containerRect.height - padding * 2;

    const scaleX = availableWidth / paperDimensions.width;
    const scaleY = availableHeight / paperDimensions.height;

    return Math.min(scaleX, scaleY, 1);
  }, [paperDimensions]);

  // Update scale on resize
  useEffect(() => {
    const handleResize = () => {
      setScale(calculateScale());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  // Render preview
  useEffect(() => {
    const renderPreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !renderer) return;

      setIsRendering(true);

      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const displayScale = scale * window.devicePixelRatio;
        const canvasWidth = paperDimensions.width * displayScale;
        const canvasHeight = paperDimensions.height * displayScale;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${paperDimensions.width * scale}px`;
        canvas.style.height = `${paperDimensions.height * scale}px`;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Calculate content area (excluding margins)
        const margins = settings.margins;
        const contentX = margins.left * displayScale;
        const contentY = margins.top * displayScale;
        const contentWidth =
          (paperDimensions.width - margins.left - margins.right) * displayScale;
        const contentHeight =
          (paperDimensions.height - margins.top - margins.bottom) * displayScale;

        // Render PDF page
        const page = await renderer.getPage(previewPage);
        if (page) {
          const pageViewport = page.getViewport({ scale: 1 });
          const pageAspect = pageViewport.width / pageViewport.height;
          const contentAspect = contentWidth / contentHeight;

          let renderWidth = contentWidth;
          let renderHeight = contentHeight;
          let offsetX = contentX;
          let offsetY = contentY;

          // Apply scaling
          const userScale = settings.scale / 100;
          if (pageAspect > contentAspect) {
            renderWidth = contentWidth * userScale;
            renderHeight = (contentWidth / pageAspect) * userScale;
            offsetX = contentX + (contentWidth - renderWidth) / 2;
            offsetY = contentY + (contentHeight - renderHeight) / 2;
          } else {
            renderHeight = contentHeight * userScale;
            renderWidth = contentHeight * pageAspect * userScale;
            offsetX = contentX + (contentWidth - renderWidth) / 2;
            offsetY = contentY + (contentHeight - renderHeight) / 2;
          }

          // Create temporary canvas for PDF rendering
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = renderWidth;
          tempCanvas.height = renderHeight;
          const tempCtx = tempCanvas.getContext('2d');

          if (tempCtx) {
            const viewport = page.getViewport({
              scale: (renderWidth / pageViewport.width),
            });

            await page.render({
              canvasContext: tempCtx,
              viewport,
            }).promise;

            // Draw rendered page onto preview canvas
            ctx.drawImage(tempCanvas, offsetX, offsetY);
          }
        }

        // Draw margins if enabled
        if (showMargins) {
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);
          ctx.setLineDash([]);
        }

        // Draw grid if enabled
        if (showGrid) {
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 0.5;
          const gridSize = 72 * displayScale; // 1 inch grid

          for (let x = 0; x <= canvasWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
          }

          for (let y = 0; y <= canvasHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
          }
        }
      } catch (error) {
        console.error('Preview render error:', error);
      } finally {
        setIsRendering(false);
      }
    };

    renderPreview();
  }, [
    renderer,
    previewPage,
    scale,
    paperDimensions,
    settings.margins,
    settings.scale,
    showMargins,
    showGrid,
  ]);

  // Handle page navigation
  const handlePrevPage = () => {
    if (previewPage > 1) {
      const newPage = previewPage - 1;
      setPreviewPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleNextPage = () => {
    if (previewPage < pageCount) {
      const newPage = previewPage + 1;
      setPreviewPage(newPage);
      onPageChange?.(newPage);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
        <div className="text-sm font-medium">
          Print Preview
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {settings.paperSize} {settings.landscape ? '(Landscape)' : '(Portrait)'}
          </span>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 overflow-auto"
      >
        <div
          className="relative bg-white shadow-lg"
          style={{
            width: paperDimensions.width * scale,
            height: paperDimensions.height * scale,
          }}
        >
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="block"
          />
        </div>
      </div>

      {/* Preview footer with navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevPage}
            disabled={previewPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {previewPage} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={previewPage >= pageCount}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Scale: {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default PrintPreviewEnhanced;
