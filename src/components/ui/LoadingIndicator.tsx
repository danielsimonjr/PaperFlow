import { X } from 'lucide-react';
import { cn } from '@utils/cn';

interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function LoadingIndicator({
  message = 'Loading...',
  progress = 0,
  showProgress = false,
  onCancel,
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
    >
      {/* Spinner */}
      <div className="relative">
        {showProgress && progress > 0 ? (
          // Progress circle
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              className="text-primary-500 transition-all duration-300"
            />
          </svg>
        ) : (
          // Spinner
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 dark:border-gray-700 dark:border-t-primary-400" />
        )}

        {/* Progress text in center */}
        {showProgress && progress > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>

      {/* Progress bar (alternative display) */}
      {showProgress && (
        <div className="w-48">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      )}
    </div>
  );
}

// Full-screen loading overlay variant
export function LoadingOverlay({
  message = 'Loading...',
  progress = 0,
  showProgress = false,
  onCancel,
}: LoadingIndicatorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <LoadingIndicator
        message={message}
        progress={progress}
        showProgress={showProgress}
        onCancel={onCancel}
      />
    </div>
  );
}
