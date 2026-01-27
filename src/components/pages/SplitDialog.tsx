import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Download } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { SplitResult } from '@lib/pages/splitPdf';

type SplitMode = 'range' | 'every-n' | 'by-size';

export interface SplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageCount: number;
  onSplitByRange: (rangeStr: string) => Promise<SplitResult>;
  onSplitEveryN: (n: number) => Promise<SplitResult[]>;
  onSplitBySize: (maxSizeKb: number) => Promise<SplitResult[]>;
}

export function SplitDialog({
  open,
  onOpenChange,
  pageCount,
  onSplitByRange,
  onSplitEveryN,
  onSplitBySize,
}: SplitDialogProps) {
  const [mode, setMode] = useState<SplitMode>('range');
  const [rangeStr, setRangeStr] = useState('');
  const [pagesPerFile, setPagesPerFile] = useState('1');
  const [maxSizeKb, setMaxSizeKb] = useState('1024');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SplitResult[] | null>(null);

  const handleSplit = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setResults(null);

    try {
      let splitResults: SplitResult[];

      switch (mode) {
        case 'range': {
          if (!rangeStr.trim()) {
            setError('Please enter a page range');
            return;
          }
          const result = await onSplitByRange(rangeStr.trim());
          splitResults = [result];
          break;
        }
        case 'every-n': {
          const n = parseInt(pagesPerFile, 10);
          if (isNaN(n) || n < 1) {
            setError('Please enter a valid number of pages');
            return;
          }
          splitResults = await onSplitEveryN(n);
          break;
        }
        case 'by-size': {
          const size = parseInt(maxSizeKb, 10);
          if (isNaN(size) || size < 1) {
            setError('Please enter a valid file size');
            return;
          }
          splitResults = await onSplitBySize(size);
          break;
        }
        default:
          return;
      }

      setResults(splitResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF');
    } finally {
      setIsLoading(false);
    }
  }, [mode, rangeStr, pagesPerFile, maxSizeKb, onSplitByRange, onSplitEveryN, onSplitBySize]);

  const handleDownload = useCallback((result: SplitResult) => {
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!results || results.length === 0) return;

    // For a single file, just download it directly
    if (results.length === 1) {
      handleDownload(results[0]);
      return;
    }

    // For multiple files, create a ZIP
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    for (const result of results) {
      zip.file(result.name, result.data);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'split_pdfs.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results, handleDownload]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setRangeStr('');
        setPagesPerFile('1');
        setMaxSizeKb('1024');
        setError(null);
        setResults(null);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  const tabClass = cn(
    'px-3 py-2 text-sm font-medium transition-colors',
    'data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700',
    'data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600',
    'dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300',
    'dark:data-[state=active]:text-primary-400 dark:data-[state=active]:border-primary-400'
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
            'dark:border-gray-700 dark:bg-gray-900',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Split PDF
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Extract or split pages from the document ({pageCount} pages total).
          </Dialog.Description>

          {results ? (
            // Results view
            <div className="mt-4 space-y-4">
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Pages: {result.pageRange} ({result.pageCount} pages)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(result)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResults(null)}
                >
                  Split Again
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDownloadAll}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {results.length > 1 ? 'All (ZIP)' : ''}
                </Button>
              </div>
            </div>
          ) : (
            // Split options
            <div className="mt-4">
              <Tabs.Root
                value={mode}
                onValueChange={(v) => setMode(v as SplitMode)}
              >
                <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
                  <Tabs.Trigger value="range" className={tabClass}>
                    By Range
                  </Tabs.Trigger>
                  <Tabs.Trigger value="every-n" className={tabClass}>
                    Every N Pages
                  </Tabs.Trigger>
                  <Tabs.Trigger value="by-size" className={tabClass}>
                    By Size
                  </Tabs.Trigger>
                </Tabs.List>

                <div className="mt-4 space-y-4">
                  <Tabs.Content value="range">
                    <div>
                      <label
                        htmlFor="pageRange"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Page Range
                      </label>
                      <input
                        type="text"
                        id="pageRange"
                        value={rangeStr}
                        onChange={(e) => setRangeStr(e.target.value)}
                        placeholder="e.g., 1-5, 8, 10-12"
                        className={cn(
                          'mt-1 block w-full rounded-md border px-3 py-2 text-sm',
                          'border-gray-300 bg-white text-gray-900',
                          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Extract specific pages (e.g., 1-5, 8, 10-12)
                      </p>
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="every-n">
                    <div>
                      <label
                        htmlFor="pagesPerFile"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Pages Per File
                      </label>
                      <input
                        type="number"
                        id="pagesPerFile"
                        min={1}
                        max={pageCount}
                        value={pagesPerFile}
                        onChange={(e) => setPagesPerFile(e.target.value)}
                        className={cn(
                          'mt-1 block w-full rounded-md border px-3 py-2 text-sm',
                          'border-gray-300 bg-white text-gray-900',
                          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Split into files with {pagesPerFile || '...'} page(s) each
                        {pagesPerFile &&
                          ` (~${Math.ceil(pageCount / parseInt(pagesPerFile, 10))} files)`}
                      </p>
                    </div>
                  </Tabs.Content>

                  <Tabs.Content value="by-size">
                    <div>
                      <label
                        htmlFor="maxSize"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Maximum File Size (KB)
                      </label>
                      <input
                        type="number"
                        id="maxSize"
                        min={100}
                        value={maxSizeKb}
                        onChange={(e) => setMaxSizeKb(e.target.value)}
                        className={cn(
                          'mt-1 block w-full rounded-md border px-3 py-2 text-sm',
                          'border-gray-300 bg-white text-gray-900',
                          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                          'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Split into files under {maxSizeKb || '...'} KB each
                      </p>
                    </div>
                  </Tabs.Content>
                </div>
              </Tabs.Root>

              {error && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSplit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Splitting...' : 'Split PDF'}
                </Button>
              </div>
            </div>
          )}

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
