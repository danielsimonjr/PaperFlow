/**
 * IPC Handlers
 *
 * Main process IPC handlers for communication with renderer process.
 * All handlers are registered in the main process and invoked from the preload script.
 */

import { IpcMain, dialog, shell, clipboard, nativeImage, BrowserWindow, Notification, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC_CHANNELS } from './channels';
import type {
  FileDialogOptions,
  SaveDialogOptions,
  MessageDialogOptions,
  FileReadOptions,
  NotificationOptions,
  WindowBounds,
  RecentFile,
} from './types';

// Recent files storage
const MAX_RECENT_FILES = 10;

/**
 * Get the path to the recent files storage
 */
function getRecentFilesPath(): string {
  return path.join(app.getPath('userData'), 'recent-files.json');
}

/**
 * Load recent files from storage
 */
async function loadRecentFiles(): Promise<RecentFile[]> {
  try {
    const data = await fs.readFile(getRecentFilesPath(), 'utf-8');
    const parsed = JSON.parse(data) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as RecentFile[];
    }
  } catch {
    // File doesn't exist or is invalid, return empty array
  }
  return [];
}

/**
 * Save recent files to storage
 */
async function saveRecentFiles(files: RecentFile[]): Promise<void> {
  await fs.writeFile(getRecentFilesPath(), JSON.stringify(files, null, 2), 'utf-8');
}

/**
 * Set up all IPC handlers
 *
 * @param ipcMain - Electron IpcMain instance
 */
export function setupIpcHandlers(ipcMain: IpcMain): void {
  // Helper to get current window
  const getCurrentWindow = (event: Electron.IpcMainInvokeEvent): BrowserWindow | null => {
    return BrowserWindow.fromWebContents(event.sender);
  };

  // File operations
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (event, options?: FileDialogOptions) => {
    const window = getCurrentWindow(event);
    if (!window) return { canceled: true, filePaths: [] };

    const result = await dialog.showOpenDialog(window, {
      title: options?.title || 'Open PDF',
      defaultPath: options?.defaultPath,
      filters: options?.filters || [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: options?.multiSelections ? ['openFile', 'multiSelections'] : ['openFile'],
    });

    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (event, options?: SaveDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { canceled: true };

      const result = await dialog.showSaveDialog(window, {
        title: options?.title || 'Save PDF',
        defaultPath: options?.defaultPath,
        filters: options?.filters || [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      return {
        canceled: result.canceled,
        filePath: result.filePath,
      };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.DIALOG_MESSAGE,
    async (event, options: MessageDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { response: -1 };

      const result = await dialog.showMessageBox(window, {
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        detail: options.detail,
        buttons: options.buttons || ['OK'],
        defaultId: options.defaultId,
        cancelId: options.cancelId,
      });

      return { response: result.response };
    }
  );

  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string, options?: FileReadOptions) => {
    try {
      const encoding = options?.encoding;
      const data = await fs.readFile(filePath, encoding);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  });

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

  ipcMain.handle(IPC_CHANNELS.FILE_GET_RECENT, async () => {
    return loadRecentFiles();
  });

  ipcMain.handle(IPC_CHANNELS.FILE_ADD_RECENT, async (_event, filePath: string) => {
    const files = await loadRecentFiles();

    // Remove if already exists
    const filtered = files.filter((f) => f.path !== filePath);

    // Add to front
    filtered.unshift({
      path: filePath,
      name: path.basename(filePath),
      timestamp: Date.now(),
    });

    // Limit to max
    const limited = filtered.slice(0, MAX_RECENT_FILES);

    await saveRecentFiles(limited);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_CLEAR_RECENT, async () => {
    await saveRecentFiles([]);
  });

  // Window operations
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const window = getCurrentWindow(event);
    if (window) window.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const window = getCurrentWindow(event);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const window = getCurrentWindow(event);
    if (window) window.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    const window = getCurrentWindow(event);
    return window ? window.isMaximized() : false;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_TITLE, (event, title: string) => {
    const window = getCurrentWindow(event);
    if (window) window.setTitle(title);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_BOUNDS, (event): WindowBounds | null => {
    const window = getCurrentWindow(event);
    if (!window) return null;
    const bounds = window.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_BOUNDS, (event, bounds: Partial<WindowBounds>) => {
    const window = getCurrentWindow(event);
    if (window) {
      const current = window.getBounds();
      window.setBounds({
        x: bounds.x ?? current.x,
        y: bounds.y ?? current.y,
        width: bounds.width ?? current.width,
        height: bounds.height ?? current.height,
      });
    }
  });

  // Shell operations
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, async (_event, url: string) => {
    // Validate URL before opening
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
        await shell.openExternal(url);
      } else {
        throw new Error('Invalid URL protocol');
      }
    } catch (error) {
      throw new Error(`Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_PATH, async (_event, filePath: string) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_TRASH_ITEM, async (_event, filePath: string) => {
    await shell.trashItem(filePath);
  });

  // Clipboard operations
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_TEXT, () => {
    return clipboard.readText();
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT, (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_IMAGE, () => {
    const image = clipboard.readImage();
    if (image.isEmpty()) {
      return null;
    }
    return image.toDataURL();
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE_IMAGE, (_event, dataUrl: string) => {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
  });

  // Notification
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SHOW, (_event, options: NotificationOptions) => {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent,
    });
    notification.show();
  });

  // System info
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_MEMORY_INFO, () => {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    };
  });

  // App version
  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => {
    return app.getVersion();
  });
}
