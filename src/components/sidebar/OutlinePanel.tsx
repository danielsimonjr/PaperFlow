import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useDocumentStore } from '@stores/documentStore';
import type { PDFOutlineItem } from '@/types/pdf';
import { cn } from '@utils/cn';

interface OutlinePanelProps {
  className?: string;
}

interface OutlineItemProps {
  item: PDFOutlineItem;
  level: number;
  onNavigate: (pageNumber: number) => void;
}

function OutlineItem({ item, level, onNavigate }: OutlineItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = useCallback(() => {
    onNavigate(item.pageNumber);
  }, [item.pageNumber, onNavigate]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded((prev) => !prev);
    },
    []
  );

  return (
    <div>
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
          level > 0 && 'ml-4'
        )}
        onClick={handleClick}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon and title */}
        <FileText className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
          {item.title}
        </span>

        {/* Page number */}
        <span className="flex-shrink-0 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500">
          p. {item.pageNumber}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 dark:border-gray-700">
          {item.children!.map((child, index) => (
            <OutlineItem
              key={`${child.title}-${index}`}
              item={child}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OutlinePanel({ className }: OutlinePanelProps) {
  const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderer = useDocumentStore((state) => state.renderer);
  const fileName = useDocumentStore((state) => state.fileName);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);

  // Load outline when document changes
  useEffect(() => {
    const loadOutline = async () => {
      if (!renderer) {
        setOutline([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const outlineItems = await renderer.getOutline();
        setOutline(outlineItems);
      } catch (err) {
        console.error('Failed to load outline:', err);
        setError('Failed to load bookmarks');
        setOutline([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOutline();
  }, [renderer]);

  const handleNavigate = useCallback(
    (pageNumber: number) => {
      setCurrentPage(pageNumber);
    },
    [setCurrentPage]
  );

  if (!fileName) {
    return (
      <div className={cn('p-4 text-sm text-gray-500 dark:text-gray-400', className)}>
        No document loaded
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-sm text-red-500 dark:text-red-400', className)}>
        {error}
      </div>
    );
  }

  if (outline.length === 0) {
    return (
      <div className={cn('p-4 text-sm text-gray-500 dark:text-gray-400', className)}>
        No bookmarks in this document
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto p-2', className)}>
      {outline.map((item, index) => (
        <OutlineItem
          key={`${item.title}-${index}`}
          item={item}
          level={0}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
}
