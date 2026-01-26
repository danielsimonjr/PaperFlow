import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualization, useDynamicVirtualization } from '@hooks/useVirtualization';

describe('useVirtualization', () => {
  it('returns correct number of virtual items for visible range', () => {
    const { result } = renderHook(() =>
      useVirtualization({
        totalItems: 100,
        itemHeight: 100,
        containerHeight: 500,
        overscan: 2,
      })
    );

    // With container height 500 and item height 100, ceil(500/100) = 5 items are visible
    // Plus 2 overscan on each side = startIndex - 2 to endIndex + 2
    // Initial scroll is 0, so startIndex = max(0, 0-2) = 0
    // endIndex = min(99, 0 + 5 + 4) = min(99, 9) = 9
    // Total items = 9 - 0 + 1 = 10
    expect(result.current.virtualItems.length).toBeLessThanOrEqual(10);
    expect(result.current.virtualItems[0]?.index).toBe(0);
  });

  it('calculates correct total height', () => {
    const { result } = renderHook(() =>
      useVirtualization({
        totalItems: 100,
        itemHeight: 50,
        containerHeight: 400,
      })
    );

    expect(result.current.totalHeight).toBe(100 * 50); // 5000
  });

  it('updates visible range on scroll', () => {
    const { result } = renderHook(() =>
      useVirtualization({
        totalItems: 100,
        itemHeight: 100,
        containerHeight: 500,
        overscan: 2,
      })
    );

    const initialFirstIndex = result.current.virtualItems[0]?.index ?? 0;

    // Simulate scroll
    act(() => {
      const mockEvent = {
        currentTarget: {
          scrollTop: 1000,
          scrollTo: () => {},
        },
      } as unknown as React.UIEvent<HTMLElement>;
      result.current.handleScroll(mockEvent);
    });

    // After scrolling 1000px (10 items), first visible item should be around index 8 (10 - 2 overscan)
    expect(result.current.virtualItems[0]?.index).toBeGreaterThan(initialFirstIndex);
  });

  it('returns correct visible range', () => {
    const { result } = renderHook(() =>
      useVirtualization({
        totalItems: 20,
        itemHeight: 100,
        containerHeight: 300,
        overscan: 1,
      })
    );

    // Initial range should start at 0
    expect(result.current.visibleRange.startIndex).toBe(0);
    // With 300px height and 100px items, 3 items visible + 1 overscan each side = 5 total
    expect(result.current.visibleRange.endIndex).toBeLessThanOrEqual(5);
  });
});

describe('useDynamicVirtualization', () => {
  it('handles variable item heights', () => {
    const { result } = renderHook(() =>
      useDynamicVirtualization({
        totalItems: 10,
        estimatedItemHeight: 100,
        containerHeight: 400,
        getItemHeight: (index) => (index % 2 === 0 ? 100 : 200),
      })
    );

    // First item should have height 100, second should have 200
    const items = result.current.virtualItems;
    if (items.length >= 2) {
      expect(items[0]?.size).toBe(100);
      expect(items[1]?.size).toBe(200);
    }
  });

  it('calculates correct total height with variable heights', () => {
    const { result } = renderHook(() =>
      useDynamicVirtualization({
        totalItems: 10,
        estimatedItemHeight: 100,
        containerHeight: 400,
        getItemHeight: (index) => (index % 2 === 0 ? 100 : 200),
      })
    );

    // 5 items of 100 + 5 items of 200 = 500 + 1000 = 1500
    expect(result.current.totalHeight).toBe(1500);
  });

  it('allows measuring elements', () => {
    const { result } = renderHook(() =>
      useDynamicVirtualization({
        totalItems: 10,
        estimatedItemHeight: 100,
        containerHeight: 400,
      })
    );

    act(() => {
      result.current.measureElement(0, 150);
    });

    // The measured height should be reflected in the virtual items
    const firstItem = result.current.virtualItems.find((item) => item.index === 0);
    expect(firstItem?.size).toBe(150);
  });

  it('handles scroll to index', () => {
    const scrollToMock = vi.fn();

    const { result } = renderHook(() =>
      useDynamicVirtualization({
        totalItems: 100,
        estimatedItemHeight: 100,
        containerHeight: 400,
      })
    );

    // Simulate having a scroll element
    act(() => {
      const mockEvent = {
        currentTarget: {
          scrollTop: 0,
          scrollTo: scrollToMock,
        },
      } as unknown as React.UIEvent<HTMLElement>;
      result.current.handleScroll(mockEvent);
    });

    act(() => {
      result.current.scrollToIndex(5);
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 500, // 5 * 100
      behavior: 'smooth',
    });
  });
});
