import { forwardRef, memo } from 'react';
import { Check, GripVertical } from 'lucide-react';
import { cn } from '@utils/cn';

export interface DraggableThumbnailProps {
  pageNumber: number;
  pageIndex: number;
  thumbnailUrl?: string;
  width: number;
  height: number;
  isCurrentPage: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after' | null;
  onClick: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  dragProps: {
    draggable: boolean;
    onDragStart: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

export const DraggableThumbnail = memo(
  forwardRef<HTMLDivElement, DraggableThumbnailProps>(
    (
      {
        pageNumber,
        thumbnailUrl,
        width,
        height,
        isCurrentPage,
        isSelected,
        isDragging,
        isDropTarget,
        dropPosition,
        onClick,
        onContextMenu,
        dragProps,
      },
      ref
    ) => {
      return (
        <div className="relative">
          {/* Drop indicator - before */}
          {isDropTarget && dropPosition === 'before' && (
            <div className="absolute -top-1.5 left-0 right-0 h-1 bg-primary-500 rounded-full" />
          )}

          <div
            ref={ref}
            onClick={onClick}
            onContextMenu={onContextMenu}
            {...dragProps}
            className={cn(
              'group relative cursor-pointer rounded-lg border-2 p-1 transition-all',
              isCurrentPage
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : isSelected
                  ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
              isDragging && 'opacity-50'
            )}
          >
            {/* Thumbnail image or placeholder */}
            <div
              className="relative overflow-hidden rounded bg-white shadow-sm dark:bg-gray-700"
              style={{ width, height }}
            >
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={`Page ${pageNumber}`}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
                </div>
              )}

              {/* Selection checkbox */}
              <div
                className={cn(
                  'absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded border transition-all',
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-400 bg-white/80 opacity-0 group-hover:opacity-100 dark:bg-gray-800/80'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              {/* Drag handle */}
              <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-white/80 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-800/80">
                <GripVertical className="h-3 w-3 text-gray-500" />
              </div>

              {/* Page number overlay */}
              <div className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                {pageNumber}
              </div>
            </div>
          </div>

          {/* Drop indicator - after */}
          {isDropTarget && dropPosition === 'after' && (
            <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-primary-500 rounded-full" />
          )}
        </div>
      );
    }
  )
);

DraggableThumbnail.displayName = 'DraggableThumbnail';
