/**
 * File Watcher Module
 *
 * Uses chokidar to monitor files for external changes.
 * Notifies the renderer process when watched files are modified or deleted.
 */

import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import { IPC_EVENTS } from './ipc/channels';
import type { FileWatcherEvent, FileStats } from './ipc/types';

// Store of active watchers
const watchers = new Map<string, FSWatcher>();

// Debounce timers for change events
const debounceTimers = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 100;

/**
 * Get file stats in our format
 */
async function getFileStats(filePath: string): Promise<FileStats | null> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtimeMs,
      modified: stats.mtimeMs,
      accessed: stats.atimeMs,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch {
    return null;
  }
}

/**
 * Send file watcher event to all windows
 */
function sendWatcherEvent(event: FileWatcherEvent): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_EVENTS.FILE_CHANGED, event);
    }
  }
}

/**
 * Start watching a file for changes
 */
export async function watchFile(filePath: string): Promise<boolean> {
  // Normalize path
  const normalizedPath = path.normalize(filePath);

  // Check if already watching
  if (watchers.has(normalizedPath)) {
    return true;
  }

  // Check if file exists
  try {
    await fs.access(normalizedPath);
  } catch {
    console.error(`[FileWatcher] Cannot watch non-existent file: ${normalizedPath}`);
    return false;
  }

  // Create watcher
  const watcher = chokidar.watch(normalizedPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  // Handle change events with debouncing
  watcher.on('change', async (changedPath) => {
    // Clear existing debounce timer
    const existingTimer = debounceTimers.get(changedPath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      debounceTimers.delete(changedPath);
      const stats = await getFileStats(changedPath);
      sendWatcherEvent({
        type: 'change',
        path: changedPath,
        stats: stats ?? undefined,
      });
    }, DEBOUNCE_MS);

    debounceTimers.set(changedPath, timer);
  });

  // Handle file deletion
  watcher.on('unlink', (deletedPath) => {
    sendWatcherEvent({
      type: 'unlink',
      path: deletedPath,
    });

    // Also send to FILE_DELETED event
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.FILE_DELETED, deletedPath);
      }
    }

    // Stop watching deleted file
    unwatchFile(deletedPath);
  });

  // Handle errors
  watcher.on('error', (error) => {
    console.error(`[FileWatcher] Error watching ${normalizedPath}:`, error);
    sendWatcherEvent({
      type: 'error',
      path: normalizedPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  watchers.set(normalizedPath, watcher);
  console.log(`[FileWatcher] Started watching: ${normalizedPath}`);
  return true;
}

/**
 * Stop watching a file
 */
export async function unwatchFile(filePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);
  const watcher = watchers.get(normalizedPath);

  if (!watcher) {
    return false;
  }

  // Clear any pending debounce timer
  const timer = debounceTimers.get(normalizedPath);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(normalizedPath);
  }

  // Close watcher
  await watcher.close();
  watchers.delete(normalizedPath);
  console.log(`[FileWatcher] Stopped watching: ${normalizedPath}`);
  return true;
}

/**
 * Stop watching all files
 */
export async function unwatchAll(): Promise<void> {
  // Clear all debounce timers
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();

  // Close all watchers
  const closePromises: Promise<void>[] = [];
  for (const [filePath, watcher] of watchers) {
    closePromises.push(
      watcher.close().then(() => {
        console.log(`[FileWatcher] Stopped watching: ${filePath}`);
      })
    );
  }

  await Promise.all(closePromises);
  watchers.clear();
}

/**
 * Get list of currently watched files
 */
export function getWatchedFiles(): string[] {
  return Array.from(watchers.keys());
}

/**
 * Check if a file is being watched
 */
export function isWatching(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);
  return watchers.has(normalizedPath);
}
