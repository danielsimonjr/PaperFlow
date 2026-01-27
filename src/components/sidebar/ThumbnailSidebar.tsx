import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { useHistoryStore } from '@stores/historyStore';
import { useLazyThumbnails } from '@hooks/useThumbnails';
import { usePageSelection } from '@hooks/usePageSelection';
import { usePageDrag } from '@hooks/usePageDrag';
import { cn } from '@utils/cn';
import { DraggableThumbnail } from '@components/pages/DraggableThumbnail';
import { PageContextMenu } from '@components/pages/PageContextMenu';
import { MoveToDialog } from '@components/pages/MoveToDialog';
import { InsertPageDialog } from '@components/pages/InsertPageDialog';
import { MergeDialog } from '@components/pages/MergeDialog';
import { SplitDialog } from '@components/pages/SplitDialog';
import {
  deletePage,
  deletePages,
  duplicatePage,
  rotatePages,
  insertBlankPage,
  movePages,
  type PageSize,
  type RotationAngle,
} from '@lib/pages/pageOperations';
import { mergePdfs, type MergeFile } from '@lib/pages/mergePdf';
import { splitByRange, splitEveryNPages, splitBySize } from '@lib/pages/splitPdf';
import { extractPages } from '@lib/pages/extractPages';
import { Merge, Scissors, CheckSquare, XSquare } from 'lucide-react';
import { Button } from '@components/ui/Button';

type ThumbnailSize = 'small' | 'medium' | 'large';

const THUMBNAIL_SIZES: Record<ThumbnailSize, number> = {
  small: 100,
  medium: 150,
  large: 200,
};

interface ThumbnailSidebarProps {
  className?: string;
}

export function ThumbnailSidebar({ className }: ThumbnailSidebarProps) {
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState<'before' | 'after'>('after');
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [contextMenuPageIndex, setContextMenuPageIndex] = useState<number>(0);

  const renderer = useDocumentStore((state) => state.renderer);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const currentPage = useDocumentStore((state) => state.currentPage);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);
  const fileName = useDocumentStore((state) => state.fileName);
  const fileData = useDocumentStore((state) => state.fileData);
  const loadDocumentFromArrayBuffer = useDocumentStore(
    (state) => state.loadDocumentFromArrayBuffer
  );
  const setModified = useDocumentStore((state) => state.setModified);

  const historyPush = useHistoryStore((state) => state.push);

  const { thumbnails, observeElement, clearThumbnails } = useLazyThumbnails({
    renderer,
    scale: 0.2,
  });

  const {
    selectedPages,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    getSelectedArray,
    selectionCount,
  } = usePageSelection({
    pageCount,
  });

  const handleReorder = useCallback(
    async (fromIndices: number[], toIndex: number) => {
      if (!fileData || !fileName) return;

      try {
        const oldData = fileData;
        const newData = await movePages(fileData, fromIndices, toIndex);

        await loadDocumentFromArrayBuffer(newData, fileName);
        setModified(true);
        clearThumbnails();

        historyPush({
          action: `Move ${fromIndices.length} page(s)`,
          undo: async () => {
            await loadDocumentFromArrayBuffer(oldData, fileName);
            clearThumbnails();
          },
          redo: async () => {
            await loadDocumentFromArrayBuffer(newData, fileName);
            clearThumbnails();
          },
        });
      } catch (error) {
        console.error('Failed to reorder pages:', error);
      }
    },
    [fileData, fileName, loadDocumentFromArrayBuffer, setModified, clearThumbnails, historyPush]
  );

  const { dragState, getDragProps } = usePageDrag({
    pageCount,
    selectedPages,
    onReorder: handleReorder,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll to current page thumbnail
  useEffect(() => {
    const element = thumbnailRefs.current.get(currentPage);
    if (element && containerRef.current) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage]);

  const handleThumbnailClick = useCallback(
    (pageIndex: number, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        toggleSelection(pageIndex, event);
      } else {
        clearSelection();
        setCurrentPage(pageIndex + 1);
      }
    },
    [toggleSelection, clearSelection, setCurrentPage]
  );

  const handleContextMenu = useCallback((pageIndex: number) => {
    setContextMenuPageIndex(pageIndex);
  }, []);

  const handleThumbnailRef = useCallback(
    (pageNumber: number, element: HTMLDivElement | null) => {
      if (element) {
        thumbnailRefs.current.set(pageNumber, element);
        observeElement(pageNumber, element);
      } else {
        thumbnailRefs.current.delete(pageNumber);
      }
    },
    [observeElement]
  );

  // Page operations
  const handleDeletePage = useCallback(
    async (pageIndex: number) => {
      if (!fileData || !fileName || pageCount <= 1) return;

      try {
        const oldData = fileData;
        const newData = await deletePage(fileData, pageIndex);

        await loadDocumentFromArrayBuffer(newData, fileName);
        setModified(true);
        clearThumbnails();
        clearSelection();

        historyPush({
          action: 'Delete page',
          undo: async () => {
            await loadDocumentFromArrayBuffer(oldData, fileName);
            clearThumbnails();
          },
          redo: async () => {
            await loadDocumentFromArrayBuffer(newData, fileName);
            clearThumbnails();
          },
        });
      } catch (error) {
        console.error('Failed to delete page:', error);
      }
    },
    [fileData, fileName, pageCount, loadDocumentFromArrayBuffer, setModified, clearThumbnails, clearSelection, historyPush]
  );

  const handleDeleteSelected = useCallback(async () => {
    if (!fileData || !fileName) return;

    const selectedArray = getSelectedArray();
    if (selectedArray.length === 0 || selectedArray.length >= pageCount) return;

    try {
      const oldData = fileData;
      const newData = await deletePages(fileData, selectedArray);

      await loadDocumentFromArrayBuffer(newData, fileName);
      setModified(true);
      clearThumbnails();
      clearSelection();

      historyPush({
        action: `Delete ${selectedArray.length} pages`,
        undo: async () => {
          await loadDocumentFromArrayBuffer(oldData, fileName);
          clearThumbnails();
        },
        redo: async () => {
          await loadDocumentFromArrayBuffer(newData, fileName);
          clearThumbnails();
        },
      });
    } catch (error) {
      console.error('Failed to delete pages:', error);
    }
  }, [fileData, fileName, pageCount, getSelectedArray, loadDocumentFromArrayBuffer, setModified, clearThumbnails, clearSelection, historyPush]);

  const handleDuplicate = useCallback(
    async (pageIndex: number) => {
      if (!fileData || !fileName) return;

      try {
        const oldData = fileData;
        const newData = await duplicatePage(fileData, pageIndex, true);

        await loadDocumentFromArrayBuffer(newData, fileName);
        setModified(true);
        clearThumbnails();

        historyPush({
          action: 'Duplicate page',
          undo: async () => {
            await loadDocumentFromArrayBuffer(oldData, fileName);
            clearThumbnails();
          },
          redo: async () => {
            await loadDocumentFromArrayBuffer(newData, fileName);
            clearThumbnails();
          },
        });
      } catch (error) {
        console.error('Failed to duplicate page:', error);
      }
    },
    [fileData, fileName, loadDocumentFromArrayBuffer, setModified, clearThumbnails, historyPush]
  );

  const handleRotate = useCallback(
    async (pageIndices: number[], rotation: RotationAngle) => {
      if (!fileData || !fileName) return;

      try {
        const oldData = fileData;
        const newData = await rotatePages(fileData, pageIndices, rotation);

        await loadDocumentFromArrayBuffer(newData, fileName);
        setModified(true);
        clearThumbnails();

        historyPush({
          action: `Rotate ${pageIndices.length} page(s)`,
          undo: async () => {
            await loadDocumentFromArrayBuffer(oldData, fileName);
            clearThumbnails();
          },
          redo: async () => {
            await loadDocumentFromArrayBuffer(newData, fileName);
            clearThumbnails();
          },
        });
      } catch (error) {
        console.error('Failed to rotate page:', error);
      }
    },
    [fileData, fileName, loadDocumentFromArrayBuffer, setModified, clearThumbnails, historyPush]
  );

  const handleInsertBlankPage = useCallback(
    async (position: 'before' | 'after', size: PageSize) => {
      if (!fileData || !fileName) return;

      const insertIndex = position === 'before' ? contextMenuPageIndex : contextMenuPageIndex + 1;

      try {
        const oldData = fileData;
        const newData = await insertBlankPage(fileData, insertIndex, size);

        await loadDocumentFromArrayBuffer(newData, fileName);
        setModified(true);
        clearThumbnails();

        historyPush({
          action: 'Insert blank page',
          undo: async () => {
            await loadDocumentFromArrayBuffer(oldData, fileName);
            clearThumbnails();
          },
          redo: async () => {
            await loadDocumentFromArrayBuffer(newData, fileName);
            clearThumbnails();
          },
        });
      } catch (error) {
        console.error('Failed to insert blank page:', error);
      }
    },
    [fileData, fileName, contextMenuPageIndex, loadDocumentFromArrayBuffer, setModified, clearThumbnails, historyPush]
  );

  const handleMoveTo = useCallback(
    async (toIndex: number) => {
      if (!fileData || !fileName) return;

      const selectedArray = getSelectedArray();
      const pageIndices = selectedArray.length > 0 && isSelected(contextMenuPageIndex)
        ? selectedArray
        : [contextMenuPageIndex];

      await handleReorder(pageIndices, toIndex);
      clearSelection();
    },
    [fileData, fileName, getSelectedArray, isSelected, contextMenuPageIndex, handleReorder, clearSelection]
  );

  const handleExtract = useCallback(
    async (pageIndex: number) => {
      if (!fileData || !fileName) return;

      const selectedArray = getSelectedArray();
      const pageIndices = selectedArray.length > 0 && isSelected(pageIndex)
        ? selectedArray
        : [pageIndex];

      try {
        const result = await extractPages(fileData, pageIndices, false);

        // Download the extracted PDF
        const blob = new Blob([result.extractedPdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extracted_pages.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to extract pages:', error);
      }
    },
    [fileData, fileName, getSelectedArray, isSelected]
  );

  const handleMerge = useCallback(
    async (files: MergeFile[]) => {
      if (!fileName) return;

      try {
        const mergedData = await mergePdfs(files);
        await loadDocumentFromArrayBuffer(mergedData.buffer, `merged_${fileName}`);
        setModified(true);
        clearThumbnails();
      } catch (error) {
        console.error('Failed to merge PDFs:', error);
        throw error;
      }
    },
    [fileName, loadDocumentFromArrayBuffer, setModified, clearThumbnails]
  );

  const handleSplitByRange = useCallback(
    async (rangeStr: string) => {
      if (!fileData || !fileName) throw new Error('No document loaded');

      const baseName = fileName.replace(/\.pdf$/i, '');
      return splitByRange(fileData, rangeStr, baseName);
    },
    [fileData, fileName]
  );

  const handleSplitEveryN = useCallback(
    async (n: number) => {
      if (!fileData || !fileName) throw new Error('No document loaded');

      const baseName = fileName.replace(/\.pdf$/i, '');
      return splitEveryNPages(fileData, n, baseName);
    },
    [fileData, fileName]
  );

  const handleSplitBySize = useCallback(
    async (maxSizeKb: number) => {
      if (!fileData || !fileName) throw new Error('No document loaded');

      const baseName = fileName.replace(/\.pdf$/i, '');
      return splitBySize(fileData, maxSizeKb * 1024, baseName);
    },
    [fileData, fileName]
  );

  if (!fileName || pageCount === 0) {
    return (
      <div className={cn('p-4 text-sm text-gray-500 dark:text-gray-400', className)}>
        No document loaded
      </div>
    );
  }

  const width = THUMBNAIL_SIZES[thumbnailSize];
  const aspectRatio = 842 / 595; // A4 aspect ratio
  const height = Math.round(width * aspectRatio);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {pageCount} pages
          {selectionCount > 0 && ` • ${selectionCount} selected`}
        </span>
        <div className="flex gap-1">
          {(['small', 'medium', 'large'] as ThumbnailSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setThumbnailSize(size)}
              className={cn(
                'h-4 rounded px-2 text-xs',
                thumbnailSize === size
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              {size.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Selection toolbar */}
      {selectionCount > 0 && (
        <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            title="Select all"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            title="Clear selection"
          >
            <XSquare className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMergeDialogOpen(true)}
          title="Merge PDFs"
        >
          <Merge className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSplitDialogOpen(true)}
          title="Split PDF"
        >
          <Scissors className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails list */}
      <div ref={containerRef} className="flex-1 overflow-auto p-3">
        <div className="flex flex-col items-center gap-3">
          {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => {
            const pageNumber = pageIndex + 1;
            const isCurrentPage = currentPage === pageNumber;
            const isPageSelected = isSelected(pageIndex);
            const isDragging = dragState.draggedPages.includes(pageIndex);
            const isDropTarget =
              dragState.dropTargetIndex === pageIndex &&
              !dragState.draggedPages.includes(pageIndex);

            return (
              <PageContextMenu
                key={pageIndex}
                pageCount={pageCount}
                isSelected={isPageSelected}
                selectedCount={selectionCount}
                onDelete={() => handleDeletePage(pageIndex)}
                onDeleteSelected={handleDeleteSelected}
                onDuplicate={() => handleDuplicate(pageIndex)}
                onRotateCW={() =>
                  handleRotate(
                    isPageSelected && selectionCount > 0 ? getSelectedArray() : [pageIndex],
                    90
                  )
                }
                onRotateCCW={() =>
                  handleRotate(
                    isPageSelected && selectionCount > 0 ? getSelectedArray() : [pageIndex],
                    270
                  )
                }
                onRotate180={() =>
                  handleRotate(
                    isPageSelected && selectionCount > 0 ? getSelectedArray() : [pageIndex],
                    180
                  )
                }
                onInsertBefore={() => {
                  setInsertPosition('before');
                  setInsertDialogOpen(true);
                }}
                onInsertAfter={() => {
                  setInsertPosition('after');
                  setInsertDialogOpen(true);
                }}
                onMoveTo={() => setMoveDialogOpen(true)}
                onExtract={() => handleExtract(pageIndex)}
              >
                <DraggableThumbnail
                  ref={(el) => handleThumbnailRef(pageNumber, el)}
                  pageNumber={pageNumber}
                  pageIndex={pageIndex}
                  thumbnailUrl={thumbnails[pageNumber]}
                  width={width}
                  height={height}
                  isCurrentPage={isCurrentPage}
                  isSelected={isPageSelected}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                  dropPosition={isDropTarget ? dragState.dropPosition : null}
                  onClick={(e) => handleThumbnailClick(pageIndex, e)}
                  onContextMenu={() => handleContextMenu(pageIndex)}
                  dragProps={getDragProps(pageIndex)}
                />
              </PageContextMenu>
            );
          })}
        </div>
      </div>

      {/* Dialogs */}
      <MoveToDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        currentPageIndex={contextMenuPageIndex}
        pageCount={pageCount}
        selectedPages={getSelectedArray()}
        onMove={handleMoveTo}
      />

      <InsertPageDialog
        open={insertDialogOpen}
        onOpenChange={setInsertDialogOpen}
        currentPageIndex={contextMenuPageIndex}
        pageCount={pageCount}
        position={insertPosition}
        onInsert={handleInsertBlankPage}
      />

      <MergeDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        currentDocument={fileData && fileName ? { name: fileName, data: fileData } : null}
        onMerge={handleMerge}
      />

      <SplitDialog
        open={splitDialogOpen}
        onOpenChange={setSplitDialogOpen}
        pageCount={pageCount}
        onSplitByRange={handleSplitByRange}
        onSplitEveryN={handleSplitEveryN}
        onSplitBySize={handleSplitBySize}
      />
    </div>
  );
}
