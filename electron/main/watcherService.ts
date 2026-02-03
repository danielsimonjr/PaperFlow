/**
 * Watcher Service
 *
 * Advanced file watching service that manages file watchers with optimized
 * performance, efficient debouncing, and proper resource management.
 */

import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import { IPC_EVENTS } from '../ipc/channels';
import type { FileWatcherEvent, FileStats } from '../ipc/types';

export interface WatcherOptions {
  debounceMs?: number;
  awaitWriteFinishMs?: number;
  pollInterval?: number;
  persistent?: boolean;
  ignoreInitial?: boolean;
  depth?: number;
}

export interface WatchedFileInfo {
  path: string;
  watcher: FSWatcher;
  lastModified: number;
  lastHash?: string;
  debounceTimer?: NodeJS.Timeout;
  isFolder: boolean;
  options: WatcherOptions;
}

// Default options
const DEFAULT_OPTIONS: WatcherOptions = {
  debounceMs: 100,
  awaitWriteFinishMs: 300,
  pollInterval: 100,
  persistent: true,
  ignoreInitial: true,
  depth: 0,
};

// Singleton service instance
let instance: WatcherService | null = null;

/**
 * File Watcher Service
 */
export class WatcherService {
  private watchers: Map<string, WatchedFileInfo> = new Map();
  private globalDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isShuttingDown: boolean = false;
  private eventQueue: FileWatcherEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private batchFlushMs: number = 50;

  /**
   * Get the singleton instance
   */
  static getInstance(): WatcherService {
    if (!instance) {
      instance = new WatcherService();
    }
    return instance;
  }

  /**
   * Get file stats in our format
   */
  private async getFileStats(filePath: string): Promise<FileStats | null> {
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
   * Queue event for batch sending
   */
  private queueEvent(event: FileWatcherEvent): void {
    this.eventQueue.push(event);

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flushEvents();
    }, this.batchFlushMs);
  }

  /**
   * Flush queued events to renderer
   */
  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];
    this.flushTimeout = null;

    // Send events in batch
    for (const event of events) {
      this.sendWatcherEvent(event);
    }
  }

  /**
   * Send file watcher event to all windows
   */
  private sendWatcherEvent(event: FileWatcherEvent): void {
    if (this.isShuttingDown) return;

    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_EVENTS.FILE_CHANGED, event);

        // Also send FILE_DELETED for unlink events
        if (event.type === 'unlink') {
          win.webContents.send(IPC_EVENTS.FILE_DELETED, event.path);
        }
      }
    }
  }

  /**
   * Start watching a file
   */
  async watchFile(filePath: string, options?: Partial<WatcherOptions>): Promise<boolean> {
    const normalizedPath = path.normalize(filePath);

    // Check if already watching
    if (this.watchers.has(normalizedPath)) {
      return true;
    }

    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch {
      console.error(`[WatcherService] Cannot watch non-existent file: ${normalizedPath}`);
      return false;
    }

    const mergedOptions: WatcherOptions = { ...DEFAULT_OPTIONS, ...options };
    const stats = await this.getFileStats(normalizedPath);
    const isFolder = stats?.isDirectory ?? false;

    // Create watcher with optimized settings
    const watcher = chokidar.watch(normalizedPath, {
      persistent: mergedOptions.persistent,
      ignoreInitial: mergedOptions.ignoreInitial,
      awaitWriteFinish: {
        stabilityThreshold: mergedOptions.awaitWriteFinishMs,
        pollInterval: mergedOptions.pollInterval,
      },
      depth: isFolder ? mergedOptions.depth : 0,
      // Use polling only on network drives for better performance
      usePolling: false,
      // Ignore hidden files and common temp patterns
      ignored: [
        /(^|[/\\])\../, // dotfiles
        /~$/, // backup files
        /\.tmp$/, // temp files
        /\.swp$/, // vim swap files
      ],
    });

    const watchedInfo: WatchedFileInfo = {
      path: normalizedPath,
      watcher,
      lastModified: stats?.modified ?? Date.now(),
      isFolder,
      options: mergedOptions,
    };

    // Handle change events with debouncing
    watcher.on('change', async (changedPath) => {
      this.handleFileChange(changedPath, 'change', mergedOptions.debounceMs!);
    });

    // Handle add events (for watched folders)
    watcher.on('add', async (addedPath) => {
      if (isFolder && addedPath !== normalizedPath) {
        this.handleFileChange(addedPath, 'add', mergedOptions.debounceMs!);
      }
    });

    // Handle file deletion
    watcher.on('unlink', (deletedPath) => {
      this.handleFileDelete(deletedPath, normalizedPath);
    });

    // Handle errors
    watcher.on('error', (error) => {
      console.error(`[WatcherService] Error watching ${normalizedPath}:`, error);
      this.queueEvent({
        type: 'error',
        path: normalizedPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    this.watchers.set(normalizedPath, watchedInfo);
    console.log(`[WatcherService] Started watching: ${normalizedPath}`);
    return true;
  }

  /**
   * Handle file change with debouncing
   */
  private handleFileChange(filePath: string, eventType: 'change' | 'add', debounceMs: number): void {
    // Clear existing debounce timer
    const existingTimer = this.globalDebounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      this.globalDebounceTimers.delete(filePath);
      const stats = await this.getFileStats(filePath);

      // Update last modified time
      const watchedInfo = this.findWatchedInfoByPath(filePath);
      if (watchedInfo && stats) {
        // Skip if modification time hasn't changed (false positive)
        if (stats.modified === watchedInfo.lastModified) {
          return;
        }
        watchedInfo.lastModified = stats.modified;
      }

      this.queueEvent({
        type: eventType,
        path: filePath,
        stats: stats ?? undefined,
      });
    }, debounceMs);

    this.globalDebounceTimers.set(filePath, timer);
  }

  /**
   * Handle file deletion
   */
  private handleFileDelete(deletedPath: string, watchedPath: string): void {
    this.queueEvent({
      type: 'unlink',
      path: deletedPath,
    });

    // If the watched file itself was deleted, stop watching
    if (deletedPath === watchedPath) {
      this.unwatchFile(deletedPath);
    }
  }

  /**
   * Find watched info for a path (including parent folders)
   */
  private findWatchedInfoByPath(filePath: string): WatchedFileInfo | undefined {
    // Direct match
    if (this.watchers.has(filePath)) {
      return this.watchers.get(filePath);
    }

    // Check if file is within a watched folder
    for (const [watchedPath, info] of this.watchers) {
      if (info.isFolder && filePath.startsWith(watchedPath + path.sep)) {
        return info;
      }
    }

    return undefined;
  }

  /**
   * Stop watching a file
   */
  async unwatchFile(filePath: string): Promise<boolean> {
    const normalizedPath = path.normalize(filePath);
    const watchedInfo = this.watchers.get(normalizedPath);

    if (!watchedInfo) {
      return false;
    }

    // Clear any pending debounce timer
    if (watchedInfo.debounceTimer) {
      clearTimeout(watchedInfo.debounceTimer);
    }

    const timer = this.globalDebounceTimers.get(normalizedPath);
    if (timer) {
      clearTimeout(timer);
      this.globalDebounceTimers.delete(normalizedPath);
    }

    // Close watcher
    await watchedInfo.watcher.close();
    this.watchers.delete(normalizedPath);
    console.log(`[WatcherService] Stopped watching: ${normalizedPath}`);
    return true;
  }

  /**
   * Stop watching all files
   */
  async unwatchAll(): Promise<void> {
    this.isShuttingDown = true;

    // Clear all debounce timers
    for (const timer of this.globalDebounceTimers.values()) {
      clearTimeout(timer);
    }
    this.globalDebounceTimers.clear();

    // Clear flush timeout
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    // Clear event queue
    this.eventQueue = [];

    // Close all watchers
    const closePromises: Promise<void>[] = [];
    for (const [filePath, info] of this.watchers) {
      if (info.debounceTimer) {
        clearTimeout(info.debounceTimer);
      }
      closePromises.push(
        info.watcher.close().then(() => {
          console.log(`[WatcherService] Stopped watching: ${filePath}`);
        })
      );
    }

    await Promise.all(closePromises);
    this.watchers.clear();
    this.isShuttingDown = false;
  }

  /**
   * Get list of currently watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Check if a file is being watched
   */
  isWatching(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return this.watchers.has(normalizedPath);
  }

  /**
   * Get stats for all watched files
   */
  getWatcherStats(): { totalWatchers: number; files: number; folders: number } {
    let files = 0;
    let folders = 0;

    for (const info of this.watchers.values()) {
      if (info.isFolder) {
        folders++;
      } else {
        files++;
      }
    }

    return {
      totalWatchers: this.watchers.size,
      files,
      folders,
    };
  }

  /**
   * Force check a file for changes
   */
  async checkForChanges(filePath: string): Promise<boolean> {
    const normalizedPath = path.normalize(filePath);
    const watchedInfo = this.watchers.get(normalizedPath);

    if (!watchedInfo) {
      return false;
    }

    const stats = await this.getFileStats(normalizedPath);
    if (!stats) {
      return false;
    }

    const hasChanged = stats.modified !== watchedInfo.lastModified;
    if (hasChanged) {
      watchedInfo.lastModified = stats.modified;
      this.queueEvent({
        type: 'change',
        path: normalizedPath,
        stats,
      });
    }

    return hasChanged;
  }

  /**
   * Cleanup resources on shutdown
   */
  async shutdown(): Promise<void> {
    await this.unwatchAll();
    instance = null;
  }
}

// Export convenience functions that use the singleton
export const watcherService = WatcherService.getInstance();

export function watchFile(filePath: string, options?: Partial<WatcherOptions>): Promise<boolean> {
  return watcherService.watchFile(filePath, options);
}

export function unwatchFile(filePath: string): Promise<boolean> {
  return watcherService.unwatchFile(filePath);
}

export function unwatchAll(): Promise<void> {
  return watcherService.unwatchAll();
}

export function getWatchedFiles(): string[] {
  return watcherService.getWatchedFiles();
}

export function isWatching(filePath: string): boolean {
  return watcherService.isWatching(filePath);
}
