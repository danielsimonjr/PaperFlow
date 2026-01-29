import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisiblePages } from '@hooks/useVisiblePages';

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }
}

describe('useVisiblePages', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('returns initial visible pages', () => {
    const { result } = renderHook(() =>
      useVisiblePages({ pageCount: 10, bufferSize: 2 })
    );

    expect(result.current.visiblePages).toBeDefined();
    expect(result.current.currentVisiblePage).toBeGreaterThanOrEqual(1);
  });

  it('provides a container ref', () => {
    const { result } = renderHook(() =>
      useVisiblePages({ pageCount: 5 })
    );

    expect(result.current.containerRef).toBeDefined();
  });

  it('provides a registerPageElement function', () => {
    const { result } = renderHook(() =>
      useVisiblePages({ pageCount: 5 })
    );

    expect(typeof result.current.registerPageElement).toBe('function');
  });

  it('handles empty page count', () => {
    const { result } = renderHook(() =>
      useVisiblePages({ pageCount: 0 })
    );

    expect(result.current.visiblePages.length).toBeGreaterThanOrEqual(0);
  });

  it('defaults currentVisiblePage to 1', () => {
    const { result } = renderHook(() =>
      useVisiblePages({ pageCount: 10 })
    );

    expect(result.current.currentVisiblePage).toBe(1);
  });
});
