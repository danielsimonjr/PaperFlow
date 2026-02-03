/**
 * Offline Queue Manager
 *
 * Queue system for operations that require network (cloud sync, sharing)
 * with automatic retry when connection is restored.
 */

import type {
  OfflineQueueItem,
  OfflineOperationType,
  SyncPriority,
} from '@/types/offline';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'paperflow-queue';
const DB_VERSION = 1;
const STORE_NAME = 'queue';

/**
 * Default retry configuration
 */
const DEFAULT_MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

/**
 * OfflineQueue class for managing queued operations
 */
class OfflineQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private listeners: Set<(item: OfflineQueueItem) => void> = new Set();

  /**
   * Initialize the queue database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new Error('Failed to open queue database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('documentId', 'documentId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Queue database not initialized');
    }
    return this.db;
  }

  /**
   * Add an operation to the queue
   */
  async enqueue(
    type: OfflineOperationType,
    documentId: string,
    payload: unknown,
    priority: SyncPriority = 'normal'
  ): Promise<OfflineQueueItem> {
    const db = await this.ensureDB();

    const item: OfflineQueueItem = {
      id: uuidv4(),
      type,
      documentId,
      payload,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: DEFAULT_MAX_RETRIES,
      priority,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onerror = () => reject(new Error('Failed to enqueue operation'));
      request.onsuccess = () => {
        this.notifyListeners(item);
        resolve(item);
      };
    });
  }

  /**
   * Get all pending items
   */
  async getPendingItems(): Promise<OfflineQueueItem[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('pending'));

      request.onerror = () => reject(new Error('Failed to get pending items'));
      request.onsuccess = () => {
        const items = request.result ?? [];
        // Sort by priority and creation time
        const priorityOrder: Record<SyncPriority, number> = { high: 0, normal: 1, low: 2 };
        items.sort((a: OfflineQueueItem, b: OfflineQueueItem) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        resolve(items);
      };
    });
  }

  /**
   * Get items for a specific document
   */
  async getItemsForDocument(documentId: string): Promise<OfflineQueueItem[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('documentId');
      const request = index.getAll(IDBKeyRange.only(documentId));

      request.onerror = () => reject(new Error('Failed to get items'));
      request.onsuccess = () => resolve(request.result ?? []);
    });
  }

  /**
   * Update item status
   */
  async updateStatus(
    id: string,
    status: OfflineQueueItem['status'],
    error?: string
  ): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(id);
      getRequest.onerror = () => reject(new Error('Failed to get item'));
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }

        item.status = status;
        if (error) {
          item.error = error;
        }
        if (status === 'processing' || status === 'failed') {
          item.lastAttempt = new Date();
        }

        const putRequest = store.put(item);
        putRequest.onerror = () => reject(new Error('Failed to update item'));
        putRequest.onsuccess = () => resolve();
      };
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetry(id: string): Promise<boolean> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(id);
      getRequest.onerror = () => reject(new Error('Failed to get item'));
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }

        item.retryCount++;
        item.lastAttempt = new Date();

        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          item.error = 'Max retries exceeded';
        } else {
          item.status = 'pending';
        }

        const putRequest = store.put(item);
        putRequest.onerror = () => reject(new Error('Failed to update item'));
        putRequest.onsuccess = () => resolve(item.retryCount < item.maxRetries);
      };
    });
  }

  /**
   * Remove completed items
   */
  async removeCompleted(): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor(IDBKeyRange.only('completed'));

      let deletedCount = 0;

      request.onerror = () => reject(new Error('Failed to remove completed'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(deletedCount);
    });
  }

  /**
   * Remove an item from the queue
   */
  async remove(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to remove item'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all items for a document
   */
  async clearForDocument(documentId: string): Promise<void> {
    const items = await this.getItemsForDocument(documentId);
    for (const item of items) {
      await this.remove(item.id);
    }
  }

  /**
   * Clear all failed items
   */
  async clearFailed(): Promise<number> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.openCursor(IDBKeyRange.only('failed'));

      let deletedCount = 0;

      request.onerror = () => reject(new Error('Failed to clear failed items'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(deletedCount);
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
    total: number;
  }> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get stats'));
      request.onsuccess = () => {
        const items = request.result ?? [];
        const stats: {
          pending: number;
          processing: number;
          failed: number;
          completed: number;
          total: number;
        } = {
          pending: 0,
          processing: 0,
          failed: 0,
          completed: 0,
          total: items.length,
        };

        for (const item of items) {
          const status = item.status as keyof typeof stats;
          if (status in stats && status !== 'total') {
            stats[status]++;
          }
        }

        resolve(stats);
      };
    });
  }

  /**
   * Get retry delay for an item
   */
  getRetryDelay(retryCount: number): number {
    const index = Math.min(retryCount, RETRY_DELAYS.length - 1);
    return RETRY_DELAYS[index] ?? 1000;
  }

  /**
   * Check if item is ready for retry
   */
  isReadyForRetry(item: OfflineQueueItem): boolean {
    if (item.status !== 'pending' || !item.lastAttempt) {
      return true;
    }

    const delay = this.getRetryDelay(item.retryCount);
    const lastAttempt = new Date(item.lastAttempt).getTime();
    return Date.now() - lastAttempt >= delay;
  }

  /**
   * Add a listener for queue changes
   */
  addListener(callback: (item: OfflineQueueItem) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners of queue changes
   */
  private notifyListeners(item: OfflineQueueItem): void {
    for (const listener of this.listeners) {
      try {
        listener(item);
      } catch (error) {
        console.error('Queue listener error:', error);
      }
    }
  }

  /**
   * Clear all items
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(new Error('Failed to clear queue'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
