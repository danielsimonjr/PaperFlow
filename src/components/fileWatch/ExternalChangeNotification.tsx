/**
 * External Change Notification Component
 *
 * Alerts user to external file changes with options to reload, ignore, or compare.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X, Eye, FileWarning } from 'lucide-react';
import { useFileWatchStore, type ExternalChange } from '@stores/fileWatchStore';

interface ExternalChangeNotificationProps {
  change: ExternalChange;
  onReload: () => void;
  onIgnore: () => void;
  onCompare: () => void;
  className?: string;
}

export function ExternalChangeNotification({
  change,
  onReload,
  onIgnore,
  onCompare,
  className = '',
}: ExternalChangeNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeAgo, setTimeAgo] = useState('');
  const { dismissChange, settings } = useFileWatchStore();

  // Update time ago display
  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - change.timestamp) / 1000);

      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [change.timestamp]);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissChange(change.id);
    onIgnore();
  };

  const handleReload = () => {
    setIsVisible(false);
    dismissChange(change.id);
    onReload();
  };

  const handleCompare = () => {
    onCompare();
  };

  if (!isVisible || change.dismissed) {
    return null;
  }

  const fileName = change.path.split(/[/\\]/).pop() || change.path;
  const isDeleted = change.type === 'unlink';

  // Determine style based on settings
  if (settings.notificationStyle === 'toast') {
    return (
      <div
        className={`fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-in ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isDeleted ? (
              <FileWarning className="w-5 h-5 text-red-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {isDeleted ? 'File Deleted' : 'File Changed'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {timeAgo}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {!isDeleted && (
            <>
              <button
                onClick={handleReload}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Reload
              </button>
              <button
                onClick={handleCompare}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Compare
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Ignore
          </button>
        </div>
      </div>
    );
  }

  // Banner style (default)
  return (
    <div
      className={`bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {isDeleted ? (
              <FileWarning className="w-5 h-5 text-red-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {isDeleted ? 'File was deleted externally' : 'External changes detected'}
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              <span className="font-medium">{fileName}</span> was{' '}
              {isDeleted ? 'deleted' : 'modified'} {timeAgo}.
              {!isDeleted && ' Would you like to reload the document?'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 flex gap-3">
        {!isDeleted && (
          <>
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Document
            </button>
            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              Compare Changes
            </button>
          </>
        )}
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/**
 * Container for multiple external change notifications
 */
export function ExternalChangeNotifications({
  onReload,
  onCompare,
  className = '',
}: {
  onReload: (path: string) => void;
  onCompare: (path: string) => void;
  className?: string;
}) {
  const { getPendingChanges, settings } = useFileWatchStore();
  const pendingChanges = getPendingChanges();

  if (!settings.showNotifications || pendingChanges.length === 0) {
    return null;
  }

  // Group by path, show most recent for each
  const changesByPath = new Map<string, ExternalChange>();
  for (const change of pendingChanges) {
    const existing = changesByPath.get(change.path);
    if (!existing || change.timestamp > existing.timestamp) {
      changesByPath.set(change.path, change);
    }
  }

  const uniqueChanges = Array.from(changesByPath.values());

  return (
    <div className={`space-y-2 ${className}`}>
      {uniqueChanges.map((change) => (
        <ExternalChangeNotification
          key={change.id}
          change={change}
          onReload={() => onReload(change.path)}
          onIgnore={() => {}}
          onCompare={() => onCompare(change.path)}
        />
      ))}
    </div>
  );
}
