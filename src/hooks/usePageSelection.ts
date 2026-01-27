import { useCallback, useState } from 'react';

export interface UsePageSelectionOptions {
  pageCount: number;
  onSelectionChange?: (selectedPages: number[]) => void;
}

export interface UsePageSelectionReturn {
  selectedPages: Set<number>;
  isSelected: (pageIndex: number) => boolean;
  toggleSelection: (pageIndex: number, event?: React.MouseEvent) => void;
  selectRange: (startIndex: number, endIndex: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedArray: () => number[];
  selectionCount: number;
  lastSelectedIndex: number | null;
}

/**
 * Hook for managing multi-page selection with support for
 * Ctrl+click (toggle individual) and Shift+click (range selection)
 */
export function usePageSelection({
  pageCount,
  onSelectionChange,
}: UsePageSelectionOptions): UsePageSelectionReturn {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const notifyChange = useCallback(
    (newSelection: Set<number>) => {
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection).sort((a, b) => a - b));
      }
    },
    [onSelectionChange]
  );

  const isSelected = useCallback(
    (pageIndex: number) => selectedPages.has(pageIndex),
    [selectedPages]
  );

  const toggleSelection = useCallback(
    (pageIndex: number, event?: React.MouseEvent) => {
      setSelectedPages((prev) => {
        const newSelection = new Set(prev);

        if (event?.shiftKey && lastSelectedIndex !== null) {
          // Shift+click: select range from last selected to current
          const start = Math.min(lastSelectedIndex, pageIndex);
          const end = Math.max(lastSelectedIndex, pageIndex);

          for (let i = start; i <= end; i++) {
            newSelection.add(i);
          }
        } else if (event?.ctrlKey || event?.metaKey) {
          // Ctrl/Cmd+click: toggle individual selection
          if (newSelection.has(pageIndex)) {
            newSelection.delete(pageIndex);
          } else {
            newSelection.add(pageIndex);
          }
        } else {
          // Regular click: select only this page
          newSelection.clear();
          newSelection.add(pageIndex);
        }

        notifyChange(newSelection);
        return newSelection;
      });

      setLastSelectedIndex(pageIndex);
    },
    [lastSelectedIndex, notifyChange]
  );

  const selectRange = useCallback(
    (startIndex: number, endIndex: number) => {
      const start = Math.max(0, Math.min(startIndex, endIndex));
      const end = Math.min(pageCount - 1, Math.max(startIndex, endIndex));

      setSelectedPages((prev) => {
        const newSelection = new Set(prev);

        for (let i = start; i <= end; i++) {
          newSelection.add(i);
        }

        notifyChange(newSelection);
        return newSelection;
      });

      setLastSelectedIndex(endIndex);
    },
    [pageCount, notifyChange]
  );

  const selectAll = useCallback(() => {
    const newSelection = new Set<number>();
    for (let i = 0; i < pageCount; i++) {
      newSelection.add(i);
    }

    setSelectedPages(newSelection);
    notifyChange(newSelection);
  }, [pageCount, notifyChange]);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
    setLastSelectedIndex(null);
    notifyChange(new Set());
  }, [notifyChange]);

  const getSelectedArray = useCallback(() => {
    return Array.from(selectedPages).sort((a, b) => a - b);
  }, [selectedPages]);

  return {
    selectedPages,
    isSelected,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    getSelectedArray,
    selectionCount: selectedPages.size,
    lastSelectedIndex,
  };
}
