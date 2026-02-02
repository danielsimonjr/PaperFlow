/**
 * Auto-Save Module
 *
 * Manages automatic saving of documents with crash recovery support.
 * Auto-save files are stored in a recovery directory within user data.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { app, BrowserWindow } from 'electron';
import { IPC_EVENTS } from './ipc/channels';
import type { AutoSaveOptions, RecoveryFileInfo } from './ipc/types';

// Auto-save configuration
interface AutoSaveEntry {
  filePath: string;
  interval: number;
  timer: NodeJS.Timeout | null;
  lastSave: number;
}

// Store of active auto-save entries
const autoSaveEntries = new Map<string, AutoSaveEntry>();

// Recovery directory
const RECOVERY_DIR = path.join(app.getPath('userData'), 'recovery');
const RECOVERY_INDEX_FILE = path.join(RECOVERY_DIR, 'index.json');
const DEFAULT_INTERVAL = 30000; // 30 seconds

/**
 * Recovery index structure
 */
interface RecoveryIndex {
  files: Array<{
    originalPath: string;
    recoveryPath: string;
    timestamp: number;
  }>;
}

/**
 * Ensure recovery directory exists
 */
async function ensureRecoveryDir(): Promise<void> {
  try {
    await fs.mkdir(RECOVERY_DIR, { recursive: true });
  } catch (error) {
    console.error('[AutoSave] Failed to create recovery directory:', error);
  }
}

/**
 * Load recovery index
 */
async function loadRecoveryIndex(): Promise<RecoveryIndex> {
  try {
    const data = await fs.readFile(RECOVERY_INDEX_FILE, 'utf-8');
    return JSON.parse(data) as RecoveryIndex;
  } catch {
    return { files: [] };
  }
}

/**
 * Save recovery index
 */
async function saveRecoveryIndex(index: RecoveryIndex): Promise<void> {
  await ensureRecoveryDir();
  await fs.writeFile(RECOVERY_INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Generate recovery file path from original path
 */
function getRecoveryPath(originalPath: string): string {
  const hash = crypto.createHash('md5').update(originalPath).digest('hex').substring(0, 8);
  const ext = path.extname(originalPath);
  const name = path.basename(originalPath, ext);
  return path.join(RECOVERY_DIR, `${name}_${hash}${ext}`);
}

/**
 * Send auto-save trigger event to renderer
 */
function sendAutoSaveTrigger(filePath: string): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_EVENTS.AUTOSAVE_TRIGGERED, filePath);
    }
  }
}

/**
 * Send recovery available event to renderer
 */
async function sendRecoveryAvailable(): Promise<void> {
  const files = await getRecoveryFiles();
  if (files.length > 0) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.RECOVERY_AVAILABLE, files);
      }
    }
  }
}

/**
 * Enable auto-save for a file
 */
export async function enableAutoSave(options: AutoSaveOptions): Promise<boolean> {
  const { filePath, interval = DEFAULT_INTERVAL } = options;
  const normalizedPath = path.normalize(filePath);

  // Disable existing auto-save if any
  await disableAutoSave(normalizedPath);

  // Create auto-save entry
  const entry: AutoSaveEntry = {
    filePath: normalizedPath,
    interval,
    timer: null,
    lastSave: Date.now(),
  };

  // Set up timer
  entry.timer = setInterval(() => {
    sendAutoSaveTrigger(normalizedPath);
    entry.lastSave = Date.now();
  }, interval);

  autoSaveEntries.set(normalizedPath, entry);
  console.log(`[AutoSave] Enabled for ${normalizedPath} with interval ${interval}ms`);
  return true;
}

/**
 * Disable auto-save for a file
 */
export async function disableAutoSave(filePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);
  const entry = autoSaveEntries.get(normalizedPath);

  if (!entry) {
    return false;
  }

  // Clear timer
  if (entry.timer) {
    clearInterval(entry.timer);
  }

  autoSaveEntries.delete(normalizedPath);
  console.log(`[AutoSave] Disabled for ${normalizedPath}`);
  return true;
}

/**
 * Save recovery data for a file
 */
export async function saveRecoveryData(originalPath: string, data: Uint8Array): Promise<string | null> {
  try {
    await ensureRecoveryDir();
    const recoveryPath = getRecoveryPath(originalPath);

    // Write recovery file
    await fs.writeFile(recoveryPath, Buffer.from(data));

    // Update recovery index
    const index = await loadRecoveryIndex();
    const existingIndex = index.files.findIndex((f) => f.originalPath === originalPath);

    const entry = {
      originalPath,
      recoveryPath,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      index.files[existingIndex] = entry;
    } else {
      index.files.push(entry);
    }

    await saveRecoveryIndex(index);
    console.log(`[AutoSave] Saved recovery data for ${originalPath}`);
    return recoveryPath;
  } catch (error) {
    console.error(`[AutoSave] Failed to save recovery data:`, error);
    return null;
  }
}

/**
 * Get list of recovery files
 */
export async function getRecoveryFiles(): Promise<RecoveryFileInfo[]> {
  try {
    const index = await loadRecoveryIndex();
    const files: RecoveryFileInfo[] = [];

    for (const entry of index.files) {
      try {
        const stats = await fs.stat(entry.recoveryPath);
        files.push({
          originalPath: entry.originalPath,
          recoveryPath: entry.recoveryPath,
          timestamp: entry.timestamp,
          size: stats.size,
        });
      } catch {
        // Recovery file no longer exists, skip it
      }
    }

    return files;
  } catch {
    return [];
  }
}

/**
 * Read recovery file data
 */
export async function readRecoveryData(recoveryPath: string): Promise<Uint8Array | null> {
  try {
    const data = await fs.readFile(recoveryPath);
    return new Uint8Array(data);
  } catch {
    return null;
  }
}

/**
 * Clear a specific recovery file
 */
export async function clearRecoveryFile(recoveryPath: string): Promise<boolean> {
  try {
    // Delete the file
    await fs.unlink(recoveryPath);

    // Update index
    const index = await loadRecoveryIndex();
    index.files = index.files.filter((f) => f.recoveryPath !== recoveryPath);
    await saveRecoveryIndex(index);

    console.log(`[AutoSave] Cleared recovery file: ${recoveryPath}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all recovery files
 */
export async function clearAllRecoveryFiles(): Promise<void> {
  try {
    const index = await loadRecoveryIndex();

    for (const entry of index.files) {
      try {
        await fs.unlink(entry.recoveryPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    await saveRecoveryIndex({ files: [] });
    console.log('[AutoSave] Cleared all recovery files');
  } catch (error) {
    console.error('[AutoSave] Failed to clear recovery files:', error);
  }
}

/**
 * Disable all auto-save entries
 */
export function disableAllAutoSave(): void {
  for (const [filePath, entry] of autoSaveEntries) {
    if (entry.timer) {
      clearInterval(entry.timer);
    }
    console.log(`[AutoSave] Disabled for ${filePath}`);
  }
  autoSaveEntries.clear();
}

/**
 * Initialize auto-save module
 * Called on app startup to check for recovery files
 */
export async function initializeAutoSave(): Promise<void> {
  await ensureRecoveryDir();
  await sendRecoveryAvailable();
}

/**
 * Check if auto-save is enabled for a file
 */
export function isAutoSaveEnabled(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return autoSaveEntries.has(normalizedPath);
}

/**
 * Get auto-save interval for a file
 */
export function getAutoSaveInterval(filePath: string): number | null {
  const normalizedPath = path.normalize(filePath);
  const entry = autoSaveEntries.get(normalizedPath);
  return entry?.interval ?? null;
}
