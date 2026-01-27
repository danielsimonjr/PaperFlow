import { useCallback, useState, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  draggedPages: number[];
  dropTargetIndex: number | null;
  dropPosition: 'before' | 'after' | null;
}

export interface UsePageDragOptions {
  pageCount: number;
  selectedPages: Set<number>;
  onReorder: (fromIndices: number[], toIndex: number) => void;
}

export interface UsePageDragReturn {
  dragState: DragState;
  handleDragStart: (pageIndex: number, event: React.DragEvent) => void;
  handleDragOver: (pageIndex: number, event: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (event: React.DragEvent) => void;
  handleDragEnd: () => void;
  getDragProps: (pageIndex: number) => {
    draggable: boolean;
    onDragStart: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

const DRAG_DATA_TYPE = 'application/x-paperflow-pages';

/**
 * Hook for managing drag-and-drop page reordering
 */
export function usePageDrag({
  pageCount,
  selectedPages,
  onReorder,
}: UsePageDragOptions): UsePageDragReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedPages: [],
    dropTargetIndex: null,
    dropPosition: null,
  });

  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (pageIndex: number, event: React.DragEvent) => {
      // Determine which pages are being dragged
      let draggedPages: number[];

      if (selectedPages.has(pageIndex)) {
        // If dragging a selected page, drag all selected pages
        draggedPages = Array.from(selectedPages).sort((a, b) => a - b);
      } else {
        // If dragging an unselected page, only drag that page
        draggedPages = [pageIndex];
      }

      // Set drag data
      event.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify(draggedPages));
      event.dataTransfer.effectAllowed = 'move';

      // Create custom drag image
      const dragImage = document.createElement('div');
      dragImage.className =
        'bg-primary-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium';
      dragImage.textContent =
        draggedPages.length === 1
          ? `Page ${draggedPages[0] + 1}`
          : `${draggedPages.length} pages`;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;

      event.dataTransfer.setDragImage(dragImage, 0, 0);

      setDragState({
        isDragging: true,
        draggedPages,
        dropTargetIndex: null,
        dropPosition: null,
      });
    },
    [selectedPages]
  );

  const handleDragOver = useCallback(
    (pageIndex: number, event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Calculate drop position based on mouse position
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropPosition: 'before' | 'after' =
        event.clientY < midpoint ? 'before' : 'after';

      setDragState((prev) => {
        // Don't allow dropping on dragged pages themselves
        if (prev.draggedPages.includes(pageIndex)) {
          return {
            ...prev,
            dropTargetIndex: null,
            dropPosition: null,
          };
        }

        return {
          ...prev,
          dropTargetIndex: pageIndex,
          dropPosition,
        };
      });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dropTargetIndex: null,
      dropPosition: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const data = event.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!data) return;

      const draggedPages: number[] = JSON.parse(data);
      const { dropTargetIndex, dropPosition } = dragState;

      if (dropTargetIndex === null || dropPosition === null) return;

      // Calculate the new index
      let toIndex = dropTargetIndex;
      if (dropPosition === 'after') {
        toIndex += 1;
      }

      // Adjust for pages being removed before the drop position
      const pagesBeforeDrop = draggedPages.filter((p) => p < toIndex).length;
      toIndex -= pagesBeforeDrop;

      // Ensure toIndex is within bounds
      toIndex = Math.max(0, Math.min(toIndex, pageCount - draggedPages.length));

      onReorder(draggedPages, toIndex);

      // Reset state
      setDragState({
        isDragging: false,
        draggedPages: [],
        dropTargetIndex: null,
        dropPosition: null,
      });
    },
    [dragState, pageCount, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    // Clean up drag image
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }

    setDragState({
      isDragging: false,
      draggedPages: [],
      dropTargetIndex: null,
      dropPosition: null,
    });
  }, []);

  const getDragProps = useCallback(
    (pageIndex: number) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent) => handleDragStart(pageIndex, event),
      onDragOver: (event: React.DragEvent) => handleDragOver(pageIndex, event),
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd]
  );

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDragProps,
  };
}
