import { ZoomIn, ZoomOut, Maximize, Maximize2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useDocumentStore } from '@stores/documentStore';

interface ZoomControlsProps {
  className?: string;
}

export function ZoomControls({ className }: ZoomControlsProps) {
  const zoom = useDocumentStore((state) => state.zoom);
  const zoomIn = useDocumentStore((state) => state.zoomIn);
  const zoomOut = useDocumentStore((state) => state.zoomOut);
  const setZoom = useDocumentStore((state) => state.setZoom);

  // Reset zoom to 100%
  const handleResetZoom = () => {
    setZoom(100);
  };

  // Fit to width (approximately 100% for most documents)
  const handleFitWidth = () => {
    // This would ideally calculate based on container width
    // For now, use a reasonable default
    setZoom(100);
  };

  // Fit to page (show entire page)
  const handleFitPage = () => {
    // This would ideally calculate based on container dimensions
    // For now, use a smaller zoom to fit page
    setZoom(75);
  };

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={zoomOut}
        disabled={zoom <= 10}
        aria-label="Zoom out"
        title="Zoom out (decreases by 25%)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <button
        onClick={handleResetZoom}
        className="min-w-[50px] text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        title="Reset to 100%"
        aria-label={`Current zoom: ${zoom}%. Click to reset to 100%.`}
      >
        {zoom}%
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={zoomIn}
        disabled={zoom >= 400}
        aria-label="Zoom in"
        title="Zoom in (increases by 25%)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleFitWidth}
        aria-label="Fit to width"
        title="Fit to width"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleFitPage}
        aria-label="Fit to page"
        title="Fit to page"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
