import { useEffect, useRef, useState, useCallback } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';
import { AnnotationLayer } from '@components/annotations/AnnotationLayer';
import { FormLayer } from '@components/forms/FormLayer';
import { TextLayer, type TextSelection } from './TextLayer';
import { SelectionPopup } from '@components/annotations/SelectionPopup';
import { NoteTool } from '@components/annotations/NoteTool';
import { DrawingCanvas } from '@components/annotations/DrawingCanvas';
import { RectangleTool } from '@components/annotations/RectangleTool';
import { EllipseTool } from '@components/annotations/EllipseTool';
import { ArrowTool } from '@components/annotations/ArrowTool';
import { LineTool } from '@components/annotations/LineTool';
import { useAnnotationStore } from '@stores/annotationStore';
import { useUIStore } from '@stores/uiStore';
import { useFormStore } from '@stores/formStore';

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
  const activeShapeType = useAnnotationStore((state) => state.activeShapeType);
  const editorTool = useUIStore((state) => state.activeTool);
  const formFields = useFormStore((state) => state.getFieldsForPage(pageNumber - 1));

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
      // Ignore cancelled render errors (PDF.js can return various formats)
      if (err instanceof Error && err.message.includes('cancelled')) {
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

  // Get annotation store actions
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);

  // Handle text selection from text layer
  const handleTextSelection = useCallback((selection: TextSelection | null) => {
    // If an annotation tool is active and we have a selection, auto-create the annotation
    if (selection && activeTool && ['highlight', 'underline', 'strikethrough'].includes(activeTool)) {
      const scaleValue = scale / 100;
      const pdfRects = selection.rects.map((rect) => ({
        x: rect.x / scaleValue,
        y: pageHeight - (rect.y + rect.height) / scaleValue,
        width: rect.width / scaleValue,
        height: rect.height / scaleValue,
      }));

      addAnnotation({
        type: activeTool,
        pageIndex: pageNumber - 1,
        rects: pdfRects,
        color: activeColor,
        opacity: activeOpacity,
        content: selection.text,
      });

      // Clear the native selection
      window.getSelection()?.removeAllRanges();
      setTextSelection(null);
      return;
    }

    setTextSelection(selection);
  }, [activeTool, activeColor, scale, pageHeight, pageNumber, addAnnotation]);

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

      {/* Text Layer for selection - disable when drawing tools are active */}
      {dimensions.width > 0 && (
        <div style={{ pointerEvents: (editorTool === 'draw' || editorTool === 'shape') ? 'none' : 'auto' }}>
          <TextLayer
            renderer={renderer}
            pageNumber={pageNumber}
            scale={scale}
            width={dimensions.width}
            height={dimensions.height}
            onTextSelected={handleTextSelection}
          />
        </div>
      )}

      {/* Annotation Layer - disable when drawing tools are active */}
      {dimensions.width > 0 && pageHeight > 0 && (
        <div style={{ pointerEvents: (editorTool === 'draw' || editorTool === 'shape') ? 'none' : 'auto' }}>
          <AnnotationLayer
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
          />
        </div>
      )}

      {/* Form Layer - disable when drawing tools are active */}
      {dimensions.width > 0 && pageHeight > 0 && formFields.length > 0 && (
        <div style={{ pointerEvents: (editorTool === 'draw' || editorTool === 'shape') ? 'none' : 'auto' }}>
          <FormLayer
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
          />
        </div>
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

      {/* Drawing Canvas Overlay */}
      {dimensions.width > 0 && (
        <DrawingCanvas
          pageIndex={pageNumber - 1}
          width={dimensions.width}
          height={dimensions.height}
          scale={scaleValue}
          isActive={editorTool === 'draw'}
        />
      )}

      {/* Shape Tools */}
      {dimensions.width > 0 && editorTool === 'shape' && (
        <>
          <RectangleTool
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
            isActive={activeShapeType === 'rectangle'}
          />
          <EllipseTool
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
            isActive={activeShapeType === 'ellipse'}
          />
          <ArrowTool
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
            isActive={activeShapeType === 'arrow'}
          />
          <LineTool
            pageIndex={pageNumber - 1}
            width={dimensions.width}
            height={dimensions.height}
            scale={scaleValue}
            pageHeight={pageHeight}
            isActive={activeShapeType === 'line'}
          />
        </>
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
