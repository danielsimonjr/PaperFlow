/**
 * File Watch IPC Handlers
 *
 * IPC channels for file watch events between main and renderer processes.
 */

import { IpcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import {
  WatcherService,
  watchFile,
  unwatchFile,
  unwatchAll,
  getWatchedFiles,
  isWatching,
} from '../main/watcherService';
import {
  watchFolder,
  unwatchFolder,
  unwatchAllFolders,
  getWatchedFolders,
  isWatchingFolder,
  watchRecentFileFolders,
  getFolderWatcherStats,
} from '../main/folderWatcher';
import {
  isFileLocked,
  canWriteFile,
  waitForUnlock,
  startLockMonitoring,
  stopLockMonitoring,
  getLockStatus,
  getLockedFiles,
  acquireLock,
} from '../main/fileLock';
import {
  getPerformanceMetrics,
  getOptimizationSettings,
  updateOptimizationSettings,
  checkPerformanceThresholds,
  autoOptimize,
  getOptimizationRecommendations,
} from '../main/watcherOptimizations';
import type { WatcherOptions } from '../main/watcherService';
import type { FolderWatcherOptions } from '../main/folderWatcher';
import type { LockCheckOptions } from '../main/fileLock';
import type { OptimizationSettings } from '../main/watcherOptimizations';

// Extended IPC channels for file watching
export const FILE_WATCH_CHANNELS = {
  // File watching
  WATCH_FILE: 'file-watch:watch-file',
  UNWATCH_FILE: 'file-watch:unwatch-file',
  UNWATCH_ALL_FILES: 'file-watch:unwatch-all-files',
  GET_WATCHED_FILES: 'file-watch:get-watched-files',
  IS_WATCHING_FILE: 'file-watch:is-watching-file',
  CHECK_FILE_CHANGES: 'file-watch:check-file-changes',

  // Folder watching
  WATCH_FOLDER: 'file-watch:watch-folder',
  UNWATCH_FOLDER: 'file-watch:unwatch-folder',
  UNWATCH_ALL_FOLDERS: 'file-watch:unwatch-all-folders',
  GET_WATCHED_FOLDERS: 'file-watch:get-watched-folders',
  IS_WATCHING_FOLDER: 'file-watch:is-watching-folder',
  WATCH_RECENT_FILE_FOLDERS: 'file-watch:watch-recent-file-folders',
  GET_FOLDER_WATCHER_STATS: 'file-watch:get-folder-watcher-stats',

  // File lock
  IS_FILE_LOCKED: 'file-watch:is-file-locked',
  CAN_WRITE_FILE: 'file-watch:can-write-file',
  WAIT_FOR_UNLOCK: 'file-watch:wait-for-unlock',
  START_LOCK_MONITORING: 'file-watch:start-lock-monitoring',
  STOP_LOCK_MONITORING: 'file-watch:stop-lock-monitoring',
  GET_LOCK_STATUS: 'file-watch:get-lock-status',
  GET_LOCKED_FILES: 'file-watch:get-locked-files',
  ACQUIRE_LOCK: 'file-watch:acquire-lock',

  // Performance
  GET_PERFORMANCE_METRICS: 'file-watch:get-performance-metrics',
  GET_OPTIMIZATION_SETTINGS: 'file-watch:get-optimization-settings',
  UPDATE_OPTIMIZATION_SETTINGS: 'file-watch:update-optimization-settings',
  CHECK_PERFORMANCE_THRESHOLDS: 'file-watch:check-performance-thresholds',
  AUTO_OPTIMIZE: 'file-watch:auto-optimize',
  GET_OPTIMIZATION_RECOMMENDATIONS: 'file-watch:get-optimization-recommendations',
} as const;

/**
 * Set up file watch IPC handlers
 */
export function setupFileWatchHandlers(ipcMain: IpcMain): void {
  // === File Watching ===

  ipcMain.handle(
    FILE_WATCH_CHANNELS.WATCH_FILE,
    async (_event, filePath: string, options?: Partial<WatcherOptions>) => {
      return watchFile(filePath, options);
    }
  );

  ipcMain.handle(FILE_WATCH_CHANNELS.UNWATCH_FILE, async (_event, filePath: string) => {
    return unwatchFile(filePath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.UNWATCH_ALL_FILES, async () => {
    await unwatchAll();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_WATCHED_FILES, () => {
    return getWatchedFiles();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.IS_WATCHING_FILE, (_event, filePath: string) => {
    return isWatching(filePath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.CHECK_FILE_CHANGES, async (_event, filePath: string) => {
    const service = WatcherService.getInstance();
    return service.checkForChanges(filePath);
  });

  // === Folder Watching ===

  ipcMain.handle(
    FILE_WATCH_CHANNELS.WATCH_FOLDER,
    (_event, folderPath: string, options?: FolderWatcherOptions) => {
      return watchFolder(folderPath, options);
    }
  );

  ipcMain.handle(FILE_WATCH_CHANNELS.UNWATCH_FOLDER, async (_event, folderPath: string) => {
    return unwatchFolder(folderPath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.UNWATCH_ALL_FOLDERS, async () => {
    await unwatchAllFolders();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_WATCHED_FOLDERS, () => {
    return getWatchedFolders();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.IS_WATCHING_FOLDER, (_event, folderPath: string) => {
    return isWatchingFolder(folderPath);
  });

  ipcMain.handle(
    FILE_WATCH_CHANNELS.WATCH_RECENT_FILE_FOLDERS,
    (_event, filePaths: string[]) => {
      return watchRecentFileFolders(filePaths);
    }
  );

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_FOLDER_WATCHER_STATS, () => {
    return getFolderWatcherStats();
  });

  // === File Lock ===

  ipcMain.handle(FILE_WATCH_CHANNELS.IS_FILE_LOCKED, async (_event, filePath: string) => {
    return isFileLocked(filePath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.CAN_WRITE_FILE, async (_event, filePath: string) => {
    return canWriteFile(filePath);
  });

  ipcMain.handle(
    FILE_WATCH_CHANNELS.WAIT_FOR_UNLOCK,
    async (_event, filePath: string, options?: LockCheckOptions) => {
      return waitForUnlock(filePath, options);
    }
  );

  ipcMain.handle(
    FILE_WATCH_CHANNELS.START_LOCK_MONITORING,
    (_event, filePath: string, checkIntervalMs?: number) => {
      startLockMonitoring(filePath, checkIntervalMs);
    }
  );

  ipcMain.handle(FILE_WATCH_CHANNELS.STOP_LOCK_MONITORING, (_event, filePath: string) => {
    stopLockMonitoring(filePath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_LOCK_STATUS, (_event, filePath: string) => {
    return getLockStatus(filePath);
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_LOCKED_FILES, () => {
    return getLockedFiles();
  });

  ipcMain.handle(
    FILE_WATCH_CHANNELS.ACQUIRE_LOCK,
    async (_event, filePath: string, options?: LockCheckOptions) => {
      return acquireLock(filePath, options);
    }
  );

  // === Performance ===

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_PERFORMANCE_METRICS, () => {
    return getPerformanceMetrics();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_OPTIMIZATION_SETTINGS, () => {
    return getOptimizationSettings();
  });

  ipcMain.handle(
    FILE_WATCH_CHANNELS.UPDATE_OPTIMIZATION_SETTINGS,
    (_event, settings: Partial<OptimizationSettings>) => {
      return updateOptimizationSettings(settings);
    }
  );

  ipcMain.handle(FILE_WATCH_CHANNELS.CHECK_PERFORMANCE_THRESHOLDS, () => {
    return checkPerformanceThresholds();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.AUTO_OPTIMIZE, async () => {
    return autoOptimize();
  });

  ipcMain.handle(FILE_WATCH_CHANNELS.GET_OPTIMIZATION_RECOMMENDATIONS, () => {
    return getOptimizationRecommendations();
  });

  // Also register the basic watcher channels from the original implementation
  // These are already registered in fileHandlers.ts but kept here for completeness
  ipcMain.handle(IPC_CHANNELS.WATCHER_START, async (_event, filePath: string) => {
    return watchFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.WATCHER_STOP, async (_event, filePath: string) => {
    return unwatchFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.WATCHER_STOP_ALL, async () => {
    await unwatchAll();
  });

  console.log('[FileWatchIPC] Handlers registered');
}
