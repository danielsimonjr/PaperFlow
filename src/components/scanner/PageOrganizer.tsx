/**
 * Page Organizer Component
 *
 * Drag-and-drop page organization for scanned documents.
 */

import { useState, useCallback } from 'react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { ScanResult } from '@lib/scanner/types';

interface PageOrganizerProps {
  pages: ScanResult[];
  onPagesChange: (pages: ScanResult[]) => void;
  onDelete?: (index: number) => void;
  onRotate?: (index: number, degrees: number) => void;
  className?: string;
}

export function PageOrganizer({
  pages,
  onPagesChange,
  onDelete,
  onRotate,
  className,
}: PageOrganizerProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === targetIndex) {
        setDraggedIndex(null);
        setDropTargetIndex(null);
        return;
      }

      const newPages = [...pages];
      const removedPages = newPages.splice(draggedIndex, 1);
      const draggedPage = removedPages[0];
      if (draggedPage) {
        newPages.splice(targetIndex, 0, draggedPage);
        onPagesChange(newPages);
      }

      setDraggedIndex(null);
      setDropTargetIndex(null);
    },
    [draggedIndex, pages, onPagesChange]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const togglePageSelection = useCallback((index: number, shiftKey: boolean) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (shiftKey && prev.size > 0) {
        // Range selection
        const lastSelected = Array.from(prev).pop()!;
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        for (let i = start; i <= end; i++) {
          newSet.add(i);
        }
      } else {
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(pages.map((_, i) => i)));
  }, [pages]);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    const newPages = pages.filter((_, i) => !selectedPages.has(i));
    onPagesChange(newPages);
    setSelectedPages(new Set());
  }, [pages, selectedPages, onPagesChange]);

  const rotateSelected = useCallback(
    (degrees: number) => {
      selectedPages.forEach((index) => {
        onRotate?.(index, degrees);
      });
    },
    [selectedPages, onRotate]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newPages = [...pages];
      const prev = newPages[index - 1];
      const current = newPages[index];
      if (prev && current) {
        newPages[index - 1] = current;
        newPages[index] = prev;
        onPagesChange(newPages);
      }
    },
    [pages, onPagesChange]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index === pages.length - 1) return;
      const newPages = [...pages];
      const current = newPages[index];
      const next = newPages[index + 1];
      if (current && next) {
        newPages[index] = next;
        newPages[index + 1] = current;
        onPagesChange(newPages);
      }
    },
    [pages, onPagesChange]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {pages.length} page{pages.length !== 1 ? 's' : ''}
            {selectedPages.size > 0 && ` (${selectedPages.size} selected)`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedPages.size > 0 ? (
            <>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Deselect
              </Button>
              <Button variant="ghost" size="sm" onClick={() => rotateSelected(90)}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
              <Button variant="ghost" size="sm" onClick={deleteSelected} className="text-red-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
          )}
        </div>
      </div>

      {/* Page grid */}
      <div className="flex-1 overflow-auto p-4">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No pages scanned</p>
            <p className="text-sm">Start scanning to add pages</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.timestamp || index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={(e) => togglePageSelection(index, e.shiftKey)}
                className={cn(
                  'relative group cursor-pointer transition-all',
                  draggedIndex === index && 'opacity-50 scale-95',
                  dropTargetIndex === index && 'ring-2 ring-primary-500 ring-offset-2',
                  selectedPages.has(index) && 'ring-2 ring-primary-500'
                )}
              >
                {/* Page thumbnail */}
                <div className="aspect-[3/4] bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border dark:border-gray-700">
                  {page.dataUrl ? (
                    <img
                      src={page.dataUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Selection checkbox */}
                  <div
                    className={cn(
                      'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedPages.has(index)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                    )}
                  >
                    {selectedPages.has(index) && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveUp(index);
                      }}
                      disabled={index === 0}
                      className="p-1.5 bg-white rounded shadow disabled:opacity-50"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveDown(index);
                      }}
                      disabled={index === pages.length - 1}
                      className="p-1.5 bg-white rounded shadow disabled:opacity-50"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotate?.(index, 90);
                      }}
                      className="p-1.5 bg-white rounded shadow"
                      title="Rotate"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(index);
                      }}
                      className="p-1.5 bg-red-500 text-white rounded shadow"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Page number */}
                <div className="mt-1 text-center text-xs text-gray-500">Page {index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageOrganizer;
