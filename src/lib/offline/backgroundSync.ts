/**
 * Background Sync API Integration
 *
 * Uses Background Sync API for reliable data synchronization when
 * connection is available, with fallback for unsupported browsers.
 */

import type { BackgroundSyncRegistration } from '@/types/offline';
import { queueProcessor } from './queueProcessor';
import { offlineQueue } from './offlineQueue';

/**
 * Sync tags
 */
export const SYNC_TAGS = {
  MAIN: 'paperflow-sync',
  DOCUMENTS: 'paperflow-documents-sync',
  ANNOTATIONS: 'paperflow-annotations-sync',
  PERIODIC: 'paperflow-periodic-sync',
} as const;

/**
 * Background sync manager
 */
class BackgroundSyncManager {
  private isSupported: boolean;
  private isPeriodicSupported: boolean;
  private fallbackIntervalId: ReturnType<typeof setInterval> | null = null;
  private registrations: Map<string, BackgroundSyncRegistration> = new Map();
  private syncListeners: Set<(tag: string, success: boolean) => void> = new Set();

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'SyncManager' in window;
    this.isPeriodicSupported = 'serviceWorker' in navigator && 'PeriodicSyncManager' in window;
  }

  /**
   * Check if background sync is supported
   */
  isSyncSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if periodic sync is supported
   */
  isPeriodicSyncSupported(): boolean {
    return this.isPeriodicSupported;
  }

  /**
   * Register for background sync
   */
  async registerSync(tag: string = SYNC_TAGS.MAIN): Promise<void> {
    if (!this.isSupported) {
      console.log('Background Sync not supported, using fallback');
      this.startFallbackSync();
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }).sync.register(tag);

      this.registrations.set(tag, {
        tag,
        lastSync: undefined,
        nextSync: undefined,
      });

      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error('Failed to register background sync:', error);
      this.startFallbackSync();
    }
  }

  /**
   * Register for periodic background sync
   */
  async registerPeriodicSync(
    tag: string = SYNC_TAGS.PERIODIC,
    minInterval: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<boolean> {
    if (!this.isPeriodicSupported) {
      console.log('Periodic Background Sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (status.state !== 'granted') {
        console.log('Periodic sync permission not granted');
        return false;
      }

      await (registration as ServiceWorkerRegistration & {
        periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
      }).periodicSync.register(tag, { minInterval });

      this.registrations.set(tag, {
        tag,
        minInterval,
        lastSync: undefined,
        nextSync: new Date(Date.now() + minInterval),
      });

      console.log(`Periodic sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Failed to register periodic sync:', error);
      return false;
    }
  }

  /**
   * Unregister periodic sync
   */
  async unregisterPeriodicSync(tag: string): Promise<void> {
    if (!this.isPeriodicSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & {
        periodicSync: { unregister: (tag: string) => Promise<void> };
      }).periodicSync.unregister(tag);

      this.registrations.delete(tag);
      console.log(`Periodic sync unregistered: ${tag}`);
    } catch (error) {
      console.error('Failed to unregister periodic sync:', error);
    }
  }

  /**
   * Get all registered syncs
   */
  async getRegisteredSyncs(): Promise<string[]> {
    if (!this.isPeriodicSupported) {
      return Array.from(this.registrations.keys());
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await (registration as ServiceWorkerRegistration & {
        periodicSync: { getTags: () => Promise<string[]> };
      }).periodicSync.getTags();
      return tags;
    } catch (error) {
      console.error('Failed to get registered syncs:', error);
      return [];
    }
  }

  /**
   * Start fallback polling for browsers without Background Sync
   */
  startFallbackSync(intervalMs: number = 60000): void {
    if (this.fallbackIntervalId) return;

    // Start the queue processor
    queueProcessor.start();

    // Set up polling interval
    this.fallbackIntervalId = setInterval(async () => {
      if (navigator.onLine) {
        await this.performSync();
      }
    }, intervalMs);

    // Listen for online events
    window.addEventListener('online', this.handleOnline);

    console.log('Fallback sync started');
  }

  /**
   * Stop fallback polling
   */
  stopFallbackSync(): void {
    if (this.fallbackIntervalId) {
      clearInterval(this.fallbackIntervalId);
      this.fallbackIntervalId = null;
    }

    window.removeEventListener('online', this.handleOnline);
    queueProcessor.stop();

    console.log('Fallback sync stopped');
  }

  /**
   * Handle coming online
   */
  private handleOnline = async (): Promise<void> => {
    console.log('Connection restored, triggering sync');
    await this.performSync();
  };

  /**
   * Perform sync operation
   */
  async performSync(): Promise<boolean> {
    try {
      // Process the queue
      await queueProcessor.processQueue();

      // Update registration info
      for (const [tag, reg] of this.registrations) {
        reg.lastSync = new Date();
        if (reg.minInterval) {
          reg.nextSync = new Date(Date.now() + reg.minInterval);
        }
        this.registrations.set(tag, reg);
      }

      this.notifyListeners(SYNC_TAGS.MAIN, true);
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners(SYNC_TAGS.MAIN, false);
      return false;
    }
  }

  /**
   * Request immediate sync
   */
  async requestSync(tag: string = SYNC_TAGS.MAIN): Promise<void> {
    if (this.isSupported) {
      await this.registerSync(tag);
    } else {
      await this.performSync();
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    pendingCount: number;
    lastSync: Date | undefined;
    isSyncing: boolean;
  }> {
    const stats = await offlineQueue.getStats();
    const mainReg = this.registrations.get(SYNC_TAGS.MAIN);
    const processorState = queueProcessor.getState();

    return {
      isOnline: navigator.onLine,
      pendingCount: stats.pending,
      lastSync: mainReg?.lastSync,
      isSyncing: processorState.isProcessing && processorState.currentItems.length > 0,
    };
  }

  /**
   * Add sync listener
   */
  addSyncListener(callback: (tag: string, success: boolean) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  /**
   * Notify sync listeners
   */
  private notifyListeners(tag: string, success: boolean): void {
    for (const listener of this.syncListeners) {
      try {
        listener(tag, success);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    }
  }

  /**
   * Initialize background sync
   */
  async initialize(): Promise<void> {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data || {};

        switch (type) {
          case 'SYNC_COMPLETED':
            this.notifyListeners(SYNC_TAGS.MAIN, true);
            break;
          case 'SYNC_FAILED':
            this.notifyListeners(SYNC_TAGS.MAIN, false);
            break;
        }
      });
    }

    // Register for background sync if supported
    if (this.isSupported) {
      await this.registerSync(SYNC_TAGS.MAIN);
    } else {
      this.startFallbackSync();
    }

    // Try to register periodic sync
    if (this.isPeriodicSupported) {
      await this.registerPeriodicSync();
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopFallbackSync();
    this.registrations.clear();
    this.syncListeners.clear();
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncManager();

/**
 * Request a one-time sync
 */
export async function requestSync(): Promise<void> {
  await backgroundSync.requestSync();
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  isOnline: boolean;
  pendingCount: number;
  lastSync: Date | undefined;
  isSyncing: boolean;
}> {
  return backgroundSync.getSyncStatus();
}
