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

      // Remember last used directory
      if (!result.canceled && result.filePaths.length > 0) {
        setLastUsedDir('open', path.dirname(result.filePaths[0]));
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

      // Remember last used directory
      if (!result.canceled && result.filePath) {
        setLastUsedDir('save', path.dirname(result.filePath));
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

      // Remember last used directory
      if (!result.canceled && result.filePaths.length > 0) {
        setLastUsedDir('folder', result.filePaths[0]);
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
      try {
        const entries: FolderEntry[] = [];
        const items = await fs.readdir(folderPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(folderPath, item.name);
          const isFile = item.isFile();
          const isDirectory = item.isDirectory();

          // Filter by extension if specified
          if (options?.extensions && isFile) {
            const ext = path.extname(item.name).toLowerCase().slice(1);
            if (!options.extensions.includes(ext)) {
              continue;
            }
          }

          const entry: FolderEntry = {
            name: item.name,
            path: itemPath,
            isFile,
            isDirectory,
          };

          // Add stats if it's a file
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

          // Handle recursive listing
          if (options?.recursive && isDirectory) {
            try {
              const subEntries = await ipcMain.handle(
                IPC_CHANNELS.FOLDER_LIST,
                {} as Electron.IpcMainInvokeEvent,
                itemPath,
                options
              );
              if (Array.isArray(subEntries)) {
                entries.push(...subEntries);
              }
            } catch {
              // Ignore recursive errors
            }
          }
        }

        return entries;
      } catch (error) {
        console.error('[FileHandlers] Failed to list folder:', error);
        return [];
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.FOLDER_CREATE, async (_event, folderPath: string) => {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  });

  // === File Read/Write Operations ===

  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
    try {
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
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_GET_STATS, async (_event, filePath: string) => {
    return getFileStats(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_DELETE, async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_COPY, async (_event, src: string, dest: string) => {
    try {
      await fs.copyFile(src, dest);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_MOVE, async (_event, src: string, dest: string) => {
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
    return loadRecentFiles();
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
