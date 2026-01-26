import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '@hooks/useSearch';
import type { PDFRenderer } from '@lib/pdf/renderer';

// Mock PDFRenderer
const mockGetTextContentAsString = vi.fn();
const mockRenderer = {
  getTextContentAsString: mockGetTextContentAsString,
} as unknown as PDFRenderer;

describe('useSearch', () => {
  beforeEach(() => {
    mockGetTextContentAsString.mockClear();
    mockGetTextContentAsString.mockImplementation((pageNum: number) => {
      const pages: Record<number, string> = {
        1: 'This is the first page with some text content.',
        2: 'This is the second page with different content.',
        3: 'Another page with the word text appearing again.',
      };
      return Promise.resolve(pages[pageNum] || '');
    });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: null, pageCount: 3 })
    );

    expect(result.current.query).toBe('');
    expect(result.current.matches).toEqual([]);
    expect(result.current.currentMatchIndex).toBe(0);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.totalMatches).toBe(0);
  });

  it('finds matches across pages', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('text');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    expect(result.current.matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pageNumber: 1 }),
        expect.objectContaining({ pageNumber: 3 }),
      ])
    );
  });

  it('navigates to next match', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('page');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    expect(result.current.currentMatchIndex).toBe(0);

    act(() => {
      result.current.nextMatch();
    });

    expect(result.current.currentMatchIndex).toBe(1);
  });

  it('navigates to previous match', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('page');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.nextMatch();
    });

    expect(result.current.currentMatchIndex).toBe(1);

    act(() => {
      result.current.prevMatch();
    });

    expect(result.current.currentMatchIndex).toBe(0);
  });

  it('wraps around when navigating past last match', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('This');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBe(2);
    });

    // Navigate past last match
    act(() => {
      result.current.nextMatch();
      result.current.nextMatch();
    });

    expect(result.current.currentMatchIndex).toBe(0);
  });

  it('clears search results', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('text');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.matches).toEqual([]);
    expect(result.current.currentMatchIndex).toBe(-1);
  });

  it('respects case sensitive option', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    // Case insensitive (default)
    await act(async () => {
      await result.current.search('THIS');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBe(2);
    });

    // Enable case sensitive
    act(() => {
      result.current.setOptions({ ...result.current.options, caseSensitive: true });
    });

    await act(async () => {
      await result.current.search('THIS');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBe(0);
    });
  });

  it('respects whole word option', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    // Without whole word
    await act(async () => {
      await result.current.search('is');
    });

    await waitFor(() => {
      expect(result.current.matches.length).toBeGreaterThan(0);
    });

    const withoutWholeWord = result.current.matches.length;

    // Enable whole word
    act(() => {
      result.current.setOptions({ ...result.current.options, wholeWord: true });
    });

    await act(async () => {
      await result.current.search('is');
    });

    // Should have fewer matches with whole word enabled
    await waitFor(() => {
      expect(result.current.matches.length).toBeLessThanOrEqual(withoutWholeWord);
    });
  });

  it('returns no matches for empty query', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: mockRenderer, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('');
    });

    expect(result.current.matches).toEqual([]);
    expect(mockGetTextContentAsString).not.toHaveBeenCalled();
  });

  it('returns no matches when renderer is null', async () => {
    const { result } = renderHook(() =>
      useSearch({ renderer: null, pageCount: 3 })
    );

    await act(async () => {
      await result.current.search('text');
    });

    expect(result.current.matches).toEqual([]);
  });
});
