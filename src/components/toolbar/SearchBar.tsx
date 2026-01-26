import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  WholeWord,
} from 'lucide-react';
import { useDocumentStore } from '@stores/documentStore';
import { useSearch } from '@hooks/useSearch';
import { cn } from '@utils/cn';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SearchBar({ isOpen, onClose, className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');

  const renderer = useDocumentStore((state) => state.renderer);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);

  const {
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
    clearSearch,
    totalMatches,
  } = useSearch({ renderer, pageCount });

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Ctrl/Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // This should be handled by parent component
      }

      if (!isOpen) return;

      // Close with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Navigate matches with Enter / Shift+Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          prevMatch();
        } else {
          nextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, nextMatch, prevMatch]);

  // Navigate to current match page
  useEffect(() => {
    if (currentMatchIndex >= 0 && matches[currentMatchIndex]) {
      setCurrentPage(matches[currentMatchIndex].pageNumber);
    }
  }, [currentMatchIndex, matches, setCurrentPage]);

  const handleSearch = useCallback(() => {
    if (localQuery.trim()) {
      setQuery(localQuery);
      search(localQuery);
    }
  }, [localQuery, setQuery, search]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalQuery(e.target.value);
    },
    []
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClose = useCallback(() => {
    clearSearch();
    setLocalQuery('');
    onClose();
  }, [clearSearch, onClose]);

  const toggleCaseSensitive = useCallback(() => {
    const newOptions = { ...options, caseSensitive: !options.caseSensitive };
    setOptions(newOptions);
    if (localQuery.trim()) {
      search(localQuery);
    }
  }, [options, setOptions, localQuery, search]);

  const toggleWholeWord = useCallback(() => {
    const newOptions = { ...options, wholeWord: !options.wholeWord };
    setOptions(newOptions);
    if (localQuery.trim()) {
      search(localQuery);
    }
  }, [options, setOptions, localQuery, search]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Search in document..."
          className="w-full rounded-md border-0 bg-transparent py-1.5 pl-8 pr-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Search options */}
      <div className="flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
        <button
          onClick={toggleCaseSensitive}
          className={cn(
            'rounded p-1.5 transition-colors',
            options.caseSensitive
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          )}
          title="Case sensitive (Alt+C)"
        >
          <CaseSensitive className="h-4 w-4" />
        </button>
        <button
          onClick={toggleWholeWord}
          className={cn(
            'rounded p-1.5 transition-colors',
            options.wholeWord
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          )}
          title="Whole word (Alt+W)"
        >
          <WholeWord className="h-4 w-4" />
        </button>
      </div>

      {/* Match count and navigation */}
      <div className="flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
        <span className="min-w-[60px] text-center text-xs text-gray-500 dark:text-gray-400">
          {isSearching ? (
            'Searching...'
          ) : totalMatches > 0 ? (
            `${currentMatchIndex + 1} of ${totalMatches}`
          ) : query ? (
            'No results'
          ) : (
            ''
          )}
        </span>
        <button
          onClick={prevMatch}
          disabled={totalMatches === 0}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={nextMatch}
          disabled={totalMatches === 0}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Next match (Enter)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        title="Close (Escape)"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
