import { forwardRef } from 'react';
import { FileUp, AlertCircle } from 'lucide-react';
import { useDropZone } from '@hooks/useDropZone';
import { cn } from '@utils/cn';

interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(
  (
    {
      onFileDrop,
      accept = ['application/pdf', '.pdf'],
      multiple = false,
      disabled = false,
      className,
      children,
    },
    ref
  ) => {
    const { isDraggingOver, rootProps, inputProps, open, error, clearError } =
      useDropZone({
        onDrop: onFileDrop,
        accept,
        multiple,
        disabled,
      });

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Hidden file input */}
        <input {...inputProps} className="sr-only" />

        {/* Main content area with drag handling */}
        <div
          {...rootProps}
          onClick={() => !disabled && open()}
          className={cn(
            'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
            isDraggingOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 bg-white hover:border-primary-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-gray-750',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          {children || (
            <>
              <div
                className={cn(
                  'mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors',
                  isDraggingOver
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <FileUp
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isDraggingOver
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                />
              </div>

              <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                {isDraggingOver ? 'Drop your PDF here' : 'Drag & drop a PDF file'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to browse
              </p>
            </>
          )}

          {/* Drag overlay */}
          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-primary-500/10">
              <div className="rounded-lg bg-primary-500 px-4 py-2 text-white shadow-lg">
                Drop to open
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearError();
              }}
              className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }
);

DropZone.displayName = 'DropZone';
