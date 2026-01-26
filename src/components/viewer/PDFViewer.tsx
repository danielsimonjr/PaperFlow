import { useRef, useEffect, useCallback } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { PageCanvas } from './PageCanvas';

export function PDFViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  const fileName = useDocumentStore((state) => state.fileName);
  const isLoading = useDocumentStore((state) => state.isLoading);
  const error = useDocumentStore((state) => state.error);
  const renderer = useDocumentStore((state) => state.renderer);
  const currentPage = useDocumentStore((state) => state.currentPage);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const zoom = useDocumentStore((state) => state.zoom);
  const viewMode = useDocumentStore((state) => state.viewMode);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);
  const nextPage = useDocumentStore((state) => state.nextPage);
  const prevPage = useDocumentStore((state) => state.prevPage);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fileName) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(pageCount);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileName, pageCount, nextPage, prevPage, setCurrentPage]);

  // Handle wheel zoom with Ctrl
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const { zoomIn, zoomOut } = useDocumentStore.getState();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileName || !renderer) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Open a PDF file to get started
        </p>
      </div>
    );
  }

  // Single page view
  if (viewMode === 'single') {
    return (
      <div
        ref={containerRef}
        className="flex h-full items-center justify-center overflow-auto bg-gray-200 p-8 dark:bg-gray-800"
        onWheel={handleWheel}
      >
        <PageCanvas
          renderer={renderer}
          pageNumber={currentPage}
          scale={zoom}
        />
      </div>
    );
  }

  // Continuous view - show all pages
  if (viewMode === 'continuous') {
    return (
      <div
        ref={containerRef}
        className="flex h-full flex-col items-center gap-4 overflow-auto bg-gray-200 p-8 dark:bg-gray-800"
        onWheel={handleWheel}
      >
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
          <PageCanvas
            key={pageNum}
            renderer={renderer}
            pageNumber={pageNum}
            scale={zoom}
          />
        ))}
      </div>
    );
  }

  // Spread view - show two pages side by side
  return (
    <div
      ref={containerRef}
      className="flex h-full items-start justify-center gap-4 overflow-auto bg-gray-200 p-8 dark:bg-gray-800"
      onWheel={handleWheel}
    >
      {/* Left page */}
      {currentPage > 1 && currentPage % 2 === 0 && (
        <PageCanvas
          renderer={renderer}
          pageNumber={currentPage - 1}
          scale={zoom}
        />
      )}
      {currentPage % 2 === 1 && (
        <PageCanvas
          renderer={renderer}
          pageNumber={currentPage}
          scale={zoom}
        />
      )}

      {/* Right page */}
      {currentPage % 2 === 0 && (
        <PageCanvas
          renderer={renderer}
          pageNumber={currentPage}
          scale={zoom}
        />
      )}
      {currentPage % 2 === 1 && currentPage < pageCount && (
        <PageCanvas
          renderer={renderer}
          pageNumber={currentPage + 1}
          scale={zoom}
        />
      )}
    </div>
  );
}
