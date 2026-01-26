import { useEffect, useCallback } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { SinglePageView } from './SinglePageView';
import { ContinuousView } from './ContinuousView';
import { SpreadView } from './SpreadView';

export function PDFViewer() {
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
  const zoomIn = useDocumentStore((state) => state.zoomIn);
  const zoomOut = useDocumentStore((state) => state.zoomOut);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fileName) return;

      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          if (viewMode === 'spread') {
            // Jump by 2 pages in spread mode
            setCurrentPage(Math.max(1, currentPage - 2));
          } else {
            prevPage();
          }
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          if (viewMode === 'spread') {
            // Jump by 2 pages in spread mode
            setCurrentPage(Math.min(pageCount, currentPage + 2));
          } else {
            nextPage();
          }
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(pageCount);
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    fileName,
    pageCount,
    currentPage,
    viewMode,
    nextPage,
    prevPage,
    setCurrentPage,
    zoomIn,
    zoomOut,
  ]);

  // Handle wheel zoom with Ctrl
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    },
    [zoomIn, zoomOut]
  );

  // Handle page change from continuous view
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
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

  // Render based on view mode
  switch (viewMode) {
    case 'single':
      return (
        <SinglePageView
          renderer={renderer}
          currentPage={currentPage}
          zoom={zoom}
          onWheel={handleWheel}
        />
      );

    case 'continuous':
      return (
        <ContinuousView
          renderer={renderer}
          pageCount={pageCount}
          currentPage={currentPage}
          zoom={zoom}
          onPageChange={handlePageChange}
          onWheel={handleWheel}
        />
      );

    case 'spread':
      return (
        <SpreadView
          renderer={renderer}
          currentPage={currentPage}
          pageCount={pageCount}
          zoom={zoom}
          onWheel={handleWheel}
        />
      );

    default:
      return null;
  }
}
