/**
 * Offline Sync Hook
 *
 * React hook for managing sync operations and status.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOfflineStore } from '@/stores/offlineStore';
import { syncEngine, type SyncResult } from '@/lib/offline/syncEngine';
import { backgroundSync, getSyncStatus } from '@/lib/offline/backgroundSync';
import { offlineQueue } from '@/lib/offline/offlineQueue';
import type { SyncProgress, SyncConflict, ConflictResolutionStrategy } from '@/types/offline';

/**
 * Sync state
 */
interface SyncState {
  isSyncing: boolean;
  progress: SyncProgress | null;
  lastSyncResult: SyncResult | null;
  error: string | null;
  pendingCount: number;
  conflicts: SyncConflict[];
}

/**
 * Hook for offline sync operations
 */
export function useOfflineSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    progress: null,
    lastSyncResult: null,
    error: null,
    pendingCount: 0,
    conflicts: [],
  });

  const isOnline = useOfflineStore((state) => state.isOnline);
  const storeConflicts = useOfflineStore((state) => state.conflicts);
  const setSyncStatus = useOfflineStore((state) => state.setSyncStatus);
  const setSyncProgress = useOfflineStore((state) => state.setSyncProgress);
  const setLastSyncAt = useOfflineStore((state) => state.setLastSyncAt);
  const setPendingOperationsCount = useOfflineStore((state) => state.setPendingOperationsCount);

  // Load initial state
  useEffect(() => {
    async function loadState() {
      const stats = await offlineQueue.getStats();
      setState((prev) => ({
        ...prev,
        pendingCount: stats.pending,
        conflicts: storeConflicts.filter((c) => !c.resolvedAt),
      }));
    }
    loadState();
  }, [storeConflicts]);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = offlineQueue.addListener(async () => {
      const stats = await offlineQueue.getStats();
      setState((prev) => ({ ...prev, pendingCount: stats.pending }));
      setPendingOperationsCount(stats.pending);
    });

    return unsubscribe;
  }, [setPendingOperationsCount]);

  /**
   * Start a full sync
   */
  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!isOnline) {
      setState((prev) => ({
        ...prev,
        error: 'Cannot sync while offline',
      }));
      return null;
    }

    if (state.isSyncing) {
      return null;
    }

    setState((prev) => ({
      ...prev,
      isSyncing: true,
      error: null,
    }));

    setSyncStatus('syncing');

    try {
      const result = await syncEngine.sync();

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: result,
        progress: null,
        conflicts: result.conflicts,
      }));

      setSyncStatus(result.success ? 'idle' : 'error');
      setSyncProgress(null);
      setLastSyncAt(new Date());

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));

      setSyncStatus('error');

      return null;
    }
  }, [isOnline, state.isSyncing, setSyncStatus, setSyncProgress, setLastSyncAt]);

  /**
   * Request background sync
   */
  const requestBackgroundSync = useCallback(async (): Promise<void> => {
    await backgroundSync.requestSync();
  }, []);

  /**
   * Cancel ongoing sync
   */
  const cancelSync = useCallback((): void => {
    syncEngine.cancelSync();
    setState((prev) => ({
      ...prev,
      isSyncing: false,
      progress: null,
    }));
    setSyncStatus('idle');
    setSyncProgress(null);
  }, [setSyncStatus, setSyncProgress]);

  /**
   * Resolve a specific conflict
   */
  const resolveConflict = useCallback(
    async (
      conflictId: string,
      strategy: ConflictResolutionStrategy
    ): Promise<void> => {
      const conflict = state.conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      await syncEngine.resolveConflict(conflict, strategy);

      setState((prev) => ({
        ...prev,
        conflicts: prev.conflicts.filter((c) => c.id !== conflictId),
      }));
    },
    [state.conflicts]
  );

  /**
   * Resolve all conflicts with a strategy
   */
  const resolveAllConflicts = useCallback(
    async (strategy: ConflictResolutionStrategy): Promise<void> => {
      for (const conflict of state.conflicts) {
        await syncEngine.resolveConflict(conflict, strategy);
      }

      setState((prev) => ({
        ...prev,
        conflicts: [],
      }));
    },
    [state.conflicts]
  );

  /**
   * Get sync status
   */
  const getStatus = useCallback(async () => {
    return getSyncStatus();
  }, []);

  return {
    // State
    isSyncing: state.isSyncing,
    progress: state.progress,
    lastSyncResult: state.lastSyncResult,
    error: state.error,
    pendingCount: state.pendingCount,
    conflicts: state.conflicts,
    hasConflicts: state.conflicts.length > 0,

    // Actions
    sync,
    requestBackgroundSync,
    cancelSync,
    resolveConflict,
    resolveAllConflicts,
    getStatus,
  };
}
