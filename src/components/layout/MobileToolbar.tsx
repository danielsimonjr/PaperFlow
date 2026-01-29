import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Type,
  Pencil,
  MoreHorizontal,
  StickyNote,
} from 'lucide-react';
import { useDocumentStore } from '@stores/documentStore';
import { useAnnotationStore } from '@stores/annotationStore';
import { cn } from '@utils/cn';
import type { AnnotationType } from '@/types';

/**
 * Bottom toolbar for mobile devices with primary actions.
 * Shows navigation, zoom, and commonly used tools.
 * Secondary tools are available in a collapsible "More" menu.
 */
export function MobileToolbar() {
  const [showMore, setShowMore] = useState(false);

  const currentPage = useDocumentStore((s) => s.currentPage);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const nextPage = useDocumentStore((s) => s.nextPage);
  const prevPage = useDocumentStore((s) => s.prevPage);
  const zoomIn = useDocumentStore((s) => s.zoomIn);
  const zoomOut = useDocumentStore((s) => s.zoomOut);

  const activeTool = useAnnotationStore((s) => s.activeTool);
  const setActiveTool = useAnnotationStore((s) => s.setActiveTool);

  const handleToolClick = (tool: AnnotationType) => {
    setActiveTool(tool === activeTool ? null : tool);
    setShowMore(false);
  };

  const secondaryTools: { id: AnnotationType; icon: typeof Highlighter; label: string }[] = [
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'note', icon: StickyNote, label: 'Note' },
    { id: 'drawing', icon: Pencil, label: 'Draw' },
    { id: 'underline', icon: Type, label: 'Underline' },
  ];

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu popup */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 mx-4 rounded-xl bg-white p-4 shadow-xl dark:bg-gray-900">
          <div className="grid grid-cols-4 gap-3">
            {secondaryTools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handleToolClick(id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-3',
                  activeTool === id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-t border-gray-200 bg-white px-2 safe-area-pb dark:border-gray-800 dark:bg-gray-950 md:hidden">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="touch-target rounded-lg p-2 text-gray-600 disabled:opacity-30 dark:text-gray-400"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-sm text-gray-600 dark:text-gray-400">
            {currentPage}/{pageCount}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= pageCount}
            className="touch-target rounded-lg p-2 text-gray-600 disabled:opacity-30 dark:text-gray-400"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="touch-target rounded-lg p-2 text-gray-600 dark:text-gray-400"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={zoomIn}
            className="touch-target rounded-lg p-2 text-gray-600 dark:text-gray-400"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        {/* Quick tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToolClick('highlight')}
            className={cn(
              'touch-target rounded-lg p-2',
              activeTool === 'highlight'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
            aria-label="Highlight"
          >
            <Highlighter className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveTool(null)}
            className={cn(
              'touch-target rounded-lg p-2',
              !activeTool
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
            aria-label="Select"
          >
            <Type className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleToolClick('drawing')}
            className={cn(
              'touch-target rounded-lg p-2',
              activeTool === 'drawing'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
            aria-label="Draw"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'touch-target rounded-lg p-2',
              showMore
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
            aria-label="More tools"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}
