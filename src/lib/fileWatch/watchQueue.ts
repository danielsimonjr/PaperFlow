/**
 * Watch Queue Manager
 *
 * Manages multiple file watch events, prioritizes urgent changes,
 * and batches related updates.
 */

export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

export interface QueuedEvent {
  id: string;
  path: string;
  type: 'change' | 'add' | 'unlink' | 'error';
  priority: EventPriority;
  timestamp: number;
  data?: unknown;
  processed: boolean;
  batchId?: string;
  retryCount: number;
  maxRetries: number;
}

export interface EventBatch {
  id: string;
  events: QueuedEvent[];
  path: string;
  createdAt: number;
  processedAt?: number;
}

export interface QueueConfig {
  maxQueueSize: number;
  batchDelayMs: number;
  maxBatchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  priorityBoostAfterMs: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxQueueSize: 1000,
  batchDelayMs: 100,
  maxBatchSize: 10,
  maxRetries: 3,
  retryDelayMs: 1000,
  priorityBoostAfterMs: 5000,
};

// Queue state
let queue: QueuedEvent[] = [];
const batches: Map<string, EventBatch> = new Map();
let config: QueueConfig = { ...DEFAULT_CONFIG };
let eventIdCounter = 0;
let batchIdCounter = 0;
let batchTimer: NodeJS.Timeout | null = null;
let processCallback: ((events: QueuedEvent[]) => Promise<void>) | null = null;
let isProcessing = false;

const generateEventId = () => `event-${Date.now()}-${++eventIdCounter}`;
const generateBatchId = () => `batch-${Date.now()}-${++batchIdCounter}`;

/**
 * Initialize the watch queue
 */
export function initializeQueue(
  callback: (events: QueuedEvent[]) => Promise<void>,
  customConfig?: Partial<QueueConfig>
): void {
  processCallback = callback;
  config = { ...DEFAULT_CONFIG, ...customConfig };
  console.log('[WatchQueue] Initialized');
}

/**
 * Get priority value for sorting (lower = higher priority)
 */
function getPriorityValue(priority: EventPriority): number {
  switch (priority) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    case 'normal':
      return 2;
    case 'low':
      return 3;
  }
}

/**
 * Determine event priority based on type and path
 */
function determinePriority(
  type: QueuedEvent['type'],
  _path: string,
  isActiveDocument: boolean
): EventPriority {
  // Errors are always high priority
  if (type === 'error') {
    return 'high';
  }

  // Active document changes are critical
  if (isActiveDocument) {
    return type === 'unlink' ? 'critical' : 'high';
  }

  // File deletions are high priority
  if (type === 'unlink') {
    return 'high';
  }

  // Regular changes are normal priority
  return 'normal';
}

/**
 * Enqueue a file watch event
 */
export function enqueueEvent(
  path: string,
  type: QueuedEvent['type'],
  data?: unknown,
  isActiveDocument: boolean = false
): QueuedEvent {
  // Check queue size limit
  if (queue.length >= config.maxQueueSize) {
    // Remove lowest priority events
    queue.sort((a, b) => getPriorityValue(a.priority) - getPriorityValue(b.priority));
    queue = queue.slice(0, Math.floor(config.maxQueueSize * 0.9));
    console.warn('[WatchQueue] Queue size limit reached, removed low priority events');
  }

  const event: QueuedEvent = {
    id: generateEventId(),
    path,
    type,
    priority: determinePriority(type, path, isActiveDocument),
    timestamp: Date.now(),
    data,
    processed: false,
    retryCount: 0,
    maxRetries: config.maxRetries,
  };

  queue.push(event);
  scheduleBatch();

  return event;
}

/**
 * Schedule batch processing
 */
function scheduleBatch(): void {
  if (batchTimer) {
    return; // Already scheduled
  }

  batchTimer = setTimeout(() => {
    batchTimer = null;
    processBatch();
  }, config.batchDelayMs);
}

/**
 * Create a batch from queued events
 */
function createBatch(): EventBatch | null {
  if (queue.length === 0) {
    return null;
  }

  // Sort by priority and timestamp
  const sortedQueue = [...queue]
    .filter((e) => !e.processed)
    .sort((a, b) => {
      const priorityDiff = getPriorityValue(a.priority) - getPriorityValue(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

  if (sortedQueue.length === 0) {
    return null;
  }

  // Group by path for related events
  const byPath = new Map<string, QueuedEvent[]>();
  for (const event of sortedQueue) {
    const existing = byPath.get(event.path) ?? [];
    existing.push(event);
    byPath.set(event.path, existing);
  }

  // Take the highest priority path's events, up to batch size
  const firstEvent = sortedQueue[0];
  if (!firstEvent) {
    return null;
  }
  const firstPath = firstEvent.path;
  const pathEvents = byPath.get(firstPath) ?? [];
  const batchEvents = pathEvents.slice(0, config.maxBatchSize);

  const batch: EventBatch = {
    id: generateBatchId(),
    events: batchEvents,
    path: firstPath,
    createdAt: Date.now(),
  };

  // Mark events as batched
  for (const event of batchEvents) {
    event.batchId = batch.id;
  }

  batches.set(batch.id, batch);
  return batch;
}

/**
 * Process a batch of events
 */
async function processBatch(): Promise<void> {
  if (isProcessing || !processCallback) {
    scheduleBatch();
    return;
  }

  isProcessing = true;

  try {
    // Boost priority of old events
    const now = Date.now();
    for (const event of queue) {
      if (
        !event.processed &&
        now - event.timestamp > config.priorityBoostAfterMs &&
        event.priority === 'low'
      ) {
        event.priority = 'normal';
      }
    }

    // Create and process batch
    const batch = createBatch();
    if (!batch) {
      isProcessing = false;
      return;
    }

    try {
      await processCallback(batch.events);

      // Mark events as processed
      batch.processedAt = Date.now();
      for (const event of batch.events) {
        event.processed = true;
      }

      // Remove processed events from queue
      queue = queue.filter((e) => !e.processed);
    } catch (error) {
      console.error('[WatchQueue] Batch processing failed:', error);

      // Handle retries
      for (const event of batch.events) {
        event.retryCount++;
        if (event.retryCount >= event.maxRetries) {
          event.processed = true; // Give up
          console.error(
            `[WatchQueue] Event ${event.id} failed after ${event.maxRetries} retries`
          );
        }
      }
    }

    // Continue processing if more events
    if (queue.filter((e) => !e.processed).length > 0) {
      scheduleBatch();
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  queueSize: number;
  pendingEvents: number;
  processedEvents: number;
  batchCount: number;
  eventsByPriority: Record<EventPriority, number>;
  eventsByType: Record<QueuedEvent['type'], number>;
} {
  const pendingEvents = queue.filter((e) => !e.processed).length;
  const processedEvents = queue.filter((e) => e.processed).length;

  const eventsByPriority: Record<EventPriority, number> = {
    critical: 0,
    high: 0,
    normal: 0,
    low: 0,
  };

  const eventsByType: Record<QueuedEvent['type'], number> = {
    change: 0,
    add: 0,
    unlink: 0,
    error: 0,
  };

  for (const event of queue) {
    if (!event.processed) {
      eventsByPriority[event.priority]++;
      eventsByType[event.type]++;
    }
  }

  return {
    queueSize: queue.length,
    pendingEvents,
    processedEvents,
    batchCount: batches.size,
    eventsByPriority,
    eventsByType,
  };
}

/**
 * Get pending events for a specific path
 */
export function getEventsForPath(path: string): QueuedEvent[] {
  return queue.filter((e) => e.path === path && !e.processed);
}

/**
 * Cancel pending events for a path
 */
export function cancelEventsForPath(path: string): number {
  let cancelled = 0;
  for (const event of queue) {
    if (event.path === path && !event.processed) {
      event.processed = true;
      cancelled++;
    }
  }
  return cancelled;
}

/**
 * Cancel all pending events
 */
export function cancelAllEvents(): number {
  let cancelled = 0;
  for (const event of queue) {
    if (!event.processed) {
      event.processed = true;
      cancelled++;
    }
  }
  return cancelled;
}

/**
 * Clear processed events from history
 */
export function clearProcessedEvents(): void {
  queue = queue.filter((e) => !e.processed);
  batches.clear();
}

/**
 * Update queue configuration
 */
export function updateQueueConfig(newConfig: Partial<QueueConfig>): QueueConfig {
  config = { ...config, ...newConfig };
  return { ...config };
}

/**
 * Get current queue configuration
 */
export function getQueueConfig(): QueueConfig {
  return { ...config };
}

/**
 * Pause queue processing
 */
export function pauseQueue(): void {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

/**
 * Resume queue processing
 */
export function resumeQueue(): void {
  if (queue.filter((e) => !e.processed).length > 0) {
    scheduleBatch();
  }
}

/**
 * Shutdown the queue
 */
export function shutdownQueue(): void {
  pauseQueue();
  cancelAllEvents();
  queue = [];
  batches.clear();
  processCallback = null;
  console.log('[WatchQueue] Shutdown complete');
}

/**
 * Check if queue is empty
 */
export function isQueueEmpty(): boolean {
  return queue.filter((e) => !e.processed).length === 0;
}

/**
 * Force process all pending events immediately
 */
export async function flushQueue(): Promise<void> {
  pauseQueue();

  while (queue.filter((e) => !e.processed).length > 0) {
    await processBatch();
  }
}
