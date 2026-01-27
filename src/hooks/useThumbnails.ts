import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';

interface ThumbnailCache {
  [pageNumber: number]: string;
}

interface UseThumbnailsOptions {
  renderer: PDFRenderer | null;
  pageCount: number;
  scale?: number;
}

interface UseThumbnailsReturn {
  getThumbnail: (pageNumber: number) => string | null;
  generateThumbnail: (pageNumber: number) => Promise<string | null>;
  isGenerating: (pageNumber: number) => boolean;
  clearCache: () => void;
}

// Default thumbnail scale (0.2 = 20% of original size)
const DEFAULT_THUMBNAIL_SCALE = 0.2;

export function useThumbnails({
  renderer,
  pageCount,
  scale = DEFAULT_THUMBNAIL_SCALE,
}: UseThumbnailsOptions): UseThumbnailsReturn {
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const generatingRef = useRef<Set<number>>(new Set());
  const canvasPoolRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Clear cache when renderer changes
  useEffect(() => {
    setThumbnailCache({});
    generatingRef.current.clear();
    canvasPoolRef.current.clear();
  }, [renderer]);

  const getThumbnail = useCallback(
    (pageNumber: number): string | null => {
      return thumbnailCache[pageNumber] || null;
    },
    [thumbnailCache]
  );

  const generateThumbnail = useCallback(
    async (pageNumber: number): Promise<string | null> => {
      if (!renderer || pageNumber < 1 || pageNumber > pageCount) {
        return null;
      }

      // Check if already cached
      if (thumbnailCache[pageNumber]) {
        return thumbnailCache[pageNumber];
      }

      // Check if currently generating
      if (generatingRef.current.has(pageNumber)) {
        return null;
      }

      generatingRef.current.add(pageNumber);

      try {
        // Reuse canvas from pool or create new one
        let canvas = canvasPoolRef.current.get(pageNumber);
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasPoolRef.current.set(pageNumber, canvas);
        }

        // Render page at thumbnail scale
        await renderer.renderPage(pageNumber, canvas, scale);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Cache the thumbnail
        setThumbnailCache((prev) => ({
          ...prev,
          [pageNumber]: dataUrl,
        }));

        return dataUrl;
      } catch (error) {
        console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error);
        return null;
      } finally {
        generatingRef.current.delete(pageNumber);
      }
    },
    [renderer, pageCount, scale, thumbnailCache]
  );

  const isGenerating = useCallback((pageNumber: number): boolean => {
    return generatingRef.current.has(pageNumber);
  }, []);

  const clearCache = useCallback(() => {
    setThumbnailCache({});
    canvasPoolRef.current.clear();
  }, []);

  return {
    getThumbnail,
    generateThumbnail,
    isGenerating,
    clearCache,
  };
}

/**
 * Hook for lazy loading thumbnails using IntersectionObserver
 */
interface UseLazyThumbnailOptions {
  renderer: PDFRenderer | null;
  scale?: number;
  rootMargin?: string;
  threshold?: number;
}

interface UseLazyThumbnailReturn {
  thumbnails: ThumbnailCache;
  observeElement: (pageNumber: number, element: HTMLElement | null) => void;
  unobserveAll: () => void;
  clearThumbnails: () => void;
}

export function useLazyThumbnails({
  renderer,
  scale = DEFAULT_THUMBNAIL_SCALE,
  rootMargin = '200px',
  threshold = 0.1,
}: UseLazyThumbnailOptions): UseLazyThumbnailReturn {
  const [thumbnails, setThumbnails] = useState<ThumbnailCache>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<number, HTMLElement>>(new Map());
  const generatingRef = useRef<Set<number>>(new Set());

  // Create observer
  useEffect(() => {
    if (!renderer) return;

    const generateThumbnail = async (pageNumber: number) => {
      if (generatingRef.current.has(pageNumber)) return;
      if (thumbnails[pageNumber]) return;

      generatingRef.current.add(pageNumber);

      try {
        const canvas = document.createElement('canvas');
        await renderer.renderPage(pageNumber, canvas, scale);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        setThumbnails((prev) => ({
          ...prev,
          [pageNumber]: dataUrl,
        }));
      } catch (error) {
        console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error);
      } finally {
        generatingRef.current.delete(pageNumber);
      }
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = Number(entry.target.getAttribute('data-page'));
            if (!isNaN(pageNumber)) {
              generateThumbnail(pageNumber);
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Observe any existing elements
    elementsRef.current.forEach((element, pageNumber) => {
      element.setAttribute('data-page', String(pageNumber));
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [renderer, scale, rootMargin, threshold, thumbnails]);

  // Clear thumbnails when renderer changes
  useEffect(() => {
    setThumbnails({});
    generatingRef.current.clear();
  }, [renderer]);

  const observeElement = useCallback(
    (pageNumber: number, element: HTMLElement | null) => {
      // Remove old element if exists
      const oldElement = elementsRef.current.get(pageNumber);
      if (oldElement && observerRef.current) {
        observerRef.current.unobserve(oldElement);
      }

      if (element) {
        elementsRef.current.set(pageNumber, element);
        element.setAttribute('data-page', String(pageNumber));
        observerRef.current?.observe(element);
      } else {
        elementsRef.current.delete(pageNumber);
      }
    },
    []
  );

  const unobserveAll = useCallback(() => {
    observerRef.current?.disconnect();
    elementsRef.current.clear();
  }, []);

  const clearThumbnails = useCallback(() => {
    setThumbnails({});
    generatingRef.current.clear();
  }, []);

  return {
    thumbnails,
    observeElement,
    unobserveAll,
    clearThumbnails,
  };
}
