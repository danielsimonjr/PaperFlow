/**
 * Shell IPC Handlers
 *
 * Handles IPC communication for shell operations.
 */

import { IpcMain } from 'electron';
import {
  showItemInFolder,
  openWithDefaultApp,
  openExternalUrl,
  trashItem,
  beep,
  getSpecialFolderPath,
  revealInFileManager,
  openContainingFolder,
  fileExists,
  openMultipleFiles,
  showAppInFolder,
  showUserDataFolder,
  showLogsFolder,
  getFileInfo,
} from '../shell';

/**
 * Shell IPC channel names
 */
export const SHELL_CHANNELS = {
  SHELL_SHOW_IN_FOLDER: 'shell-show-in-folder',
  SHELL_OPEN_DEFAULT: 'shell-open-default',
  SHELL_OPEN_EXTERNAL: 'shell-open-external',
  SHELL_TRASH_ITEM: 'shell-trash-item',
  SHELL_BEEP: 'shell-beep',
  SHELL_GET_SPECIAL_FOLDER: 'shell-get-special-folder',
  SHELL_REVEAL_IN_FILE_MANAGER: 'shell-reveal-in-file-manager',
  SHELL_OPEN_CONTAINING_FOLDER: 'shell-open-containing-folder',
  SHELL_FILE_EXISTS: 'shell-file-exists',
  SHELL_OPEN_MULTIPLE: 'shell-open-multiple',
  SHELL_SHOW_APP_FOLDER: 'shell-show-app-folder',
  SHELL_SHOW_USER_DATA_FOLDER: 'shell-show-user-data-folder',
  SHELL_SHOW_LOGS_FOLDER: 'shell-show-logs-folder',
  SHELL_GET_FILE_INFO: 'shell-get-file-info',
} as const;

/**
 * Set up shell IPC handlers
 */
export function setupShellHandlers(ipcMain: IpcMain): void {
  // Show item in folder
  ipcMain.handle(SHELL_CHANNELS.SHELL_SHOW_IN_FOLDER, (_event, filePath: string) => {
    showItemInFolder(filePath);
    return { success: true };
  });

  // Open with default app
  ipcMain.handle(SHELL_CHANNELS.SHELL_OPEN_DEFAULT, async (_event, filePath: string) => {
    const error = await openWithDefaultApp(filePath);
    return {
      success: !error,
      error: error || undefined,
    };
  });

  // Open external URL
  ipcMain.handle(SHELL_CHANNELS.SHELL_OPEN_EXTERNAL, async (_event, url: string) => {
    try {
      await openExternalUrl(url);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL',
      };
    }
  });

  // Trash item
  ipcMain.handle(SHELL_CHANNELS.SHELL_TRASH_ITEM, async (_event, filePath: string) => {
    try {
      await trashItem(filePath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trash item',
      };
    }
  });

  // Beep
  ipcMain.handle(SHELL_CHANNELS.SHELL_BEEP, () => {
    beep();
    return { success: true };
  });

  // Get special folder path
  ipcMain.handle(
    SHELL_CHANNELS.SHELL_GET_SPECIAL_FOLDER,
    (
      _event,
      name:
        | 'home'
        | 'appData'
        | 'userData'
        | 'sessionData'
        | 'temp'
        | 'exe'
        | 'module'
        | 'desktop'
        | 'documents'
        | 'downloads'
        | 'music'
        | 'pictures'
        | 'videos'
        | 'recent'
        | 'logs'
        | 'crashDumps'
    ) => {
      try {
        const path = getSpecialFolderPath(name);
        return { success: true, path };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get path',
        };
      }
    }
  );

  // Reveal in file manager
  ipcMain.handle(SHELL_CHANNELS.SHELL_REVEAL_IN_FILE_MANAGER, (_event, filePath: string) => {
    return revealInFileManager(filePath);
  });

  // Open containing folder
  ipcMain.handle(SHELL_CHANNELS.SHELL_OPEN_CONTAINING_FOLDER, async (_event, filePath: string) => {
    return openContainingFolder(filePath);
  });

  // Check if file exists
  ipcMain.handle(SHELL_CHANNELS.SHELL_FILE_EXISTS, async (_event, filePath: string) => {
    const exists = await fileExists(filePath);
    return { exists };
  });

  // Open multiple files
  ipcMain.handle(SHELL_CHANNELS.SHELL_OPEN_MULTIPLE, async (_event, filePaths: string[]) => {
    const results = await openMultipleFiles(filePaths);
    return { results };
  });

  // Show app folder
  ipcMain.handle(SHELL_CHANNELS.SHELL_SHOW_APP_FOLDER, () => {
    showAppInFolder();
    return { success: true };
  });

  // Show user data folder
  ipcMain.handle(SHELL_CHANNELS.SHELL_SHOW_USER_DATA_FOLDER, () => {
    showUserDataFolder();
    return { success: true };
  });

  // Show logs folder
  ipcMain.handle(SHELL_CHANNELS.SHELL_SHOW_LOGS_FOLDER, () => {
    showLogsFolder();
    return { success: true };
  });

  // Get file info
  ipcMain.handle(SHELL_CHANNELS.SHELL_GET_FILE_INFO, async (_event, filePath: string) => {
    const info = await getFileInfo(filePath);
    return { success: !!info, info };
  });
}
