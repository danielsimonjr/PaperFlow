import { useState, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, GripVertical, Trash2, FileText } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { isValidPdf, getPdfPageCount, type MergeFile } from '@lib/pages/mergePdf';

interface FileEntry {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  size: number;
}

export interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDocument?: { name: string; data: ArrayBuffer } | null;
  onMerge: (files: MergeFile[]) => Promise<void>;
}

export function MergeDialog({
  open,
  onOpenChange,
  currentDocument,
  onMerge,
}: MergeDialogProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [includeCurrentDocument, setIncludeCurrentDocument] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const newFiles: FileEntry[] = [];

      for (const file of Array.from(selectedFiles)) {
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
          setError(`"${file.name}" is not a PDF file`);
          continue;
        }

        const data = await file.arrayBuffer();

        if (!(await isValidPdf(data))) {
          setError(`"${file.name}" is not a valid PDF file`);
          continue;
        }

        const pageCount = await getPdfPageCount(data);

        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          data,
          pageCount,
          size: file.size,
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load PDF files'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragStart = useCallback(
    (index: number, event: React.DragEvent) => {
      setDraggedIndex(index);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback(
    (index: number, event: React.DragEvent) => {
      event.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDropTargetIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (draggedIndex !== null && dropTargetIndex !== null) {
        setFiles((prev) => {
          const newFiles = [...prev];
          const [removed] = newFiles.splice(draggedIndex, 1);
          newFiles.splice(dropTargetIndex, 0, removed);
          return newFiles;
        });
      }

      setDraggedIndex(null);
      setDropTargetIndex(null);
    },
    [draggedIndex, dropTargetIndex]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleMerge = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const mergeFiles: MergeFile[] = [];

      // Add current document first if included
      if (includeCurrentDocument && currentDocument) {
        mergeFiles.push({
          name: currentDocument.name,
          data: currentDocument.data,
        });
      }

      // Add uploaded files
      for (const file of files) {
        mergeFiles.push({
          name: file.name,
          data: file.data,
        });
      }

      if (mergeFiles.length < 2) {
        setError('At least 2 PDF files are required for merging');
        return;
      }

      await onMerge(mergeFiles);
      onOpenChange(false);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setIsLoading(false);
    }
  }, [includeCurrentDocument, currentDocument, files, onMerge, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setFiles([]);
        setError(null);
        setIncludeCurrentDocument(true);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPages =
    (includeCurrentDocument && currentDocument
      ? 1 // We don't know the page count of current doc here
      : 0) + files.reduce((sum, f) => sum + f.pageCount, 0);

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
            Merge PDF Files
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Combine multiple PDF files into a single document. Drag to reorder.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {/* Current document checkbox */}
            {currentDocument && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeCurrentDocument}
                  onChange={(e) => setIncludeCurrentDocument(e.target.checked)}
                  className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include current document ({currentDocument.name})
                </span>
              </label>
            )}

            {/* File drop zone */}
            <div
              className={cn(
                'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                'border-gray-300 hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-500'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Drag and drop PDF files here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  browse
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragOver={(e) => handleDragOver(index, e)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                      draggedIndex === index
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : dropTargetIndex === index
                          ? 'border-primary-400 bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-gray-400" />
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.pageCount} pages • {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Summary */}
            {(files.length > 0 || (includeCurrentDocument && currentDocument)) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total files:{' '}
                {files.length +
                  (includeCurrentDocument && currentDocument ? 1 : 0)}
                {totalPages > 0 && ` • ${totalPages}+ pages`}
              </p>
            )}
          </div>

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
              onClick={handleMerge}
              disabled={
                isLoading ||
                (files.length === 0 &&
                  (!includeCurrentDocument || !currentDocument)) ||
                (files.length +
                  (includeCurrentDocument && currentDocument ? 1 : 0) <
                  2)
              }
            >
              {isLoading ? 'Merging...' : 'Merge PDFs'}
            </Button>
          </div>

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
