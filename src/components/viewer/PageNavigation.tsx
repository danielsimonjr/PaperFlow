import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useDocumentStore } from '@stores/documentStore';

interface PageNavigationProps {
  className?: string;
}

export function PageNavigation({ className }: PageNavigationProps) {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const currentPage = useDocumentStore((state) => state.currentPage);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const viewMode = useDocumentStore((state) => state.viewMode);
  const nextPage = useDocumentStore((state) => state.nextPage);
  const prevPage = useDocumentStore((state) => state.prevPage);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);

  // Navigation handlers that account for spread view
  const handlePrevPage = useCallback(() => {
    if (viewMode === 'spread') {
      setCurrentPage(Math.max(1, currentPage - 2));
    } else {
      prevPage();
    }
  }, [viewMode, currentPage, setCurrentPage, prevPage]);

  const handleNextPage = useCallback(() => {
    if (viewMode === 'spread') {
      setCurrentPage(Math.min(pageCount, currentPage + 2));
    } else {
      nextPage();
    }
  }, [viewMode, currentPage, pageCount, setCurrentPage, nextPage]);

  // Jump to page handler
  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(inputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
      setCurrentPage(pageNum);
    }
    setIsEditing(false);
    setInputValue('');
  }, [inputValue, pageCount, setCurrentPage]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    }
  };

  const handleInputBlur = () => {
    handleJumpToPage();
  };

  const handlePageClick = () => {
    setIsEditing(true);
    setInputValue(String(currentPage));
  };

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {isEditing ? (
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          autoFocus
          min={1}
          max={pageCount}
          className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-sm dark:border-gray-600 dark:bg-gray-800"
          aria-label="Page number"
        />
      ) : (
        <button
          onClick={handlePageClick}
          className="min-w-[80px] text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={`Page ${currentPage} of ${pageCount}. Click to jump to page.`}
        >
          {pageCount > 0 ? `${currentPage} / ${pageCount}` : '-'}
        </button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextPage}
        disabled={currentPage >= pageCount}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
