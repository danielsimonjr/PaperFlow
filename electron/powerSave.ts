/**
 * Power Save Blocker Module
 *
 * Prevents system sleep during long-running operations like OCR,
 * batch processing, or large file operations.
 */

import { powerSaveBlocker, BrowserWindow } from 'electron';

/**
 * Power save blocker types
 */
export type PowerSaveBlockerType = 'prevent-app-suspension' | 'prevent-display-sleep';

/**
 * Active blocker info
 */
export interface ActiveBlocker {
  id: number;
  type: PowerSaveBlockerType;
  reason: string;
  startTime: number;
}

// Store active blockers
const activeBlockers: Map<string, ActiveBlocker> = new Map();

// Counter for generating unique operation IDs
let operationCounter = 0;

/**
 * Start a power save blocker
 *
 * @param reason - Human-readable reason for blocking
 * @param type - Type of blocking (default: prevent-app-suspension)
 * @returns Operation ID to use when stopping
 */
export function startPowerSaveBlocker(
  reason: string,
  type: PowerSaveBlockerType = 'prevent-app-suspension'
): string {
  const operationId = `op_${++operationCounter}_${Date.now()}`;

  const blockerId = powerSaveBlocker.start(type);

  const blocker: ActiveBlocker = {
    id: blockerId,
    type,
    reason,
    startTime: Date.now(),
  };

  activeBlockers.set(operationId, blocker);

  console.log(`[PowerSave] Started blocker ${operationId}: ${reason} (type: ${type})`);

  return operationId;
}

/**
 * Stop a power save blocker
 *
 * @param operationId - Operation ID from startPowerSaveBlocker
 * @returns True if blocker was stopped, false if not found
 */
export function stopPowerSaveBlocker(operationId: string): boolean {
  const blocker = activeBlockers.get(operationId);

  if (!blocker) {
    console.warn(`[PowerSave] Blocker not found: ${operationId}`);
    return false;
  }

  powerSaveBlocker.stop(blocker.id);
  activeBlockers.delete(operationId);

  const duration = Date.now() - blocker.startTime;
  console.log(
    `[PowerSave] Stopped blocker ${operationId}: ${blocker.reason} (duration: ${duration}ms)`
  );

  return true;
}

/**
 * Check if a power save blocker is active
 *
 * @param operationId - Operation ID to check
 */
export function isBlockerActive(operationId: string): boolean {
  const blocker = activeBlockers.get(operationId);

  if (!blocker) {
    return false;
  }

  return powerSaveBlocker.isStarted(blocker.id);
}

/**
 * Get all active blockers
 */
export function getActiveBlockers(): Array<{ operationId: string } & ActiveBlocker> {
  const result: Array<{ operationId: string } & ActiveBlocker> = [];

  activeBlockers.forEach((blocker, operationId) => {
    result.push({
      operationId,
      ...blocker,
    });
  });

  return result;
}

/**
 * Stop all active blockers
 */
export function stopAllBlockers(): number {
  let count = 0;

  activeBlockers.forEach((blocker, operationId) => {
    powerSaveBlocker.stop(blocker.id);
    console.log(`[PowerSave] Stopped blocker ${operationId}: ${blocker.reason}`);
    count++;
  });

  activeBlockers.clear();

  if (count > 0) {
    console.log(`[PowerSave] Stopped ${count} blocker(s)`);
  }

  return count;
}

/**
 * Execute an async operation with power save blocking
 *
 * @param reason - Reason for blocking
 * @param operation - Async operation to execute
 * @param type - Type of blocking
 * @returns Result of the operation
 */
export async function withPowerSaveBlocking<T>(
  reason: string,
  operation: () => Promise<T>,
  type: PowerSaveBlockerType = 'prevent-app-suspension'
): Promise<T> {
  const operationId = startPowerSaveBlocker(reason, type);

  try {
    return await operation();
  } finally {
    stopPowerSaveBlocker(operationId);
  }
}

/**
 * Execute an operation with power save blocking and progress notification
 *
 * @param window - Window to send progress updates to
 * @param reason - Reason for blocking
 * @param operation - Operation with progress callback
 * @param type - Type of blocking
 */
export async function withPowerSaveBlockingAndProgress<T>(
  window: BrowserWindow | null,
  reason: string,
  operation: (
    reportProgress: (percent: number, detail?: string) => void
  ) => Promise<T>,
  type: PowerSaveBlockerType = 'prevent-app-suspension'
): Promise<T> {
  const operationId = startPowerSaveBlocker(reason, type);

  const reportProgress = (percent: number, detail?: string) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('power-save-progress', {
        operationId,
        reason,
        percent,
        detail,
      });

      // Update taskbar progress on Windows
      window.setProgressBar(percent / 100);
    }
  };

  try {
    const result = await operation(reportProgress);

    // Clear progress bar
    if (window && !window.isDestroyed()) {
      window.setProgressBar(-1);
    }

    return result;
  } catch (error) {
    // Set error state on progress bar
    if (window && !window.isDestroyed()) {
      window.setProgressBar(-1);
    }
    throw error;
  } finally {
    stopPowerSaveBlocker(operationId);
  }
}

/**
 * Common operations that should block power save
 */
export const PowerSaveOperations = {
  OCR: 'Performing OCR text recognition',
  BATCH_PROCESS: 'Processing multiple files',
  LARGE_FILE: 'Processing large file',
  EXPORT: 'Exporting document',
  MERGE: 'Merging documents',
  COMPRESS: 'Compressing document',
  PRINT: 'Preparing document for printing',
  DOWNLOAD: 'Downloading update',
  BACKUP: 'Creating backup',
} as const;

/**
 * Create a helper for a specific operation type
 */
export function createOperationBlocker(
  reason: string,
  type: PowerSaveBlockerType = 'prevent-app-suspension'
) {
  let operationId: string | null = null;

  return {
    start: () => {
      if (operationId) {
        console.warn('[PowerSave] Operation already started');
        return operationId;
      }
      operationId = startPowerSaveBlocker(reason, type);
      return operationId;
    },

    stop: () => {
      if (!operationId) {
        console.warn('[PowerSave] Operation not started');
        return false;
      }
      const result = stopPowerSaveBlocker(operationId);
      operationId = null;
      return result;
    },

    isActive: () => {
      if (!operationId) return false;
      return isBlockerActive(operationId);
    },

    getOperationId: () => operationId,
  };
}

/**
 * IPC channel names for power save
 */
export const POWER_SAVE_CHANNELS = {
  START_BLOCKER: 'power-save-start',
  STOP_BLOCKER: 'power-save-stop',
  IS_ACTIVE: 'power-save-is-active',
  GET_ALL_BLOCKERS: 'power-save-get-all',
  STOP_ALL: 'power-save-stop-all',
} as const;

/**
 * IPC event names
 */
export const POWER_SAVE_EVENTS = {
  PROGRESS: 'power-save-progress',
  STARTED: 'power-save-started',
  STOPPED: 'power-save-stopped',
} as const;
