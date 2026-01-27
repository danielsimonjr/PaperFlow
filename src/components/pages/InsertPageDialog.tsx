import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { PageSize } from '@lib/pages/pageOperations';

export interface InsertPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPageIndex: number;
  pageCount: number;
  position: 'before' | 'after';
  onInsert: (position: 'before' | 'after', size: PageSize) => void;
}

const PAGE_SIZES: { value: PageSize; label: string; description: string }[] = [
  { value: 'match', label: 'Match Document', description: 'Same size as adjacent page' },
  { value: 'letter', label: 'Letter', description: '8.5" x 11"' },
  { value: 'a4', label: 'A4', description: '210mm x 297mm' },
  { value: 'legal', label: 'Legal', description: '8.5" x 14"' },
];

export function InsertPageDialog({
  open,
  onOpenChange,
  currentPageIndex,
  position: initialPosition,
  onInsert,
}: InsertPageDialogProps) {
  const [position, setPosition] = useState<'before' | 'after'>(initialPosition);
  const [pageSize, setPageSize] = useState<PageSize>('match');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onInsert(position, pageSize);
      onOpenChange(false);
    },
    [position, pageSize, onInsert, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setPageSize('match');
      } else {
        setPosition(initialPosition);
      }
      onOpenChange(open);
    },
    [initialPosition, onOpenChange]
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
            Insert Blank Page
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Insert a new blank page {position} page {currentPageIndex + 1}.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              {/* Position selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Position
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="position"
                      value="before"
                      checked={position === 'before'}
                      onChange={() => setPosition('before')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Before page {currentPageIndex + 1}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="position"
                      value="after"
                      checked={position === 'after'}
                      onChange={() => setPosition('after')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      After page {currentPageIndex + 1}
                    </span>
                  </label>
                </div>
              </div>

              {/* Page size selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page Size
                </label>
                <div className="mt-2 space-y-2">
                  {PAGE_SIZES.map((size) => (
                    <label
                      key={size.value}
                      className={cn(
                        'flex cursor-pointer items-center rounded-lg border p-3 transition-colors',
                        pageSize === size.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                      )}
                    >
                      <input
                        type="radio"
                        name="pageSize"
                        value={size.value}
                        checked={pageSize === size.value}
                        onChange={() => setPageSize(size.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {size.label}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {size.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
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
                Insert Page
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
