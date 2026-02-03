/**
 * Document Compare Component
 *
 * Side-by-side comparison view showing current and external versions
 * of the document with differences highlighted.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Columns,
  Rows,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { DocumentDiff } from '@lib/fileWatch/documentDiff';
import { createChangeNavigationList, getDiffStatistics } from '@lib/fileWatch/documentDiff';

interface DocumentCompareProps {
  currentDocument: ArrayBuffer | null;
  externalDocument: ArrayBuffer | null;
  diff: DocumentDiff;
  onAcceptExternal: () => void;
  onKeepCurrent: () => void;
  onMergePage?: (pageNumber: number, source: 'current' | 'external') => void;
  className?: string;
}

type CompareLayout = 'side-by-side' | 'vertical';

export function DocumentCompare({
  currentDocument,
  externalDocument,
  diff,
  onAcceptExternal,
  onKeepCurrent,
  onMergePage,
  className = '',
}: DocumentCompareProps) {
  const [layout, setLayout] = useState<CompareLayout>('side-by-side');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [synchronizedScroll, setSynchronizedScroll] = useState(true);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const stats = getDiffStatistics(diff);
  const changeList = createChangeNavigationList(diff);

  // Synchronized scrolling
  const handleScroll = useCallback(
    (source: 'left' | 'right') => {
      if (!synchronizedScroll) return;

      const sourceRef = source === 'left' ? leftScrollRef : rightScrollRef;
      const targetRef = source === 'left' ? rightScrollRef : leftScrollRef;

      if (sourceRef.current && targetRef.current) {
        targetRef.current.scrollTop = sourceRef.current.scrollTop;
        targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
      }
    },
    [synchronizedScroll]
  );

  // Navigate to a changed page
  const navigateToChange = (index: number) => {
    if (changeList[index]) {
      setCurrentPage(changeList[index].pageNumber);
    }
  };

  // Get current change index
  const currentChangeIndex = changeList.findIndex(
    (c) => c.pageNumber === currentPage
  );

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setLayout('side-by-side')}
              className={`p-1.5 rounded ${
                layout === 'side-by-side'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Side by side"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('vertical')}
              className={`p-1.5 rounded ${
                layout === 'vertical'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title="Vertical"
            >
              <Rows className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={zoom <= 25}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Sync scroll toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={synchronizedScroll}
              onChange={(e) => setSynchronizedScroll(e.target.checked)}
              className="rounded"
            />
            Sync scroll
          </label>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {stats.modifiedPages} modified, {stats.addedPages} added, {stats.removedPages} removed
          </span>
        </div>
      </div>

      {/* Change navigation */}
      {changeList.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToChange(Math.max(0, currentChangeIndex - 1))}
              disabled={currentChangeIndex <= 0}
              className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-amber-700 dark:text-amber-300">
              Change {currentChangeIndex + 1} of {changeList.length}
            </span>

            <button
              onClick={() => navigateToChange(Math.min(changeList.length - 1, currentChangeIndex + 1))}
              disabled={currentChangeIndex >= changeList.length - 1}
              className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {changeList[currentChangeIndex] && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Page {changeList[currentChangeIndex].pageNumber}: {changeList[currentChangeIndex].description}
            </span>
          )}
        </div>
      )}

      {/* Compare view */}
      <div
        className={`flex-1 flex ${
          layout === 'vertical' ? 'flex-col' : 'flex-row'
        } min-h-0`}
      >
        {/* Current document */}
        <div className={`${layout === 'vertical' ? 'h-1/2' : 'w-1/2'} flex flex-col border-r border-gray-200 dark:border-gray-700`}>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Version
            </h3>
          </div>
          <div
            ref={leftScrollRef}
            className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900"
            onScroll={() => handleScroll('left')}
          >
            {currentDocument ? (
              <div
                className="bg-white shadow-lg mx-auto"
                style={{
                  width: `${(595 * zoom) / 100}px`,
                  height: `${(842 * zoom) / 100}px`,
                }}
              >
                {/* PDF rendering would go here */}
                <div className="flex items-center justify-center h-full text-gray-400">
                  Page {currentPage} - Current
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No document loaded
              </div>
            )}
          </div>
        </div>

        {/* External document */}
        <div className={`${layout === 'vertical' ? 'h-1/2' : 'w-1/2'} flex flex-col`}>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              External Version
            </h3>
          </div>
          <div
            ref={rightScrollRef}
            className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900"
            onScroll={() => handleScroll('right')}
          >
            {externalDocument ? (
              <div
                className="bg-white shadow-lg mx-auto"
                style={{
                  width: `${(595 * zoom) / 100}px`,
                  height: `${(842 * zoom) / 100}px`,
                }}
              >
                {/* PDF rendering would go here */}
                <div className="flex items-center justify-center h-full text-gray-400">
                  Page {currentPage} - External
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No document loaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {onMergePage && (
            <>
              <button
                onClick={() => onMergePage(currentPage, 'current')}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                Use Current Page
              </button>
              <button
                onClick={() => onMergePage(currentPage, 'external')}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                Use External Page
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onKeepCurrent}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg"
          >
            <X className="w-4 h-4" />
            Keep Current
          </button>
          <button
            onClick={onAcceptExternal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Check className="w-4 h-4" />
            Accept External
          </button>
        </div>
      </div>
    </div>
  );
}
