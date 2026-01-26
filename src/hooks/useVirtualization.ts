import { useState, useCallback, useRef, useMemo } from 'react';

interface VirtualizationOptions {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

interface UseVirtualizationReturn {
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  visibleRange: { startIndex: number; endIndex: number };
  handleScroll: (e: React.UIEvent<HTMLElement>) => void;
  scrollTop: number;
}

export function useVirtualization({
  totalItems,
  itemHeight,
  containerHeight,
  overscan = 2,
}: VirtualizationOptions): UseVirtualizationReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleCount + overscan * 2
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, totalItems, overscan]);

  // Generate virtual items for the visible range
  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight,
      });
    }

    return items;
  }, [visibleRange, itemHeight]);

  const totalHeight = totalItems * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    scrollElementRef.current = target;
    setScrollTop(target.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const targetScroll = index * itemHeight;

      if (scrollElementRef.current) {
        scrollElementRef.current.scrollTo({
          top: targetScroll,
          behavior,
        });
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    visibleRange,
    handleScroll,
    scrollTop,
  };
}

/**
 * More flexible virtualization hook that supports variable item heights
 */
interface DynamicVirtualizationOptions {
  totalItems: number;
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

interface DynamicVirtualItem {
  index: number;
  start: number;
  size: number;
}

interface UseDynamicVirtualizationReturn {
  virtualItems: DynamicVirtualItem[];
  totalHeight: number;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  handleScroll: (e: React.UIEvent<HTMLElement>) => void;
  measureElement: (index: number, height: number) => void;
  scrollTop: number;
}

export function useDynamicVirtualization({
  totalItems,
  estimatedItemHeight,
  containerHeight,
  overscan = 2,
  getItemHeight,
}: DynamicVirtualizationOptions): UseDynamicVirtualizationReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(
    new Map()
  );
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Get height for an item (measured or estimated)
  const getHeight = useCallback(
    (index: number): number => {
      if (getItemHeight) return getItemHeight(index);
      return measuredHeights.get(index) ?? estimatedItemHeight;
    },
    [measuredHeights, estimatedItemHeight, getItemHeight]
  );

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: { start: number; end: number }[] = [];
    let currentOffset = 0;

    for (let i = 0; i < totalItems; i++) {
      const height = getHeight(i);
      positions.push({
        start: currentOffset,
        end: currentOffset + height,
      });
      currentOffset += height;
    }

    return positions;
  }, [totalItems, getHeight]);

  const totalHeight = itemPositions.length > 0
    ? (itemPositions[itemPositions.length - 1]?.end ?? 0)
    : 0;

  // Find visible items using binary search
  const virtualItems = useMemo(() => {
    if (itemPositions.length === 0) return [];

    // Binary search for start index
    let startIndex = 0;
    let low = 0;
    let high = itemPositions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midPos = itemPositions[mid];
      if (midPos && midPos.end < scrollTop) {
        low = mid + 1;
      } else {
        startIndex = mid;
        high = mid - 1;
      }
    }

    startIndex = Math.max(0, startIndex - overscan);

    // Find end index
    const viewportEnd = scrollTop + containerHeight;
    let endIndex = startIndex;

    while (endIndex < itemPositions.length) {
      const pos = itemPositions[endIndex];
      if (!pos || pos.start >= viewportEnd) break;
      endIndex++;
    }

    endIndex = Math.min(itemPositions.length - 1, endIndex + overscan);

    // Generate virtual items
    const items: DynamicVirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const pos = itemPositions[i];
      if (pos) {
        items.push({
          index: i,
          start: pos.start,
          size: pos.end - pos.start,
        });
      }
    }

    return items;
  }, [itemPositions, scrollTop, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    scrollElementRef.current = target;
    setScrollTop(target.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (index < 0 || index >= itemPositions.length) return;

      const pos = itemPositions[index];
      if (!pos) return;

      const targetScroll = pos.start;

      if (scrollElementRef.current) {
        scrollElementRef.current.scrollTo({
          top: targetScroll,
          behavior,
        });
      }
    },
    [itemPositions]
  );

  const measureElement = useCallback((index: number, height: number) => {
    setMeasuredHeights((prev) => {
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    handleScroll,
    measureElement,
    scrollTop,
  };
}
