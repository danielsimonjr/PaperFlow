/**
 * Update Settings Component
 *
 * Settings panel for auto-update configuration.
 * Allows users to configure update channel, frequency, and behavior.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, Info, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useUpdateStore } from '@/stores/updateStore';
import { Button } from '@/components/ui/Button';
import type { UpdateChannel, UpdateCheckFrequency } from '../../../electron/ipc/types';

export interface UpdateSettingsProps {
  className?: string;
}

export function UpdateSettings({ className = '' }: UpdateSettingsProps): React.ReactElement {
  const {
    state,
    settings,
    isCheckingManually,
    setAutoUpdate,
    setChannel,
    setCheckFrequency,
    checkForUpdates,
    syncWithMain,
  } = useUpdateStore();

  const [checkResult, setCheckResult] = useState<'success' | 'error' | null>(null);

  // Sync with main process on mount
  useEffect(() => {
    syncWithMain();
  }, [syncWithMain]);

  // Clear check result after timeout
  useEffect(() => {
    if (checkResult) {
      const timer = setTimeout(() => setCheckResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [checkResult]);

  const handleCheckForUpdates = async () => {
    try {
      await checkForUpdates();
      setCheckResult(
        state.status === 'available' || state.status === 'downloaded' ? 'success' : 'success'
      );
    } catch {
      setCheckResult('error');
    }
  };

  const formatLastCheckTime = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const channelOptions: { value: UpdateChannel; label: string; description: string }[] = [
    { value: 'stable', label: 'Stable', description: 'Recommended for most users' },
    { value: 'beta', label: 'Beta', description: 'Preview new features before release' },
    { value: 'alpha', label: 'Alpha', description: 'Experimental builds for testing' },
  ];

  const frequencyOptions: { value: UpdateCheckFrequency; label: string }[] = [
    { value: 'hourly', label: 'Every hour' },
    { value: 'daily', label: 'Once a day' },
    { value: 'weekly', label: 'Once a week' },
    { value: 'never', label: 'Never (manual only)' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Version */}
      <div className="rounded border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Current Version</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PaperFlow v{state.currentVersion}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            {state.status === 'available' && (
              <span className="text-sm text-blue-500">Update available</span>
            )}
            {state.status === 'downloaded' && (
              <span className="text-sm text-green-500">Ready to install</span>
            )}

            {/* Check button */}
            <Button
              onClick={handleCheckForUpdates}
              variant="secondary"
              size="sm"
              disabled={isCheckingManually}
            >
              {isCheckingManually ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-4 w-4" />
              )}
              Check for Updates
            </Button>
          </div>
        </div>

        {/* Check result feedback */}
        {checkResult && !isCheckingManually && (
          <div className="mt-3 text-sm">
            {state.status === 'available' || state.status === 'downloaded' ? (
              <span className="flex items-center gap-1 text-blue-500">
                <Info className="h-4 w-4" />
                Version {state.availableVersion} is available
              </span>
            ) : checkResult === 'error' ? (
              <span className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Failed to check for updates
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-500">
                <Check className="h-4 w-4" />
                You're up to date
              </span>
            )}
          </div>
        )}

        {/* Last check time */}
        <p className="mt-2 text-xs text-gray-400">
          Last checked: {formatLastCheckTime(state.lastCheckTime)}
        </p>
      </div>

      {/* Auto-Update Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">Automatic Updates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download and install updates automatically
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={settings.autoUpdate}
            onChange={(e) => setAutoUpdate(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700" />
        </label>
      </div>

      {/* Update Channel */}
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Update Channel</h3>
        <div className="space-y-2">
          {channelOptions.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center rounded border p-3 transition-colors ${
                settings.channel === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="updateChannel"
                value={option.value}
                checked={settings.channel === option.value}
                onChange={() => setChannel(option.value)}
                className="h-4 w-4 text-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Warning for non-stable channels */}
        {settings.channel !== 'stable' && (
          <div className="mt-2 flex items-start gap-2 rounded bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              {settings.channel === 'beta'
                ? 'Beta releases may contain bugs. Use with caution.'
                : 'Alpha releases are experimental and may be unstable.'}
            </span>
          </div>
        )}
      </div>

      {/* Check Frequency */}
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Check Frequency</h3>
        <select
          value={settings.checkFrequency}
          onChange={(e) => setCheckFrequency(e.target.value as UpdateCheckFrequency)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Settings */}
      <details className="rounded border border-gray-200 dark:border-gray-700">
        <summary className="cursor-pointer px-4 py-2 font-medium text-gray-900 dark:text-white">
          Advanced Settings
        </summary>
        <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-700">
          {/* Allow Downgrade */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Allow Downgrade
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow installing older versions (useful when switching from beta to stable)
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.allowDowngrade}
                onChange={(e) =>
                  useUpdateStore.getState().setSettings({ allowDowngrade: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700" />
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}

export default UpdateSettings;
