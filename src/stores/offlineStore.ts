/**
 * Offline-Aware Zustand Store
 *
 * Manages connection status, sync state, pending operations count,
 * and last sync timestamp.
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type {
  ConnectionStatus,
  SyncStatus,
  SyncProgress,
  OfflineStorageStats,
  SyncConflict,
  ConflictResolutionStrategy,
} from '@/types/offline';

/**
 * Offline store state
 */
interface OfflineState {
  // Connection status
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;

  // Sync status
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  syncError: string | null;

  // Queue status
  pendingOperationsCount: number;
  failedOperationsCount: number;

  // Storage status
  storageStats: OfflineStorageStats | null;

  // Conflicts
  conflicts: SyncConflict[];
  hasUnresolvedConflicts: boolean;

  // Settings
  autoSync: boolean;
  syncOnReconnect: boolean;
  defaultConflictResolution: ConflictResolutionStrategy;

  // Banner state
  showOfflineBanner: boolean;
  offlineBannerDismissed: boolean;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setOnline: (online: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
  setLastSyncAt: (date: Date | null) => void;
  setSyncError: (error: string | null) => void;
  setPendingOperationsCount: (count: number) => void;
  setFailedOperationsCount: (count: number) => void;
  setStorageStats: (stats: OfflineStorageStats | null) => void;
  addConflict: (conflict: SyncConflict) => void;
  removeConflict: (conflictId: string) => void;
  resolveConflict: (conflictId: string, strategy: ConflictResolutionStrategy) => void;
  clearConflicts: () => void;
  setAutoSync: (enabled: boolean) => void;
  setSyncOnReconnect: (enabled: boolean) => void;
  setDefaultConflictResolution: (strategy: ConflictResolutionStrategy) => void;
  showBanner: () => void;
  dismissBanner: () => void;
  resetBannerDismissal: () => void;
}

/**
 * Offline store
 */
export const useOfflineStore = create<OfflineState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        connectionStatus: 'online',
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastOnlineAt: null,
        lastOfflineAt: null,

        syncStatus: 'idle',
        syncProgress: null,
        lastSyncAt: null,
        nextSyncAt: null,
        syncError: null,

        pendingOperationsCount: 0,
        failedOperationsCount: 0,

        storageStats: null,

        conflicts: [],
        hasUnresolvedConflicts: false,

        autoSync: true,
        syncOnReconnect: true,
        defaultConflictResolution: 'newest-wins',

        showOfflineBanner: false,
        offlineBannerDismissed: false,

        // Actions
        setConnectionStatus: (status) => {
          const now = new Date();
          set((state) => ({
            connectionStatus: status,
            isOnline: status === 'online',
            lastOnlineAt: status === 'online' ? now : state.lastOnlineAt,
            lastOfflineAt: status === 'offline' ? now : state.lastOfflineAt,
            showOfflineBanner:
              status === 'offline' && !state.offlineBannerDismissed,
          }));
        },

        setOnline: (online) => {
          const now = new Date();
          const { offlineBannerDismissed, syncOnReconnect } = get();

          set((state) => ({
            connectionStatus: online ? 'online' : 'offline',
            isOnline: online,
            lastOnlineAt: online ? now : state.lastOnlineAt,
            lastOfflineAt: !online ? now : state.lastOfflineAt,
            showOfflineBanner: !online && !offlineBannerDismissed,
            // Reset banner dismissal when coming back online
            offlineBannerDismissed: online ? false : offlineBannerDismissed,
          }));

          // Trigger sync on reconnect if enabled
          if (online && syncOnReconnect) {
            // This will be handled by the sync engine
          }
        },

        setSyncStatus: (status) => {
          set({ syncStatus: status });
        },

        setSyncProgress: (progress) => {
          set({ syncProgress: progress });
        },

        setLastSyncAt: (date) => {
          set({ lastSyncAt: date });
        },

        setSyncError: (error) => {
          set({
            syncError: error,
            syncStatus: error ? 'error' : 'idle',
          });
        },

        setPendingOperationsCount: (count) => {
          set({ pendingOperationsCount: count });
        },

        setFailedOperationsCount: (count) => {
          set({ failedOperationsCount: count });
        },

        setStorageStats: (stats) => {
          set({ storageStats: stats });
        },

        addConflict: (conflict) => {
          set((state) => ({
            conflicts: [...state.conflicts, conflict],
            hasUnresolvedConflicts: true,
          }));
        },

        removeConflict: (conflictId) => {
          set((state) => {
            const newConflicts = state.conflicts.filter((c) => c.id !== conflictId);
            return {
              conflicts: newConflicts,
              hasUnresolvedConflicts: newConflicts.some((c) => !c.resolvedAt),
            };
          });
        },

        resolveConflict: (conflictId, strategy) => {
          set((state) => {
            const newConflicts = state.conflicts.map((c) =>
              c.id === conflictId
                ? {
                    ...c,
                    resolvedAt: new Date(),
                    resolution: {
                      strategy,
                      resolvedAt: new Date(),
                      resultingVersion: c.localVersion, // Will be updated by sync engine
                    },
                  }
                : c
            );
            return {
              conflicts: newConflicts,
              hasUnresolvedConflicts: newConflicts.some((c) => !c.resolvedAt),
            };
          });
        },

        clearConflicts: () => {
          set({
            conflicts: [],
            hasUnresolvedConflicts: false,
          });
        },

        setAutoSync: (enabled) => {
          set({ autoSync: enabled });
        },

        setSyncOnReconnect: (enabled) => {
          set({ syncOnReconnect: enabled });
        },

        setDefaultConflictResolution: (strategy) => {
          set({ defaultConflictResolution: strategy });
        },

        showBanner: () => {
          set({ showOfflineBanner: true });
        },

        dismissBanner: () => {
          set({
            showOfflineBanner: false,
            offlineBannerDismissed: true,
          });
        },

        resetBannerDismissal: () => {
          set({ offlineBannerDismissed: false });
        },
      }),
      {
        name: 'paperflow-offline',
        partialize: (state) => ({
          autoSync: state.autoSync,
          syncOnReconnect: state.syncOnReconnect,
          defaultConflictResolution: state.defaultConflictResolution,
          lastSyncAt: state.lastSyncAt,
        }),
      }
    )
  )
);

/**
 * Initialize online/offline listeners
 */
export function initializeOfflineListeners(): () => void {
  const store = useOfflineStore.getState();

  // Set initial state
  store.setOnline(navigator.onLine);

  // Online event handler
  const handleOnline = () => {
    store.setOnline(true);
  };

  // Offline event handler
  const handleOffline = () => {
    store.setOnline(false);
  };

  // Add event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Selectors
 */
export const selectIsOnline = (state: OfflineState) => state.isOnline;
export const selectConnectionStatus = (state: OfflineState) => state.connectionStatus;
export const selectSyncStatus = (state: OfflineState) => state.syncStatus;
export const selectSyncProgress = (state: OfflineState) => state.syncProgress;
export const selectPendingCount = (state: OfflineState) => state.pendingOperationsCount;
export const selectHasConflicts = (state: OfflineState) => state.hasUnresolvedConflicts;
export const selectShowOfflineBanner = (state: OfflineState) => state.showOfflineBanner;
