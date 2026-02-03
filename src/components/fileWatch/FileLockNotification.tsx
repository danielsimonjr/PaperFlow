/**
 * File Lock Notification Component
 *
 * Notifies user when a file is locked by another application
 * with retry options.
 */

import { useState, useEffect, useCallback } from 'react';
import { Lock, RefreshCw, X, CheckCircle } from 'lucide-react';

interface FileLockNotificationProps {
  filePath: string;
  isLocked: boolean;
  onRetry: () => Promise<boolean>;
  onDismiss: () => void;
  className?: string;
}

export function FileLockNotification({
  filePath,
  isLocked,
  onRetry,
  onDismiss,
  className = '',
}: FileLockNotificationProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryResult, setLastRetryResult] = useState<boolean | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);
  const [secondsUntilRetry, setSecondsUntilRetry] = useState(0);

  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setLastRetryResult(null);

    try {
      const success = await onRetry();
      setLastRetryResult(success);
      setRetryCount((prev) => prev + 1);

      if (success) {
        setAutoRetry(false);
      }
    } catch {
      setLastRetryResult(false);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  // Auto-retry logic
  useEffect(() => {
    if (!autoRetry || !isLocked || isRetrying) return;

    setSecondsUntilRetry(5);

    const countdownInterval = setInterval(() => {
      setSecondsUntilRetry((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRetry, isLocked, retryCount, isRetrying, handleRetry]);

  if (!isLocked && lastRetryResult === true) {
    // Show success state briefly
    return (
      <div
        className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              File is now available
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {fileName} can now be saved
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!isLocked) {
    return null;
  }

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            File is Locked
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            <span className="font-medium truncate block">{fileName}</span>
            is currently being used by another program and cannot be saved.
          </p>

          {retryCount > 0 && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Retry attempts: {retryCount}
              {lastRetryResult === false && ' (last attempt failed)'}
            </p>
          )}

          {autoRetry && !isRetrying && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Auto-retry in {secondsUntilRetry}s...
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry Now'}
        </button>

        <label className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRetry}
            onChange={(e) => setAutoRetry(e.target.checked)}
            className="rounded border-red-300 text-red-600 focus:ring-red-500"
            disabled={isRetrying}
          />
          Auto-retry every 5s
        </label>
      </div>

      <div className="mt-3 text-xs text-red-600 dark:text-red-400">
        <p>Possible solutions:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Close the file in other applications</li>
          <li>Wait for the other program to finish</li>
          <li>Save to a different location</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Compact file lock indicator for toolbar/status bar
 */
export function FileLockIndicator({
  isLocked,
  onClick,
  className = '',
}: {
  isLocked: boolean;
  onClick?: () => void;
  className?: string;
}) {
  if (!isLocked) return null;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ${className}`}
      title="File is locked by another application"
    >
      <Lock className="w-3 h-3" />
      Locked
    </button>
  );
}
