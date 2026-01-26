import { useEffect, useRef, useState, useCallback } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';
import { AnnotationLayer } from '@components/annotations/AnnotationLayer';
import { TextLayer, type TextSelection } from './TextLayer';
import { SelectionPopup } from '@components/annotations/SelectionPopup';
import { NoteTool } from '@components/annotations/NoteTool';
import { useAnnotationStore } from '@stores/annotationStore';

interface PageCanvasProps {
  renderer: PDFRenderer;
  pageNumber: number;
  scale: number;
  onPageRendered?: (dimensions: { width: number; height: number }) => void;
}

export function PageCanvas({
  renderer,
  pageNumber,
  scale,
  onPageRendered,
}: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pageHeight, setPageHeight] = useState(0);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);

  const activeTool = useAnnotationStore((state) => state.activeTool);

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    setError(null);

    try {
      const result = await renderer.renderPage(pageNumber, canvas, scale / 100);
      setDimensions(result);
      onPageRendered?.(result);

      // Get page height in PDF points for coordinate conversion
      const pageInfo = await renderer.getPageInfo(pageNumber);
      setPageHeight(pageInfo.height);
    } catch (err) {
      // Ignore cancelled render errors
      if (err instanceof Error && err.message === 'Rendering cancelled') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to render page');
    } finally {
      setIsRendering(false);
    }
  }, [renderer, pageNumber, scale, onPageRendered]);

  useEffect(() => {
    renderPage();

    return () => {
      renderer.cancelRender(pageNumber);
    };
  }, [renderPage, renderer, pageNumber]);

  // Handle text selection from text layer
  const handleTextSelection = useCallback((selection: TextSelection | null) => {
    setTextSelection(selection);
  }, []);

  // Clear selection popup
  const clearSelection = useCallback(() => {
    setTextSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  // Convert screen selection rects to PDF rects
  const getPdfRects = useCallback(() => {
    if (!textSelection) return [];
    const scaleValue = scale / 100;
    return textSelection.rects.map((rect) => ({
      x: rect.x / scaleValue,
      y: pageHeight - (rect.y + rect.height) / scaleValue,
      width: rect.width / scaleValue,
      height: rect.height / scaleValue,
    }));
  }, [textSelection, scale, pageHeight]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-white p-8 shadow-lg dark:bg-gray-700">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const scaleValue = scale / 100;

  return (
    <div className="relative inline-block">
      {/* PDF Canvas */}
      <canvas
        ref={canvasRef}
        className="block shadow-lg"
        style={{ background: 'white' }}
      />

      {/* Text Layer for selection */}
      {dimensions.width > 0 && (
        <TextLayer
          renderer={renderer}
          pageNumber={pageNumber}
          scale={scale}
          width={dimensions.width}
          height={dimensions.height}
          onTextSelected={handleTextSelection}
        />
      )}

      {/* Annotation Layer */}
      {dimensions.width > 0 && pageHeight > 0 && (
        <AnnotationLayer
          pageIndex={pageNumber - 1}
          width={dimensions.width}
          height={dimensions.height}
          scale={scaleValue}
          pageHeight={pageHeight}
        />
      )}

      {/* Note Tool Overlay */}
      {activeTool === 'note' && dimensions.width > 0 && (
        <NoteTool
          pageIndex={pageNumber - 1}
          scale={scaleValue}
          pageHeight={pageHeight}
          onNoteCreated={clearSelection}
        />
      )}

      {/* Selection Popup */}
      {textSelection && textSelection.rects.length > 0 && !activeTool && (
        <SelectionPopup
          position={{
            x: (textSelection.rects[textSelection.rects.length - 1]?.x ?? 0) +
              (textSelection.rects[textSelection.rects.length - 1]?.width ?? 0) / 2,
            y: textSelection.rects[0]?.y ?? 0,
          }}
          text={textSelection.text}
          pdfRects={getPdfRects()}
          pageIndex={pageNumber - 1}
          onAnnotationCreated={clearSelection}
          onClose={clearSelection}
        />
      )}

      {/* Loading indicator */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
