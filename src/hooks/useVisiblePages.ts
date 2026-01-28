import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

export interface VisiblePage {
  pageNumber: number;
  isVisible: boolean;
  isBuffered: boolean;
}

interface UseVisiblePagesOptions {
  pageCount: number;
  bufferSize?: number;
}

interface UseVisiblePagesReturn {
  visiblePages: VisiblePage[];
  currentVisiblePage: number;
  registerPageElement: (pageNumber: number, element: HTMLElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Track which pages are currently visible in the viewport using IntersectionObserver.
 * Returns visible pages plus a configurable buffer of pages above and below.
 */
export function useVisiblePages({
  pageCount,
  bufferSize = 2,
}: UseVisiblePagesOptions): UseVisiblePagesReturn {
  const [visibleSet, setVisibleSet] = useState<Set<number>>(new Set([1]));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Set up IntersectionObserver
  useEffect(() => {
    const options: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin: '200px 0px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      setVisibleSet((prev) => {
        const next = new Set(prev);
        for (const entry of entries) {
          const pageNumber = Number(
            (entry.target as HTMLElement).dataset.pageNumber
          );
          if (!isNaN(pageNumber)) {
            if (entry.isIntersecting) {
              next.add(pageNumber);
            } else {
              next.delete(pageNumber);
            }
          }
        }
        return next;
      });
    }, options);

    // Observe all currently registered elements
    for (const [, element] of elementsRef.current) {
      observerRef.current.observe(element);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const registerPageElement = useCallback(
    (pageNumber: number, element: HTMLElement | null) => {
      const observer = observerRef.current;

      if (element) {
        element.dataset.pageNumber = String(pageNumber);
        elementsRef.current.set(pageNumber, element);
        observer?.observe(element);
      } else {
        const existing = elementsRef.current.get(pageNumber);
        if (existing) {
          observer?.unobserve(existing);
          elementsRef.current.delete(pageNumber);
        }
      }
    },
    []
  );

  const currentVisiblePage = useMemo(() => {
    const sorted = Array.from(visibleSet).sort((a, b) => a - b);
    return sorted[0] ?? 1;
  }, [visibleSet]);

  const visiblePages = useMemo(() => {
    const result: VisiblePage[] = [];

    // Calculate buffer range
    const minVisible = Math.min(...Array.from(visibleSet));
    const maxVisible = Math.max(...Array.from(visibleSet));
    const bufferStart = Math.max(1, (isFinite(minVisible) ? minVisible : 1) - bufferSize);
    const bufferEnd = Math.min(pageCount, (isFinite(maxVisible) ? maxVisible : 1) + bufferSize);

    for (let i = bufferStart; i <= bufferEnd; i++) {
      result.push({
        pageNumber: i,
        isVisible: visibleSet.has(i),
        isBuffered: !visibleSet.has(i),
      });
    }

    return result;
  }, [visibleSet, pageCount, bufferSize]);

  return {
    visiblePages,
    currentVisiblePage,
    registerPageElement,
    containerRef,
  };
}
