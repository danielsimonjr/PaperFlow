/**
 * Folder Watcher Module
 *
 * Watches folders containing recently opened files for changes.
 * Enables notifications even when documents are not actively open.
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { BrowserWindow } from 'electron';
import { IPC_EVENTS } from '../ipc/channels';
import type { FileWatcherEvent } from '../ipc/types';

export interface WatchedFolder {
  path: string;
  watcher: FSWatcher;
  watchedExtensions: string[];
  maxDepth: number;
  fileCount: number;
  lastActivity: number;
}

export interface FolderWatcherOptions {
  extensions?: string[];
  maxDepth?: number;
  debounceMs?: number;
  maxFilesPerFolder?: number;
}

const DEFAULT_OPTIONS: Required<FolderWatcherOptions> = {
  extensions: ['.pdf'],
  maxDepth: 1,
  debounceMs: 300,
  maxFilesPerFolder: 100,
};

// Store of active folder watchers
const watchedFolders: Map<string, WatchedFolder> = new Map();
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Send folder watcher event to all windows
 */
function sendFolderEvent(event: FileWatcherEvent): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_EVENTS.FILE_CHANGED, event);
    }
  }
}

/**
 * Check if a file has a watched extension
 */
function hasWatchedExtension(filePath: string, extensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

/**
 * Start watching a folder
 */
export function watchFolder(
  folderPath: string,
  options?: FolderWatcherOptions
): boolean {
  const normalizedPath = path.normalize(folderPath);

  // Check if already watching
  if (watchedFolders.has(normalizedPath)) {
    // Update last activity
    const existing = watchedFolders.get(normalizedPath)!;
    existing.lastActivity = Date.now();
    return true;
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Create watcher for the folder
    const watcher = chokidar.watch(normalizedPath, {
      persistent: true,
      ignoreInitial: true,
      depth: mergedOptions.maxDepth,
      awaitWriteFinish: {
        stabilityThreshold: mergedOptions.debounceMs,
        pollInterval: 100,
      },
      // Only watch files with specified extensions
      ignored: (filePath: string, stats) => {
        // Always watch directories
        if (stats?.isDirectory()) {
          return false;
        }
        // Ignore dotfiles and temp files
        if (/(^|[/\\])\../.test(filePath) || /~$|\.tmp$|\.swp$/.test(filePath)) {
          return true;
        }
        // Check extension for files
        return !hasWatchedExtension(filePath, mergedOptions.extensions);
      },
    });

    const folderInfo: WatchedFolder = {
      path: normalizedPath,
      watcher,
      watchedExtensions: mergedOptions.extensions,
      maxDepth: mergedOptions.maxDepth,
      fileCount: 0,
      lastActivity: Date.now(),
    };

    // Handle events with debouncing
    const handleEvent = (eventType: FileWatcherEvent['type'], filePath: string) => {
      if (!hasWatchedExtension(filePath, mergedOptions.extensions)) {
        return;
      }

      // Debounce events
      const key = `${eventType}-${filePath}`;
      const existingTimer = debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        debounceTimers.delete(key);
        folderInfo.lastActivity = Date.now();

        sendFolderEvent({
          type: eventType,
          path: filePath,
        });
      }, mergedOptions.debounceMs);

      debounceTimers.set(key, timer);
    };

    watcher.on('change', (filePath) => handleEvent('change', filePath));
    watcher.on('add', (filePath) => {
      folderInfo.fileCount++;
      handleEvent('add', filePath);
    });
    watcher.on('unlink', (filePath) => {
      folderInfo.fileCount = Math.max(0, folderInfo.fileCount - 1);
      handleEvent('unlink', filePath);
    });

    watcher.on('error', (error) => {
      console.error(`[FolderWatcher] Error watching ${normalizedPath}:`, error);
    });

    watchedFolders.set(normalizedPath, folderInfo);
    console.log(`[FolderWatcher] Started watching folder: ${normalizedPath}`);
    return true;
  } catch (error) {
    console.error(`[FolderWatcher] Failed to watch folder ${normalizedPath}:`, error);
    return false;
  }
}

/**
 * Stop watching a folder
 */
export async function unwatchFolder(folderPath: string): Promise<boolean> {
  const normalizedPath = path.normalize(folderPath);
  const folderInfo = watchedFolders.get(normalizedPath);

  if (!folderInfo) {
    return false;
  }

  // Clear debounce timers for this folder
  for (const [key, timer] of debounceTimers) {
    if (key.includes(normalizedPath)) {
      clearTimeout(timer);
      debounceTimers.delete(key);
    }
  }

  await folderInfo.watcher.close();
  watchedFolders.delete(normalizedPath);
  console.log(`[FolderWatcher] Stopped watching folder: ${normalizedPath}`);
  return true;
}

/**
 * Stop watching all folders
 */
export async function unwatchAllFolders(): Promise<void> {
  // Clear all debounce timers
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();

  // Close all watchers
  const closePromises: Promise<void>[] = [];
  for (const [folderPath, info] of watchedFolders) {
    closePromises.push(
      info.watcher.close().then(() => {
        console.log(`[FolderWatcher] Stopped watching folder: ${folderPath}`);
      })
    );
  }

  await Promise.all(closePromises);
  watchedFolders.clear();
}

/**
 * Watch folders containing recent files
 */
export function watchRecentFileFolders(filePaths: string[]): number {
  const uniqueFolders = new Set<string>();

  for (const filePath of filePaths) {
    const folder = path.dirname(filePath);
    uniqueFolders.add(folder);
  }

  let watchedCount = 0;
  for (const folder of uniqueFolders) {
    if (watchFolder(folder)) {
      watchedCount++;
    }
  }

  return watchedCount;
}

/**
 * Get list of watched folders
 */
export function getWatchedFolders(): string[] {
  return Array.from(watchedFolders.keys());
}

/**
 * Get detailed info about watched folders
 */
export function getWatchedFolderInfo(): WatchedFolder[] {
  return Array.from(watchedFolders.values());
}

/**
 * Check if a folder is being watched
 */
export function isWatchingFolder(folderPath: string): boolean {
  return watchedFolders.has(path.normalize(folderPath));
}

/**
 * Clean up stale folder watches
 * Removes watches that haven't had activity for the specified duration
 */
export async function cleanupStaleWatches(maxInactiveMs: number = 3600000): Promise<number> {
  const now = Date.now();
  const staleFolders: string[] = [];

  for (const [folderPath, info] of watchedFolders) {
    if (now - info.lastActivity > maxInactiveMs) {
      staleFolders.push(folderPath);
    }
  }

  for (const folderPath of staleFolders) {
    await unwatchFolder(folderPath);
  }

  if (staleFolders.length > 0) {
    console.log(`[FolderWatcher] Cleaned up ${staleFolders.length} stale folder watches`);
  }

  return staleFolders.length;
}

/**
 * Get stats about folder watching
 */
export function getFolderWatcherStats(): {
  totalFolders: number;
  totalFiles: number;
  oldestActivity: number;
  newestActivity: number;
} {
  let totalFiles = 0;
  let oldestActivity = Date.now();
  let newestActivity = 0;

  for (const info of watchedFolders.values()) {
    totalFiles += info.fileCount;
    if (info.lastActivity < oldestActivity) {
      oldestActivity = info.lastActivity;
    }
    if (info.lastActivity > newestActivity) {
      newestActivity = info.lastActivity;
    }
  }

  return {
    totalFolders: watchedFolders.size,
    totalFiles,
    oldestActivity: watchedFolders.size > 0 ? oldestActivity : 0,
    newestActivity,
  };
}
