import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Clock, HardDrive } from 'lucide-react';
import { storage, RecentFile } from '@lib/storage/indexeddb';
import { cn } from '@utils/cn';

interface RecentFilesProps {
  onFileSelect: (file: RecentFile) => void;
  className?: string;
}

export function RecentFiles({ onFileSelect, className }: RecentFilesProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await storage.getRecentFiles(10);
      setRecentFiles(files);
    } catch (err) {
      console.error('Failed to load recent files:', err);
      setError('Failed to load recent files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  const handleRemoveFile = useCallback(
    async (e: React.MouseEvent, fileId: string) => {
      e.stopPropagation();
      try {
        await storage.removeRecentFile(fileId);
        setRecentFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        console.error('Failed to remove recent file:', err);
      }
    },
    []
  );

  const handleClearAll = useCallback(async () => {
    try {
      await storage.clearRecentFiles();
      setRecentFiles([]);
    } catch (err) {
      console.error('Failed to clear recent files:', err);
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const fileDate = new Date(date);
    const diffMs = now.getTime() - fileDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return fileDate.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Recent Files</h3>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center text-sm text-red-500', className)}>
        {error}
      </div>
    );
  }

  if (recentFiles.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Recent Files</h3>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-500">
          No recent files yet
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Recent Files</h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {recentFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => onFileSelect(file)}
            className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
          >
            {/* Thumbnail or icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt=""
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              )}
            </div>

            {/* File info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {file.name}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  {formatFileSize(file.size)}
                </span>
                <span>•</span>
                <span>{formatDate(file.lastOpened)}</span>
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => handleRemoveFile(e, file.id)}
              className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Remove from recent files"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
