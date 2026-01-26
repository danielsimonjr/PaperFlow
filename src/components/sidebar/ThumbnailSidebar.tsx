import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { useLazyThumbnails } from '@hooks/useThumbnails';
import { cn } from '@utils/cn';

type ThumbnailSize = 'small' | 'medium' | 'large';

const THUMBNAIL_SIZES: Record<ThumbnailSize, number> = {
  small: 100,
  medium: 150,
  large: 200,
};

interface ThumbnailSidebarProps {
  className?: string;
}

export function ThumbnailSidebar({ className }: ThumbnailSidebarProps) {
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium');

  const renderer = useDocumentStore((state) => state.renderer);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const currentPage = useDocumentStore((state) => state.currentPage);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);
  const fileName = useDocumentStore((state) => state.fileName);

  const { thumbnails, observeElement } = useLazyThumbnails({
    renderer,
    scale: 0.2,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to current page thumbnail
  useEffect(() => {
    const element = thumbnailRefs.current.get(currentPage);
    if (element && containerRef.current) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage]);

  const handleThumbnailClick = useCallback(
    (pageNumber: number) => {
      setCurrentPage(pageNumber);
    },
    [setCurrentPage]
  );

  const handleThumbnailRef = useCallback(
    (pageNumber: number, element: HTMLDivElement | null) => {
      if (element) {
        thumbnailRefs.current.set(pageNumber, element);
        observeElement(pageNumber, element);
      } else {
        thumbnailRefs.current.delete(pageNumber);
      }
    },
    [observeElement]
  );

  if (!fileName || pageCount === 0) {
    return (
      <div className={cn('p-4 text-sm text-gray-500 dark:text-gray-400', className)}>
        No document loaded
      </div>
    );
  }

  const width = THUMBNAIL_SIZES[thumbnailSize];
  const aspectRatio = 842 / 595; // A4 aspect ratio
  const height = Math.round(width * aspectRatio);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Size selector */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {pageCount} pages
        </span>
        <div className="flex gap-1">
          {(['small', 'medium', 'large'] as ThumbnailSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setThumbnailSize(size)}
              className={cn(
                'h-4 rounded px-2 text-xs',
                thumbnailSize === size
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              {size.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Thumbnails list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3"
      >
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNumber) => (
            <div
              key={pageNumber}
              ref={(el) => handleThumbnailRef(pageNumber, el)}
              onClick={() => handleThumbnailClick(pageNumber)}
              className={cn(
                'group cursor-pointer rounded-lg border-2 p-1 transition-all',
                currentPage === pageNumber
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {/* Thumbnail image or placeholder */}
              <div
                className="relative overflow-hidden rounded bg-white shadow-sm dark:bg-gray-700"
                style={{ width, height }}
              >
                {thumbnails[pageNumber] ? (
                  <img
                    src={thumbnails[pageNumber]}
                    alt={`Page ${pageNumber}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                  </div>
                )}

                {/* Page number overlay */}
                <div className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                  {pageNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
