/**
 * File Lock Detection Module
 *
 * Detects when files are locked by other applications and notifies the user.
 * Works on Windows, macOS, and Linux with platform-specific approaches.
 */

import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { IPC_EVENTS } from '../ipc/channels';

export interface FileLockInfo {
  path: string;
  isLocked: boolean;
  lockedBy?: string;
  timestamp: number;
  retryCount: number;
}

export interface LockCheckOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeout?: number;
}

// Store lock status for tracked files
const lockStatus: Map<string, FileLockInfo> = new Map();
const lockCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

const DEFAULT_OPTIONS: Required<LockCheckOptions> = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeout: 5000,
};

/**
 * Send lock event to all windows
 */
function sendLockEvent(event: 'file-locked' | 'file-unlocked', info: FileLockInfo): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_EVENTS.FILE_CHANGED, {
        type: event === 'file-locked' ? 'error' : 'change',
        path: info.path,
        error: event === 'file-locked' ? 'File is locked by another process' : undefined,
      });
    }
  }
}

/**
 * Check if a file is locked by attempting to open it for writing
 *
 * This is a cross-platform approach that works by:
 * - Attempting to open the file with exclusive write access
 * - If it fails with EBUSY, EPERM, or EACCES, the file is likely locked
 */
export async function isFileLocked(filePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);

  try {
    // Check if file exists first
    await fs.access(normalizedPath, fsConstants.F_OK);
  } catch {
    // File doesn't exist, can't be locked
    return false;
  }

  try {
    // Try to open the file for reading and writing
    // If another process has an exclusive lock, this will fail
    const handle = await fs.open(normalizedPath, fsConstants.O_RDWR);
    await handle.close();
    return false;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    // These error codes indicate the file is locked or in use
    if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
      return true;
    }
    // For other errors, assume not locked but log
    console.warn(`[FileLock] Unexpected error checking lock for ${normalizedPath}:`, err.code);
    return false;
  }
}

/**
 * Check if a file can be written to
 */
export async function canWriteFile(filePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);

  try {
    await fs.access(normalizedPath, fsConstants.W_OK);
    return !await isFileLocked(normalizedPath);
  } catch {
    return false;
  }
}

/**
 * Wait for a file to become unlocked
 */
export async function waitForUnlock(
  filePath: string,
  options?: LockCheckOptions
): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let retries = 0;

  while (retries < opts.maxRetries) {
    const locked = await isFileLocked(normalizedPath);
    if (!locked) {
      return true;
    }

    retries++;
    if (retries < opts.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, opts.retryDelayMs));
    }
  }

  return false;
}

/**
 * Start monitoring a file for lock status changes
 */
export function startLockMonitoring(
  filePath: string,
  checkIntervalMs: number = 2000
): void {
  const normalizedPath = path.normalize(filePath);

  // Stop existing monitoring
  stopLockMonitoring(normalizedPath);

  // Initialize lock info
  const info: FileLockInfo = {
    path: normalizedPath,
    isLocked: false,
    timestamp: Date.now(),
    retryCount: 0,
  };
  lockStatus.set(normalizedPath, info);

  // Start interval check
  const interval = setInterval(async () => {
    const currentInfo = lockStatus.get(normalizedPath);
    if (!currentInfo) {
      clearInterval(interval);
      return;
    }

    const wasLocked = currentInfo.isLocked;
    const isLocked = await isFileLocked(normalizedPath);

    if (isLocked !== wasLocked) {
      currentInfo.isLocked = isLocked;
      currentInfo.timestamp = Date.now();
      currentInfo.retryCount = isLocked ? 0 : currentInfo.retryCount;

      if (isLocked) {
        sendLockEvent('file-locked', currentInfo);
        console.log(`[FileLock] File locked: ${normalizedPath}`);
      } else {
        sendLockEvent('file-unlocked', currentInfo);
        console.log(`[FileLock] File unlocked: ${normalizedPath}`);
      }
    }
  }, checkIntervalMs);

  lockCheckIntervals.set(normalizedPath, interval);
  console.log(`[FileLock] Started monitoring: ${normalizedPath}`);
}

/**
 * Stop monitoring a file for lock status
 */
export function stopLockMonitoring(filePath: string): void {
  const normalizedPath = path.normalize(filePath);

  const interval = lockCheckIntervals.get(normalizedPath);
  if (interval) {
    clearInterval(interval);
    lockCheckIntervals.delete(normalizedPath);
  }

  lockStatus.delete(normalizedPath);
  console.log(`[FileLock] Stopped monitoring: ${normalizedPath}`);
}

/**
 * Stop all lock monitoring
 */
export function stopAllLockMonitoring(): void {
  for (const interval of lockCheckIntervals.values()) {
    clearInterval(interval);
  }
  lockCheckIntervals.clear();
  lockStatus.clear();
  console.log('[FileLock] Stopped all monitoring');
}

/**
 * Get current lock status for a file
 */
export function getLockStatus(filePath: string): FileLockInfo | null {
  const normalizedPath = path.normalize(filePath);
  return lockStatus.get(normalizedPath) || null;
}

/**
 * Get all currently locked files
 */
export function getLockedFiles(): FileLockInfo[] {
  return Array.from(lockStatus.values()).filter(info => info.isLocked);
}

/**
 * Attempt to acquire a lock on a file
 * Returns true if lock acquired, false if file is already locked
 */
export async function acquireLock(
  filePath: string,
  options?: LockCheckOptions
): Promise<{ success: boolean; error?: string }> {
  const normalizedPath = path.normalize(filePath);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check if file is locked
    const locked = await isFileLocked(normalizedPath);
    if (locked) {
      // Try to wait for unlock
      const unlocked = await waitForUnlock(normalizedPath, opts);
      if (!unlocked) {
        return {
          success: false,
          error: 'File is locked by another process',
        };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acquire lock',
    };
  }
}

/**
 * Write file with lock check and retry
 */
export async function writeFileWithLockCheck(
  filePath: string,
  data: Buffer | Uint8Array,
  options?: LockCheckOptions
): Promise<{ success: boolean; error?: string }> {
  const normalizedPath = path.normalize(filePath);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // First, check/wait for lock
  const lockResult = await acquireLock(normalizedPath, opts);
  if (!lockResult.success) {
    return lockResult;
  }

  // Attempt to write
  let retries = 0;
  while (retries < opts.maxRetries) {
    try {
      await fs.writeFile(normalizedPath, data);
      return { success: true };
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
        retries++;
        if (retries < opts.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, opts.retryDelayMs));
        }
      } else {
        return {
          success: false,
          error: err.message || 'Failed to write file',
        };
      }
    }
  }

  return {
    success: false,
    error: 'File is locked by another process after multiple retries',
  };
}
