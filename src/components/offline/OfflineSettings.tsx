/**
 * Offline Settings Component
 *
 * UI for managing offline storage space and document availability.
 */

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  Download,
  Star,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOfflineStore } from '@/stores/offlineStore';
import { offlineStorage } from '@/lib/offline/offlineStorage';
import { offlineAvailability } from '@/lib/offline/offlineAvailability';
import { cn } from '@/utils/cn';
import type { OfflineDocumentMetadata, SyncPriority, OfflineStorageStats } from '@/types/offline';

export interface OfflineSettingsProps {
  className?: string;
}

export function OfflineSettings({ className }: OfflineSettingsProps) {
  const [documents, setDocuments] = useState<OfflineDocumentMetadata[]>([]);
  const [stats, setStats] = useState<OfflineStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const autoSync = useOfflineStore((state) => state.autoSync);
  const syncOnReconnect = useOfflineStore((state) => state.syncOnReconnect);
  const setAutoSync = useOfflineStore((state) => state.setAutoSync);
  const setSyncOnReconnect = useOfflineStore((state) => state.setSyncOnReconnect);

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [docs, storageStats] = await Promise.all([
          offlineStorage.getAllDocumentMetadata(),
          offlineStorage.getStorageStats(),
        ]);
        setDocuments(docs);
        setStats(storageStats);
      } catch (error) {
        console.error('Failed to load offline data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handler for removing documents (used in expanded document actions)
  const _handleRemoveDocument = async (documentId: string) => {
    await offlineAvailability.removeFromOffline(documentId);
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    setStats(await offlineStorage.getStorageStats());
  };
  // Keep reference to avoid unused variable warning
  void _handleRemoveDocument;

  // Handler for setting document priority (used in expanded document actions)
  const _handleSetPriority = async (documentId: string, priority: SyncPriority) => {
    await offlineAvailability.setPriority(documentId, priority);
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, priority } : d))
    );
  };
  // Keep reference to avoid unused variable warning
  void _handleSetPriority;

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all offline documents?')) {
      return;
    }
    await offlineStorage.clearAll();
    setDocuments([]);
    setStats(await offlineStorage.getStorageStats());
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: SyncPriority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'normal':
        return 'text-blue-500';
      case 'low':
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Storage Overview */}
      {stats && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Offline Storage
                </h3>
                <p className="text-sm text-gray-500">
                  {stats.totalDocuments} documents stored
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatBytes(stats.totalSize)}
              </p>
              <p className="text-sm text-gray-500">
                of {formatBytes(stats.availableSpace + stats.usedSpace)}
              </p>
            </div>
          </div>

          {/* Storage Bar */}
          <div className="mt-4">
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={cn(
                  'h-full transition-all',
                  stats.quotaUsagePercent > 90
                    ? 'bg-red-500'
                    : stats.quotaUsagePercent > 70
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                )}
                style={{ width: `${Math.min(stats.quotaUsagePercent, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{Math.round(stats.quotaUsagePercent)}% used</span>
              <span>{formatBytes(stats.availableSpace)} available</span>
            </div>
          </div>

          {stats.quotaUsagePercent > 80 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">
                Storage is running low. Consider removing some offline documents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sync Settings */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Sync Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Auto-sync
              </p>
              <p className="text-sm text-gray-500">
                Automatically sync changes in the background
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

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Sync on reconnect
              </p>
              <p className="text-sm text-gray-500">
                Sync immediately when connection is restored
              </p>
            </div>
            <button
              onClick={() => setSyncOnReconnect(!syncOnReconnect)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                syncOnReconnect ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  syncOnReconnect && 'translate-x-5'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Offline Documents
          </h3>
          {documents.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <Download className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium text-gray-900 dark:text-white">
              No offline documents
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Documents you mark for offline access will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-4 p-4 transition-colors',
                  selectedDoc === doc.id && 'bg-gray-50 dark:bg-gray-800'
                )}
              >
                <button
                  onClick={() =>
                    setSelectedDoc(selectedDoc === doc.id ? null : doc.id)
                  }
                  className="flex flex-1 items-center gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {doc.fileName}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatBytes(doc.fileSize)}</span>
                      <span>-</span>
                      <span>{doc.pageCount} pages</span>
                      <span>-</span>
                      <span>Modified {formatDate(doc.modifiedAt)}</span>
                    </div>
                  </div>
                  <Star
                    className={cn('h-5 w-5', getPriorityColor(doc.priority))}
                    fill={doc.priority === 'high' ? 'currentColor' : 'none'}
                  />
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 text-gray-400 transition-transform',
                      selectedDoc === doc.id && 'rotate-90'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
