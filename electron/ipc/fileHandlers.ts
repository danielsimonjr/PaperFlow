/**
 * File System IPC Handlers
 *
 * Comprehensive IPC handlers for native file system operations.
 * Handles file dialogs, reading, writing, watching, and folder operations.
 */

import { IpcMain, dialog, BrowserWindow, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC_CHANNELS } from './channels';
import type {
  FileDialogOptions,
  SaveDialogOptions,
  FolderDialogOptions,
  FolderListOptions,
  FolderEntry,
  FileStats,
  AutoSaveOptions,
  BackupOptions,
} from './types';
import { watchFile, unwatchFile, unwatchAll } from '../fileWatcher';
import { enableAutoSave, disableAutoSave, getRecoveryFiles, clearRecoveryFile } from '../autoSave';
import { createBackup, listBackups, restoreBackup, deleteBackup } from '../backup';
import {
  loadRecentFiles,
  addRecentFile,
  removeRecentFile,
  clearRecentFiles,
} from '../recentFiles';
import {
  approvePath,
  approvePaths,
  assertPathAllowed,
  assertExtensionAllowedForWrite,
  isPathAllowed,
} from './pathSandbox';

/** Recursive folder listing caps (security finding 2026-05-01 #6). */
export const MAX_RECURSIVE_DEPTH = 5;
export const MAX_RECURSIVE_ENTRIES = 10000;

// Store last used directory for each dialog type
const lastUsedDirs: Map<string, string> = new Map();

/**
 * Get the last used directory for a dialog type
 */
function getLastUsedDir(type: 'open' | 'save' | 'folder'): string {
  return lastUsedDirs.get(type) || app.getPath('documents');
}

/**
 * Set the last used directory for a dialog type
 */
function setLastUsedDir(type: 'open' | 'save' | 'folder', dir: string): void {
  lastUsedDirs.set(type, dir);
}

/**
 * Get file stats
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
 * Helper to get current window from event
 */
function getCurrentWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/**
 * Recursive folder listing with depth + entry caps.
 *
 * Replaces the broken self-call to `ipcMain.handle()` (which registers a
 * handler, never invokes one). Caps prevent runaway listings on huge
 * directory trees and short-circuit denial-of-service-by-recursion.
 *
 * Exported for unit tests; not part of the IPC surface.
 */
export async function listFolderRecursive(
  folderPath: string,
  options: FolderListOptions | undefined,
  depth: number,
  counter: { count: number },
): Promise<FolderEntry[]> {
  if (depth > MAX_RECURSIVE_DEPTH) return [];
  if (counter.count >= MAX_RECURSIVE_ENTRIES) return [];

  const entries: FolderEntry[] = [];
  let items: import('fs').Dirent[];
  try {
    items = await fs.readdir(folderPath, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const item of items) {
    if (counter.count >= MAX_RECURSIVE_ENTRIES) break;
    const itemPath = path.join(folderPath, item.name);
    const isFile = item.isFile();
    const isDirectory = item.isDirectory();

    if (options?.extensions && isFile) {
      const ext = path.extname(item.name).toLowerCase().slice(1);
      if (!options.extensions.includes(ext)) continue;
    }

    const entry: FolderEntry = {
      name: item.name,
      path: itemPath,
      isFile,
      isDirectory,
    };

    if (isFile) {
      try {
        const stats = await fs.stat(itemPath);
        entry.size = stats.size;
        entry.modified = stats.mtimeMs;
      } catch {
        // Ignore stats errors
      }
    }

    entries.push(entry);
    counter.count++;

    if (options?.recursive && isDirectory) {
      const sub = await listFolderRecursive(itemPath, options, depth + 1, counter);
      entries.push(...sub);
    }
  }

  return entries;
}

/**
 * Set up file system IPC handlers
 */
export function setupFileHandlers(ipcMain: IpcMain): void {
  // === File Dialog Operations ===

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_OPEN_FILE,
    async (event, options?: FileDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { canceled: true, filePaths: [] };

      const defaultPath = options?.defaultPath || getLastUsedDir('open');

      const result = await dialog.showOpenDialog(window, {
        title: options?.title || 'Open PDF',
        defaultPath,
        filters: options?.filters || [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: options?.multiSelections
          ? ['openFile', 'multiSelections']
          : ['openFile'],
      });

      // Remember last used directory and seed the path sandbox with the
      // user-approved file paths.
      if (!result.canceled && result.filePaths.length > 0) {
        setLastUsedDir('open', path.dirname(result.filePaths[0]));
        approvePaths(result.filePaths);
      }

      return {
        canceled: result.canceled,
        filePaths: result.filePaths,
      };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (event, options?: SaveDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { canceled: true };

      const defaultPath = options?.defaultPath || getLastUsedDir('save');

      const result = await dialog.showSaveDialog(window, {
        title: options?.title || 'Save PDF',
        defaultPath,
        filters: options?.filters || [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      // Remember last used directory and seed the sandbox with the
      // user-approved save target.
      if (!result.canceled && result.filePath) {
        setLastUsedDir('save', path.dirname(result.filePath));
        approvePath(result.filePath);
      }

      return {
        canceled: result.canceled,
        filePath: result.filePath,
      };
    }
  );

  // === Folder Operations ===

  ipcMain.handle(
    IPC_CHANNELS.FOLDER_PICK,
    async (event, options?: FolderDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { canceled: true };

      const defaultPath = options?.defaultPath || getLastUsedDir('folder');

      const result = await dialog.showOpenDialog(window, {
        title: options?.title || 'Select Folder',
        defaultPath,
        buttonLabel: options?.buttonLabel || 'Select',
        properties: ['openDirectory', 'createDirectory'],
      });

      // Remember last used directory and approve the folder + all
      // descendants (the user explicitly picked it).
      if (!result.canceled && result.filePaths.length > 0) {
        setLastUsedDir('folder', result.filePaths[0]);
        approvePaths(result.filePaths);
      }

      return {
        canceled: result.canceled,
        folderPath: result.filePaths[0],
      };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FOLDER_LIST,
    async (_event, folderPath: string, options?: FolderListOptions) => {
      if (typeof folderPath !== 'string' || !isPathAllowed(folderPath)) {
        console.warn('[FileHandlers] FOLDER_LIST denied for unapproved path:', folderPath);
        return [];
      }
      try {
        return await listFolderRecursive(folderPath, options, 0, { count: 0 });
      } catch (error) {
        console.error('[FileHandlers] Failed to list folder:', error);
        return [];
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE, async (_event, folderPath: string) => {
    try {
      assertPathAllowed(folderPath);
      await fs.mkdir(folderPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  });

  // === File Read/Write Operations ===

  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
    try {
      assertPathAllowed(filePath);
      const data = await fs.readFile(filePath);
      return { success: true, data: new Uint8Array(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.FILE_WRITE,
    async (_event, filePath: string, data: Uint8Array) => {
      try {
        assertPathAllowed(filePath);
        assertExtensionAllowedForWrite(filePath);
        await fs.writeFile(filePath, Buffer.from(data));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to write file',
        };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.FILE_SAVE, async (_event, filePath: string, data: Uint8Array) => {
    try {
      assertPathAllowed(filePath);
      assertExtensionAllowedForWrite(filePath);
      await fs.writeFile(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save file',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_EXISTS, async (_event, filePath: string) => {
    if (!isPathAllowed(filePath)) return false;
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_GET_STATS, async (_event, filePath: string) => {
    if (!isPathAllowed(filePath)) return null;
    return getFileStats(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_DELETE, async (_event, filePath: string) => {
    if (!isPathAllowed(filePath)) return false;
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_COPY, async (_event, src: string, dest: string) => {
    if (!isPathAllowed(src) || !isPathAllowed(dest)) return false;
    try {
      assertExtensionAllowedForWrite(dest);
      await fs.copyFile(src, dest);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_MOVE, async (_event, src: string, dest: string) => {
    if (!isPathAllowed(src) || !isPathAllowed(dest)) return false;
    try {
      assertExtensionAllowedForWrite(dest);
    } catch {
      return false;
    }
    try {
      await fs.rename(src, dest);
      return true;
    } catch {
      // rename doesn't work across devices, try copy + delete
      try {
        await fs.copyFile(src, dest);
        await fs.unlink(src);
        return true;
      } catch {
        return false;
      }
    }
  });

  // === Recent Files ===

  ipcMain.handle(IPC_CHANNELS.FILE_GET_RECENT, async () => {
    const recents = await loadRecentFiles();
    // Recent files were previously approved by the user. Re-seed the
    // sandbox so reopening from the recent-files menu still works after
    // app restart (which clears the in-memory allow-list).
    for (const r of recents) approvePath(r.path);
    return recents;
  });

  ipcMain.handle(IPC_CHANNELS.FILE_ADD_RECENT, async (_event, filePath: string) => {
    await addRecentFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_REMOVE_RECENT, async (_event, filePath: string) => {
    await removeRecentFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_CLEAR_RECENT, async () => {
    await clearRecentFiles();
  });

  // === File Watcher ===

  ipcMain.handle(IPC_CHANNELS.WATCHER_START, async (_event, filePath: string) => {
    return watchFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.WATCHER_STOP, async (_event, filePath: string) => {
    return unwatchFile(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.WATCHER_STOP_ALL, async () => {
    await unwatchAll();
  });

  // === Auto-Save ===

  ipcMain.handle(IPC_CHANNELS.AUTOSAVE_ENABLE, async (_event, options: AutoSaveOptions) => {
    return enableAutoSave(options);
  });

  ipcMain.handle(IPC_CHANNELS.AUTOSAVE_DISABLE, async (_event, filePath: string) => {
    return disableAutoSave(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.AUTOSAVE_GET_RECOVERY, async () => {
    return getRecoveryFiles();
  });

  ipcMain.handle(IPC_CHANNELS.AUTOSAVE_CLEAR_RECOVERY, async (_event, recoveryPath: string) => {
    return clearRecoveryFile(recoveryPath);
  });

  // === Backup ===

  ipcMain.handle(
    IPC_CHANNELS.BACKUP_CREATE,
    async (_event, filePath: string, options?: BackupOptions) => {
      return createBackup(filePath, options);
    }
  );

  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async (_event, filePath: string) => {
    return listBackups(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, async (_event, backupId: string) => {
    return restoreBackup(backupId);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_DELETE, async (_event, backupId: string) => {
    return deleteBackup(backupId);
  });

  // === Window Document State ===

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_DOCUMENT_EDITED, (event, edited: boolean) => {
    const window = getCurrentWindow(event);
    if (window && process.platform === 'darwin') {
      window.setDocumentEdited(edited);
    }
  });
}
