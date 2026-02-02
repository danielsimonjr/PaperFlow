/**
 * Update Notification Component
 *
 * Shows a notification when an update is available or downloaded.
 * Provides quick actions to download, install, or dismiss.
 */

import React from 'react';
import { X, Download, RotateCcw, Info, AlertCircle } from 'lucide-react';
import { useUpdateStore } from '@/stores/updateStore';
import { Button } from '@/components/ui/Button';

export interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className = '' }: UpdateNotificationProps): React.ReactElement | null {
  const {
    state,
    isNotificationVisible,
    hideNotification,
    downloadUpdate,
    installAndRestart,
    installLater,
    showReleaseNotes,
  } = useUpdateStore();

  // Don't show if not visible or no update
  if (!isNotificationVisible) {
    return null;
  }

  // Only show for 'available' or 'downloaded' states
  if (state.status !== 'available' && state.status !== 'downloaded') {
    return null;
  }

  const isDownloaded = state.status === 'downloaded';
  const version = state.availableVersion || 'new version';

  const handlePrimaryAction = () => {
    if (isDownloaded) {
      installAndRestart();
    } else {
      downloadUpdate();
      hideNotification();
    }
  };

  const handleSecondaryAction = async () => {
    if (isDownloaded) {
      await installLater();
    } else {
      hideNotification();
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isDownloaded ? (
            <RotateCcw className="h-5 w-5 text-green-500" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5 text-blue-500" aria-hidden="true" />
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isDownloaded ? 'Update Ready' : 'Update Available'}
          </h3>
        </div>
        <button
          onClick={hideNotification}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        {isDownloaded ? (
          <>
            PaperFlow <strong>{version}</strong> has been downloaded and is ready to install.
            Restart the app to apply the update.
          </>
        ) : (
          <>
            A new version of PaperFlow (<strong>{version}</strong>) is available.
            Would you like to download it now?
          </>
        )}
      </p>

      {/* Release notes link */}
      {state.releaseNotes && (
        <button
          onClick={showReleaseNotes}
          className="mb-3 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
        >
          <Info className="h-4 w-4" />
          View release notes
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handlePrimaryAction} variant="primary" size="sm">
          {isDownloaded ? 'Restart Now' : 'Download Update'}
        </Button>
        <Button onClick={handleSecondaryAction} variant="secondary" size="sm">
          {isDownloaded ? 'Later' : 'Not Now'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Update Error Notification Component
 */
export function UpdateErrorNotification(): React.ReactElement | null {
  const { state, checkForUpdates, hideNotification } = useUpdateStore();

  if (state.status !== 'error') {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-red-200 bg-white p-4 shadow-lg dark:border-red-800 dark:bg-gray-800"
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Update Error</h3>
        </div>
        <button
          onClick={hideNotification}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        Failed to check for updates: {state.error || 'Unknown error'}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => checkForUpdates()} variant="primary" size="sm">
          Retry
        </Button>
        <Button onClick={hideNotification} variant="secondary" size="sm">
          Dismiss
        </Button>
      </div>

      {/* Manual download link */}
      <a
        href="https://github.com/paperflow/paperflow/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-xs text-blue-500 hover:underline"
      >
        Download manually from GitHub
      </a>
    </div>
  );
}

export default UpdateNotification;
