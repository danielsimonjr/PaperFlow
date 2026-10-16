import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFRenderer } from '@lib/pdf/renderer';

/**
 * One search match: its page number, its index on that page, and the matched text.
 */
export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  text: string;
}

/**
 * Search options: case sensitivity and whole-word matching.
 */
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
  search: (query: string, searchOptions?: SearchOptions) => Promise<void>;
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

/**
 * Search the text of the open PDF and move between the matches.
 *
 * The hook caches page text until the renderer changes. A new search cancels any search in progress.
 * `search` uses the options of the hook state. A caller that changes the options in the same event passes the new
 * options to `search`. The reason is that each `search` function holds the options of its own render.
 */
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
        const text = await renderer.getTextContentAsString(pageNumber);
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
    async (searchQuery: string, searchOptions: SearchOptions = options) => {
      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!renderer || !searchQuery.trim()) {
        setMatches([]);
        setCurrentMatchIndex(0);
        // The cancelled search skips its own reset of this flag.
        setIsSearching(false);
        return;
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsSearching(true);
      const foundMatches: SearchMatch[] = [];

      try {
        const regex = buildSearchRegex(searchQuery, searchOptions);

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
