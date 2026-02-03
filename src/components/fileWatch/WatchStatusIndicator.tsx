/**
 * Watch Status Indicator Component
 *
 * Shows the current file watching status in the UI.
 */

import React from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Lock,
  FileWarning,
} from 'lucide-react';
import { useFileWatchStore, type FileWatchStatus } from '@stores/fileWatchStore';

interface WatchStatusIndicatorProps {
  filePath?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  FileWatchStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  watching: {
    icon: <Eye className="w-4 h-4" />,
    label: 'Watching',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  changed: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Changed',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  deleted: {
    icon: <FileWarning className="w-4 h-4" />,
    label: 'Deleted',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  locked: {
    icon: <Lock className="w-4 h-4" />,
    label: 'Locked',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Error',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function WatchStatusIndicator({
  filePath,
  showLabel = true,
  size = 'sm',
  className = '',
}: WatchStatusIndicatorProps) {
  const { getWatchedFile, isEnabled, settings } = useFileWatchStore();

  // If no file path provided or watching is disabled
  if (!settings.enabled || !isEnabled) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
        title="File watching disabled"
      >
        <EyeOff className={iconSizes[size]} />
        {showLabel && <span>Not watching</span>}
      </div>
    );
  }

  if (!filePath) {
    return null;
  }

  const watchedFile = getWatchedFile(filePath);

  if (!watchedFile) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
        title="Not watching this file"
      >
        <EyeOff className={iconSizes[size]} />
        {showLabel && <span>Not watched</span>}
      </div>
    );
  }

  const config = statusConfig[watchedFile.status];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${config.bgColor} ${config.color} ${className}`}
      title={`${config.label}${watchedFile.changeCount > 0 ? ` (${watchedFile.changeCount} changes)` : ''}`}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && (
        <>
          <span>{config.label}</span>
          {watchedFile.changeCount > 0 && (
            <span className="ml-1 px-1.5 bg-white/30 dark:bg-black/20 rounded-full text-xs font-medium">
              {watchedFile.changeCount}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Global watch status for status bar
 */
export function GlobalWatchStatus({ className = '' }: { className?: string }) {
  const { watchedFiles, isEnabled, settings, getPendingChanges } = useFileWatchStore();
  const pendingChanges = getPendingChanges();

  if (!settings.enabled || !isEnabled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}
        title="File watching disabled"
      >
        <EyeOff className="w-3.5 h-3.5" />
        <span>Watching off</span>
      </div>
    );
  }

  const watchCount = watchedFiles.size;
  const changedCount = pendingChanges.length;

  if (watchCount === 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}
        title="No files being watched"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>No files watched</span>
      </div>
    );
  }

  if (changedCount > 0) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 ${className}`}
        title={`${changedCount} file(s) have changed`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{changedCount} changed</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 ${className}`}
      title={`Watching ${watchCount} file(s)`}
    >
      <CheckCircle className="w-3.5 h-3.5" />
      <span>Watching {watchCount}</span>
    </div>
  );
}

/**
 * Watch toggle button
 */
export function WatchToggleButton({
  filePath,
  onToggle,
  className = '',
}: {
  filePath: string;
  onToggle?: (watching: boolean) => void;
  className?: string;
}) {
  const { getWatchedFile, watchFile, unwatchFile, isEnabled } = useFileWatchStore();
  const [isToggling, setIsToggling] = React.useState(false);

  const isWatching = !!getWatchedFile(filePath);

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (isWatching) {
        await unwatchFile(filePath);
        onToggle?.(false);
      } else {
        await watchFile(filePath);
        onToggle?.(true);
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling || !isEnabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
        ${
          isWatching
            ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
            : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      title={isWatching ? 'Stop watching this file' : 'Watch this file for changes'}
    >
      {isToggling ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : isWatching ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
      <span>{isWatching ? 'Watching' : 'Watch'}</span>
    </button>
  );
}
