/**
 * Queue Processor
 *
 * Processes offline queue items when connection is available.
 * Handles retry logic, error handling, and queue management.
 */

import { offlineQueue } from './offlineQueue';
import type { OfflineQueueItem, OfflineOperationType } from '@/types/offline';

/**
 * Operation handler type
 */
export type OperationHandler = (
  item: OfflineQueueItem
) => Promise<void>;

/**
 * Queue processor options
 */
export interface QueueProcessorOptions {
  maxConcurrent?: number;
  processInterval?: number;
  onProcessStart?: (item: OfflineQueueItem) => void;
  onProcessComplete?: (item: OfflineQueueItem) => void;
  onProcessError?: (item: OfflineQueueItem, error: Error) => void;
  onQueueEmpty?: () => void;
}

/**
 * Queue processor state
 */
export interface QueueProcessorState {
  isProcessing: boolean;
  currentItems: OfflineQueueItem[];
  processedCount: number;
  errorCount: number;
}

/**
 * QueueProcessor class
 */
class QueueProcessor {
  private handlers: Map<OfflineOperationType, OperationHandler> = new Map();
  private isRunning = false;
  private processingItems: Set<string> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private options: Required<QueueProcessorOptions>;
  private state: QueueProcessorState = {
    isProcessing: false,
    currentItems: [],
    processedCount: 0,
    errorCount: 0,
  };
  private stateListeners: Set<(state: QueueProcessorState) => void> = new Set();

  constructor(options: QueueProcessorOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      processInterval: options.processInterval ?? 5000,
      onProcessStart: options.onProcessStart ?? (() => {}),
      onProcessComplete: options.onProcessComplete ?? (() => {}),
      onProcessError: options.onProcessError ?? (() => {}),
      onQueueEmpty: options.onQueueEmpty ?? (() => {}),
    };
  }

  /**
   * Register a handler for an operation type
   */
  registerHandler(type: OfflineOperationType, handler: OperationHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(type: OfflineOperationType): void {
    this.handlers.delete(type);
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateState({ isProcessing: true });

    // Process immediately
    this.processQueue();

    // Set up interval for periodic processing
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.options.processInterval);
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.updateState({ isProcessing: false });

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process pending items in the queue
   */
  async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    // Check if online
    if (!navigator.onLine) {
      return;
    }

    try {
      const pendingItems = await offlineQueue.getPendingItems();

      // Filter items that are ready for retry and not currently being processed
      const readyItems = pendingItems.filter(
        (item) =>
          !this.processingItems.has(item.id) &&
          offlineQueue.isReadyForRetry(item)
      );

      if (readyItems.length === 0) {
        if (pendingItems.length === 0) {
          this.options.onQueueEmpty();
        }
        return;
      }

      // Process up to maxConcurrent items
      const itemsToProcess = readyItems.slice(
        0,
        this.options.maxConcurrent - this.processingItems.size
      );

      this.updateState({
        currentItems: [...this.state.currentItems, ...itemsToProcess],
      });

      await Promise.all(itemsToProcess.map((item) => this.processItem(item)));
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: OfflineQueueItem): Promise<void> {
    const handler = this.handlers.get(item.type);

    if (!handler) {
      console.warn(`No handler for operation type: ${item.type}`);
      await offlineQueue.updateStatus(
        item.id,
        'failed',
        `No handler for type: ${item.type}`
      );
      return;
    }

    this.processingItems.add(item.id);
    await offlineQueue.updateStatus(item.id, 'processing');
    this.options.onProcessStart(item);

    try {
      await handler(item);
      await offlineQueue.updateStatus(item.id, 'completed');
      this.updateState({
        processedCount: this.state.processedCount + 1,
        currentItems: this.state.currentItems.filter((i) => i.id !== item.id),
      });
      this.options.onProcessComplete(item);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const canRetry = await offlineQueue.incrementRetry(item.id);

      if (!canRetry) {
        await offlineQueue.updateStatus(item.id, 'failed', errorMessage);
      }

      this.updateState({
        errorCount: this.state.errorCount + 1,
        currentItems: this.state.currentItems.filter((i) => i.id !== item.id),
      });
      this.options.onProcessError(item, error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.processingItems.delete(item.id);
    }
  }

  /**
   * Force process a specific item
   */
  async forceProcess(itemId: string): Promise<void> {
    const items = await offlineQueue.getPendingItems();
    const item = items.find((i) => i.id === itemId);

    if (item) {
      await this.processItem(item);
    }
  }

  /**
   * Retry all failed items
   */
  async retryFailed(): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    // Get all failed items and reset them to pending
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['queue'], 'readwrite');
      const store = transaction.objectStore('queue');
      const index = store.index('status');
      const request = index.openCursor(IDBKeyRange.only('failed'));

      request.onerror = () => reject(new Error('Failed to retry items'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const item = cursor.value;
          item.status = 'pending';
          item.retryCount = 0;
          item.error = undefined;
          cursor.update(item);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
    });

    // Trigger immediate processing
    this.processQueue();
  }

  /**
   * Get the internal database (for retry logic)
   */
  private async getDB(): Promise<IDBDatabase | null> {
    await offlineQueue.init();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('paperflow-queue', 1);
      request.onerror = () => reject(null);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get processor state
   */
  getState(): QueueProcessorState {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<QueueProcessorState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateListeners();
  }

  /**
   * Add state listener
   */
  addStateListener(callback: (state: QueueProcessorState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /**
   * Notify state listeners
   */
  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error('State listener error:', error);
      }
    }
  }

  /**
   * Reset processor state
   */
  resetState(): void {
    this.state = {
      isProcessing: this.isRunning,
      currentItems: [],
      processedCount: 0,
      errorCount: 0,
    };
    this.notifyStateListeners();
  }
}

// Export singleton instance
export const queueProcessor = new QueueProcessor();

// Register default handlers
queueProcessor.registerHandler('create', async (item) => {
  // Placeholder for create operation
  console.log('Processing create operation:', item);
});

queueProcessor.registerHandler('update', async (item) => {
  // Placeholder for update operation
  console.log('Processing update operation:', item);
});

queueProcessor.registerHandler('delete', async (item) => {
  // Placeholder for delete operation
  console.log('Processing delete operation:', item);
});

queueProcessor.registerHandler('sync', async (item) => {
  // Placeholder for sync operation
  console.log('Processing sync operation:', item);
});

queueProcessor.registerHandler('upload', async (item) => {
  // Placeholder for upload operation
  console.log('Processing upload operation:', item);
});

queueProcessor.registerHandler('download', async (item) => {
  // Placeholder for download operation
  console.log('Processing download operation:', item);
});
