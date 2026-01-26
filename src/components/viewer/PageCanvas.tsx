import { useEffect, useRef, useState, useCallback } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';

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

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);
    setError(null);

    try {
      const result = await renderer.renderPage(pageNumber, canvas, scale / 100);
      onPageRendered?.(result);
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

  if (error) {
    return (
      <div className="flex items-center justify-center bg-white p-8 shadow-lg dark:bg-gray-700">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        className="block shadow-lg"
        style={{ background: 'white' }}
      />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
