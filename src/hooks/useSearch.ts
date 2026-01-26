import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  text: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

interface UseSearchOptions {
  renderer: PDFRenderer | null;
  pageCount: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  matches: SearchMatch[];
  currentMatchIndex: number;
  isSearching: boolean;
  options: SearchOptions;
  setOptions: (options: SearchOptions) => void;
  search: (query: string) => Promise<void>;
  nextMatch: () => void;
  prevMatch: () => void;
  goToMatch: (index: number) => void;
  clearSearch: () => void;
  totalMatches: number;
}

const DEFAULT_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
};

export function useSearch({
  renderer,
  pageCount,
}: UseSearchOptions): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_OPTIONS);

  const abortControllerRef = useRef<AbortController | null>(null);
  const textCacheRef = useRef<Map<number, string>>(new Map());

  // Clear cache when renderer changes
  useEffect(() => {
    textCacheRef.current.clear();
    setMatches([]);
    setCurrentMatchIndex(0);
    setQuery('');
  }, [renderer]);

  // Get text content for a page (with caching)
  const getPageText = useCallback(
    async (pageNumber: number): Promise<string> => {
      if (!renderer) return '';

      // Check cache
      const cached = textCacheRef.current.get(pageNumber);
      if (cached !== undefined) return cached;

      try {
        const text = await renderer.getTextContent(pageNumber);
        textCacheRef.current.set(pageNumber, text);
        return text;
      } catch (error) {
        console.error(`Failed to get text for page ${pageNumber}:`, error);
        return '';
      }
    },
    [renderer]
  );

  // Build regex from search options
  const buildSearchRegex = useCallback(
    (searchQuery: string, opts: SearchOptions): RegExp => {
      let pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (opts.wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }

      return new RegExp(pattern, opts.caseSensitive ? 'g' : 'gi');
    },
    []
  );

  const search = useCallback(
    async (searchQuery: string) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!renderer || !searchQuery.trim()) {
        setMatches([]);
        setCurrentMatchIndex(0);
        return;
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsSearching(true);
      const foundMatches: SearchMatch[] = [];

      try {
        const regex = buildSearchRegex(searchQuery, options);

        // Search through all pages
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          if (signal.aborted) break;

          const text = await getPageText(pageNum);
          let match;
          let matchIndex = 0;

          while ((match = regex.exec(text)) !== null) {
            foundMatches.push({
              pageNumber: pageNum,
              matchIndex: matchIndex++,
              text: match[0],
            });
          }
        }

        if (!signal.aborted) {
          setMatches(foundMatches);
          setCurrentMatchIndex(foundMatches.length > 0 ? 0 : -1);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Search failed:', error);
          setMatches([]);
          setCurrentMatchIndex(-1);
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [renderer, pageCount, options, buildSearchRegex, getPageText]
  );

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const goToMatch = useCallback(
    (index: number) => {
      if (index >= 0 && index < matches.length) {
        setCurrentMatchIndex(index);
      }
    },
    [matches.length]
  );

  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery('');
    setMatches([]);
    setCurrentMatchIndex(-1);
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    matches,
    currentMatchIndex,
    isSearching,
    options,
    setOptions,
    search,
    nextMatch,
    prevMatch,
    goToMatch,
    clearSearch,
    totalMatches: matches.length,
  };
}
