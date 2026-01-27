import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

export interface MoveToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPageIndex: number;
  pageCount: number;
  selectedPages: number[];
  onMove: (toIndex: number) => void;
}

export function MoveToDialog({
  open,
  onOpenChange,
  currentPageIndex,
  pageCount,
  selectedPages,
  onMove,
}: MoveToDialogProps) {
  const [targetPage, setTargetPage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isMultiplePages = selectedPages.length > 1;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const pageNum = parseInt(targetPage, 10);

      if (isNaN(pageNum)) {
        setError('Please enter a valid page number');
        return;
      }

      if (pageNum < 1 || pageNum > pageCount) {
        setError(`Page number must be between 1 and ${pageCount}`);
        return;
      }

      // Convert to zero-based index
      const toIndex = pageNum - 1;

      // Check if moving to same position
      const pagesToMove = isMultiplePages ? selectedPages : [currentPageIndex];
      if (pagesToMove.includes(toIndex) && pagesToMove.length === 1) {
        setError('Page is already at that position');
        return;
      }

      onMove(toIndex);
      onOpenChange(false);
      setTargetPage('');
    },
    [targetPage, pageCount, isMultiplePages, selectedPages, currentPageIndex, onMove, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTargetPage('');
        setError(null);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
            'dark:border-gray-700 dark:bg-gray-900',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Move {isMultiplePages ? `${selectedPages.length} Pages` : 'Page'} To
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isMultiplePages
              ? `Move pages ${selectedPages.map((p) => p + 1).join(', ')} to a new position.`
              : `Move page ${currentPageIndex + 1} to a new position.`}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="targetPage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Move to position
                </label>
                <input
                  type="number"
                  id="targetPage"
                  min={1}
                  max={pageCount}
                  value={targetPage}
                  onChange={(e) => {
                    setTargetPage(e.target.value);
                    setError(null);
                  }}
                  placeholder={`1 - ${pageCount}`}
                  className={cn(
                    'mt-1 block w-full rounded-md border px-3 py-2 text-sm',
                    'border-gray-300 bg-white text-gray-900',
                    'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                  )}
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Document has {pageCount} pages
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Move
              </Button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm text-gray-500 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
