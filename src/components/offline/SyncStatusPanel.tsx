/**
 * Sync Status Panel
 *
 * Detailed panel showing sync status, progress, pending operations,
 * and sync controls.
 */

import { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  CloudOff,
  HardDrive,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOfflineStore } from '@/stores/offlineStore';
import { offlineStorage } from '@/lib/offline/offlineStorage';
import { offlineQueue } from '@/lib/offline/offlineQueue';
import { backgroundSync } from '@/lib/offline/backgroundSync';
import { cn } from '@/utils/cn';
import type { OfflineStorageStats } from '@/types/offline';

export interface SyncStatusPanelProps {
  onClose: () => void;
}

export function SyncStatusPanel({ onClose }: SyncStatusPanelProps) {
  const [storageStats, setStorageStats] = useState<OfflineStorageStats | null>(null);
  const [queueStats, setQueueStats] = useState({ pending: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const isOnline = useOfflineStore((state) => state.isOnline);
  const syncStatus = useOfflineStore((state) => state.syncStatus);
  const syncProgress = useOfflineStore((state) => state.syncProgress);
  const lastSyncAt = useOfflineStore((state) => state.lastSyncAt);
  const syncError = useOfflineStore((state) => state.syncError);
  const hasUnresolvedConflicts = useOfflineStore((state) => state.hasUnresolvedConflicts);
  const conflicts = useOfflineStore((state) => state.conflicts);
  const autoSync = useOfflineStore((state) => state.autoSync);
  const setAutoSync = useOfflineStore((state) => state.setAutoSync);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const [storage, queue] = await Promise.all([
          offlineStorage.getStorageStats(),
          offlineQueue.getStats(),
        ]);
        setStorageStats(storage);
        setQueueStats(queue);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleSync = async () => {
    await backgroundSync.requestSync();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Sync Status
        </h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isOnline
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
            )}
          >
            {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {isOnline ? 'Connected' : 'Offline'}
            </p>
            <p className="text-sm text-gray-500">
              {isOnline
                ? 'All features available'
                : 'Limited to offline documents'}
            </p>
          </div>
        </div>

        {/* Sync Progress */}
        {syncStatus === 'syncing' && syncProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Syncing {syncProgress.currentDocument || '...'}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {syncProgress.documentsSynced}/{syncProgress.documentsTotal}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${(syncProgress.bytesTransferred / syncProgress.bytesTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Sync Error */}
        {syncStatus === 'error' && syncError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <CloudOff className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Sync Error</p>
              <p className="text-red-600 dark:text-red-300">{syncError}</p>
            </div>
          </div>
        )}

        {/* Conflicts Warning */}
        {hasUnresolvedConflicts && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {conflicts.filter((c) => !c.resolvedAt).length} Conflicts
              </p>
              <p className="text-amber-600 dark:text-amber-300">
                Some documents need manual resolution
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {/* Last Sync */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Last Sync</span>
              </div>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {formatDate(lastSyncAt)}
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Pending</span>
              </div>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {queueStats.pending} operations
              </p>
            </div>

            {/* Storage */}
            {storageStats && (
              <>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-xs">Documents</span>
                  </div>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {storageStats.totalDocuments}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Storage Used</span>
                  </div>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {formatBytes(storageStats.totalSize)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Auto-sync Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Auto-sync</p>
            <p className="text-sm text-gray-500">
              Sync changes automatically
            </p>
          </div>
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              autoSync ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                autoSync && 'translate-x-5'
              )}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSync}
          disabled={!isOnline || syncStatus === 'syncing'}
        >
          {syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
