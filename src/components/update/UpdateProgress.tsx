/**
 * Update Progress Component
 *
 * Shows download progress with speed, size, and cancel option.
 */

import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useUpdateStore, formatDownloadProgress } from '@/stores/updateStore';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export interface UpdateProgressProps {
  className?: string;
}

export function UpdateProgress({ className = '' }: UpdateProgressProps): React.ReactElement | null {
  const {
    state,
    isProgressDialogVisible,
    hideProgressDialog,
    cancelDownload,
    installAndRestart,
    installLater,
  } = useUpdateStore();

  // Only show during downloading or downloaded states
  if (!isProgressDialogVisible) {
    return null;
  }

  const isDownloading = state.status === 'downloading';
  const isDownloaded = state.status === 'downloaded';
  const hasError = state.status === 'error';
  const progress = formatDownloadProgress(state.downloadProgress);

  const handleClose = async () => {
    if (isDownloading) {
      await cancelDownload();
    } else {
      hideProgressDialog();
    }
  };

  if (!isDownloading && !isDownloaded && !hasError) {
    return null;
  }

  return (
    <Dialog open={isProgressDialogVisible} onOpenChange={handleClose}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDownloading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isDownloaded && <Download className="h-5 w-5 text-green-500" />}
            {isDownloading ? 'Downloading Update...' : 'Update Ready'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Version info */}
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            {isDownloading ? (
              <>Downloading PaperFlow <strong>{state.availableVersion}</strong>...</>
            ) : (
              <>PaperFlow <strong>{state.availableVersion}</strong> is ready to install.</>
            )}
          </p>

          {/* Progress bar (only during download) */}
          {isDownloading && state.downloadProgress && (
            <div className="mb-4">
              {/* Progress bar */}
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: progress.percent }}
                  role="progressbar"
                  aria-valuenow={state.downloadProgress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Progress details */}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{progress.percent}</span>
                <span>{progress.speed}</span>
                <span>
                  {progress.transferred} / {progress.total}
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {hasError && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {state.error || 'An error occurred while downloading the update.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isDownloading && (
              <Button onClick={cancelDownload} variant="secondary" size="sm">
                Cancel
              </Button>
            )}

            {isDownloaded && (
              <>
                <Button onClick={installLater} variant="secondary" size="sm">
                  Install Later
                </Button>
                <Button onClick={installAndRestart} variant="primary" size="sm">
                  Restart Now
                </Button>
              </>
            )}

            {hasError && (
              <Button onClick={hideProgressDialog} variant="secondary" size="sm">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact progress indicator for status bar
 */
export function UpdateProgressIndicator(): React.ReactElement | null {
  const { state, showProgressDialog } = useUpdateStore();

  if (state.status !== 'downloading') {
    return null;
  }

  const progress = formatDownloadProgress(state.downloadProgress);

  return (
    <button
      onClick={showProgressDialog}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      title="View download progress"
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Downloading update... {progress.percent}</span>
    </button>
  );
}

export default UpdateProgress;
