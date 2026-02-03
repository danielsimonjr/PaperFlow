/**
 * Update Notification Component
 *
 * User notification for available updates.
 */

import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  progress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  updateInfo?: UpdateInfo;
  error?: string;
}

interface ElectronUpdatesAPI {
  getState: () => Promise<UpdateState>;
  onStateChange: (handler: (event: unknown, state: UpdateState) => void) => void;
  offStateChange: (handler: (event: unknown, state: UpdateState) => void) => void;
  download: () => Promise<void>;
  install: () => void;
}

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for update state changes from main process
    const handleStateChange = (_event: unknown, state: UpdateState) => {
      setUpdateState(state);
      if (state.status === 'available') {
        setDismissed(false);
      }
    };

    // Check if running in Electron
    const electronWindow = window as unknown as { electronUpdates?: ElectronUpdatesAPI };
    if (typeof window !== 'undefined' && electronWindow.electronUpdates) {
      const api = electronWindow.electronUpdates;

      // Get initial state
      api.getState().then(setUpdateState);

      // Listen for changes
      api.onStateChange(handleStateChange);

      return () => {
        api.offStateChange(handleStateChange);
      };
    }
  }, []);

  const handleDownload = async () => {
    const electronWindow = window as unknown as { electronUpdates?: ElectronUpdatesAPI };
    if (electronWindow.electronUpdates) {
      await electronWindow.electronUpdates.download();
    }
  };

  const handleInstall = () => {
    const electronWindow = window as unknown as { electronUpdates?: ElectronUpdatesAPI };
    if (electronWindow.electronUpdates) {
      electronWindow.electronUpdates.install();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Don't show if dismissed or no update
  if (dismissed || updateState.status === 'idle' || updateState.status === 'checking') {
    return null;
  }

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 max-w-sm', className)}>
      {/* Update available */}
      {updateState.status === 'available' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">Update Available</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Version {updateState.updateInfo?.version} is ready to download.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDismiss} className="flex-1">
              Later
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} className="flex-1">
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Downloading */}
      {updateState.status === 'downloading' && updateState.progress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <svg
              className="w-5 h-5 text-primary-500 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-sm">Downloading Update</div>
              <div className="text-xs text-gray-500">
                {formatBytes(updateState.progress.transferred)} /{' '}
                {formatBytes(updateState.progress.total)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatBytes(updateState.progress.bytesPerSecond)}/s
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${updateState.progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Downloaded */}
      {updateState.status === 'downloaded' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">Update Ready</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Restart to install version {updateState.updateInfo?.version}.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDismiss} className="flex-1">
              Later
            </Button>
            <Button variant="primary" size="sm" onClick={handleInstall} className="flex-1">
              Restart Now
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {updateState.status === 'error' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-red-700 dark:text-red-400">Update Failed</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">
                {updateState.error || 'An error occurred while updating.'}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateNotification;
